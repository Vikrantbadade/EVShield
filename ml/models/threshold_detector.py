#!/usr/bin/env python3
"""
EVShield Statistical Baseline & Threshold-Based Anomaly Detector
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "packet_rate",
    "request_rate",
    "new_connection_rate",
    "active_connections",
    "data_transfer_volume",
    "connection_duration",
    "request_frequency",
]


class ThresholdDetector:
    """Configurable statistical baseline and static threshold anomaly detector."""

    def __init__(self, sensitivity: str = "MEDIUM"):
        self.sensitivity = sensitivity
        self.baseline_stats: Dict[str, Dict[str, float]] = {}
        self.multipliers = {
            "burst": 3.0,
            "conn_rate": 3.5,
            "packet_rate": 3.0,
            "data_volume": 3.0,
            "duration": 2.5,
            "active_conn": 3.0,
            "z_score": 2.5,
        }
        self.apply_sensitivity(sensitivity)

    def apply_sensitivity(self, sensitivity: str) -> None:
        self.sensitivity = sensitivity
        if sensitivity == "HIGH":
            self.multipliers = {
                "burst": 2.2,
                "conn_rate": 2.4,
                "packet_rate": 2.2,
                "data_volume": 2.2,
                "duration": 2.0,
                "active_conn": 2.2,
                "z_score": 2.0,
            }
        elif sensitivity == "LOW":
            self.multipliers = {
                "burst": 4.5,
                "conn_rate": 5.0,
                "packet_rate": 4.5,
                "data_volume": 4.5,
                "duration": 3.5,
                "active_conn": 4.5,
                "z_score": 3.5,
            }
        else:  # MEDIUM
            self.multipliers = {
                "burst": 3.0,
                "conn_rate": 3.5,
                "packet_rate": 3.0,
                "data_volume": 3.0,
                "duration": 2.5,
                "active_conn": 3.0,
                "z_score": 2.5,
            }

    def fit(self, normal_df: pd.DataFrame) -> ThresholdDetector:
        """Calculate statistical baseline parameters from normal training samples."""
        self.baseline_stats = {}
        for col in FEATURE_COLUMNS:
            vals = normal_df[col].to_numpy(dtype=float)
            mean = float(np.mean(vals))
            std = float(np.std(vals, ddof=1))
            self.baseline_stats[col] = {
                "mean": round(mean, 2),
                "std": round(max(std, 1e-4), 2),
                "min": round(float(np.min(vals)), 2),
                "max": round(float(np.max(vals)), 2),
            }
        return self

    def predict_sample(self, row: pd.Series | Dict[str, float]) -> Tuple[int, str, float, List[str], str]:
        """
        Evaluate a single network flow sample.
        Returns: (is_anomaly, category, max_deviation_pct, contributing_features, explanation)
        """
        contributing: List[str] = []
        deviations: Dict[str, float] = {}

        req_rate = float(row["request_rate"])
        pkt_rate = float(row["packet_rate"])
        new_conn = float(row["new_connection_rate"])
        act_conn = float(row["active_connections"])
        data_vol = float(row["data_transfer_volume"])
        conn_dur = float(row["connection_duration"])

        # Check deviations against baseline
        for col, val in [
            ("request_rate", req_rate),
            ("packet_rate", pkt_rate),
            ("new_connection_rate", new_conn),
            ("active_connections", act_conn),
            ("data_transfer_volume", data_vol),
            ("connection_duration", conn_dur),
        ]:
            b_mean = self.baseline_stats.get(col, {}).get("mean", 12.0)
            b_std = self.baseline_stats.get(col, {}).get("std", 2.0)
            dev_pct = ((val - b_mean) / max(b_mean, 1e-4)) * 100.0
            deviations[col] = dev_pct

        # Anomaly rules
        z_req = (req_rate - self.baseline_stats.get("request_rate", {}).get("mean", 12.0)) / self.baseline_stats.get("request_rate", {}).get("std", 2.2)
        z_pkt = (pkt_rate - self.baseline_stats.get("packet_rate", {}).get("mean", 48.0)) / self.baseline_stats.get("packet_rate", {}).get("std", 9.0)
        z_conn = (new_conn - self.baseline_stats.get("new_connection_rate", {}).get("mean", 10.0)) / self.baseline_stats.get("new_connection_rate", {}).get("std", 2.5)
        z_data = (data_vol - self.baseline_stats.get("data_transfer_volume", {}).get("mean", 6144.0)) / self.baseline_stats.get("data_transfer_volume", {}).get("std", 1200.0)
        z_dur = (conn_dur - self.baseline_stats.get("connection_duration", {}).get("mean", 14.0)) / self.baseline_stats.get("connection_duration", {}).get("std", 2.8)
        z_act = (act_conn - self.baseline_stats.get("active_connections", {}).get("mean", 3.0)) / self.baseline_stats.get("active_connections", {}).get("std", 1.0)

        if z_req >= self.multipliers["burst"] or req_rate > 50.0:
            contributing.append("request_rate")
        if z_pkt >= self.multipliers["packet_rate"] or pkt_rate > 200.0:
            contributing.append("packet_rate")
        if z_conn >= self.multipliers["conn_rate"] or new_conn > 50.0:
            contributing.append("new_connection_rate")
        if z_data >= self.multipliers["data_volume"] or data_vol > 30000.0:
            contributing.append("data_transfer_volume")
        if z_dur >= self.multipliers["duration"] or conn_dur > 70.0:
            contributing.append("connection_duration")
        if z_act >= self.multipliers["active_conn"] or act_conn > 12:
            contributing.append("active_connections")

        # Specific repeated requests rule: high request rate with low new connections and fast duration
        is_repeated = req_rate > 30.0 and new_conn < 6.0 and conn_dur < 12.0
        if is_repeated:
            contributing.append("repeated_requests")

        is_anomaly = 1 if len(contributing) > 0 else 0

        # Classify primary anomaly category
        if not is_anomaly:
            category = "NORMAL"
            explanation = "All network flow metrics within nominal baseline parameters."
            max_dev = 0.0
        elif len(contributing) >= 3 or ("request_rate" in contributing and "data_transfer_volume" in contributing and "new_connection_rate" in contributing):
            category = "COMBINED_ANOMALY"
            max_dev = max(deviations.values())
            explanation = f"Multi-feature network anomaly: {', '.join(contributing)} exceed statistical thresholds simultaneously."
        elif "connection_duration" in contributing and conn_dur > 100.0:
            category = "UNUSUAL_LATENCY"
            max_dev = deviations["connection_duration"]
            explanation = f"Abnormally elevated connection hold time ({conn_dur:.1f}ms vs {self.baseline_stats.get('connection_duration', {}).get('mean', 14.0):.1f}ms baseline)."
        elif "data_transfer_volume" in contributing and data_vol > 60000.0:
            category = "EXCESSIVE_DATA"
            max_dev = deviations["data_transfer_volume"]
            explanation = f"Excessive data bandwidth transfer volume ({data_vol/1024:.1f} KB/s vs {self.baseline_stats.get('data_transfer_volume', {}).get('mean', 6144.0)/1024:.1f} KB/s baseline)."
        elif "new_connection_rate" in contributing and new_conn > 100.0:
            category = "HIGH_CONNECTION_RATE"
            max_dev = deviations["new_connection_rate"]
            explanation = f"Aggressive new connection handshake surge ({new_conn:.1f} conn/s vs {self.baseline_stats.get('new_connection_rate', {}).get('mean', 10.0):.1f} conn/s baseline)."
        elif is_repeated:
            category = "REPEATED_REQUESTS"
            max_dev = deviations["request_rate"]
            explanation = f"Repeated authentication request pattern with low session entropy and fast response times ({req_rate:.1f} req/s)."
        elif "request_rate" in contributing or "packet_rate" in contributing:
            category = "TRAFFIC_BURST"
            max_dev = max(deviations.get("request_rate", 0), deviations.get("packet_rate", 0))
            explanation = f"Volumetric traffic burst detected: request rate {req_rate:.1f} req/s (+{deviations['request_rate']:.0f}% over baseline)."
        else:
            category = "ANOMALY"
            max_dev = max(deviations.values())
            explanation = f"Network telemetry exceeds threshold on features: {', '.join(contributing)}."

        return is_anomaly, category, round(max_dev, 1), contributing, explanation

    def predict(self, df: pd.DataFrame) -> Tuple[np.ndarray, float, float]:
        """Predict on dataframe, return (binary_preds, latency_per_sample_ms, throughput)"""
        import time
        start = time.perf_counter()
        binary_preds = []
        for _, row in df.iterrows():
            is_anom, _, _, _, _ = self.predict_sample(row)
            binary_preds.append(is_anom)
        total_time = time.perf_counter() - start
        latency_ms = (total_time / len(df)) * 1000.0
        throughput = len(df) / max(total_time, 1e-6)
        return np.array(binary_preds, dtype=int), latency_ms, throughput

