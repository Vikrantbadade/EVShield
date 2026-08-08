# EVShield Mini Project — ML Completion Audit

## Audit status

**ML COMPLETION AUDIT: PASS.**

The prior auditability/provenance issue is resolved. The previously untracked raw file is now tracked by commit `197ef797693e4ac4e4c0cb1774d7686b997ba10d` (`197ef79`, *Add missing CICEV2023 raw dataset file*):

```text
ml/dataset/Wrong_EV_TS/Random_CS_On/Gaussian_On/TIME_DELTA/TIME_DELTA.json
```

The raw-data worktree now has zero untracked files, zero unstaged modifications, and zero staged modifications under `ml/dataset/`. The recorded hashes for the preprocessing pipeline, baseline datasets/model, richer datasets/model, saved predictions, and threshold-selection artifact all match the earlier audit. The previous FAIL was an auditability/provenance issue caused by the missing Git-tracked raw file, not an ML pipeline failure.

## 1. ML pipeline summary

The final frozen Mini Project experiment is `TOP_richer_stats_v1` with `random_forest_standard`:

- one labelled TOP `data_point[]` series is one sample;
- ten per-series numeric features: `count`, `mean`, `max`, `sum`, `std`, `min`, `median`, `q1`, `q3`, and `iqr`;
- seed 42; five-fold shuffled stratified TRAIN-only CV;
- selection order: mean PR-AUC, then ROC-AUC, then F1;
- final estimator: `RandomForestClassifier(n_estimators=400, min_samples_leaf=1, random_state=42)`;
- classification threshold: 0.55, selected only from TRAIN OOF predictions under the predefined FPR constraint.

The frozen baseline remains `TOP_baseline_dataset` / `xgboost_balanced`; it was not replaced or modified.

## 2. Dataset verification

All processed datasets exist. A direct read of every CSV found zero missing values across all columns and zero non-finite numeric values.

| Dataset | TRAIN rows (normal / attack) | TEST rows (normal / attack) | Features | Missing / non-finite |
|---|---:|---:|---:|---:|
| TIME_DELTA | 12 (6 / 6) | 8 (4 / 4) | 6 | 0 / 0 |
| STAT CS: branch, cycles, instructions | 12 (6 / 6), each | 8 (4 / 4), each | 6, each | 0 / 0 |
| STAT GS: branch, cycles, instructions | 4 (2 / 2), each | 4 (2 / 2), each | 6, each | 0 / 0 |
| TOP baseline | 4,152 (1,136 / 3,016) | 3,592 (1,219 / 2,373) | 4 | 0 / 0 |
| TOP richer v1 | 4,152 (1,136 / 3,016) | 3,592 (1,219 / 2,373) | 10 | 0 / 0 |

Label encoding is correct: `normal=0`, `attack=1`. The richer schema records this encoding, the one-series sample definition, metadata-only raw symbols, and `no_cross_family_alignment=true` in [schema.json](../ml/processed/TOP_richer_stats_v1/schema.json).

The approved condition-level split is present in both TOP datasets:

```text
TRAIN: Correct_ID/Random_CS_ON/Gaussian_Off
       Wrong_ID/Random_CS_OFF/Gaussian_Off

TEST:  Correct_ID/Random_CS_OFF/Gaussian_Off
       Wrong_ID/Random_CS_ON/Gaussian_Off
```

There is no row-level TRAIN/TEST random split in the final experiment. No cross-family arrays were joined or aligned by index; the reported TOP model consumes only the ten richer TOP columns after metadata is dropped.

## 3. Preprocessing verification

**PASS.** The original pipeline configuration is preserved at [preprocessing_config.json](../ml/processed/preprocessing_config.json), with its validation report at [preprocessing_validation.json](../ml/processed/preprocessing_validation.json). The separate richer extraction is reproducible from [build_top_richer_stats_v1.py](../ml/build_top_richer_stats_v1.py); it preserves source metadata and computes each feature from only one complete TOP series.

Both the baseline and richer versioned datasets remain present:

- `ml/processed/TOP_baseline_dataset/`
- `ml/processed/TOP_richer_stats_v1/`

The richer validation manifest reports 4,152 TRAIN rows, 3,592 TEST rows, zero missing/NaN/Inf values, no duplicate metadata rows, baseline-equivalent shared rows, and no source/pipeline modifications recorded during Step 15. The Step 15 report additionally records matching pre/post hashes for the baseline data, baseline model, and preprocessing pipeline.

