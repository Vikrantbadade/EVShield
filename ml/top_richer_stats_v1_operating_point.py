from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import StratifiedKFold

ROOT = Path(__file__).resolve().parent
DATASET_DIR = ROOT / "processed" / "TOP_richer_stats_v1"
SELECTED_DIR = ROOT / "experiments" / "TOP_richer_stats_v1" / "random_forest_standard"
OUTPUT_DIR = ROOT / "experiments" / "TOP_richer_stats_v1" / "operating_point"
FEATURE_COLUMNS = ["count", "mean", "max", "sum", "std", "min", "median", "q1", "q3", "iqr"]
METADATA_COLUMNS = ["condition_directory", "source_family", "profiling_context", "entity_id", "metric", "raw_symbol_name", "label"]
SEED = 42
THRESHOLDS = np.round(np.arange(0.10, 0.901, 0.05), 2)
FPR_CONSTRAINT = 0.30


def build_model() -> RandomForestClassifier:
    """The frozen Step 15 random_forest_standard configuration."""
    return RandomForestClassifier(random_state=SEED, n_estimators=400, min_samples_leaf=1)


def threshold_metrics(y_true: np.ndarray, scores: np.ndarray, threshold: float) -> Dict[str, Any]:
    predicted = (scores >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, predicted, labels=[0, 1]).ravel()
    return {
        "threshold": float(threshold), "precision": float(precision_score(y_true, predicted, zero_division=0)),
        "recall": float(recall_score(y_true, predicted, zero_division=0)),
        "f1": float(f1_score(y_true, predicted, zero_division=0)),
        "fpr": float(fp / (fp + tn)) if fp + tn else 0.0,
        "fnr": float(fn / (fn + tp)) if fn + tp else 0.0,
        "tp": int(tp), "tn": int(tn), "fp": int(fp), "fn": int(fn),
    }


def select_threshold(table: pd.DataFrame) -> Dict[str, Any]:
    eligible = table[table["fpr"] <= FPR_CONSTRAINT].copy()
    if eligible.empty:
        return {"selected_threshold": None, "constraint_satisfied": False,
                "selection_rule": "maximize recall subject to FPR <= 0.30; then F1; then precision",
                "reason": "No evaluated threshold satisfied the FPR constraint."}
    selected = eligible.sort_values(["recall", "f1", "precision", "threshold"], ascending=[False, False, False, False]).iloc[0]
    return {"selected_threshold": float(selected["threshold"]), "constraint_satisfied": True,
            "selection_rule": "maximize recall subject to FPR <= 0.30; then F1; then precision",
            "selected_train_oof_metrics": {key: (float(selected[key]) if key not in {"tp", "tn", "fp", "fn"} else int(selected[key]))
                                           for key in table.columns},
            "eligible_thresholds": [float(value) for value in eligible["threshold"].tolist()]}


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # TRAIN data only: the five temporary fold models create OOF scores. No final model is refit.
    train = pd.read_csv(DATASET_DIR / "train.csv")
    if len(train) != 4152 or not np.isfinite(train[FEATURE_COLUMNS].to_numpy(dtype=float)).all():
        raise ValueError("Unexpected or invalid TRAIN dataset")
    X, y = train[FEATURE_COLUMNS], train["label"].to_numpy(dtype=int)
    oof_scores = np.full(len(train), np.nan, dtype=float)
    oof_folds = np.full(len(train), -1, dtype=int)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    for fold, (fit_idx, valid_idx) in enumerate(cv.split(X, y), start=1):
        model = build_model()
        model.fit(X.iloc[fit_idx], y[fit_idx])
        oof_scores[valid_idx] = model.predict_proba(X.iloc[valid_idx])[:, 1]
        oof_folds[valid_idx] = fold
    if np.isnan(oof_scores).any() or (oof_folds < 1).any():
        raise RuntimeError("OOF prediction generation did not cover every TRAIN row")

    oof = train[METADATA_COLUMNS + FEATURE_COLUMNS].copy()
    oof["cv_fold"] = oof_folds
    oof["probability_attack"] = oof_scores
    oof["probability_normal"] = 1.0 - oof_scores
    oof.to_csv(OUTPUT_DIR / "train_oof_predictions.csv", index=False)

    rows = [threshold_metrics(y, oof_scores, float(threshold)) for threshold in THRESHOLDS]
    table = pd.DataFrame(rows)
    table.to_csv(OUTPUT_DIR / "threshold_metrics.csv", index=False)
    selected = select_threshold(table)
    (OUTPUT_DIR / "selected_threshold.json").write_text(json.dumps(selected, indent=2), encoding="utf-8")
    if selected["selected_threshold"] is None:
        summary = {"status": "no_threshold_meets_constraint", "train_rows": len(train), "thresholds": rows, "selection": selected,
                   "test_predictions_used": False, "no_final_model_retrained": True}
        (OUTPUT_DIR / "operating_point_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
        print(json.dumps(summary, indent=2))
        return

    # Selection is complete. Read only the saved selected-model TEST probabilities and apply the frozen threshold once.
    test = pd.read_csv(SELECTED_DIR / "predictions.csv")
    if len(test) != 3592 or not np.isfinite(test["probability_attack"].to_numpy(dtype=float)).all():
        raise ValueError("Unexpected or invalid saved TEST predictions")
    threshold = float(selected["selected_threshold"])
    test_scores = test["probability_attack"].to_numpy(dtype=float)
    test_y = test["actual_label"].to_numpy(dtype=int)
    test_pred = (test_scores >= threshold).astype(int)
    test_metrics = threshold_metrics(test_y, test_scores, threshold)
    test_output = test.copy()
    test_output["selected_threshold"] = threshold
    test_output["predicted_label_selected_threshold"] = test_pred
    test_output.to_csv(OUTPUT_DIR / "test_threshold_predictions.csv", index=False)
    summary = {
        "status": "selected_threshold_applied_once_to_saved_test_probabilities", "train_rows": len(train), "cv": {"folds": 5, "seed": SEED},
        "thresholds": rows, "selection": selected, "selected_threshold_test_metrics": test_metrics,
        "test_prediction_source": str(SELECTED_DIR / "predictions.csv"), "test_predictions_used": True,
        "no_final_model_retrained": True, "no_test_data_used_for_threshold_selection": True,
    }
    (OUTPUT_DIR / "operating_point_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
