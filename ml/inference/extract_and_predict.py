#!/usr/bin/env python3
"""EVShield Local Feature Extractor & Inference Adapter (Phase 10)

Accepts either:
  1. Raw kernel-symbol data_point[] series payload (Development / Replay / Collector Mode):
     {"data_point": [3.26, 2.94, 2.41, 1.96, ...], "symbol": "optional_symbol_name"}
  2. Direct 10-feature engineered JSON vector:
     {"count": 14.0, "mean": 2.49, "max": 3.26, ...}

Extracts the 10 TOP statistical features using `ml.build_top_richer_stats_v1.summarize`
if a raw series is provided, and passes the vector to `predict.py` for scoring.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.build_top_richer_stats_v1 import numeric_series, summarize
from ml.inference.predict import (
    configured_feature_columns,
    feature_vector,
    load_model,
    selected_threshold,
    PredictionError,
    write_error,
)
import numpy as np
import pandas as pd


def process_input(payload: Dict[str, Any]) -> Dict[str, float]:
    """Extract or pass-through 10 feature values."""
    # Check if raw series payload is provided
    if "data_point" in payload and isinstance(payload["data_point"], list):
        raw_series = payload["data_point"]
        symbol = str(payload.get("symbol", "unknown_kernel_symbol"))
        values = numeric_series(raw_series, source=f"symbol:{symbol}")
        features = summarize(values)
        return features

    # Otherwise assume payload is direct 10-feature dict
    return payload


def main() -> int:
    try:
        try:
            raw_input = json.load(sys.stdin)
        except json.JSONDecodeError as exc:
            raise PredictionError("stdin must contain a valid JSON object") from exc

        if not isinstance(raw_input, dict):
            raise PredictionError("stdin JSON must be an object")

        is_raw_series = "data_point" in raw_input
        features_dict = process_input(raw_input)
        columns = configured_feature_columns()

        vector = feature_vector(features_dict, columns)
        model = load_model()
        threshold = selected_threshold()

        attack_index = list(model.classes_).index(1)
        probabilities = model.predict_proba(pd.DataFrame(vector, columns=columns))
        probability_attack = float(probabilities[0, attack_index])

        predicted_label = int(probability_attack >= threshold)

        response = {
            "probability_attack": round(probability_attack, 4),
            "predicted_label": predicted_label,
            "label": "ATTACK" if predicted_label == 1 else "NORMAL",
            "threshold": threshold,
            "mode": "REPLAY_SERIES" if is_raw_series else "ENGINEERED_VECTOR",
            "extracted_features": features_dict,
        }
        print(json.dumps(response))
        return 0
    except PredictionError as exc:
        return write_error(str(exc))
    except Exception as exc:
        return write_error(f"Inference pipeline failed: {exc}")


if __name__ == "__main__":
    raise SystemExit(main())
