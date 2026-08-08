from __future__ import annotations

import json
import math
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, Iterable, List

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
DATASET_DIR = ROOT / "dataset"
PROCESSED_DIR = ROOT / "processed"
PROCESSED_DIR.mkdir(exist_ok=True, parents=True)

TRAIN_CONDITIONS = [
    "Correct_ID/Random_CS_ON/Gaussian_Off",
    "Wrong_ID/Random_CS_OFF/Gaussian_Off",
]
TEST_CONDITIONS = [
    "Correct_ID/Random_CS_OFF/Gaussian_Off",
    "Wrong_ID/Random_CS_ON/Gaussian_Off",
]
ALL_CONDITIONS = {
    "train": TRAIN_CONDITIONS,
    "test": TEST_CONDITIONS,
}
CLASS_MAP = {"normal": 0, "attack": 1}
STAT_METRICS = ["branch", "cycles", "instructions"]
TOP_METRICS = ["branch", "cycles", "instructions"]

TIME_DELTA_FEATURES = ["count", "mean", "std", "min", "max", "median"]
STAT_FEATURES = ["count", "mean", "std", "min", "max", "median"]
TOP_FEATURES = ["count", "mean", "max", "sum"]

WARNINGS: List[str] = []

DATASET_SPEC = {
    "TIME_DELTA_dataset": {
        "family": "TIME_DELTA",
        "metadata": ["condition_directory", "source_family", "profiling_context", "entity_id", "metric", "label"],
        "features": ["count", "mean", "std", "min", "max", "median"],
        "kind": "time_delta",
    },
    "STAT_CS_branch": {"family": "STAT", "profiling_context": "CS", "metric": "branch", "metadata": ["condition_directory", "source_family", "profiling_context", "entity_id", "metric", "label"], "features": STAT_FEATURES, "kind": "stat"},
    "STAT_CS_cycles": {"family": "STAT", "profiling_context": "CS", "metric": "cycles", "metadata": ["condition_directory", "source_family", "profiling_context", "entity_id", "metric", "label"], "features": STAT_FEATURES, "kind": "stat"},
    "STAT_CS_instructions": {"family": "STAT", "profiling_context": "CS", "metric": "instructions", "metadata": ["condition_directory", "source_family", "profiling_context", "entity_id", "metric", "label"], "features": STAT_FEATURES, "kind": "stat"},
    "STAT_GS_branch": {"family": "STAT", "profiling_context": "GS", "metric": "branch", "metadata": ["condition_directory", "source_family", "profiling_context", "entity_id", "metric", "label"], "features": STAT_FEATURES, "kind": "stat"},
    "STAT_GS_cycles": {"family": "STAT", "profiling_context": "GS", "metric": "cycles", "metadata": ["condition_directory", "source_family", "profiling_context", "entity_id", "metric", "label"], "features": STAT_FEATURES, "kind": "stat"},
    "STAT_GS_instructions": {"family": "STAT", "profiling_context": "GS", "metric": "instructions", "metadata": ["condition_directory", "source_family", "profiling_context", "entity_id", "metric", "label"], "features": STAT_FEATURES, "kind": "stat"},
    "TOP_baseline_dataset": {"family": "TOP", "metadata": ["condition_directory", "source_family", "profiling_context", "entity_id", "metric", "raw_symbol_name", "label"], "features": ["count", "mean", "max", "sum"], "kind": "top"},
}


def infer_profiling_context(entity_id: str) -> str:
    return "GS" if str(entity_id).startswith("GS_") else "CS"


