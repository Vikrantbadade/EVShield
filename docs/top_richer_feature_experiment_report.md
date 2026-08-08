# EVShield Mini Project — Richer TOP Feature Experiment Report (v1)

## Outcome

`TOP_richer_stats_v1` improved held-out ranking and attack detection relative to the frozen TOP baseline, but it **did not meet the predeclared full acceptance criteria** because its false-positive rate increased from 37.57% to 50.12%. No post-TEST tuning or new version was created.

The selected v1 model is `random_forest_standard`, selected solely by five-fold TRAIN CV PR-AUC (seed 42). TEST was loaded only after that selection and after the two TRAIN-only transfer diagnostics.

## 1. Scope and safeguards

This experiment implemented the approved plan in `docs/top_richer_feature_experiment_plan.md`.

- One complete labelled TOP kernel-symbol `data_point[]` series remains one sample.
- Only TOP source files were read. TIME_DELTA and STAT were not joined or used.
- No arrays were aligned by index; no event IDs were created.
- Raw symbol name and all other provenance fields are metadata only, never classifier inputs.
- The four approved condition directories remained whole in their fixed TRAIN/TEST partitions.
- The baseline files and `ml/preprocessing_pipeline.py` were not changed. Post-run hashes match the pre-run snapshot:
  - preprocessing pipeline: `fe98cbd8449bcce9d837c5955d4026ebd47d874eba6149e84c891fd403445fe0`
  - baseline TRAIN CSV: `a122c0814d792a96d45c038892512e27278df2b291311b6bc339a256155a5c18`
  - baseline TEST CSV: `73d1573d09dfb075b743bc8971515ed70b4a0069172b7b023a8708fba32cc8ff`
  - baseline selected model: `eed09995b51d4246adef636ed9a7f1ca12051cf58c60e22c9d93d078cf6af716`

The versioned outputs are in `ml/processed/TOP_richer_stats_v1/` and `ml/experiments/TOP_richer_stats_v1/`.

## 2. Dataset validation and feature schema

The new dataset passed all required validation.

| Partition | Rows | Normal | Attack | Missing / NaN / Inf | Duplicate metadata rows |
|---|---:|---:|---:|---:|---:|
| TRAIN | 4,152 | 1,136 | 3,016 | 0 / 0 / 0 | 0 |
| TEST | 3,592 | 1,219 | 2,373 | 0 / 0 / 0 | 0 |

The TRAIN conditions are `Correct_ID/Random_CS_ON/Gaussian_Off` and `Wrong_ID/Random_CS_OFF/Gaussian_Off`; TEST contains the complementary approved conditions. Metadata order and the four shared summaries (`count`, `mean`, `max`, `sum`) were verified equal to the baseline dataset before writing v1.

Each single TOP series has these ten deterministic features:

```text
count, mean, max, sum, std, min, median, q1, q3, iqr
```

`std` uses `ddof=0`; Q1, median, and Q3 use NumPy's `linear` quantile definition; `iqr = q3 - q1`. No upper quantiles were added.

## 3. TRAIN-only model selection

The exact eight baseline configurations and unchanged hyperparameters were evaluated with `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)`. PR-AUC was the primary criterion; ROC-AUC and F1 were predefined tie-breakers. No TEST result participated in this selection.

| Configuration | CV PR-AUC | CV ROC-AUC | CV F1 | CV recall |
|---|---:|---:|---:|---:|
| **random_forest_standard** | **0.9516** | **0.8907** | **0.8918** | **0.9085** |
| random_forest_balanced | 0.9515 | 0.8878 | 0.8745 | 0.8442 |
| xgboost_standard | 0.9513 | 0.8866 | 0.8858 | 0.9005 |
| xgboost_balanced | 0.9502 | 0.8847 | 0.8718 | 0.8412 |
| linear_svm_standard | 0.8111 | 0.6342 | 0.3185 | 0.2009 |
| logistic_regression_balanced | 0.8083 | 0.6315 | 0.7701 | 0.7553 |
| linear_svm_balanced | 0.8078 | 0.6289 | 0.0383 | 0.0196 |
| logistic_regression_standard | 0.7995 | 0.6164 | 0.8401 | 0.9897 |

The selected `random_forest_standard` was then fitted once on all TRAIN rows and evaluated once on TEST with the pre-frozen 0.5 threshold.

## 4. Final TEST result

