# EVShield Mini Project — Richer TOP Feature Experiment Plan (v1)

## 1. Purpose and decision boundary

This plan defines the next, versioned TOP-only experiment following the Step 14 error analysis in `docs/ml_error_analysis.md`. The baseline is retained unchanged at `ml/processed/TOP_baseline_dataset/` and `ml/experiments/TOP_baseline_dataset/`.

The purpose is to test whether a richer **within-series** statistical description improves condition-level generalization over the four-feature TOP baseline. It does not authorize implementation yet.

The following remain fixed:

- one complete labelled TOP `data_point[]` kernel-symbol series = one ML sample;
- no joins with TIME_DELTA or STAT;
- no pairing or alignment of arrays by index;
- raw symbol name, condition, context, entity, and metric remain metadata, not model inputs;
- the original `ml/dataset/` files are read-only;
- the approved condition split and the locked TEST partition remain unchanged.

## 2. Versioned dataset and output locations

When implementation is approved, use a new dataset version and new experiment directory:

```text
ml/processed/TOP_richer_stats_v1/
  train.csv
  test.csv
  schema.json
  validation.json

ml/experiments/TOP_richer_stats_v1/
  cv_selection_summary.csv
  experiment_summary.json
  <model-config>/
```

The implementation must be a separate richer-TOP extraction/experiment path. It must not modify `ml/preprocessing_pipeline.py`, the baseline processed CSVs, baseline model artifacts, or any source JSON under `ml/dataset/`.

The new rows retain the baseline metadata columns:

```text
condition_directory, source_family, profiling_context,
entity_id, metric, raw_symbol_name, label
```

## 3. Feature schema

The v1 model matrix has exactly ten numeric features, calculated independently from the values in one complete TOP `data_point[]` series:

| Feature | Definition | Why it is included |
|---|---|---|
| `count` | Number of finite values, n | Retains the baseline's series-size signal. |
| `mean` | Arithmetic mean | Retains baseline central tendency. |
| `max` | Largest observed value | Retains baseline upper endpoint. |
| `sum` | Sum of values | Retains baseline total-magnitude signal. |
| `std` | Population standard deviation (`ddof=0`) | Measures dispersion, which mean/max cannot distinguish. `ddof=0` is defined for a one-value series. |
| `min` | Smallest observed value | Adds lower-tail/endpoint information absent from the baseline. |
| `median` | 50th percentile | Gives robust central tendency, reducing sensitivity to outliers. |
| `q1` | 25th percentile, using NumPy's documented default linear quantile method | Captures the lower part of the distribution. |
| `q3` | 75th percentile, using the same method | Captures the upper bulk of the distribution. |
| `iqr` | `q3 - q1` | Gives a robust measure of spread and distribution shape. |

This schema directly addresses the Step 14 finding that `count`/`sum` and `mean`/`max` are correlated and omit distributional shape. All features are deterministic, per-series summaries; no feature is calculated across samples or conditions.

### Upper quantiles

No additional upper quantile (for example p90 or p95) is in v1. The error analysis justifies quartiles and IQR as a compact robust distribution summary, but did not establish that a particular upper quantile adds independent value beyond `max` and `q3`. Adding it now would be unprincipled feature expansion. A later, separately approved experiment may screen a predeclared upper-quantile candidate using TRAIN folds only.

## 4. Per-series calculation and validation

For each selected source series:

1. Read the complete numeric `data_point[]` array beneath its existing TOP metadata path.
2. Validate that it is non-empty and all values are finite numeric values.
3. Calculate the ten features from that array alone, using the definitions above.
4. Preserve its existing metadata and label.
5. Assign the row to TRAIN or TEST solely from its `condition_directory`.

The extractor must fail rather than impute or silently drop a malformed, empty, NaN, or infinite series. It must report, per partition: row count, class count, condition directories, feature names, missing/NaN/Inf counts, and duplicate metadata identifiers if found. The expected row and class counts are identical to the baseline because the sample definition is identical:

| Partition | Rows | Normal | Attack |
|---|---:|---:|---:|
| TRAIN | 4,152 | 1,136 | 3,016 |
| TEST | 3,592 | 1,219 | 2,373 |

`count`, `std`, quantiles, and IQR use only the values in the sample itself. They have no fitted parameters, vocabulary, scaler, imputer, or label-derived computation.

## 5. Split and leakage safeguards

The fixed partitions are:

```text
TRAIN
Correct_ID/Random_CS_ON/Gaussian_Off
Wrong_ID/Random_CS_OFF/Gaussian_Off

TEST
Correct_ID/Random_CS_OFF/Gaussian_Off
Wrong_ID/Random_CS_ON/Gaussian_Off
```

Safeguards required in implementation and reporting:

1. Assert that each partition contains only its two approved whole condition directories; never random-split rows or series.
2. Never read TEST labels, feature distributions, or TEST metrics while choosing the feature schema, model, class weight, hyperparameters, or threshold. This v1 schema is frozen by this document before implementation.
3. Use metadata only for traceability, split verification, condition-wise reporting, and the diagnostic below. Drop all metadata before fitting a classifier.
4. For models requiring scaling, fit `StandardScaler` inside each TRAIN CV fold only; refit it on full TRAIN only after selection; then apply it unchanged to TEST.
5. Derive all class weights, including XGBoost `scale_pos_weight`, from the applicable training fold only. Do not compute them from TEST.
6. Use no imputation. Fail validation if a feature is missing or non-finite.
7. Freeze a default 0.5 classification threshold before TEST evaluation. Any future threshold policy must be designed and tuned solely within TRAIN validation folds under a separate approval.
8. Run the final selected model on TEST exactly once for this version; do not use that result to create a v1.1 feature variant or retroactively select another configuration.

## 6. Exact model-selection protocol

The richer representation changes only the feature schema; the baseline comparison remains otherwise comparable.

1. Build and validate `TOP_richer_stats_v1` using the fixed split above.
2. On TRAIN only, evaluate the same eight baseline configurations with seed 42 and five-fold `StratifiedKFold(shuffle=True, random_state=42)`:
   - logistic regression: standard and `class_weight='balanced'`;
   - random forest: standard and `class_weight='balanced'`;
   - XGBoost: standard and training-fold-derived `scale_pos_weight`;
   - linear SVM: standard and `class_weight='balanced'`.
3. Keep the baseline hyperparameters unchanged for a fair representation comparison. The only intentional difference is the ten-feature input matrix.
4. Compute fold-level PR-AUC, ROC-AUC, precision, recall, F1, and confusion matrix at the frozen 0.5 threshold.
5. Select one configuration by highest mean TRAIN-CV PR-AUC. Resolve an exact PR-AUC tie by higher mean ROC-AUC, then higher mean F1, with this ordering recorded before TEST is opened.
6. Refit the selected configuration on all TRAIN rows. Evaluate the locked TEST partition once and save predictions, metrics, confusion matrix, fitted model, configuration, schema, validation report, and package versions.

## 7. Condition-group diagnostic (TRAIN only)

This diagnostic estimates condition transfer before the final TEST evaluation. It is not a tuning or selection criterion.

After the model configuration is selected by the five-fold TRAIN-CV protocol, run it with the frozen v1 schema and model settings in both directions:

| Diagnostic | Fit condition | Validation condition |
|---|---|---|
| A | `Correct_ID/Random_CS_ON/Gaussian_Off` | `Wrong_ID/Random_CS_OFF/Gaussian_Off` |
| B | `Wrong_ID/Random_CS_OFF/Gaussian_Off` | `Correct_ID/Random_CS_ON/Gaussian_Off` |

For each direction, calculate PR-AUC, ROC-AUC, precision, recall, F1, confusion matrix, and FPR. Fit any scaler and derive any class weight solely on that diagnostic's fit condition. Report the results as transfer stress tests; do not change features, parameters, selected configuration, or threshold based on them.

## 8. Baseline comparison and reporting

The report must compare the v1 selected model against the frozen baseline `xgboost_balanced` using these known baseline values:

| Measure | Baseline TRAIN CV | Baseline TEST |
|---|---:|---:|
| PR-AUC | 0.9007 | 0.8048 |
| ROC-AUC | 0.7718 | 0.6641 |
| Precision | 0.8465 | 0.7596 |
| Recall | 0.7337 | 0.6098 |
| F1 | 0.7859 | 0.6765 |
| FPR | — | 0.3757 |

For v1, report the same measures plus accuracy, TN/FP/FN/TP, feature importance, and the generalization gaps:

```text
PR-AUC gap = TRAIN-CV mean PR-AUC − TEST PR-AUC
ROC-AUC gap = TRAIN-CV mean ROC-AUC − TEST ROC-AUC
```

Tree-model importance may be reported as gain and split count. It is descriptive, not causal. For a scaled linear model, report standardized coefficients with the same limitation. Report condition-wise TEST results separately, but do not use them to select a different model.

## 9. Acceptance criteria

The experiment is technically valid only if all of the following hold:

- exactly 4,152 TRAIN and 3,592 TEST rows are produced, with the stated class counts and condition membership;
- all ten features are present and finite; no data are imputed or silently discarded;
- baseline files and the original dataset remain unchanged;
- all configuration/feature decisions and selection evidence are restricted to TRAIN;
- a single configuration is selected by the predefined PR-AUC rule and TEST is evaluated once;
- the two directional condition diagnostics are reported without influencing selection.

The v1 representation will be considered an improvement **for this locked comparison** only if, on that one frozen TEST evaluation, it improves both PR-AUC and ROC-AUC over 0.8048 and 0.6641 while neither lowering attack recall below 0.6098 nor increasing FPR above 0.3757. This is an interpretation rule, not permission to tune after TEST. If it is not met, record the negative result and do not iterate from TEST feedback.

## 10. Approval gate

This document authorizes no code or data changes. Wait for explicit approval before creating `TOP_richer_stats_v1`, implementing its separate extractor/experiment runner, or fitting any model.
