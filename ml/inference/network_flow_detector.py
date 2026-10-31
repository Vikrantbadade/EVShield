#!/usr/bin/env python3
"""
EVShield Unified Network-Flow Anomaly Detector & Inference Server
Supports:
1. Threshold-Based Anomaly Detection (Statistical Z-scores & Rules)
2. Random Forest Classification (Supervised multi-class)
3. Isolation Forest Outlier Detection (Unsupervised outlier partitioning)
4. Ensemble Consensus (Multi-model voting)

Usage:
  - CLI one-shot: python network_flow_detector.py < payload.json
  - Long-lived Daemon mode: python network_flow_detector.py --daemon
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

MODELS_DIR = BASE_DIR / "models"

from models.threshold_detector import ThresholdDetector

FEATURE_COLUMNS = [
    "packet_rate",
    "request_rate",
    "new_connection_rate",
    "active_connections",
    "data_transfer_volume",
    "connection_duration",
    "request_frequency",
]

CLASS_NAMES = {
    0: "NORMAL",
    1: "TRAFFIC_BURST",
    2: "HIGH_CONNECTION_RATE",
    3: "REPEATED_REQUESTS",
    4: "EXCESSIVE_DATA",
    5: "UNUSUAL_LATENCY",
    6: "COMBINED_ANOMALY",
}


class NetworkFlowDetectorEngine:
    def __init__(self):
        self.rf_model = None
        self.if_model = None
        self.threshold_detector = None
        self.baseline_stats = {}
        self.load_models()

    def load_models(self) -> Dict[str, bool]:
        status = {}

        # 1. Random Forest
        rf_path = MODELS_DIR / "random_forest.joblib"
        if rf_path.exists():
            try:
                self.rf_model = joblib.load(rf_path)
                status["random_forest"] = True
            except Exception as e:
                print(f"[Detector] Failed to load RF model: {e}", file=sys.stderr)
                status["random_forest"] = False
        else:
            status["random_forest"] = False

        # 2. Isolation Forest
        if_path = MODELS_DIR / "isolation_forest.joblib"
        if if_path.exists():
            try:
                self.if_model = joblib.load(if_path)
                status["isolation_forest"] = True
            except Exception as e:
                print(f"[Detector] Failed to load IF model: {e}", file=sys.stderr)
                status["isolation_forest"] = False
        else:
            status["isolation_forest"] = False

        # 3. Threshold Baseline
        thresh_path = MODELS_DIR / "threshold_detector.joblib"
        baseline_json_path = MODELS_DIR / "threshold_baseline.json"
        if thresh_path.exists():
            try:
                self.threshold_detector = joblib.load(thresh_path)
                status["threshold"] = True
            except Exception:
                status["threshold"] = False
        elif baseline_json_path.exists():
            try:
                with open(baseline_json_path, "r", encoding="utf-8") as f:
                    self.baseline_stats = json.load(f)
                status["threshold"] = True
            except Exception:
                status["threshold"] = False
        else:
            status["threshold"] = False

        return status

    def extract_features(self, payload: Dict[str, Any]) -> Dict[str, float]:
        """Extract or normalize the 7 network-flow features from raw incoming payload."""
        req_rate = float(payload.get("request_rate", payload.get("requestsPerSecond", 12.0)))
        pkt_rate = float(payload.get("packet_rate", payload.get("packetRate", req_rate * 4.0)))
        new_conn = float(payload.get("new_connection_rate", payload.get("newConnectionRate", req_rate * 0.9)))
        act_conn = float(payload.get("active_connections", payload.get("activeConnections", 3.0)))
        data_vol = float(payload.get("data_transfer_volume", payload.get("dataTransferredBytes", req_rate * 512.0)))
        conn_dur = float(payload.get("connection_duration", payload.get("avgConnectionDurationMs", payload.get("averageLatencyMs", 14.0))))
        req_freq = float(payload.get("request_frequency", payload.get("requestFrequencyHz", req_rate)))

        return {
            "packet_rate": round(pkt_rate, 1),
            "request_rate": round(req_rate, 1),
            "new_connection_rate": round(new_conn, 1),
            "active_connections": round(act_conn, 0),
            "data_transfer_volume": round(data_vol, 0),
            "connection_duration": round(conn_dur, 1),
            "request_frequency": round(req_freq, 1),
        }

    def predict_threshold(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Run statistical baseline and threshold evaluation."""
        start = time.perf_counter()
        if self.threshold_detector is not None:
            is_anom, category, max_dev, contributing, expl = self.threshold_detector.predict_sample(features)
        else:
            # Fallback inline evaluation
            b_mean = {"request_rate": 12.0, "packet_rate": 48.0, "new_connection_rate": 10.0, "data_transfer_volume": 6144.0, "connection_duration": 14.0, "active_connections": 3.0}
            b_std = {"request_rate": 2.2, "packet_rate": 9.0, "new_connection_rate": 2.5, "data_transfer_volume": 1200.0, "connection_duration": 2.8, "active_connections": 1.0}
            contributing = []
            for k in b_mean:
                z = (features[k] - b_mean[k]) / b_std[k]
                if z > 2.5 or (k == "request_rate" and features[k] > 40):
                    contributing.append(k)
            is_anom = 1 if len(contributing) > 0 else 0
            category = "ANOMALY" if is_anom else "NORMAL"
            max_dev = 150.0 if is_anom else 0.0
            expl = f"Threshold triggered on {', '.join(contributing)}" if is_anom else "Within baseline."

        duration_ms = round((time.perf_counter() - start) * 1000.0, 3)

        return {
            "method": "THRESHOLD",
            "is_anomaly": bool(is_anom),
            "anomaly_score": 1.0 if is_anom else 0.0,
            "category": category,
            "severity": "CRITICAL" if (is_anom and max_dev > 250) else "HIGH" if is_anom else "LOW",
            "confidence": 0.95 if is_anom else 0.98,
            "contributing_features": contributing,
            "explanation": expl,
            "max_deviation_percent": max_dev,
            "latency_ms": max(0.005, duration_ms),
        }

    def predict_random_forest(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Run Random Forest inference with class attribution and probability distribution."""
        start = time.perf_counter()
        if self.rf_model is None:
            raise RuntimeError("Random Forest model is not loaded.")

        X = pd.DataFrame([features])[FEATURE_COLUMNS]
        pred_class = int(self.rf_model.predict(X)[0])
        probabilities = self.rf_model.predict_proba(X)[0]

        is_anom = pred_class != 0
        category = CLASS_NAMES.get(pred_class, "ANOMALY")
        anomaly_prob = float(1.0 - probabilities[0]) if len(probabilities) > 0 else (1.0 if is_anom else 0.0)

        # Contributing features: Top RF feature importances that have positive deviation in this sample
        contributing = []
        importances = dict(zip(FEATURE_COLUMNS, self.rf_model.feature_importances_))
        sorted_features = sorted(importances.items(), key=lambda x: x[1], reverse=True)
        for feat, imp in sorted_features:
            if imp > 0.08:
                contributing.append(feat)

        if not is_anom:
            expl = "Random Forest classified traffic pattern as NOMINAL baseline."
        else:
            expl = f"Random Forest flagged {category} ({anomaly_prob*100:.1f}% confidence); key contributing features: {', '.join(contributing[:3])}."

        duration_ms = round((time.perf_counter() - start) * 1000.0, 3)

        return {
            "method": "RANDOM_FOREST",
            "is_anomaly": bool(is_anom),
            "predicted_class_id": pred_class,
            "category": category,
            "probability_attack": round(anomaly_prob, 4),
            "confidence": round(float(np.max(probabilities)), 4),
            "severity": "CRITICAL" if (is_anom and anomaly_prob > 0.85) else "HIGH" if is_anom else "LOW",
            "class_probabilities": {CLASS_NAMES[i]: round(float(p), 4) for i, p in enumerate(probabilities)},
            "contributing_features": contributing[:3],
            "explanation": expl,
            "latency_ms": max(0.01, duration_ms),
        }

    def predict_isolation_forest(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Run Isolation Forest outlier prediction.
        Note: Anomaly score is continuous raw decision function offset (negative = outlier, positive = inlier),
        NOT represented as a probability.
        """
        start = time.perf_counter()
        if self.if_model is None:
            raise RuntimeError("Isolation Forest model is not loaded.")

        X = pd.DataFrame([features])[FEATURE_COLUMNS]
        decision_score = float(self.if_model.decision_function(X)[0])
        raw_pred = int(self.if_model.predict(X)[0])  # 1 = inlier, -1 = outlier
        is_anom = raw_pred == -1

        # Outlier severity based on distance below decision boundary
        if not is_anom:
            category = "NORMAL"
            severity = "LOW"
            expl = f"Isolation Forest score (+{decision_score:.3f}) lies safely inside the nominal partitioning boundary."
            contributing = []
        else:
            severity = "CRITICAL" if decision_score < -0.15 else "HIGH"
            # Attribute contributing features by deviation from training baseline
            b_means = {"request_rate": 12.0, "packet_rate": 48.0, "new_connection_rate": 10.0, "data_transfer_volume": 6144.0, "connection_duration": 14.0, "active_connections": 3.0}
            b_stds = {"request_rate": 2.2, "packet_rate": 9.0, "new_connection_rate": 2.5, "data_transfer_volume": 1200.0, "connection_duration": 2.8, "active_connections": 1.0}
            devs = {}
            for col, mean in b_means.items():
                if col in features:
                    devs[col] = abs((features[col] - mean) / b_stds[col])
            contributing = sorted(devs, key=devs.get, reverse=True)[:3]
            category = "ANOMALY_OUTLIER"
            expl = f"Isolation Forest detected abnormal structural isolation (outlier score: {decision_score:.3f}); primary deviations: {', '.join(contributing)}."

        duration_ms = round((time.perf_counter() - start) * 1000.0, 3)

        return {
            "method": "ISOLATION_FOREST",
            "is_anomaly": bool(is_anom),
            "anomaly_score": round(decision_score, 4),  # Decision function offset
            "raw_prediction": raw_pred,
            "category": category,
            "severity": severity,
            "contributing_features": contributing,
            "explanation": expl,
            "latency_ms": max(0.01, duration_ms),
        }

    def predict_ensemble(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Combine predictions from Threshold, Random Forest, and Isolation Forest."""
        start = time.perf_counter()
        th_res = self.predict_threshold(features)
        rf_res = self.predict_random_forest(features)
        if_res = self.predict_isolation_forest(features)

        votes = [
            1 if th_res["is_anomaly"] else 0,
            1 if rf_res["is_anomaly"] else 0,
            1 if if_res["is_anomaly"] else 0,
        ]
        anomaly_votes = sum(votes)
        # Majority voting (at least 2 of 3 agree)
        is_anom = anomaly_votes >= 2

        # Primary category from Random Forest or Threshold
        if is_anom:
            category = rf_res["category"] if rf_res["category"] != "NORMAL" else th_res["category"]
            severity = "CRITICAL" if anomaly_votes == 3 else "HIGH"
            expl = f"Ensemble consensus ({anomaly_votes}/3 detectors confirmed attack): Category flagged as {category}."
        else:
            category = "NORMAL"
            severity = "LOW"
            expl = f"Ensemble consensus ({3 - anomaly_votes}/3 detectors confirmed normal monitoring baseline)."

        duration_ms = round((time.perf_counter() - start) * 1000.0, 3)

        return {
            "method": "ENSEMBLE",
            "is_anomaly": is_anom,
            "category": category,
            "severity": severity,
            "votes": {"threshold": th_res["is_anomaly"], "random_forest": rf_res["is_anomaly"], "isolation_forest": if_res["is_anomaly"]},
            "vote_count": anomaly_votes,
            "details": {
                "threshold": th_res,
                "random_forest": rf_res,
                "isolation_forest": if_res,
            },
            "explanation": expl,
            "latency_ms": max(0.02, duration_ms),
        }

    def dispatch(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatch prediction according to requested method."""
        cmd = payload.get("cmd")
        if cmd == "ping":
            return {
                "status": "pong",
                "models": {
                    "threshold": self.threshold_detector is not None,
                    "random_forest": self.rf_model is not None,
                    "isolation_forest": self.if_model is not None,
                },
            }
        if cmd == "reload":
            return {"status": "reloaded", "models": self.load_models()}
        if cmd == "retrain":
            # Run training script
            import subprocess
            res = subprocess.run([sys.executable, str(BASE_DIR / "models" / "train_and_evaluate.py")], capture_output=True, text=True)
            self.load_models()
            return {"status": "retrained", "output": res.stdout[-400:] if res.stdout else res.stderr[-400:]}

        # Inference request
        method = str(payload.get("method", "all")).upper()
        features = self.extract_features(payload)

        if method == "THRESHOLD":
            result = self.predict_threshold(features)
        elif method == "RANDOM_FOREST":
            result = self.predict_random_forest(features)
        elif method == "ISOLATION_FOREST":
            result = self.predict_isolation_forest(features)
        elif method == "ENSEMBLE" or method == "COMBINED":
            result = self.predict_ensemble(features)
        else:
            # Method 'all': return all three plus ensemble
            th = self.predict_threshold(features)
            rf = self.predict_random_forest(features)
            isf = self.predict_isolation_forest(features)
            ens = self.predict_ensemble(features)
            result = {
                "features": features,
                "threshold": th,
                "random_forest": rf,
                "isolation_forest": isf,
                "ensemble": ens,
                "active_decision": ens,
            }

        result["extracted_features"] = features
        return result


def run_daemon():
    """Run persistent JSON-RPC loop over stdin/stdout."""
    engine = NetworkFlowDetectorEngine()
    print(json.dumps({"status": "ready", "engine": "EVShield_NetworkFlow_Daemon"}), flush=True)

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            resp = engine.dispatch(req)
            print(json.dumps(resp), flush=True)
        except Exception as e:
            err_resp = {"error": str(e), "success": False}
            print(json.dumps(err_resp), flush=True)


def run_oneshot():
    """Read single JSON object from stdin and print result."""
    engine = NetworkFlowDetectorEngine()
    raw = sys.stdin.read().strip()
    if not raw:
        print(json.dumps({"error": "Empty input"}), file=sys.stderr)
        sys.exit(1)
    req = json.loads(raw)
    resp = engine.dispatch(req)
    print(json.dumps(resp, indent=2))


if __name__ == "__main__":
    if "--daemon" in sys.argv:
        run_daemon()
    else:
        run_oneshot()
