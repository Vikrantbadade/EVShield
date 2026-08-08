# EVShield Mini Project — TOP Baseline Error Analysis

## Scope and method

This report is the Step 14 analysis of the already-selected `xgboost_balanced` TOP baseline. It is deliberately read-only: `ml/dataset/` was not accessed for modification, the preprocessing pipeline was not changed, and no new model was fitted or tuned.

Evidence was calculated from these existing artifacts:

- `ml/processed/TOP_baseline_dataset/train.csv` and `test.csv`
- `ml/experiments/TOP_baseline_dataset/cv_selection_summary.csv`
- `ml/experiments/TOP_baseline_dataset/xgboost_balanced/{model.joblib,metrics.json,predictions.csv}`

The sample definition remains unchanged: one labelled TOP kernel-symbol `data_point[]` series is one sample. The four model inputs are `count`, `mean`, `max`, and `sum`; condition, context, metric, entity, and raw symbol are audit metadata, not predictors.

## 1. Current-model result

`xgboost_balanced` was selected by the stated protocol: the highest mean PR-AUC in five-fold, stratified **TRAIN-only** CV (seed 42). Its held-out TEST result is:

| Measure | TRAIN CV mean | Held-out TEST |
|---|---:|---:|
| PR-AUC | 0.901 | 0.805 |
| ROC-AUC | 0.772 | 0.664 |
| Precision | 0.846 | 0.760 |
| Recall | 0.734 | 0.610 |
| F1 | 0.786 | 0.676 |

At the frozen 0.5 decision threshold, the TEST confusion matrix is `[[761, 458], [926, 1447]]` (rows: actual normal/attack; columns: predicted normal/attack). This means:

- 926 of 2,373 attack-series samples are missed: attack recall is **60.98%**.
- 458 of 1,219 normal-series samples are incorrectly flagged: false-positive rate is **37.57%**.
- Accuracy is 61.47%, so it must not be used as evidence of a deployable detector.

PR-AUC remains materially above the attack prevalence (66.06% in TEST), so the score carries some ranking signal. However, ROC-AUC 0.664 shows that the score does not reliably order attacks above normals across the unseen conditions. The system is therefore a useful first baseline only, not a production detection model.

## 2. Why TRAIN CV is better than the locked TEST result

The decline is credible evidence of condition shift rather than a test-set error. Stratified CV preserves class proportions but splits individual TOP series at random within the two training conditions. Thus validation folds contain samples from the same condition distributions—and potentially closely related source/entity/metric families—as their training folds. The final evaluation instead uses two entirely unseen condition directories.

The held-out conditions are intentionally different:

| Partition | Conditions | Normal / attack samples |
|---|---|---:|
| TRAIN | `Correct_ID/Random_CS_ON`, `Wrong_ID/Random_CS_OFF` | 1,136 / 3,016 |
| TEST | `Correct_ID/Random_CS_OFF`, `Wrong_ID/Random_CS_ON` | 1,219 / 2,373 |

Most importantly, attack-series distributions shift down in their size-related summaries:

| Feature, attack class | TRAIN mean | TEST mean | KS distance | Standardized mean difference |
|---|---:|---:|---:|---:|
| `count` | 44.41 | 24.40 | 0.146 | -0.393 |
| `max` | 8.46 | 6.04 | 0.104 | -0.229 |
| `sum` | 169.00 | 86.49 | 0.146 | -0.298 |
| `mean` | 3.00 | 2.87 | 0.056 | -0.029 |

The `count` and `sum` KS tests have p < 0.001 (both p < 5e-25), while `max` also differs strongly (p < 1e-12). Normal-series `count` changes more moderately (42.53 to 32.64; KS 0.062, p = 0.020); normal `max` is stable (p = 0.400). Consequently, samples that looked like lower-magnitude attacks in training can overlap normal-looking regions in TEST. This is consistent with both the PR-AUC/ROC-AUC drop and the large false-negative count.

The four conditions do not form an independently balanced factorial experiment: in the training pair, attack scenario and random-targeting setting are coupled, and the pairing reverses in TEST. The present data cannot attribute the shift uniquely to scenario, targeting, or their interaction. It can only establish that the held-out condition distributions differ.

## 3. Feature usefulness and limitations

The fitted XGBoost model uses all four features. Its internal gain ranking is:

| Feature | Mean split gain | Split count |
|---|---:|---:|
| `mean` | 1.615 | 3,987 |
| `count` | 1.264 | 2,457 |
| `max` | 1.149 | 3,929 |
| `sum` | 1.066 | 3,006 |

This ranking is descriptive of the fitted model, not causal feature importance. It agrees with a simple train-defined univariate check: lower `mean` and lower `max` have the strongest TEST ranking signal (ROC-AUC 0.682 and 0.672 respectively); `count` and `sum` are weaker alone (0.600 and 0.632). No one summary feature is sufficient.

