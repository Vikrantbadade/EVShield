#!/usr/bin/env python3
"""
EVShield Network-Flow Dataset Generator
Generates a reproducible, standardized network-flow dataset for evaluating:
1. Threshold-based Anomaly Detection
2. Random Forest Classification (Supervised)
3. Isolation Forest Anomaly Detection (Unsupervised)

Consistent Network-Flow Feature Schema:
- packet_rate (packets/sec)
- request_rate (requests/sec)
- new_connection_rate (new connections/sec)
- active_connections (active connection count)
- data_transfer_volume (bytes/sec)
- connection_duration (average latency in ms)
- request_frequency (Hz)

Classes:
0: NORMAL
1: TRAFFIC_BURST
2: HIGH_CONNECTION_RATE
3: REPEATED_REQUESTS
4: EXCESSIVE_DATA
5: UNUSUAL_LATENCY
6: COMBINED_ANOMALY
"""

from __future__ import annotations

import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

RANDOM_SEED = 42
TOTAL_SAMPLES = 4000
OUTPUT_DIR = Path(__file__).resolve().parent / "network_flow"

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


def generate_class_samples(
    class_id: int,
    num_samples: int,
    rng: np.random.Generator,
) -> pd.DataFrame:
    """Generate synthetic network flow observations for a specific class with realistic distributions."""
    if class_id == 0:
        # NORMAL: Nominal EV charging telemetry
        req_rate = rng.normal(loc=12.0, scale=2.2, size=num_samples).clip(6.0, 22.0)
        pkt_rate = rng.normal(loc=req_rate * 4.0, scale=4.5).clip(20.0, 95.0)
        new_conn = rng.normal(loc=req_rate * 0.9, scale=2.0).clip(3.0, 20.0)
        act_conn = rng.poisson(lam=3.0, size=num_samples).clip(1, 8)
        bytes_sec = rng.normal(loc=req_rate * 512.0, scale=800.0).clip(1500.0, 14000.0)
        conn_dur = rng.normal(loc=14.0, scale=2.8, size=num_samples).clip(6.0, 32.0)
        req_freq = rng.normal(loc=req_rate, scale=0.8).clip(5.0, 22.0)

    elif class_id == 1:
        # TRAFFIC_BURST: High request rate surge
        req_rate = rng.normal(loc=95.0, scale=16.0, size=num_samples).clip(70.0, 160.0)
        pkt_rate = rng.normal(loc=req_rate * 4.2, scale=35.0).clip(280.0, 700.0)
        new_conn = rng.normal(loc=16.0, scale=4.0, size=num_samples).clip(8.0, 30.0)
        act_conn = rng.poisson(lam=6.0, size=num_samples).clip(3, 14)
        bytes_sec = rng.normal(loc=req_rate * 520.0, scale=6000.0).clip(32000.0, 95000.0)
        conn_dur = rng.normal(loc=17.5, scale=3.5, size=num_samples).clip(8.0, 40.0)
        req_freq = rng.normal(loc=req_rate, scale=4.0).clip(65.0, 160.0)

    elif class_id == 2:
        # HIGH_CONNECTION_RATE: Aggressive new connection handshakes
        req_rate = rng.normal(loc=26.0, scale=5.0, size=num_samples).clip(14.0, 45.0)
        pkt_rate = rng.normal(loc=125.0, scale=22.0, size=num_samples).clip(70.0, 220.0)
        new_conn = rng.normal(loc=290.0, scale=42.0, size=num_samples).clip(180.0, 480.0)
        act_conn = rng.normal(loc=26.0, scale=5.0, size=num_samples).clip(14, 50).astype(int)
        bytes_sec = rng.normal(loc=16000.0, scale=3000.0, size=num_samples).clip(8000.0, 32000.0)
        conn_dur = rng.normal(loc=15.0, scale=3.0, size=num_samples).clip(8.0, 35.0)
        req_freq = rng.normal(loc=req_rate, scale=2.0).clip(12.0, 45.0)

    elif class_id == 3:
        # REPEATED_REQUESTS: Bot replay with identical credentials & fast cache turnaround
        req_rate = rng.normal(loc=48.0, scale=7.0, size=num_samples).clip(32.0, 75.0)
        pkt_rate = rng.normal(loc=190.0, scale=25.0, size=num_samples).clip(120.0, 310.0)
        new_conn = rng.normal(loc=3.5, scale=1.0, size=num_samples).clip(1.0, 8.0)
        act_conn = rng.poisson(lam=3.0, size=num_samples).clip(1, 6)
        bytes_sec = rng.normal(loc=13500.0, scale=2200.0, size=num_samples).clip(7000.0, 24000.0)
        conn_dur = rng.normal(loc=8.2, scale=1.2, size=num_samples).clip(4.0, 14.0)
        req_freq = rng.normal(loc=req_rate, scale=1.5).clip(30.0, 75.0)

    elif class_id == 4:
        # EXCESSIVE_DATA: Heavy payload exfiltration / buffer downloads
        req_rate = rng.normal(loc=18.0, scale=3.5, size=num_samples).clip(10.0, 30.0)
        bytes_sec = rng.normal(loc=155000.0, scale=28000.0, size=num_samples).clip(95000.0, 280000.0)
        pkt_rate = rng.normal(loc=bytes_sec / 340.0, scale=40.0).clip(260.0, 850.0)
        new_conn = rng.normal(loc=8.0, scale=2.0, size=num_samples).clip(3.0, 16.0)
        act_conn = rng.poisson(lam=5.0, size=num_samples).clip(2, 10)
        conn_dur = rng.normal(loc=34.0, scale=7.0, size=num_samples).clip(18.0, 65.0)
        req_freq = rng.normal(loc=req_rate, scale=1.5).clip(9.0, 30.0)

    elif class_id == 5:
        # UNUSUAL_LATENCY: Connection-holding Slowloris attack
        req_rate = rng.normal(loc=11.0, scale=2.5, size=num_samples).clip(5.0, 20.0)
        pkt_rate = rng.normal(loc=44.0, scale=9.0, size=num_samples).clip(20.0, 85.0)
        new_conn = rng.normal(loc=3.0, scale=1.0, size=num_samples).clip(1.0, 7.0)
        act_conn = rng.normal(loc=22.0, scale=4.0, size=num_samples).clip(12, 40).astype(int)
        bytes_sec = rng.normal(loc=5500.0, scale=1200.0, size=num_samples).clip(2000.0, 11000.0)
        conn_dur = rng.normal(loc=235.0, scale=42.0, size=num_samples).clip(140.0, 420.0)
        req_freq = rng.normal(loc=req_rate, scale=1.0).clip(4.0, 20.0)

    elif class_id == 6:
        # COMBINED_ANOMALY: Multi-vector attack (surge across requests, conns, packets, data)
        req_rate = rng.normal(loc=115.0, scale=22.0, size=num_samples).clip(80.0, 190.0)
        bytes_sec = rng.normal(loc=185000.0, scale=32000.0, size=num_samples).clip(110000.0, 320000.0)
        pkt_rate = rng.normal(loc=540.0, scale=85.0, size=num_samples).clip(360.0, 900.0)
        new_conn = rng.normal(loc=195.0, scale=32.0, size=num_samples).clip(110.0, 320.0)
        act_conn = rng.normal(loc=35.0, scale=7.0, size=num_samples).clip(18, 65).astype(int)
        conn_dur = rng.normal(loc=88.0, scale=18.0, size=num_samples).clip(45.0, 175.0)
        req_freq = rng.normal(loc=req_rate, scale=5.0).clip(75.0, 190.0)

    else:
        raise ValueError(f"Unknown class_id: {class_id}")

    data = {
        "packet_rate": np.round(pkt_rate, 1),
        "request_rate": np.round(req_rate, 1),
        "new_connection_rate": np.round(new_conn, 1),
        "active_connections": act_conn.astype(int),
        "data_transfer_volume": np.round(bytes_sec, 0).astype(int),
        "connection_duration": np.round(conn_dur, 1),
        "request_frequency": np.round(req_freq, 1),
        "label": class_id,
        "class_name": CLASS_NAMES[class_id],
        "is_anomaly": 0 if class_id == 0 else 1,
    }

    return pd.DataFrame(data)