| Measure | Baseline: XGBoost balanced | v1: Random Forest standard | Difference (v1 − baseline) |
|---|---:|---:|---:|
| Accuracy | 0.6147 | 0.6960 | +0.0813 |
| Precision | 0.7596 | 0.7559 | -0.0037 |
| Recall | 0.6098 | 0.7973 | +0.1875 |
| F1 | 0.6765 | 0.7760 | +0.0996 |
| ROC-AUC | 0.6641 | 0.7577 | +0.0936 |
| PR-AUC | 0.8048 | 0.8676 | +0.0628 |
| False-positive rate | 0.3757 | 0.5012 | +0.1255 |

The v1 confusion matrix (rows: actual normal/attack; columns: predicted normal/attack) is:

```text
[[608, 611],
 [481, 1892]]
```

Compared with the baseline, v1 detects 445 more attack samples (481 rather than 926 false negatives), but produces 153 more false positives (611 rather than 458). The representation improves ranking and recall markedly, while the unweighted random-forest operating point flags too many normal samples.

The generalization gaps are:

| Gap | Baseline | v1 |
|---|---:|---:|
| TRAIN-CV PR-AUC − TEST PR-AUC | 0.0959 | 0.0840 |
| TRAIN-CV ROC-AUC − TEST ROC-AUC | 0.1077 | 0.1330 |

Thus v1 has a smaller PR-AUC gap but a larger ROC-AUC gap. Both observations should be retained; neither is a basis for further TEST-driven adjustment.

## 5. Feature importance

The selected random forest's impurity importances are descriptive, not causal, and should be interpreted cautiously because several summaries are correlated.

| Rank | Feature | Importance |
|---:|---|---:|
| 1 | `min` | 0.1729 |
| 2 | `q1` | 0.1271 |
| 3 | `median` | 0.1134 |
| 4 | `mean` | 0.1016 |
| 5 | `sum` | 0.0915 |
| 6 | `q3` | 0.0838 |
| 7 | `max` | 0.0802 |
| 8 | `iqr` | 0.0789 |
| 9 | `std` | 0.0761 |
| 10 | `count` | 0.0746 |

The leading role of `min`, `q1`, and `median` supports the Step 14 conclusion: lower-distribution and robust-centre information, absent from the four-feature baseline, adds usable signal.

## 6. Held-out condition results

| TEST condition | PR-AUC | ROC-AUC | Recall | FPR | TN / FP / FN / TP |
|---|---:|---:|---:|---:|---:|
| `Correct_ID/Random_CS_OFF/Gaussian_Off` | 0.8917 | 0.7888 | 0.8219 | 0.4904 | 291 / 280 / 210 / 969 |
| `Wrong_ID/Random_CS_ON/Gaussian_Off` | 0.8398 | 0.7263 | 0.7730 | 0.5108 | 317 / 331 / 271 / 923 |

The previously harder `Wrong_ID/Random_CS_ON` condition remains weaker, but both held-out conditions have higher recall than the baseline's overall 60.98%. FPR is high in both, not confined to one condition.

## 7. TRAIN-only condition-transfer diagnostics

These diagnostics used the selected configuration and frozen schema after CV selection. They did not affect model, feature, or threshold selection.

| Diagnostic | Fit condition → validation condition | PR-AUC | ROC-AUC | Recall | FPR | TN / FP / FN / TP |
|---|---|---:|---:|---:|---:|---:|
| A | Correct_ID/Random_CS_ON → Wrong_ID/Random_CS_OFF | 0.9494 | 0.8778 | 0.9157 | 0.4223 | 305 / 223 / 125 / 1,358 |
| B | Wrong_ID/Random_CS_OFF → Correct_ID/Random_CS_ON | 0.9183 | 0.8275 | 0.8591 | 0.4260 | 349 / 259 / 216 / 1,317 |

Transfer is asymmetric but reasonably strong in both directions by ranking and recall. The already elevated diagnostic FPR is consistent with the final TEST operating-point issue.

## 8. Acceptance-criteria decision

All technical validity criteria were met: fixed sample definition and split, expected counts, finite values, untouched baseline/source data, TRAIN-only selection, a single TEST evaluation, and both diagnostics reported.

The full improvement rule was **not met**. v1 improved PR-AUC (0.8676 > 0.8048), ROC-AUC (0.7577 > 0.6641), and recall (0.7973 ≥ 0.6098), but FPR increased to 0.5012, exceeding the maximum 0.3757. This is a valid negative result under the predefined rule, not a reason to retune using TEST.

The artifacts needed to reproduce this result are retained under `ml/processed/TOP_richer_stats_v1/` and `ml/experiments/TOP_richer_stats_v1/`. No further Step 15 version was created.