def ensure_numeric_series(raw_value: Any, source_description: str) -> List[float]:
    if raw_value is None:
        raise ValueError(f"Missing data_point in {source_description}")
    if not isinstance(raw_value, list):
        raise TypeError(f"Expected data_point list in {source_description}, got {type(raw_value).__name__}")
    if len(raw_value) == 0:
        raise ValueError(f"Empty data_point array in {source_description}")

    numeric_values: List[float] = []
    for item in raw_value:
        if item is None:
            raise ValueError(f"Null value encountered in {source_description}")
        if isinstance(item, bool):
            raise ValueError(f"Boolean value encountered in {source_description}")
        if not isinstance(item, (int, float)):
            raise TypeError(f"Malformed non-numeric value in {source_description}: {item!r}")
        value = float(item)
        if math.isnan(value) or math.isinf(value):
            raise ValueError(f"NaN/Inf value encountered in {source_description}: {item!r}")
        numeric_values.append(value)
    return numeric_values


def summarize_numeric_values(values: Iterable[float], feature_names: List[str]) -> Dict[str, float]:
    arr = list(values)
    if not arr:
        raise ValueError("Cannot summarize an empty series")
    a = pd.Series(arr, dtype=float)
    output: Dict[str, float] = {}
    for name in feature_names:
        if name == "count":
            output[name] = float(len(a))
        elif name == "mean":
            output[name] = float(a.mean())
        elif name == "std":
            output[name] = float(a.std(ddof=0))
        elif name == "min":
            output[name] = float(a.min())
        elif name == "max":
            output[name] = float(a.max())
        elif name == "median":
            output[name] = float(a.median())
        elif name == "sum":
            output[name] = float(a.sum())
        else:
            raise KeyError(f"Unsupported feature name: {name}")
    return output


def valid_condition_paths() -> List[Path]:
    paths: List[Path] = []
    for rel in TRAIN_CONDITIONS + TEST_CONDITIONS:
        p = DATASET_DIR / rel
        if p.exists():
            paths.append(p)
    return paths


def choose_split(condition_directory: str) -> str:
    if condition_directory in TRAIN_CONDITIONS:
        return "train"
    if condition_directory in TEST_CONDITIONS:
        return "test"
    raise ValueError(f"Condition directory not in approved split: {condition_directory}")


def iter_json_files(path: Path) -> List[Path]:
    return sorted(p for p in path.glob("*.json") if p.is_file())


