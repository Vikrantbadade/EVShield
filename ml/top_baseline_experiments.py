from __future__ import annotations

import json
import math
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, average_precision_score, confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import LinearSVC
from xgboost import XGBClassifier

ROOT = Path(__file__).resolve().parent
PROCESSED_DIR = ROOT / "processed" / "TOP_baseline_dataset"
EXPERIMENT_ROOT = ROOT / "experiments" / "TOP_baseline_dataset"
SEED = 42
CV_FOLDS = 5
FEATURE_COLUMNS = ["count", "mean", "max", "sum"]
METADATA_COLUMNS = [
    "condition_directory",
    "source_family",
    "profiling_context",
    "entity_id",
    "metric",
    "raw_symbol_name",
    "label",
]


def verify_dataset(train_df: pd.DataFrame, test_df: pd.DataFrame) -> None:
    required = ["condition_directory", "source_family", "profiling_context", "entity_id", "metric", "raw_symbol_name", "label"] + FEATURE_COLUMNS
    missing = [c for c in required if c not in train_df.columns or c not in test_df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    if set(train_df["label"].unique()) - {0, 1}:
        raise ValueError("Train labels contain values outside {0,1}")
    if set(test_df["label"].unique()) - {0, 1}:
        raise ValueError("Test labels contain values outside {0,1}")
    if train_df[FEATURE_COLUMNS].isna().sum().sum() != 0:
        raise ValueError("Train features contain missing values")
    if test_df[FEATURE_COLUMNS].isna().sum().sum() != 0:
        raise ValueError("Test features contain missing values")
    if np.isinf(train_df[FEATURE_COLUMNS].to_numpy(dtype=float)).sum() != 0:
        raise ValueError("Train features contain Inf values")
    if np.isinf(test_df[FEATURE_COLUMNS].to_numpy(dtype=float)).sum() != 0:
        raise ValueError("Test features contain Inf values")
    expected_train_conditions = [
        "Correct_ID/Random_CS_ON/Gaussian_Off",
        "Wrong_ID/Random_CS_OFF/Gaussian_Off",
    ]
    expected_test_conditions = [
        "Correct_ID/Random_CS_OFF/Gaussian_Off",
        "Wrong_ID/Random_CS_ON/Gaussian_Off",
    ]
    if sorted(train_df["condition_directory"].unique().tolist()) != sorted(expected_train_conditions):
        raise ValueError(f"Unexpected train condition directories: {sorted(train_df['condition_directory'].unique().tolist())}")
    if sorted(test_df["condition_directory"].unique().tolist()) != sorted(expected_test_conditions):
        raise ValueError(f"Unexpected test condition directories: {sorted(test_df['condition_directory'].unique().tolist())}")


def build_model_specs() -> List[Dict[str, Any]]:
    specs: List[Dict[str, Any]] = []
    specs.append({
        "name": "logistic_regression_standard",
        "family": "logistic_regression",
        "balance_mode": "standard",
        "model_factory": lambda: Pipeline([
            ("scaler", StandardScaler()),
            ("model", LogisticRegression(random_state=SEED, max_iter=4000, solver="lbfgs")),
        ]),
        "requires_scaler": True,
        "class_weight": None,
    })
    specs.append({
        "name": "logistic_regression_balanced",
        "family": "logistic_regression",
        "balance_mode": "balanced",
        "model_factory": lambda: Pipeline([
            ("scaler", StandardScaler()),
            ("model", LogisticRegression(random_state=SEED, max_iter=4000, solver="lbfgs", class_weight="balanced")),
        ]),
        "requires_scaler": True,
        "class_weight": "balanced",
    })
    specs.append({
        "name": "random_forest_standard",
        "family": "random_forest",
        "balance_mode": "standard",
        "model_factory": lambda: RandomForestClassifier(random_state=SEED, n_estimators=400, min_samples_leaf=1),
        "requires_scaler": False,
        "class_weight": None,
    })
    specs.append({
        "name": "random_forest_balanced",
        "family": "random_forest",
        "balance_mode": "balanced",
        "model_factory": lambda: RandomForestClassifier(random_state=SEED, n_estimators=400, class_weight="balanced", min_samples_leaf=1),
        "requires_scaler": False,
        "class_weight": "balanced",
    })
    specs.append({
        "name": "xgboost_standard",
        "family": "xgboost",
        "balance_mode": "standard",
        "model_factory": lambda: XGBClassifier(
            random_state=SEED,
            n_estimators=500,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="binary:logistic",
            eval_metric="logloss",
            n_jobs=-1,
        ),
        "requires_scaler": False,
        "class_weight": None,
    })
    specs.append({
        "name": "xgboost_balanced",
        "family": "xgboost",
        "balance_mode": "balanced",
        "model_factory": lambda: XGBClassifier(
            random_state=SEED,
            n_estimators=500,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="binary:logistic",
            eval_metric="logloss",
            scale_pos_weight=1.0,
            n_jobs=-1,
        ),
        "requires_scaler": False,
        "class_weight": "scale_pos_weight",
    })
    specs.append({
        "name": "linear_svm_standard",
        "family": "linear_svm",
        "balance_mode": "standard",
        "model_factory": lambda: Pipeline([
            ("scaler", StandardScaler()),
            ("model", LinearSVC(random_state=SEED, C=1.0, max_iter=10000)),
        ]),
        "requires_scaler": True,
        "class_weight": None,
    })
    specs.append({
        "name": "linear_svm_balanced",
        "family": "linear_svm",
        "balance_mode": "balanced",
        "model_factory": lambda: Pipeline([
            ("scaler", StandardScaler()),
            ("model", LinearSVC(random_state=SEED, C=1.0, max_iter=10000, class_weight="balanced")),
        ]),
        "requires_scaler": True,
        "class_weight": "balanced",
    })
    return specs


def compute_metrics(y_true: Iterable[int], y_pred: Iterable[int], y_score: Iterable[float]) -> Dict[str, Any]:
    y_true_arr = np.asarray(list(y_true), dtype=int)
    y_pred_arr = np.asarray(list(y_pred), dtype=int)
    y_score_arr = np.asarray(list(y_score), dtype=float)
    tn, fp, fn, tp = confusion_matrix(y_true_arr, y_pred_arr, labels=[0, 1]).ravel()
    return {
        "accuracy": float(accuracy_score(y_true_arr, y_pred_arr)),
        "precision": float(precision_score(y_true_arr, y_pred_arr, zero_division=0)),
        "recall": float(recall_score(y_true_arr, y_pred_arr, zero_division=0)),
        "f1": float(f1_score(y_true_arr, y_pred_arr, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true_arr, y_score_arr)),
        "pr_auc": float(average_precision_score(y_true_arr, y_score_arr)),
        "tp": int(tp),
        "tn": int(tn),
        "fp": int(fp),
        "fn": int(fn),
        "confusion_matrix": [[int(tn), int(fp)], [int(fn), int(tp)]],
    }


def make_proba(model: Any, X: pd.DataFrame) -> np.ndarray:
    if hasattr(model, "predict_proba"):
        return np.asarray(model.predict_proba(X)[:, 1], dtype=float)
    if hasattr(model, "decision_function"):
        return np.asarray(model.decision_function(X), dtype=float)
    return np.asarray(model.predict(X), dtype=float)


def train_cv_for_spec(spec: Dict[str, Any], X_train: pd.DataFrame, y_train: pd.Series) -> Dict[str, Any]:
    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=SEED)
    fold_rows: List[Dict[str, Any]] = []
    fold_scores: List[float] = []
    for fold_idx, (train_idx, valid_idx) in enumerate(cv.split(X_train, y_train), start=1):
        X_fold_train = X_train.iloc[train_idx].reset_index(drop=True)
        y_fold_train = y_train.iloc[train_idx].reset_index(drop=True)
        X_fold_valid = X_train.iloc[valid_idx].reset_index(drop=True)
        y_fold_valid = y_train.iloc[valid_idx].reset_index(drop=True)

        model = spec["model_factory"]()
        if spec["family"] in {"logistic_regression", "linear_svm"}:
            model.fit(X_fold_train, y_fold_train)
        else:
            model.fit(X_fold_train, y_fold_train)

        valid_proba = make_proba(model, X_fold_valid)
        valid_pred = (valid_proba >= 0.5).astype(int)
        metrics = compute_metrics(y_fold_valid, valid_pred, valid_proba)
        metrics["fold"] = fold_idx
        fold_rows.append(metrics)
        fold_scores.append(metrics["pr_auc"])

    mean_pr_auc = float(np.mean(fold_scores))
    mean_roc_auc = float(np.mean([row["roc_auc"] for row in fold_rows]))
    mean_f1 = float(np.mean([row["f1"] for row in fold_rows]))
    mean_recall = float(np.mean([row["recall"] for row in fold_rows]))
    mean_precision = float(np.mean([row["precision"] for row in fold_rows]))
    return {
        "config_name": spec["name"],
        "family": spec["family"],
        "balance_mode": spec["balance_mode"],
        "class_weight": spec["class_weight"],
        "cv_folds": CV_FOLDS,
        "mean_pr_auc": mean_pr_auc,
        "mean_roc_auc": mean_roc_auc,
        "mean_f1": mean_f1,
        "mean_recall": mean_recall,
        "mean_precision": mean_precision,
        "fold_metrics": fold_rows,
    }


