from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Callable, Dict, List

import joblib
import numpy as np
import pandas as pd
import sklearn
import xgboost
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, average_precision_score, confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import LinearSVC
from xgboost import XGBClassifier

ROOT = Path(__file__).resolve().parent
DATASET_DIR = ROOT / "processed" / "TOP_richer_stats_v1"
EXPERIMENT_DIR = ROOT / "experiments" / "TOP_richer_stats_v1"
SEED = 42
CV_FOLDS = 5
FEATURE_COLUMNS = ["count", "mean", "max", "sum", "std", "min", "median", "q1", "q3", "iqr"]
METADATA_COLUMNS = ["condition_directory", "source_family", "profiling_context", "entity_id", "metric", "raw_symbol_name", "label"]
TRAIN_CONDITIONS = ["Correct_ID/Random_CS_ON/Gaussian_Off", "Wrong_ID/Random_CS_OFF/Gaussian_Off"]
TEST_CONDITIONS = ["Correct_ID/Random_CS_OFF/Gaussian_Off", "Wrong_ID/Random_CS_ON/Gaussian_Off"]


def metrics(y: pd.Series | np.ndarray, pred: np.ndarray, score: np.ndarray) -> Dict[str, Any]:
    yv = np.asarray(y, dtype=int)
    tn, fp, fn, tp = confusion_matrix(yv, pred, labels=[0, 1]).ravel()
    return {"accuracy": float(accuracy_score(yv, pred)), "precision": float(precision_score(yv, pred, zero_division=0)),
            "recall": float(recall_score(yv, pred, zero_division=0)), "f1": float(f1_score(yv, pred, zero_division=0)),
            "roc_auc": float(roc_auc_score(yv, score)), "pr_auc": float(average_precision_score(yv, score)),
            "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp), "fpr": float(fp / (fp + tn)) if fp + tn else 0.0,
            "confusion_matrix": [[int(tn), int(fp)], [int(fn), int(tp)]]}


def scores(model: Any, X: pd.DataFrame) -> np.ndarray:
    if hasattr(model, "predict_proba"):
        return np.asarray(model.predict_proba(X)[:, 1], dtype=float)
    return np.asarray(model.decision_function(X), dtype=float)


def specs() -> List[Dict[str, Any]]:
    def xgb(scale: float) -> XGBClassifier:
        return XGBClassifier(random_state=SEED, n_estimators=500, max_depth=6, learning_rate=0.05, subsample=0.9,
                             colsample_bytree=0.9, objective="binary:logistic", eval_metric="logloss",
                             scale_pos_weight=scale, n_jobs=-1)
    return [
        {"name": "logistic_regression_standard", "family": "logistic_regression", "balance_mode": "standard", "class_weight": None,
         "factory": lambda y: Pipeline([("scaler", StandardScaler()), ("model", LogisticRegression(random_state=SEED, max_iter=4000, solver="lbfgs"))])},
        {"name": "logistic_regression_balanced", "family": "logistic_regression", "balance_mode": "balanced", "class_weight": "balanced",
         "factory": lambda y: Pipeline([("scaler", StandardScaler()), ("model", LogisticRegression(random_state=SEED, max_iter=4000, solver="lbfgs", class_weight="balanced"))])},
        {"name": "random_forest_standard", "family": "random_forest", "balance_mode": "standard", "class_weight": None,
         "factory": lambda y: RandomForestClassifier(random_state=SEED, n_estimators=400, min_samples_leaf=1)},
        {"name": "random_forest_balanced", "family": "random_forest", "balance_mode": "balanced", "class_weight": "balanced",
         "factory": lambda y: RandomForestClassifier(random_state=SEED, n_estimators=400, class_weight="balanced", min_samples_leaf=1)},
        {"name": "xgboost_standard", "family": "xgboost", "balance_mode": "standard", "class_weight": None, "factory": lambda y: xgb(1.0)},
        {"name": "xgboost_balanced", "family": "xgboost", "balance_mode": "balanced", "class_weight": "scale_pos_weight",
         "factory": lambda y: xgb(float((y == 0).sum() / (y == 1).sum()))},
        {"name": "linear_svm_standard", "family": "linear_svm", "balance_mode": "standard", "class_weight": None,
         "factory": lambda y: Pipeline([("scaler", StandardScaler()), ("model", LinearSVC(random_state=SEED, C=1.0, max_iter=10000))])},
        {"name": "linear_svm_balanced", "family": "linear_svm", "balance_mode": "balanced", "class_weight": "balanced",
         "factory": lambda y: Pipeline([("scaler", StandardScaler()), ("model", LinearSVC(random_state=SEED, C=1.0, max_iter=10000, class_weight="balanced"))])},
    ]


