# EVShield Mini Project — TOP Model Optimization Experiment Plan (v1)

## 1. Decision boundary and current baseline

This document plans a new, separate optimization experiment. It authorizes no implementation, dataset generation, model fitting, or TEST evaluation until explicit approval.

The frozen comparison baseline is `TOP_richer_stats_v1` / `random_forest_standard`:

| Item | Frozen value |
|---|---|
| Dataset | `ml/processed/TOP_richer_stats_v1/` |
| Representation | `count`, `mean`, `max`, `sum`, `std`, `min`, `median`, `q1`, `q3`, `iqr` |
| Selected model | `RandomForestClassifier(n_estimators=400, min_samples_leaf=1, random_state=42)` |
| Selection | five-fold stratified TRAIN-only CV, PR-AUC → ROC-AUC → F1 |
| Operating threshold | 0.55, selected from TRAIN OOF probabilities with FPR <= 30% constraint |
| TEST @ 0.55 | precision 0.7740; recall 0.7606; F1 0.7673; FPR 0.4323; FNR 0.2394 |

The present experiment asks whether a separately versioned TOP-only configuration can improve this recall/FPR trade-off. It must not overwrite or retroactively replace the baseline.

## 2. Fixed data architecture

The following are immutable:

- one complete labelled TOP kernel-symbol `data_point[]` series remains one sample;
- source metadata, raw symbol, condition, context, entity, and metric remain metadata rather than predictors;
- no TIME_DELTA or STAT rows are joined to TOP;
- no arrays are aligned by index and no event IDs/pseudo-keys are created;
- `ml/dataset/` is read-only;
- no row-level random TRAIN/TEST split is permitted.

The approved split remains:

```text
TRAIN
  Correct_ID/Random_CS_ON/Gaussian_Off
  Wrong_ID/Random_CS_OFF/Gaussian_Off

TEST
  Correct_ID/Random_CS_OFF/Gaussian_Off
  Wrong_ID/Random_CS_ON/Gaussian_Off
```

The expected TRAIN count is 4,152 rows (1,136 normal / 3,016 attack) and may be validated during selection. The expected TEST count is 3,592 rows (1,219 normal / 2,373 attack), but it is a post-freeze evaluation check only. TEST must remain completely unread during selection: its CSV, schema, row count, class balance, feature distributions, metadata, and values may not be loaded, inspected, or used before the final evaluation.

## 3. New versioned locations

After approval, all new outputs will be isolated from existing artifacts:

```text
ml/processed/TOP_model_optimization_features_v1/    # only if a predeclared expanded feature variant is built
ml/experiments/TOP_model_optimization_v1/
  experiment_config.json
  dataset_manifest.json
  feature_configurations.json
  cv_selection_summary.csv
  cv_fold_results/
  train_oof_predictions.csv
  threshold_metrics.csv
  selected_threshold.json
  <selected-config>/
    model.joblib
    metrics.json
    confusion_matrix.json
    predictions.csv
    feature_importance.json
  reproducibility.json
```

Existing `TOP_richer_stats_v1`, baseline datasets, selected models, `predict.py`, preprocessing pipeline, and source data will not be modified.

## 4. Predeclared feature configurations

The existing ten-feature representation is the mandatory reference configuration. Redundancy will first be described using TRAIN-only correlations and fold-local model importance; low importance alone is not a removal criterion.

| Configuration | Features / rule | Purpose |
|---|---|---|
| `rich10_full` | Existing ten features, no selector | Direct reference to the frozen richer representation. |
| `rich10_mi8` | Existing ten features; `SelectKBest(mutual_info_classif, k=8)` fit within each CV training fold only | Tests whether a fixed, supervised reduction improves generalization without hand-removing a feature. |
| `expanded14_full` | Existing ten plus `range = max - min`, `q10`, `q90`, and `mad_mean = mean(abs(x - mean(x)))`, each calculated inside one source series | Tests a small, predeclared set of distribution-shape features unavailable in the current summary. |
| `expanded14_mi10` | Expanded 14 features; `SelectKBest(mutual_info_classif, k=10)` fit within each CV training fold only | Tests a fold-local reduction of the expanded feature set. |

For `expanded14_*`, the new values use NumPy linear quantiles for `q10`/`q90`, and all values must be finite. They will be computed from only the same raw TOP series that defines the sample. The extractor must fail—not impute or drop rows—if the expected count, class counts, metadata equivalence, finite values, or baseline-ten-feature equivalence fails.

No coefficient of variation is predeclared because it is unstable/undefined at zero mean. No raw symbol feature, source metadata feature, temporal/order feature, or cross-family feature is allowed.

## 5. Controlled model candidates

All candidates use seed 42. The search is deliberately bounded; it is not a brute-force sweep.

### Random Forest

Evaluate these fixed configurations for each feature configuration:

| Name | `n_estimators` | `max_depth` | `min_samples_leaf` | `min_samples_split` | `max_features` | `class_weight` |
|---|---:|---|---:|---:|---|---|
| `rf_reference` | 400 | `None` | 1 | 2 | `sqrt` | `None` |
| `rf_leaf2` | 400 | `None` | 2 | 2 | `sqrt` | `None` |
| `rf_leaf5` | 400 | `None` | 5 | 2 | `sqrt` | `None` |
| `rf_depth12` | 400 | 12 | 2 | 2 | `sqrt` | `None` |
| `rf_balanced_leaf2` | 400 | `None` | 2 | 2 | `sqrt` | `balanced` |
| `rf_balanced_depth12` | 400 | 12 | 2 | 2 | `log2` | `balanced` |