def fit_final_model(spec: Dict[str, Any], X_train: pd.DataFrame, y_train: pd.Series) -> Any:
    model = spec["model_factory"]()
    model.fit(X_train, y_train)
    return model


def save_run(run_dir: Path, spec: Dict[str, Any], cv_summary: Dict[str, Any], dataset_manifest: Dict[str, Any], final_model: Any, scaler: Any | None, X_test: pd.DataFrame, y_test: pd.Series, y_test_proba: np.ndarray, y_test_pred: np.ndarray) -> Dict[str, Any]:
    run_dir.mkdir(parents=True, exist_ok=True)

    if scaler is not None:
        joblib.dump(scaler, run_dir / "scaler.joblib")
    joblib.dump(final_model, run_dir / "model.joblib")

    final_metrics = compute_metrics(y_test, y_test_pred, y_test_proba)
    cm = confusion_matrix(y_test, y_test_pred, labels=[0, 1])
    final_summary = {
        "config_name": spec["name"],
        "family": spec["family"],
        "balance_mode": spec["balance_mode"],
        "class_weight": spec["class_weight"],
        "cv_selection_metric": "pr_auc",
        "cv_mean_pr_auc": cv_summary["mean_pr_auc"],
        "test_metrics": final_metrics,
        "selected_via_train_only_cv": True,
        "test_set_used_once": True,
        "no_external_api": True,
    }

    predictions = X_test.copy()
    predictions["actual_label"] = y_test.to_numpy()
    predictions["predicted_label"] = y_test_pred
    predictions["probability_attack"] = y_test_proba
    predictions["probability_normal"] = 1.0 - y_test_proba
    predictions = predictions.reset_index(drop=True)
    predictions.to_csv(run_dir / "predictions.csv", index=False)

    with (run_dir / "metrics.json").open("w", encoding="utf-8") as f:
        json.dump(final_metrics, f, indent=2)
    with (run_dir / "confusion_matrix.json").open("w", encoding="utf-8") as f:
        json.dump({"labels": [0, 1], "matrix": cm.tolist()}, f, indent=2)
    with (run_dir / "experiment_config.json").open("w", encoding="utf-8") as f:
        json.dump({
            "random_seed": SEED,
            "cv_folds": CV_FOLDS,
            "selection_metric": "pr_auc",
            "train_only_cv": True,
            "test_set_locked": True,
            "model_family": spec["family"],
            "config_name": spec["name"],
            "class_weight": spec["class_weight"],
            "dataset_manifest": dataset_manifest,
            "feature_columns": FEATURE_COLUMNS,
            "label_encoding": {"normal": 0, "attack": 1},
            "scaling_used": spec["requires_scaler"],
            "python_version": __import__("sys").version,
            "pandas_version": pd.__version__,
            "numpy_version": np.__version__,
            "sklearn_version": __import__("sklearn").__version__,
            "xgboost_version": __import__("xgboost").__version__,
        }, f, indent=2)
    with (run_dir / "dataset_manifest.json").open("w", encoding="utf-8") as f:
        json.dump(dataset_manifest, f, indent=2)
    with (run_dir / "experiment_summary.json").open("w", encoding="utf-8") as f:
        json.dump(final_summary, f, indent=2)
    cv_df = pd.DataFrame(cv_summary["fold_metrics"])
    cv_df.to_csv(run_dir / "train_cv_results.csv", index=False)

    return final_summary