def validate(frame: pd.DataFrame, conditions: List[str], expected_rows: int, expected_counts: Dict[int, int]) -> None:
    required = METADATA_COLUMNS + FEATURE_COLUMNS
    if frame.columns.tolist() != required or len(frame) != expected_rows:
        raise ValueError("Unexpected dataset schema or row count")
    if sorted(frame.condition_directory.unique()) != sorted(conditions):
        raise ValueError("Unexpected condition split")
    if frame.label.value_counts().to_dict() != expected_counts or not np.isfinite(frame[FEATURE_COLUMNS].to_numpy(dtype=float)).all():
        raise ValueError("Invalid labels or features")


def cv_result(spec: Dict[str, Any], X: pd.DataFrame, y: pd.Series) -> Dict[str, Any]:
    rows = []
    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=SEED)
    for fold, (fit_idx, valid_idx) in enumerate(cv.split(X, y), start=1):
        fit_X, fit_y = X.iloc[fit_idx], y.iloc[fit_idx]
        valid_X, valid_y = X.iloc[valid_idx], y.iloc[valid_idx]
        model = spec["factory"](fit_y)
        model.fit(fit_X, fit_y)
        score = scores(model, valid_X)
        row = metrics(valid_y, (score >= 0.5).astype(int), score)
        row["fold"] = fold
        rows.append(row)
    result = {"config_name": spec["name"], "family": spec["family"], "balance_mode": spec["balance_mode"],
              "class_weight": spec["class_weight"], "cv_folds": CV_FOLDS, "fold_metrics": rows}
    for key in ("pr_auc", "roc_auc", "f1", "recall", "precision", "accuracy", "fpr"):
        result[f"mean_{key}"] = float(np.mean([row[key] for row in rows]))
    return result


def importance(model: Any) -> List[Dict[str, Any]]:
    if isinstance(model, XGBClassifier):
        booster = model.get_booster()
        gain, weight = booster.get_score(importance_type="gain"), booster.get_score(importance_type="weight")
        return [{"feature": feature, "gain": float(gain.get(feature, 0.0)), "split_count": int(weight.get(feature, 0))} for feature in FEATURE_COLUMNS]
    if isinstance(model, RandomForestClassifier):
        return [{"feature": feature, "impurity_importance": float(value)} for feature, value in zip(FEATURE_COLUMNS, model.feature_importances_)]
    estimator = model.named_steps["model"]
    return [{"feature": feature, "standardized_coefficient": float(value)} for feature, value in zip(FEATURE_COLUMNS, estimator.coef_.ravel())]


def diagnostic(spec: Dict[str, Any], frame: pd.DataFrame) -> List[Dict[str, Any]]:
    result = []
    for name, fit_condition, valid_condition in [("A", TRAIN_CONDITIONS[0], TRAIN_CONDITIONS[1]), ("B", TRAIN_CONDITIONS[1], TRAIN_CONDITIONS[0])]:
        fit = frame[frame.condition_directory == fit_condition]
        valid = frame[frame.condition_directory == valid_condition]
        model = spec["factory"](fit.label)
        model.fit(fit[FEATURE_COLUMNS], fit.label)
        score = scores(model, valid[FEATURE_COLUMNS])
        row = metrics(valid.label, (score >= 0.5).astype(int), score)
        row.update({"diagnostic": name, "fit_condition": fit_condition, "validation_condition": valid_condition,
                    "fit_rows": int(len(fit)), "validation_rows": int(len(valid))})
        result.append(row)
    return result