## 4. Model and artifact verification

**PASS.** The selected model loads successfully from [model.joblib](../ml/experiments/TOP_richer_stats_v1/random_forest_standard/model.joblib) as a `RandomForestClassifier`.

| Required item | Location / evidence | Status |
|---|---|---|
| Saved model | `random_forest_standard/model.joblib` | PASS |
| Configuration and seed | `random_forest_standard/experiment_config.json` | PASS |
| Selection/training configuration | `random_forest_standard/selected_model.json`, parent `experiment_summary.json`, CV CSVs | PASS |
| Dataset manifest | embedded `dataset` manifest in `ml/experiments/TOP_richer_stats_v1/experiment_summary.json` | PASS |
| Metrics | `random_forest_standard/metrics.json` | PASS |
| Predictions | `random_forest_standard/predictions.csv` | PASS |
| Confusion matrix | `random_forest_standard/confusion_matrix.json` | PASS |
| Feature importance | `random_forest_standard/feature_importance.json` | PASS |
| Frozen threshold artifacts | `operating_point/{selected_threshold.json,threshold_metrics.csv,train_oof_predictions.csv,test_threshold_predictions.csv,operating_point_summary.json}` | PASS |

Recorded SHA-256 values at audit time:

```text
TOP richer TRAIN CSV: 48294c43df96703e31045d87382fd7dd6a6f28c80546393094c1a5ab524c6fbf
TOP richer TEST CSV:  91f708e95a2104f3f0b64084fe2691bf791a1c4a0cdef4467f7c1c574a9cb487
Saved model:           aede06fd5be9441f052586eeb604632e7fafed56d9296ed3e2b5bfb2fbd6c457
Saved TEST predictions:cafede19fd87aa38c8417081a05ee7c3133cc4c141b94f7ba135e7a37e5a082c
Threshold selection:   084a0baf100dabfcda91f044d98d4912a33564dcb3ad76f344be34400480cfbe
```

## 5. Local inference verification

**PASS.** The saved model was loaded without fitting. The first held-out TEST row was read from the richer TEST CSV, restricted to the exact ten frozen feature columns, and scored. Its score exactly matches the corresponding score in the saved Step 15 prediction artifact.

```text
Sample source:          Correct_ID/Random_CS_OFF/Gaussian_Off
Family/context:         TOP / CS
Entity / metric:        2-39-89-25 / branch
Raw symbol (metadata):  __update_load_avg_se
True label:             1
Probability attack:     0.3175
Frozen threshold:       0.55
Predicted label:        0
```

The sample is a held-out TEST sample and was used only for this read-only inference verification. The `test_threshold_predictions.csv` file has 3,592 rows, its probabilities are identical to the saved Step 15 probabilities, and its `predicted_label_selected_threshold` values exactly equal `probability_attack >= 0.55`.

## 6. Reproducibility information

| Item | Value |
|---|---|
| Python | 3.13.9 |
| NumPy | 2.5.1 |
| pandas | 3.0.5 |
| scikit-learn | 1.9.0 |
| XGBoost | 2.1.1 |
| Random seed | 42 |
| Dataset | `ml/processed/TOP_richer_stats_v1/` |
| Feature schema | 10 columns recorded in its `schema.json` |
| Model config | `random_forest_standard`, 400 trees, default Gini / `max_features='sqrt'`, `min_samples_leaf=1` |
| Model selection | five-fold `StratifiedKFold(shuffle=True, random_state=42)`, TRAIN only |
| Operating policy | TRAIN-OOF threshold 0.55, selected to maximize recall subject to FPR <= 30% |

The scripts and saved artifacts support reproducing the extraction, model-selection, final model loading, and prediction pipeline. Rerunning training scripts would rewrite existing artifacts, so a demonstration should use the read-only commands below rather than rerunning the experiments.

## 7. Leakage and TEST-integrity checks

**PASS, based on code and retained evidence.**

- The data schema and project reports retain one-series samples and explicitly prohibit cross-family index alignment.
- `top_richer_stats_v1_experiments.py` validates whole condition membership and expected row/class counts before fitting. It creates the TRAIN CV results and selects the configuration before it reads the TEST CSV.
- `top_richer_stats_v1_operating_point.py` generates OOF scores from TRAIN only, writes the selected threshold, then reads only already saved TEST probabilities for the single frozen-threshold application. No final model is refit there.
- The TOP vocabulary rule is not applicable to v1 because raw symbol is metadata and not a model feature; all richer statistical features are deterministic within-series calculations, with no TEST-fitted transform.
- No scaler, imputer, calibration method, feature-selection step, hyperparameter setting, or threshold was fit from TEST.