def collect_time_delta_rows() -> Dict[str, List[Dict[str, Any]]]:
    global WARNINGS
    rows: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for condition in TRAIN_CONDITIONS + TEST_CONDITIONS:
        condition_path = DATASET_DIR / condition
        time_dir = condition_path / "TIME_DELTA"
        if not time_dir.exists():
            continue
        for file_path in iter_json_files(time_dir):
            try:
                payload = json.loads(file_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError as exc:
                WARNINGS.append(f"Skipping malformed JSON in {file_path}: {exc}")
                continue
            if not isinstance(payload, dict):
                WARNINGS.append(f"Skipping non-dict payload in {file_path}")
                continue
            for entity_id, entity_payload in payload.items():
                if not isinstance(entity_payload, dict):
                    continue
                time_payload = entity_payload.get("time_diff")
                if not isinstance(time_payload, dict):
                    continue
                for class_name, class_payload in time_payload.items():
                    if class_name not in CLASS_MAP:
                        continue
                    try:
                        values = ensure_numeric_series(class_payload.get("data_point"), f"{condition}/TIME_DELTA/{entity_id}/{class_name}")
                    except (TypeError, ValueError) as exc:
                        WARNINGS.append(f"Skipping invalid TIME_DELTA sample: {condition}/{entity_id}/{class_name}: {exc}")
                        continue
                    row = {
                        "condition_directory": condition,
                        "source_family": "TIME_DELTA",
                        "profiling_context": infer_profiling_context(entity_id),
                        "entity_id": str(entity_id),
                        "metric": "time_diff",
                        "label": CLASS_MAP[class_name],
                    }
                    for feature_name, feature_value in summarize_numeric_values(values, TIME_DELTA_FEATURES).items():
                        row[feature_name] = feature_value
                    rows["TIME_DELTA_dataset"].append(row)
    return rows


def collect_stat_rows() -> Dict[str, List[Dict[str, Any]]]:
    global WARNINGS
    rows: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for condition in TRAIN_CONDITIONS + TEST_CONDITIONS:
        for context in ["CS", "GS"]:
            stat_dir = DATASET_DIR / condition / "STAT" / context
            if not stat_dir.exists():
                continue
            for file_path in iter_json_files(stat_dir):
                try:
                    payload = json.loads(file_path.read_text(encoding="utf-8"))
                except json.JSONDecodeError as exc:
                    WARNINGS.append(f"Skipping malformed JSON in {file_path}: {exc}")
                    continue
                if not isinstance(payload, dict):
                    WARNINGS.append(f"Skipping non-dict STAT payload in {file_path}")
                    continue
                for entity_id, entity_payload in payload.items():
                    if not isinstance(entity_payload, dict):
                        continue
                    for metric in STAT_METRICS:
                        metric_payload = entity_payload.get(metric)
                        if not isinstance(metric_payload, dict):
                            continue
                        for class_name, class_payload in metric_payload.items():
                            if class_name not in CLASS_MAP:
                                continue
                            dataset_name = f"STAT_{context}_{metric}"
                            try:
                                values = ensure_numeric_series(class_payload.get("data_point"), f"{condition}/STAT/{context}/{entity_id}/{metric}/{class_name}")
                            except (TypeError, ValueError) as exc:
                                WARNINGS.append(f"Skipping invalid STAT sample: {condition}/STAT/{context}/{entity_id}/{metric}/{class_name}: {exc}")
                                continue
                            row = {
                                "condition_directory": condition,
                                "source_family": "STAT",
                                "profiling_context": context,
                                "entity_id": str(entity_id),
                                "metric": metric,
                                "label": CLASS_MAP[class_name],
                            }
                            for feature_name, feature_value in summarize_numeric_values(values, STAT_FEATURES).items():
                                row[feature_name] = feature_value
                            rows[dataset_name].append(row)
    return rows


def collect_top_rows() -> Dict[str, List[Dict[str, Any]]]:
    global WARNINGS
    rows: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for condition in TRAIN_CONDITIONS + TEST_CONDITIONS:
        for context in ["CS", "GS"]:
            top_dir = DATASET_DIR / condition / "TOP" / context
            if not top_dir.exists():
                continue
            for file_path in iter_json_files(top_dir):
                file_name = file_path.name.lower()
                if "basis" in file_name or "feature" in file_name or "final_dataset" in file_name or "kernel_record" in file_name or "ratio" in file_name or "elbow" in file_name or "record_size" in file_name or "intersection" in file_name or "avg" in file_name or "unique" in file_name or "sam_res" in file_name:
                    continue
                try:
                    payload = json.loads(file_path.read_text(encoding="utf-8"))
                except json.JSONDecodeError as exc:
                    WARNINGS.append(f"Skipping malformed JSON in {file_path}: {exc}")
                    continue
                if not isinstance(payload, dict):
                    WARNINGS.append(f"Skipping non-dict TOP payload in {file_path}")
                    continue
                for entity_id, entity_payload in payload.items():
                    if not isinstance(entity_payload, dict):
                        continue
                    for metric in TOP_METRICS:
                        metric_payload = entity_payload.get(metric)
                        if not isinstance(metric_payload, dict):
                            continue
                        for class_name, symbol_payload in metric_payload.items():
                            if class_name not in CLASS_MAP:
                                continue
                            if not isinstance(symbol_payload, dict):
                                continue
                            for symbol_name, symbol_info in symbol_payload.items():
                                if not isinstance(symbol_info, dict):
                                    continue
                                try:
                                    values = ensure_numeric_series(symbol_info.get("data_point"), f"{condition}/TOP/{context}/{entity_id}/{metric}/{class_name}/{symbol_name}")
                                except (TypeError, ValueError) as exc:
                                    WARNINGS.append(f"Skipping invalid TOP sample: {condition}/TOP/{context}/{entity_id}/{metric}/{class_name}/{symbol_name}: {exc}")
                                    continue
                                row = {
                                    "condition_directory": condition,
                                    "source_family": "TOP",
                                    "profiling_context": context,
                                    "entity_id": str(entity_id),
                                    "metric": metric,
                                    "raw_symbol_name": str(symbol_name),
                                    "label": CLASS_MAP[class_name],
                                }
                                for feature_name, feature_value in summarize_numeric_values(values, TOP_FEATURES).items():
                                    row[feature_name] = feature_value
                                rows["TOP_baseline_dataset"].append(row)
    return rows


def split_rows_for_dataset(rows: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    split_rows = {"train": [], "test": []}
    for row in rows:
        split_rows[choose_split(row["condition_directory"])].append(row)
    return split_rows


def dataset_output_paths() -> Dict[str, Path]:
    return {
        name: PROCESSED_DIR / name for name in DATASET_SPEC.keys()
    }


def build_schema(dataset_name: str) -> Dict[str, Any]:
    spec = DATASET_SPEC[dataset_name]
    columns = list(spec["metadata"]) + list(spec["features"])
    return {
        "dataset_name": dataset_name,
        "source_family": spec["family"],
        "profiling_context": spec.get("profiling_context"),
        "metric": spec.get("metric"),
        "columns": columns,
        "feature_count": len(spec["features"]),
        "label_column": "label",
        "label_encoding": {"normal": 0, "attack": 1},
    }


def write_dataset_csv(dataset_name: str, rows: List[Dict[str, Any]], split_name: str) -> None:
    output_dir = PROCESSED_DIR / dataset_name
    output_dir.mkdir(exist_ok=True, parents=True)
    df = pd.DataFrame(rows)
    if not rows:
        columns = list(DATASET_SPEC[dataset_name]["metadata"]) + list(DATASET_SPEC[dataset_name]["features"])
        df = pd.DataFrame(columns=columns)
    else:
        columns = list(DATASET_SPEC[dataset_name]["metadata"]) + list(DATASET_SPEC[dataset_name]["features"])
        df = df[columns]
    df.to_csv(output_dir / f"{split_name}.csv", index=False)
    with (output_dir / "schema.json").open("w", encoding="utf-8") as f:
        json.dump(build_schema(dataset_name), f, indent=2)


def validate_dataset(df: pd.DataFrame, dataset_name: str) -> Dict[str, Any]:
    feature_columns = list(DATASET_SPEC[dataset_name]["features"])
    missing = int(df[feature_columns].isna().sum().sum())
    inf_count = int(pd.DataFrame(np.where(np.isinf(df[feature_columns].to_numpy(dtype=float)), 1, 0)).sum().sum()) if not df.empty else 0
    return {
        "rows": int(len(df)),
        "label_counts": {"normal": int((df["label"] == 0).sum()), "attack": int((df["label"] == 1).sum())},
        "missing_values": missing,
        "nan_values": int(df[feature_columns].isna().sum().sum()),
        "inf_values": inf_count,
        "feature_count": len(feature_columns),
    }


def main() -> None:
    WARNINGS.clear()
    time_rows = collect_time_delta_rows()
    stat_rows = collect_stat_rows()
    top_rows = collect_top_rows()

    all_dataset_rows: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for dataset_name, rows in time_rows.items():
        all_dataset_rows[dataset_name].extend(rows)
    for dataset_name, rows in stat_rows.items():
        all_dataset_rows[dataset_name].extend(rows)
    for dataset_name, rows in top_rows.items():
        all_dataset_rows[dataset_name].extend(rows)

    summary: Dict[str, Any] = {
        "train_conditions": TRAIN_CONDITIONS,
        "test_conditions": TEST_CONDITIONS,
        "dataset_not_modified": True,
        "dataset_paths": {},
        "raw_series_counts": {
            "TIME_DELTA_dataset": len(all_dataset_rows.get("TIME_DELTA_dataset", [])),
            "STAT_summary": {name: len(all_dataset_rows.get(name, [])) for name in [
                "STAT_CS_branch",
                "STAT_CS_cycles",
                "STAT_CS_instructions",
                "STAT_GS_branch",
                "STAT_GS_cycles",
                "STAT_GS_instructions",
            ]},
            "TOP_baseline_dataset": len(all_dataset_rows.get("TOP_baseline_dataset", [])),
        },
        "dataset_split_counts": {},
        "class_distribution": {},
        "missing_invalid_values": {},
        "warnings": [],
    }

    for dataset_name in DATASET_SPEC.keys():
        rows = all_dataset_rows.get(dataset_name, [])
        split_rows = split_rows_for_dataset(rows)
        for split_name in ["train", "test"]:
            write_dataset_csv(dataset_name, split_rows[split_name], split_name)
        summary["dataset_split_counts"][dataset_name] = {split_name: len(split_rows[split_name]) for split_name in ["train", "test"]}

        train_df = pd.DataFrame(split_rows["train"])
        test_df = pd.DataFrame(split_rows["test"])
        summary["class_distribution"][dataset_name] = {
            "train": {"normal": int((train_df["label"] == 0).sum()) if not train_df.empty else 0, "attack": int((train_df["label"] == 1).sum()) if not train_df.empty else 0},
            "test": {"normal": int((test_df["label"] == 0).sum()) if not test_df.empty else 0, "attack": int((test_df["label"] == 1).sum()) if not test_df.empty else 0},
        }
        feature_columns = list(DATASET_SPEC[dataset_name]["features"])
        summary["missing_invalid_values"][dataset_name] = {
            "train": {
                "missing_values": int(train_df[feature_columns].isna().sum().sum()) if not train_df.empty else 0,
                "nan_values": int(train_df[feature_columns].isna().sum().sum()) if not train_df.empty else 0,
                "inf_values": int(np.isinf(train_df[feature_columns].to_numpy(dtype=float)).sum()) if not train_df.empty else 0,
            },
            "test": {
                "missing_values": int(test_df[feature_columns].isna().sum().sum()) if not test_df.empty else 0,
                "nan_values": int(test_df[feature_columns].isna().sum().sum()) if not test_df.empty else 0,
                "inf_values": int(np.isinf(test_df[feature_columns].to_numpy(dtype=float)).sum()) if not test_df.empty else 0,
            },
        }

    summary["warnings"] = WARNINGS
    summary["generated_files"] = sorted(str(p.relative_to(ROOT)) for p in PROCESSED_DIR.rglob("*") if p.is_file())
    summary["train_test_condition_verification"] = {
        "train": TRAIN_CONDITIONS,
        "test": TEST_CONDITIONS,
        "all_rows_in_approved_split": True,
    }
    summary["dataset_architecture"] = {
        "sample_identity": "one complete labelled data_point[] series = one ML sample",
        "family_aware_outputs": list(DATASET_SPEC.keys()),
        "no_cross_family_alignment": True,
        "top_baseline_uses_metadata_only_symbol": True,
        "top_k_vocabulary_not_used_in_baseline": True,
    }

    config_path = PROCESSED_DIR / "preprocessing_config.json"
    with config_path.open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    validation_path = PROCESSED_DIR / "preprocessing_validation.json"
    validation_payload = {
        "train_conditions": TRAIN_CONDITIONS,
        "test_conditions": TEST_CONDITIONS,
        "dataset_split_counts": summary["dataset_split_counts"],
        "class_distribution": summary["class_distribution"],
        "missing_invalid_values": summary["missing_invalid_values"],
        "generated_files": summary["generated_files"],
        "dataset_not_modified": True,
        "warnings": summary["warnings"],
    }
    with validation_path.open("w", encoding="utf-8") as f:
        json.dump(validation_payload, f, indent=2)

    print(json.dumps({
        "train_conditions": TRAIN_CONDITIONS,
        "test_conditions": TEST_CONDITIONS,
        "dataset_split_counts": summary["dataset_split_counts"],
        "class_distribution": summary["class_distribution"],
        "generated_files": summary["generated_files"],
        "dataset_not_modified": True,
    }, indent=2))


if __name__ == "__main__":
    main()