### XGBoost

Evaluate these fixed tree configurations, with the balanced variant deriving `scale_pos_weight = negative_count / positive_count` from each fitting fold only:

| Name | `n_estimators` | `max_depth` | `learning_rate` | `subsample` / `colsample_bytree` | Balance |
|---|---:|---:|---:|---|---|
| `xgb_reference` | 500 | 6 | 0.05 | 0.9 / 0.9 | standard |
| `xgb_shallow` | 500 | 3 | 0.05 | 0.9 / 0.9 | standard |
| `xgb_regularized` | 500 | 4 | 0.03 | 0.9 / 0.9 | standard, `min_child_weight=3`, `reg_lambda=2` |
| `xgb_balanced_shallow` | 500 | 3 | 0.05 | 0.9 / 0.9 | fold-derived `scale_pos_weight` |
| `xgb_balanced_regularized` | 500 | 4 | 0.03 | 0.9 / 0.9 | fold-derived weight, `min_child_weight=3`, `reg_lambda=2` |

No deep-learning model will be added: the current data is a modest tabular representation and does not justify it.

## 6. TRAIN-only evaluation and selection

1. Validate only the required TRAIN CSV, its expected schema/count/class balance, and TRAIN feature configurations. Do not open, parse, inspect, or validate the TEST CSV at this stage.
2. Use `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)` on TRAIN only. All selectors are fit on each fold's fitting rows only; they are never fit before splitting.
3. For every predeclared feature/model configuration, save fold PR-AUC, ROC-AUC, precision, recall, F1, FPR, FNR, and confusion-matrix components at 0.50 for descriptive CV reporting.
4. Select one configuration by mean CV PR-AUC. Exact ties resolve by mean ROC-AUC, then mean F1, then a lexicographic configuration name recorded before TEST access.
5. Using only the selected configuration, regenerate a complete set of five-fold TRAIN OOF probabilities. This produces one out-of-fold score for each TRAIN sample.
6. Evaluate thresholds 0.10 through 0.90 inclusive in steps of 0.05 on those OOF scores. Select the highest-recall threshold with OOF FPR <= 0.30; ties resolve by F1, then precision, then the higher threshold. If none is eligible, record that outcome and do not relax the constraint after seeing TEST.
7. Freeze and write the feature configuration, selector configuration, model parameters, class-weight rule, threshold, package versions, and complete selection evidence before opening TEST.
8. Only then open TEST for the first time, validate it solely as part of the final frozen evaluation, refit the frozen pipeline on all TRAIN rows, and evaluate TEST exactly once. No result from that evaluation may create a follow-up configuration in this version.

## 7. Leakage controls

- During selection, assert only TRAIN condition membership and expected TRAIN row/class counts. Do not inspect TEST condition membership, row/class counts, schema, feature equivalence, distributions, labels, scores, or metrics.
- Do not load, parse, read, or otherwise inspect the TEST CSV until step 8 above, after every feature/model/selector/class-weight/threshold/version decision has been frozen and recorded.
- Compute series statistics independently within one raw TOP `data_point[]` array; never calculate across rows, partitions, or conditions.
- Keep all metadata out of the feature matrix. Raw symbol names never form a vocabulary or predictor.
- Fit `SelectKBest`, all class weights, and all model parameters only on the applicable CV fitting fold. Fit the selected final pipeline on full TRAIN only.
- Do not impute missing/non-finite values. Fail validation instead.
- Produce threshold evidence only from TRAIN OOF probabilities. Never use TEST to select a threshold, calibration, model, feature configuration, or hyperparameter.
- Preserve baseline and current richer artifacts by writing only the new versioned paths.

## 8. Final reporting

The final report will separate TRAIN/CV evidence from the one final TEST result. It will include model/feature selection, configuration, package versions, OOF threshold table, TEST accuracy, precision, recall, F1, ROC-AUC, PR-AUC, FPR, FNR, TP/TN/FP/FN, confusion matrix, and feature importance.

It will compare the frozen final candidate with both existing reference points:

| Reference | Recall | FPR |
|---|---:|---:|
| TOP baseline XGBoost @ 0.50 | 0.6098 | 0.3757 |
| TOP richer v1 Random Forest @ 0.55 | 0.7606 | 0.4323 |

## 9. Acceptance criteria

Technical validity requires all of the following:

- expected split, row counts, labels, sample definition, and finite feature values;
- no modifications to raw data, preprocessing, existing datasets, or existing experiment artifacts;
- all choices based only on TRAIN/CV/OOF evidence;
- a saved model, dataset manifest, configuration, CV results, OOF predictions, threshold rationale, final TEST predictions, metrics, and reproducibility information;
- exactly one final TEST evaluation after the feature configuration, model configuration, selector configuration, class-weight rule, threshold, and package versions/configuration are frozen and recorded.

For this locked comparison, call the new version an operating-point improvement only if its single final TEST result has **FPR <= 0.30**, **recall >= 0.7606**, and **PR-AUC >= 0.8676**. This is an interpretation criterion, not permission to tune after TEST. If it is not met, report the result honestly and retain the existing `TOP_richer_stats_v1` model/threshold as the current selected implementation.

## 10. Approval gate

No experiment has been run and no new processed or experiment directory has been created. Await explicit approval before implementing `TOP_model_optimization_v1`.