These are reproducibility and provenance checks; they do not make the held-out result a production guarantee.

## 8. Final frozen model metrics

The selected model’s Step 15 score-ranking metrics are unchanged by the Step 16 threshold analysis:

| Operating point | PR-AUC | ROC-AUC | Precision | Recall | F1 | FPR | TN / FP / FN / TP |
|---|---:|---:|---:|---:|---:|---:|---:|
| Richer v1 Random Forest @ 0.50 | 0.8676 | 0.7577 | 0.7559 | 0.7973 | 0.7760 | 0.5012 | 608 / 611 / 481 / 1,892 |
| Richer v1 Random Forest @ 0.55 (TRAIN-OOF selected) | 0.8676 | 0.7577 | 0.7740 | 0.7606 | 0.7673 | 0.4323 | 692 / 527 / 568 / 1,805 |
| TOP baseline XGBoost balanced @ 0.50 | 0.8048 | 0.6641 | 0.7596 | 0.6098 | 0.6765 | 0.3757 | 761 / 458 / 926 / 1,447 |

The final policy threshold is 0.55, frozen from TRAIN OOF evidence. It improves attack recall materially versus the baseline, while TEST FPR remains above the baseline and above the TRAIN OOF constraint.

## 9. Known limitations

- Only TOP currently has adequate volume for meaningful standalone ML. TIME_DELTA and STAT data are too small and condition-shifted for robust predictive claims.
- The four condition groups do not separate scenario and targeting effects independently; held-out condition shift is substantial.
- Threshold 0.55 met the 30% FPR constraint on TRAIN OOF scores but not on TEST (43.23%); no TEST-driven retuning is permitted.
- The current corpus lacks a verified event/decision identifier shared across families, so supervised fusion is invalid and has not been attempted.
- The model is a reproducible research baseline, not a deployable detector.

## 10. Future Minor Project work

Follow [instrumentation_and_data_collection_spec.md](instrumentation_and_data_collection_spec.md): collect coordinator-issued immutable `decision_id` values, run-level IDs, synchronized clocks, validated labels, full family provenance, and independent runs. First implement and pass the data-integrity pilot; only then consider group-aware family models and late fusion from OOF probabilities.

## 11. Professor demonstration commands

Run these commands from a terminal. They only read artifacts and do not retrain models or modify data.

```bash
cd /home/v/mini-project/EVShield

# Show the frozen configuration and selected TRAIN-only threshold.
cat ml/experiments/TOP_richer_stats_v1/random_forest_standard/experiment_config.json
cat ml/experiments/TOP_richer_stats_v1/operating_point/selected_threshold.json

# Verify the saved model loads and score one held-out TEST row with the exact 10-feature schema.
./.venv/bin/python - <<'PY'
import joblib
import pandas as pd

features = ['count', 'mean', 'max', 'sum', 'std', 'min', 'median', 'q1', 'q3', 'iqr']
model = joblib.load('ml/experiments/TOP_richer_stats_v1/random_forest_standard/model.joblib')
row = pd.read_csv('ml/processed/TOP_richer_stats_v1/test.csv').iloc[[0]]
probability = float(model.predict_proba(row[features])[:, 1][0])
threshold = 0.55
print('source =', row.iloc[0]['condition_directory'], row.iloc[0]['source_family'], row.iloc[0]['profiling_context'])
print('true_label =', int(row.iloc[0]['label']))
print('probability_attack =', probability)
print('predicted_label =', int(probability >= threshold))
print('threshold =', threshold)
PY

# Verify expected hashes of the versioned richer data and saved model.
sha256sum ml/processed/TOP_richer_stats_v1/train.csv \
          ml/processed/TOP_richer_stats_v1/test.csv \
          ml/experiments/TOP_richer_stats_v1/random_forest_standard/model.joblib

# Confirm that the raw dataset worktree is clean.
git status --short --untracked-files=all -- ml/dataset
```

## Conclusion

The ML pipeline is locally reproducible, its frozen model loads and predicts correctly, and its TRAIN-only selection and threshold workflow are supported by retained artifacts.

> EVShield Mini Project ML pipeline is complete and locally reproducible.
