from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
DATASET_DIR = ROOT / "dataset"
OUTPUT_DIR = ROOT / "processed" / "TOP_richer_stats_v1"
BASELINE_DIR = ROOT / "processed" / "TOP_baseline_dataset"

TRAIN_CONDITIONS = [
    "Correct_ID/Random_CS_ON/Gaussian_Off",
    "Wrong_ID/Random_CS_OFF/Gaussian_Off",
]
TEST_CONDITIONS = [
    "Correct_ID/Random_CS_OFF/Gaussian_Off",
    "Wrong_ID/Random_CS_ON/Gaussian_Off",
]
CLASS_MAP = {"normal": 0, "attack": 1}
TOP_METRICS = ["branch", "cycles", "instructions"]
METADATA_COLUMNS = [
    "condition_directory", "source_family", "profiling_context", "entity_id",
    "metric", "raw_symbol_name", "label",
]
FEATURE_COLUMNS = ["count", "mean", "max", "sum", "std", "min", "median", "q1", "q3", "iqr"]
EXPECTED = {
    "train": {"rows": 4152, "normal": 1136, "attack": 3016, "conditions": TRAIN_CONDITIONS},
    "test": {"rows": 3592, "normal": 1219, "attack": 2373, "conditions": TEST_CONDITIONS},
}


def numeric_series(raw: Any, source: str) -> np.ndarray:
    if not isinstance(raw, list) or not raw:
        raise ValueError(f"Expected non-empty data_point[] at {source}")
    if any(isinstance(value, bool) or not isinstance(value, (int, float)) for value in raw):
        raise ValueError(f"Non-numeric data_point value at {source}")
    values = np.asarray(raw, dtype=float)
    if not np.isfinite(values).all():
        raise ValueError(f"NaN/Inf data_point value at {source}")
    return values


def summarize(values: np.ndarray) -> Dict[str, float]:
    q1, median, q3 = np.quantile(values, [0.25, 0.5, 0.75], method="linear")
    row = {
        "count": float(values.size), "mean": float(values.mean()), "max": float(values.max()),
        "sum": float(values.sum()), "std": float(values.std(ddof=0)), "min": float(values.min()),
        "median": float(median), "q1": float(q1), "q3": float(q3), "iqr": float(q3 - q1),
    }
    if not np.isfinite(np.asarray(list(row.values()), dtype=float)).all():
        raise ValueError("Feature calculation produced a non-finite value")
    return row


def build_rows() -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for condition in TRAIN_CONDITIONS + TEST_CONDITIONS:
        for context in ("CS", "GS"):
            top_dir = DATASET_DIR / condition / "TOP" / context
            if not top_dir.is_dir():
                raise FileNotFoundError(f"Missing TOP directory: {top_dir}")
            files = sorted(path for path in top_dir.glob("*.json") if path.is_file())
            if len(files) != 1:
                raise ValueError(f"Expected exactly one TOP JSON file in {top_dir}, found {len(files)}")
            payload = json.loads(files[0].read_text(encoding="utf-8"))
            if not isinstance(payload, dict):
                raise ValueError(f"TOP payload is not an object: {files[0]}")
            for entity_id, entity_payload in payload.items():
                if not isinstance(entity_payload, dict):
                    raise ValueError(f"Invalid entity payload: {condition}/{context}/{entity_id}")
                for metric in TOP_METRICS:
                    metric_payload = entity_payload.get(metric)
                    if metric_payload is None:
                        continue
                    if not isinstance(metric_payload, dict):
                        raise ValueError(f"Invalid metric payload: {condition}/{context}/{entity_id}/{metric}")
                    for class_name, symbol_payload in metric_payload.items():
                        if class_name not in CLASS_MAP:
                            continue
                        if not isinstance(symbol_payload, dict):
                            raise ValueError(f"Invalid symbol payload: {condition}/{context}/{entity_id}/{metric}/{class_name}")
                        for symbol_name, symbol_info in symbol_payload.items():
                            if not isinstance(symbol_info, dict):
                                raise ValueError(f"Invalid symbol info: {condition}/{context}/{entity_id}/{metric}/{class_name}/{symbol_name}")
                            source = f"{condition}/TOP/{context}/{entity_id}/{metric}/{class_name}/{symbol_name}"
                            values = numeric_series(symbol_info.get("data_point"), source)
                            row: Dict[str, Any] = {
                                "condition_directory": condition, "source_family": "TOP",
                                "profiling_context": context, "entity_id": str(entity_id),
                                "metric": metric, "raw_symbol_name": str(symbol_name),
                                "label": CLASS_MAP[class_name],
                            }
                            row.update(summarize(values))
                            rows.append(row)
    return rows