There is also redundancy. `count` and `sum` have Pearson correlation 0.788 in TRAIN and 0.799 in TEST. `mean` and `max` correlate 0.644/0.681. Because `sum` is structurally related to `count × mean`, these four values describe central tendency, total amount, and one endpoint, but not the shape of the underlying series.

The representation loses information that may distinguish attack patterns with similar totals: variability, lower tail, median, quantiles/IQR, asymmetry, tail heaviness, zero/near-zero rate, and temporal/order-dependent behaviour. The last category must be approached carefully because stored array order is not a verified authentication-event chronology; any future sequential features must operate only within a single series and be explicitly justified.

## 4. False-positive and false-negative analysis

### Outcome profiles

The model is confident in many errors rather than merely failing at the threshold boundary. Median attack probability is 0.735 for false positives and 0.300 for false negatives; their 10th/90th percentiles are 0.539/0.941 and 0.121/0.457 respectively. A TEST-derived threshold change would therefore not solve the central ranking/representation problem and is prohibited by the evaluation design.

The median feature profiles show the overlap:

| Outcome | Count | Mean | Max | Sum |
|---|---:|---:|---:|---:|
| True negative | 16 | 2.958 | 5.670 | 52.930 |
| False positive | 21 | 3.386 | 6.600 | 82.960 |
| False negative | 13 | 2.710 | 4.540 | 39.615 |
| True positive | 8 | 1.763 | 2.500 | 16.930 |

Detected attacks tend to have notably lower summaries than missed attacks. Conversely, false positives have higher summaries than correctly rejected normal samples. This is a direct pattern-level explanation for the 0.5-threshold errors.

### Performance by held-out condition

| TEST condition | Samples | FPR | Attack recall | PR-AUC | ROC-AUC |
|---|---:|---:|---:|---:|---:|
| `Correct_ID/Random_CS_OFF/Gaussian_Off` | 1,750 | 39.75% | 64.89% | 0.831 | 0.687 |
| `Wrong_ID/Random_CS_ON/Gaussian_Off` | 1,842 | 35.65% | 57.12% | 0.777 | 0.642 |

The `Wrong_ID/Random_CS_ON` condition accounts for 512 of 926 false negatives (55.3%) and has the worse ranking and recall. False positives are high in both conditions, so this is not a single-condition failure.

By profiling context, CS contributes 578/926 false negatives (62.4%) despite having only 982 attack samples, whereas GS contributes 348/926 across 1,391 attack samples. The corresponding false-positive counts are 143/298 normal CS samples and 315/921 normal GS samples. This identifies CS attack recall as a particularly important diagnostic target, but context must remain metadata unless a new, approved representation is designed.

No individual raw symbol dominates the errors: the most frequent symbol/metric/context combination appears only four times in either error category. This is evidence against a single malformed symbol series being responsible. It does **not** justify feeding raw symbol identity into the current baseline.

## 5. Interpretation

The baseline's problem is not missing values or invalid numeric data: the processed split contains zero missing, NaN, and infinite feature values. The principal limitations are instead:

1. **Condition generalization:** random row-level CV within TRAIN estimates interpolation across known condition distributions, while the locked TEST measures transfer to unseen conditions.
2. **Compressed representation:** four highly correlated summaries cannot identify distributional shape, so normal high-overhead series and attack series with less extreme summaries overlap.
3. **Operating trade-off:** the class-weighted XGBoost configuration prioritizes precision over recall at 0.5, but its poor score separation makes a different threshold insufficient as a standalone remedy.

For context, `xgboost_standard` had nearly tied TRAIN CV PR-AUC (0.90048 vs. 0.90070) and slightly higher TEST PR-AUC/recall (0.807/0.794), but it was not selected because selection was correctly frozen by TRAIN-only CV. This comparison is descriptive only; it is not a reason to select a TEST winner retroactively.

## 6. Scientifically defensible next step (requires approval)

Do not modify the current baseline or use TEST data for selection. If approved, the next experiment should be a **new, versioned TOP representation** that still keeps one complete labelled TOP series as one sample and preserves the fixed condition holdout.

Recommended candidate features, computed independently inside each series, are:

- existing `count`, `mean`, `max`, `sum`;
- `std`, `min`, `median`;
- robust quantiles (for example Q1, Q3, IQR, and selected upper quantiles);
- optionally skewness/kurtosis and a documented zero/near-zero proportion, only after validating their stability and finite-value behaviour.

The design should not create cross-family joins, align arrays by index, use source-condition metadata as a predictor, or introduce the reserved K=20 raw-symbol vocabulary. Any feature schema and validation protocol must be frozen using training data only. Alongside the existing stratified CV, report a **condition-group diagnostic** on the two training conditions (train on one condition, validate on the other, then reverse). With only two groups this is a stress test rather than a reliable tuning criterion, but it will expose transfer fragility before the locked TEST evaluation. A future data collection with independently varied scenario and targeting conditions would be needed to disentangle their effects robustly.

No implementation is authorized by this report. Await approval before creating the richer processed dataset, fitting models, altering thresholds, or beginning integration.
