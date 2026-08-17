#!/usr/bin/env python3
"""EVShield Local Feature Extractor & Inference Adapter (Phase 10).

Accepts either:

1. Raw kernel-symbol data_point[] series payload:
   {"data_point": [3.26, 2.94, 2.41, 1.96, ...],
    "symbol": "optional_symbol_name"}

2. Direct 10-feature engineered JSON vector:
   {"count": 14.0, "mean": 2.49, "max": 3.26, ...}

For raw series input, the adapter reuses the existing
numeric_series() and summarize() functions from
ml/build_top_richer_stats_v1.py.

The resulting 10-feature vector is then scored using the
existing EVShield ML inference implementation.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import pandas as pd

# Project root:
# EVShield/
#   ml/
#     inference/
#       extract_and_predict.py
PROJECT_ROOT = Path(__file__).resolve().parents[2]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.build_top_richer_stats_v1 import numeric_series, summarize
from ml.inference.predict import (
    PredictionError,
    configured_feature_columns,
    feature_vector,
    load_model,
    selected_threshold,
    write_error,
)


def process_input(payload: dict[str, Any]) -> dict[str, Any]:
    """Extract or pass through the 10 feature values."""

    # Raw CICEV2023 / replay series mode.
    if "data_point" in payload and isinstance(payload["data_point"], list):
        raw_series = payload["data_point"]
        symbol = str(
            payload.get("symbol", "unknown_kernel_symbol")
        )

        values = numeric_series(
            raw_series,
            source=f"symbol:{symbol}",
        )

        features = summarize(values)

        return features

    # Otherwise treat the payload as an already engineered
    # 10-feature vector.
    return payload


def main() -> int:
    """Read JSON from stdin, run local inference, and emit JSON."""

    try:
        # ---------------------------------------------------------
        # Read stdin
        # ---------------------------------------------------------
        try:
            raw_text = sys.stdin.read()
            if not raw_text.strip():
                raise PredictionError("stdin was empty; must contain a valid JSON object")
            raw_input = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise PredictionError(
                "stdin must contain a valid JSON object"
            ) from exc

        if not isinstance(raw_input, dict):
            raise PredictionError(
                "stdin JSON must be an object"
            )

        # ---------------------------------------------------------
        # Determine input mode
        # ---------------------------------------------------------
        is_raw_series = "data_point" in raw_input

        # ---------------------------------------------------------
        # Feature extraction / pass-through
        # ---------------------------------------------------------
        features_dict = process_input(raw_input)

        # ---------------------------------------------------------
        # Use the existing model feature configuration
        # ---------------------------------------------------------
        columns = configured_feature_columns()

        vector = feature_vector(
            features_dict,
            columns,
        )

        # ---------------------------------------------------------
        # Load existing trained model and threshold
        # ---------------------------------------------------------
        model = load_model()
        threshold = selected_threshold()

        # ---------------------------------------------------------
        # Real Random Forest inference
        # ---------------------------------------------------------
        attack_index = list(model.classes_).index(1)

        probabilities = model.predict_proba(
            pd.DataFrame(
                vector,
                columns=columns,
            )
        )

        probability_attack = float(
            probabilities[0, attack_index]
        )

        predicted_label = int(
            probability_attack >= threshold
        )

        # ---------------------------------------------------------
        # Response
        # ---------------------------------------------------------
        response = {
            "probability_attack": round(
                probability_attack,
                4,
            ),
            "predicted_label": predicted_label,
            "label": (
                "ATTACK"
                if predicted_label == 1
                else "NORMAL"
            ),
            "threshold": threshold,
            "mode": (
                "REPLAY_SERIES"
                if is_raw_series
                else "ENGINEERED_VECTOR"
            ),
            "extracted_features": features_dict,
        }

        print(json.dumps(response), flush=True)

        return 0

    except PredictionError as exc:
        return write_error(str(exc))

    except Exception as exc:
        return write_error(
            f"Inference pipeline failed: {exc}"
        )


if __name__ == "__main__":
    raise SystemExit(main())
    