def main() -> None:
    train = pd.read_csv(DATASET_DIR / "train.csv")
    validate(train, TRAIN_CONDITIONS, 4152, {1: 3016, 0: 1136})
    X, y = train[FEATURE_COLUMNS], train.label.astype(int)
    EXPERIMENT_DIR.mkdir(parents=True, exist_ok=True)
    results = [cv_result(spec, X, y) for spec in specs()]
    ranked = sorted(results, key=lambda row: (-row["mean_pr_auc"], -row["mean_roc_auc"], -row["mean_f1"], row["config_name"]))
    pd.DataFrame([{key: value for key, value in row.items() if key != "fold_metrics"} for row in ranked]).to_csv(EXPERIMENT_DIR / "cv_selection_summary.csv", index=False)
    cv_dir = EXPERIMENT_DIR / "train_cv"
    cv_dir.mkdir(exist_ok=True)
    for row in results:
        pd.DataFrame(row["fold_metrics"]).to_csv(cv_dir / f"{row['config_name']}.csv", index=False)
    selected = ranked[0]
    spec = next(item for item in specs() if item["name"] == selected["config_name"])
    diagnostics = diagnostic(spec, train)
    (EXPERIMENT_DIR / "condition_transfer_diagnostics.json").write_text(json.dumps(diagnostics, indent=2), encoding="utf-8")
    pd.DataFrame(diagnostics).to_csv(EXPERIMENT_DIR / "condition_transfer_diagnostics.csv", index=False)

    # TEST is loaded only after feature schema and configuration selection are complete.
    test = pd.read_csv(DATASET_DIR / "test.csv")
    validate(test, TEST_CONDITIONS, 3592, {1: 2373, 0: 1219})
    model = spec["factory"](y)
    model.fit(X, y)
    test_score = scores(model, test[FEATURE_COLUMNS])
    test_pred = (test_score >= 0.5).astype(int)
    test_metrics = metrics(test.label, test_pred, test_score)
    selected_dir = EXPERIMENT_DIR / selected["config_name"]
    selected_dir.mkdir(exist_ok=True)
    joblib.dump(model, selected_dir / "model.joblib")
    if hasattr(model, "named_steps"):
        joblib.dump(model.named_steps["scaler"], selected_dir / "scaler.joblib")
    predictions = test[METADATA_COLUMNS + FEATURE_COLUMNS].copy()
    predictions["actual_label"] = test.label.to_numpy()
    predictions["predicted_label"] = test_pred
    predictions["probability_attack"] = test_score
    predictions["probability_normal"] = 1.0 - test_score
    predictions.to_csv(selected_dir / "predictions.csv", index=False)
    (selected_dir / "metrics.json").write_text(json.dumps(test_metrics, indent=2), encoding="utf-8")
    (selected_dir / "confusion_matrix.json").write_text(json.dumps({"labels": [0, 1], "matrix": test_metrics["confusion_matrix"]}, indent=2), encoding="utf-8")
    (selected_dir / "feature_importance.json").write_text(json.dumps(importance(model), indent=2), encoding="utf-8")
    condition_rows = []
    for condition, subset in test.assign(_pred=test_pred, _score=test_score).groupby("condition_directory"):
        condition_rows.append({"condition_directory": condition, **metrics(subset.label, subset._pred.to_numpy(), subset._score.to_numpy())})
    (selected_dir / "condition_metrics.json").write_text(json.dumps(condition_rows, indent=2), encoding="utf-8")
    pd.DataFrame(condition_rows).to_csv(selected_dir / "condition_metrics.csv", index=False)
    manifest = {"dataset_name": "TOP_richer_stats_v1", "feature_columns": FEATURE_COLUMNS, "train_rows": len(train), "test_rows": len(test),
                "train_conditions": TRAIN_CONDITIONS, "test_conditions": TEST_CONDITIONS,
                "train_class_distribution": {"normal": 1136, "attack": 3016}, "test_class_distribution": {"normal": 1219, "attack": 2373}}
    summary = {"dataset": manifest, "random_seed": SEED, "cv_folds": CV_FOLDS, "selection_metric": "pr_auc", "tie_break_order": ["roc_auc", "f1"],
               "results_by_config": [{key: value for key, value in row.items() if key != "fold_metrics"} for row in ranked],
               "winner": {key: value for key, value in selected.items() if key != "fold_metrics"}, "test_metrics": test_metrics,
               "condition_transfer_diagnostics": diagnostics, "test_set_used_once_after_selection": True, "train_only_selection": True, "no_external_api": True}
    (EXPERIMENT_DIR / "experiment_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    (selected_dir / "selected_model.json").write_text(json.dumps({"selected_config": selected["config_name"], "selection_reason": "highest TRAIN-only CV PR-AUC, then ROC-AUC, then F1", "winner": summary["winner"]}, indent=2), encoding="utf-8")
    config = {"random_seed": SEED, "cv_folds": CV_FOLDS, "selection_metric": "pr_auc", "tie_break_order": ["roc_auc", "f1"], "threshold": 0.5,
              "feature_columns": FEATURE_COLUMNS, "train_only_selection": True, "test_loaded_after_selection": True,
              "python_version": sys.version, "pandas_version": pd.__version__, "numpy_version": np.__version__, "sklearn_version": sklearn.__version__, "xgboost_version": xgboost.__version__}
    (selected_dir / "experiment_config.json").write_text(json.dumps(config, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