def generate_dataset() -> dict:
    """Generate balanced multi-class dataset, split into train, val, test with zero data leakage."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(RANDOM_SEED)

    # 50% normal (2000 samples), 50% anomaly split across 6 anomaly classes (~333 each)
    num_normal = TOTAL_SAMPLES // 2
    num_anomaly_per_class = num_normal // (len(CLASS_NAMES) - 1)

    frames = [generate_class_samples(0, num_normal, rng)]
    for cid in range(1, len(CLASS_NAMES)):
        frames.append(generate_class_samples(cid, num_anomaly_per_class, rng))

    full_df = pd.concat(frames, ignore_index=True)

    # Shuffle with fixed seed
    full_df = full_df.sample(frac=1.0, random_state=RANDOM_SEED).reset_index(drop=True)

    # Stratified split: 70% train (2800), 15% validation (600), 15% held-out test (600)
    train_df, temp_df = train_test_split(
        full_df,
        test_size=0.30,
        random_state=RANDOM_SEED,
        stratify=full_df["label"],
    )

    val_df, test_df = train_test_split(
        temp_df,
        test_size=0.50,
        random_state=RANDOM_SEED,
        stratify=temp_df["label"],
    )

    # Save splits
    train_path = OUTPUT_DIR / "train.csv"
    val_path = OUTPUT_DIR / "val.csv"
    test_path = OUTPUT_DIR / "test.csv"

    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)

    schema_metadata = {
        "dataset_name": "EVShield_Network_Flow_v1",
        "description": "Standardized network-flow benchmark for EV charging network anomaly detection and multi-model comparison.",
        "random_seed": RANDOM_SEED,
        "total_samples": len(full_df),
        "split_counts": {
            "train": len(train_df),
            "val": len(val_df),
            "test": len(test_df),
        },
        "feature_columns": FEATURE_COLUMNS,
        "target_columns": ["label", "class_name", "is_anomaly"],
        "classes": CLASS_NAMES,
        "feature_descriptions": {
            "packet_rate": "Number of packets transferred per second (pkt/s)",
            "request_rate": "HTTP/OCPP request throughput per second (req/s)",
            "new_connection_rate": "Rate of newly created TCP connections per second (conn/s)",
            "active_connections": "Current concurrent open active connections count",
            "data_transfer_volume": "Total volume of data transferred per second in bytes (B/s)",
            "connection_duration": "Average latency or connection hold time in milliseconds (ms)",
            "request_frequency": "Observed request frequency in Hertz (Hz)",
        },
    }

    schema_path = OUTPUT_DIR / "schema.json"
    with open(schema_path, "w", encoding="utf-8") as f:
        json.dump(schema_metadata, f, indent=2)

    print(f"Generated {len(full_df)} network-flow samples:")
    print(f"  Train: {len(train_df)} samples -> {train_path}")
    print(f"  Val:   {len(val_df)} samples -> {val_path}")
    print(f"  Test:  {len(test_df)} samples -> {test_path} (HELD-OUT)")
    print(f"  Schema: {schema_path}")

    return schema_metadata


if __name__ == "__main__":
    generate_dataset()

