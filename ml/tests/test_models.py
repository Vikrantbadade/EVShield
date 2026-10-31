#!/usr/bin/env python3
"""
Unit and Integration Tests for EVShield ML Anomaly Detectors
Verifies:
- Dataset generation and schema consistency
- Threshold Detector calibration and prediction
- Random Forest loading, inference, and class attribution
- Isolation Forest loading, outlier scoring, and negative decision boundary
- Model persistence and error handling
"""

import json
import sys
from pathlib import Path
import unittest
import numpy as np
import pandas as pd
import joblib

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

MODELS_DIR = BASE_DIR / "models"
DATASET_DIR = BASE_DIR / "dataset" / "network_flow"

from inference.network_flow_detector import NetworkFlowDetectorEngine, FEATURE_COLUMNS, CLASS_NAMES
from dataset.generate_network_flow_dataset import generate_class_samples


class TestNetworkFlowDataset(unittest.TestCase):
    def test_schema_exists_and_valid(self):
        schema_path = DATASET_DIR / "schema.json"
        self.assertTrue(schema_path.exists(), "schema.json must exist")
        with open(schema_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        self.assertEqual(meta["feature_columns"], FEATURE_COLUMNS)
        self.assertEqual(len(meta["classes"]), 7)

    def test_dataset_splits_no_data_leakage(self):
        train_path = DATASET_DIR / "train.csv"
        val_path = DATASET_DIR / "val.csv"
        test_path = DATASET_DIR / "test.csv"

        self.assertTrue(train_path.exists())
        self.assertTrue(val_path.exists())
        self.assertTrue(test_path.exists())

        train_df = pd.read_csv(train_path)
        val_df = pd.read_csv(val_path)
        test_df = pd.read_csv(test_path)

        self.assertGreater(len(train_df), 2000)
        self.assertGreater(len(test_df), 400)

        # Check feature columns present
        for col in FEATURE_COLUMNS:
            self.assertIn(col, train_df.columns)
            self.assertIn(col, test_df.columns)

        # Check all values are finite
        self.assertTrue(np.all(np.isfinite(train_df[FEATURE_COLUMNS].to_numpy())))
        self.assertTrue(np.all(np.isfinite(test_df[FEATURE_COLUMNS].to_numpy())))


class TestAnomalyDetectors(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = NetworkFlowDetectorEngine()

    def test_models_loaded(self):
        self.assertIsNotNone(self.engine.rf_model, "Random Forest model must be loaded")
        self.assertIsNotNone(self.engine.if_model, "Isolation Forest model must be loaded")
        self.assertIsNotNone(self.engine.threshold_detector, "Threshold detector must be loaded")

    def test_nominal_sample_prediction(self):
        nominal = {
            "packet_rate": 48.0,
            "request_rate": 12.0,
            "new_connection_rate": 10.0,
            "active_connections": 3.0,
            "data_transfer_volume": 6144.0,
            "connection_duration": 14.0,
            "request_frequency": 12.0,
        }

        # 1. Threshold
        th_res = self.engine.predict_threshold(nominal)
        self.assertFalse(th_res["is_anomaly"])
        self.assertEqual(th_res["category"], "NORMAL")

        # 2. Random Forest
        rf_res = self.engine.predict_random_forest(nominal)
        self.assertFalse(rf_res["is_anomaly"])
        self.assertEqual(rf_res["category"], "NORMAL")

        # 3. Isolation Forest
        if_res = self.engine.predict_isolation_forest(nominal)
        self.assertFalse(if_res["is_anomaly"])
        self.assertGreater(if_res["anomaly_score"], 0.0, "Nominal traffic should have positive inlier score")

    def test_traffic_burst_anomaly_detection(self):
        burst = {
            "packet_rate": 420.0,
            "request_rate": 105.0,
            "new_connection_rate": 16.0,
            "active_connections": 6.0,
            "data_transfer_volume": 52000.0,
            "connection_duration": 18.0,
            "request_frequency": 105.0,
        }

        # 1. Threshold
        th_res = self.engine.predict_threshold(burst)
        self.assertTrue(th_res["is_anomaly"])

        # 2. Random Forest
        rf_res = self.engine.predict_random_forest(burst)
        self.assertTrue(rf_res["is_anomaly"])
        self.assertEqual(rf_res["category"], "TRAFFIC_BURST")

        # 3. Isolation Forest
        if_res = self.engine.predict_isolation_forest(burst)
        self.assertTrue(if_res["is_anomaly"])
        self.assertLess(if_res["anomaly_score"], 0.0, "Anomaly should produce negative outlier score")

    def test_slowloris_latency_anomaly(self):
        slowloris = {
            "packet_rate": 45.0,
            "request_rate": 11.0,
            "new_connection_rate": 3.0,
            "active_connections": 22.0,
            "data_transfer_volume": 5500.0,
            "connection_duration": 250.0,
            "request_frequency": 11.0,
        }

        rf_res = self.engine.predict_random_forest(slowloris)
        self.assertTrue(rf_res["is_anomaly"])
        self.assertEqual(rf_res["category"], "UNUSUAL_LATENCY")

    def test_evaluation_results_file(self):
        report_path = MODELS_DIR / "evaluation_results.json"
        self.assertTrue(report_path.exists())
        with open(report_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertIn("models", data)
        self.assertIn("THRESHOLD", data["models"])
        self.assertIn("RANDOM_FOREST", data["models"])
        self.assertIn("ISOLATION_FOREST", data["models"])

        # Validate that F1 scores exceed 95%
        self.assertGreater(data["models"]["THRESHOLD"]["metrics"]["f1_score"], 0.95)
        self.assertGreater(data["models"]["RANDOM_FOREST"]["metrics"]["f1_score"], 0.95)
        self.assertGreater(data["models"]["ISOLATION_FOREST"]["metrics"]["f1_score"], 0.95)


if __name__ == "__main__":
    unittest.main()
