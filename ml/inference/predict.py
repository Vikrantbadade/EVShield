#!/usr/bin/env python3
"""Read one engineered TOP richer-v1 feature vector from stdin and emit JSON.

This entry point intentionally does not accept raw profiling series: the saved
Random Forest was trained on the already-engineered TOP_richer_stats_v1 schema.
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / "ml" / "experiments" / "TOP_richer_stats_v1" / "random_forest_standard" / "model.joblib"
EXPERIMENT_CONFIG_PATH = MODEL_PATH.with_name("experiment_config.json")
SCHEMA_PATH = PROJECT_ROOT / "ml" / "processed" / "TOP_richer_stats_v1" / "schema.json"
THRESHOLD_PATH = PROJECT_ROOT / "ml" / "experiments" / "TOP_richer_stats_v1" / "operating_point" / "selected_threshold.json"
OPTIONAL_FEATURE_COLUMNS_PATH = PROJECT_ROOT / "ml" / "processed" / "feature_columns.json"


class PredictionError(ValueError):
    """Expected input or artifact validation failure."""


def write_error(message: str) -> int:
    print(json.dumps({"error": message}), file=sys.stderr)
    return 1


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise PredictionError(f"Required artifact not found: {path.relative_to(PROJECT_ROOT)}") from exc
    except json.JSONDecodeError as exc:
        raise PredictionError(f"Invalid JSON artifact: {path.relative_to(PROJECT_ROOT)}") from exc


def configured_feature_columns() -> list[str]:
    """Load the saved training feature order; never infer it from input."""
    if OPTIONAL_FEATURE_COLUMNS_PATH.is_file():
        configured = read_json(OPTIONAL_FEATURE_COLUMNS_PATH)
        columns = configured.get("feature_columns") if isinstance(configured, dict) else configured
        source = OPTIONAL_FEATURE_COLUMNS_PATH
    else:
        configured = read_json(EXPERIMENT_CONFIG_PATH)
        columns = configured.get("feature_columns") if isinstance(configured, dict) else None
        source = EXPERIMENT_CONFIG_PATH

    if not isinstance(columns, list) or not columns or not all(isinstance(column, str) for column in columns):
        raise PredictionError(f"Invalid feature-column definition in: {source.relative_to(PROJECT_ROOT)}")
    if len(set(columns)) != len(columns):
        raise PredictionError("Saved feature-column definition contains duplicates")

    schema = read_json(SCHEMA_PATH)
    schema_columns = schema.get("columns") if isinstance(schema, dict) else None
    label_column = schema.get("label_column") if isinstance(schema, dict) else None
    if not isinstance(schema_columns, list) or not isinstance(label_column, str) or label_column not in schema_columns:
        raise PredictionError("Invalid TOP richer v1 schema")
    schema_features = schema_columns[schema_columns.index(label_column) + 1 :]
    if columns != schema_features:
        raise PredictionError("Saved experiment feature order does not match TOP richer v1 schema")
    return columns


def selected_threshold() -> float:
    threshold_artifact = read_json(THRESHOLD_PATH)
    threshold = threshold_artifact.get("selected_threshold") if isinstance(threshold_artifact, dict) else None
    if isinstance(threshold, bool) or not isinstance(threshold, (int, float)) or not math.isfinite(float(threshold)):
        raise PredictionError("Invalid selected threshold artifact")
    return float(threshold)


def read_feature_payload() -> dict[str, Any]:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError as exc:
        raise PredictionError("stdin must contain one valid JSON object of engineered feature values") from exc
    if not isinstance(payload, dict):
        raise PredictionError("stdin JSON must be an object of engineered feature values")
    return payload


def feature_vector(payload: dict[str, Any], columns: list[str]) -> np.ndarray:
    missing = [column for column in columns if column not in payload]
    if missing:
        raise PredictionError(f"Missing required feature: {missing[0]}")
    unexpected = sorted(set(payload) - set(columns))
    if unexpected:
        raise PredictionError(f"Unexpected feature: {unexpected[0]}")

    values: list[float] = []
    for column in columns:
        value = payload[column]
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise PredictionError(f"Feature must be a JSON number: {column}")
        numeric_value = float(value)
        if not math.isfinite(numeric_value):
            raise PredictionError(f"Feature must be finite: {column}")
        values.append(numeric_value)
    return np.asarray([values], dtype=float)


def load_model() -> Any:
    try:
        model = joblib.load(MODEL_PATH)
    except FileNotFoundError as exc:
        raise PredictionError(f"Required model not found: {MODEL_PATH.relative_to(PROJECT_ROOT)}") from exc
    except Exception as exc:  # joblib exposes several loader exception types.
        raise PredictionError(f"Could not load saved model: {exc}") from exc
    if not hasattr(model, "predict_proba") or not hasattr(model, "classes_"):
        raise PredictionError("Saved model does not provide class probabilities and class labels")
    classes = list(model.classes_)
    if set(classes) != {0, 1}:
        raise PredictionError(f"Unexpected saved model classes: {classes}")
    return model


def main() -> int:
    try:
        columns = configured_feature_columns()
        payload = read_feature_payload()
        vector = feature_vector(payload, columns)
        model = load_model()
        attack_index = list(model.classes_).index(1)
        probabilities = model.predict_proba(pd.DataFrame(vector, columns=columns))
        if probabilities.shape != (1, len(model.classes_)):
            raise PredictionError("Saved model returned an unexpected probability shape")
        probability_attack = float(probabilities[0, attack_index])
        if not math.isfinite(probability_attack):
            raise PredictionError("Saved model returned a non-finite attack probability")
        threshold = selected_threshold()
        predicted_label = int(probability_attack >= threshold)
        print(json.dumps({
            "probability_attack": round(probability_attack, 4),
            "predicted_label": predicted_label,
            "label": "ATTACK" if predicted_label == 1 else "NORMAL",
            "threshold": threshold,
        }))
        return 0
    except PredictionError as exc:
        return write_error(str(exc))
    except Exception as exc:  # Keep stdout valid JSON-only even for unexpected failures.
        return write_error(f"Prediction failed: {exc}")


if __name__ == "__main__":
    raise SystemExit(main())