def validate_partition(df: pd.DataFrame, split: str) -> Dict[str, Any]:
    expected = EXPECTED[split]
    if list(df.columns) != METADATA_COLUMNS + FEATURE_COLUMNS:
        raise ValueError(f"Unexpected {split} schema: {df.columns.tolist()}")
    if len(df) != expected["rows"]:
        raise ValueError(f"Unexpected {split} row count: {len(df)}")
    if sorted(df["condition_directory"].unique()) != sorted(expected["conditions"]):
        raise ValueError(f"Unexpected {split} conditions")
    counts = df["label"].value_counts().to_dict()
    if counts.get(0, 0) != expected["normal"] or counts.get(1, 0) != expected["attack"]:
        raise ValueError(f"Unexpected {split} class counts: {counts}")
    values = df[FEATURE_COLUMNS].to_numpy(dtype=float)
    if not np.isfinite(values).all() or df[FEATURE_COLUMNS].isna().to_numpy().any():
        raise ValueError(f"Invalid {split} feature values")
    return {
        "rows": int(len(df)), "label_counts": {"normal": int(counts.get(0, 0)), "attack": int(counts.get(1, 0))},
        "condition_directories": sorted(df["condition_directory"].unique().tolist()),
        "missing_values": int(df[FEATURE_COLUMNS].isna().sum().sum()),
        "nan_values": int(df[FEATURE_COLUMNS].isna().sum().sum()),
        "inf_values": int(np.isinf(values).sum()),
        "duplicate_metadata_rows": int(df.duplicated(METADATA_COLUMNS).sum()),
    }


def verify_baseline_equivalence(train: pd.DataFrame, test: pd.DataFrame) -> None:
    for split, rich in (("train", train), ("test", test)):
        baseline = pd.read_csv(BASELINE_DIR / f"{split}.csv")
        if len(baseline) != len(rich):
            raise ValueError(f"Baseline {split} row count differs")
        key = METADATA_COLUMNS
        if not baseline[key].equals(rich[key]):
            raise ValueError(f"Baseline {split} metadata order/content differs")
        for feature in ("count", "mean", "max", "sum"):
            if not np.allclose(baseline[feature], rich[feature], rtol=0, atol=1e-12):
                raise ValueError(f"Baseline {split} feature mismatch: {feature}")


def main() -> None:
    rows = build_rows()
    frame = pd.DataFrame(rows, columns=METADATA_COLUMNS + FEATURE_COLUMNS)
    train = frame[frame["condition_directory"].isin(TRAIN_CONDITIONS)].reset_index(drop=True)
    test = frame[frame["condition_directory"].isin(TEST_CONDITIONS)].reset_index(drop=True)
    validation = {"train": validate_partition(train, "train"), "test": validate_partition(test, "test")}
    verify_baseline_equivalence(train, test)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    train.to_csv(OUTPUT_DIR / "train.csv", index=False)
    test.to_csv(OUTPUT_DIR / "test.csv", index=False)
    schema = {
        "dataset_name": "TOP_richer_stats_v1", "source_family": "TOP", "profiling_context": None,
        "metric": None, "columns": METADATA_COLUMNS + FEATURE_COLUMNS, "feature_count": len(FEATURE_COLUMNS),
        "feature_definitions": {"std_ddof": 0, "quantile_method": "numpy.linear", "iqr": "q3 - q1"},
        "label_column": "label", "label_encoding": {"normal": 0, "attack": 1},
        "sample_definition": "one complete labelled TOP data_point[] series = one ML sample",
        "no_cross_family_alignment": True, "raw_symbol_name_is_metadata_only": True,
    }
    (OUTPUT_DIR / "schema.json").write_text(json.dumps(schema, indent=2), encoding="utf-8")
    validation.update({
        "dataset_name": "TOP_richer_stats_v1", "feature_columns": FEATURE_COLUMNS,
        "train_conditions": TRAIN_CONDITIONS, "test_conditions": TEST_CONDITIONS,
        "baseline_equivalence_verified": True, "dataset_source_modified": False,
        "preprocessing_pipeline_modified": False,
    })
    (OUTPUT_DIR / "validation.json").write_text(json.dumps(validation, indent=2), encoding="utf-8")
    print(json.dumps(validation, indent=2))


if __name__ == "__main__":
    main()