def main() -> None:
    train_df = pd.read_csv(PROCESSED_DIR / "train.csv")
    test_df = pd.read_csv(PROCESSED_DIR / "test.csv")
    verify_dataset(train_df, test_df)

    X_train = train_df[FEATURE_COLUMNS].copy()
    y_train = train_df["label"].astype(int).copy()
    X_test = test_df[FEATURE_COLUMNS].copy()
    y_test = test_df["label"].astype(int).copy()

    dataset_manifest = {
        "dataset_name": "TOP_baseline_dataset",
        "dataset_path": str(PROCESSED_DIR),
        "train_rows": int(len(train_df)),
        "test_rows": int(len(test_df)),
        "feature_columns": FEATURE_COLUMNS,
        "train_conditions": sorted(train_df["condition_directory"].unique().tolist()),
        "test_conditions": sorted(test_df["condition_directory"].unique().tolist()),
        "label_encoding": {"normal": 0, "attack": 1},
        "train_class_distribution": {"normal": int((y_train == 0).sum()), "attack": int((y_train == 1).sum())},
        "test_class_distribution": {"normal": int((y_test == 0).sum()), "attack": int((y_test == 1).sum())},
        "missing_values": {"train": int(train_df[FEATURE_COLUMNS].isna().sum().sum()), "test": int(test_df[FEATURE_COLUMNS].isna().sum().sum())},
        "nan_values": {"train": int(train_df[FEATURE_COLUMNS].isna().sum().sum()), "test": int(test_df[FEATURE_COLUMNS].isna().sum().sum())},
        "inf_values": {"train": int(np.isinf(train_df[FEATURE_COLUMNS].to_numpy(dtype=float)).sum()), "test": int(np.isinf(test_df[FEATURE_COLUMNS].to_numpy(dtype=float)).sum())},
        "preprocessing_reference": str(ROOT / "processed" / "preprocessing_config.json"),
    }

    EXPERIMENT_ROOT.mkdir(parents=True, exist_ok=True)
    all_cv_results: List[Dict[str, Any]] = []

    for spec in build_model_specs():
        if spec["name"] == "xgboost_balanced":
            train_neg = int((y_train == 0).sum())
            train_pos = int((y_train == 1).sum())
            spec["model_factory"] = lambda: XGBClassifier(
                random_state=SEED,
                n_estimators=500,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.9,
                colsample_bytree=0.9,
                objective="binary:logistic",
                eval_metric="logloss",
                scale_pos_weight=train_neg / train_pos,
                n_jobs=-1,
            )
        cv_summary = train_cv_for_spec(spec, X_train, y_train)
        all_cv_results.append(cv_summary)

        run_path = EXPERIMENT_ROOT / spec["name"]
        fitted_model = fit_final_model(spec, X_train, y_train)
        if spec["family"] in {"logistic_regression", "linear_svm"}:
            scaler = fitted_model.named_steps["scaler"] if hasattr(fitted_model, "named_steps") else None
            final_model = fitted_model
        else:
            scaler = None
            final_model = fitted_model
        test_probs = make_proba(final_model, X_test)
        test_pred = (test_probs >= 0.5).astype(int)
        save_run(run_path, spec, cv_summary, dataset_manifest, final_model, scaler, X_test, y_test, test_probs, test_pred)

    cv_summary_df = pd.DataFrame([
        {
            "config_name": row["config_name"],
            "family": row["family"],
            "balance_mode": row["balance_mode"],
            "class_weight": str(row["class_weight"]),
            "mean_pr_auc": row["mean_pr_auc"],
            "mean_roc_auc": row["mean_roc_auc"],
            "mean_f1": row["mean_f1"],
            "mean_recall": row["mean_recall"],
            "mean_precision": row["mean_precision"],
        }
        for row in all_cv_results
    ])
    cv_summary_df = cv_summary_df.sort_values("mean_pr_auc", ascending=False).reset_index(drop=True)
    winner = cv_summary_df.iloc[0].to_dict()
    cv_summary_df.to_csv(EXPERIMENT_ROOT / "cv_selection_summary.csv", index=False)

    top_level_summary = {
        "dataset": dataset_manifest,
        "random_seed": SEED,
        "selection_metric": "pr_auc",
        "cv_folds": CV_FOLDS,
        "results_by_config": cv_summary_df.to_dict(orient="records"),
        "winner": winner,
        "test_set_used_once": True,
        "train_only_cv": True,
        "no_external_api": True,
    }
    with (EXPERIMENT_ROOT / "experiment_summary.json").open("w", encoding="utf-8") as f:
        json.dump(top_level_summary, f, indent=2)

    selected_name = winner["config_name"]
    selected_run_dir = EXPERIMENT_ROOT / selected_name
    with (selected_run_dir / "selected_model.json").open("w", encoding="utf-8") as f:
        json.dump({"selected_config": selected_name, "selection_reason": "highest mean PR-AUC from TRAIN-only stratified CV", "winner": winner}, f, indent=2)

    print(json.dumps(top_level_summary, indent=2))


if __name__ == "__main__":
    main()
