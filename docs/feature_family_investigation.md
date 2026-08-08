# EVShield Mini Project — Feature-Family Investigation

## Scope and conclusion

This is a read-only Step 17 investigation of the approved family-specific processed datasets. No model was trained, no dataset or preprocessing file was modified, and no TEST result was used to select anything.

The evidence supports keeping the families separate. TOP is the only family with enough independent series for a meaningful standalone ML baseline. TIME_DELTA and CS STAT have strong-looking within-TRAIN class differences but only 12 TRAIN series each; GS STAT has only four. Those differences are descriptive evidence, not reliable standalone-model evidence. The families measure semantically distinct phenomena, but **the present data cannot demonstrate predictive complementarity or train a supervised fusion model** because it contains no verified cross-family event/window identifier.

## 1. Current TOP reference

| System | PR-AUC | ROC-AUC | Recall | FPR | Notes |
|---|---:|---:|---:|---:|---|
| TOP baseline, XGBoost balanced @ 0.50 | 0.8048 | 0.6641 | 60.98% | 37.57% | Four summary features. |
| TOP richer v1, Random Forest @ 0.50 | 0.8676 | 0.7577 | 79.73% | 50.12% | Ten per-series summaries. |
| TOP richer v1, frozen threshold 0.55 | — | — | 76.06% | 43.23% | Threshold selected from TRAIN OOF only. |

TOP richer v1 has better ranking and recall than the baseline, but its held-out FPR remains high. It is the only current family with sufficient sample volume for a substantive standalone experiment.

## 2. Dataset inventory and data validity

All listed feature matrices have zero missing, NaN, and infinite feature values. `count` denotes series length and is a legitimate within-series feature; it is not a cross-family identifier.

| Dataset / family | Features | TRAIN rows, normal / attack | TEST rows, normal / attack | Standalone ML adequacy |
|---|---:|---:|---:|---|
| TIME_DELTA | 6 | 12, 6 / 6 | 8, 4 / 4 | No: exploratory diagnostic only. |
| STAT_CS_branch | 6 | 12, 6 / 6 | 8, 4 / 4 | No: exploratory diagnostic only. |
| STAT_CS_cycles | 6 | 12, 6 / 6 | 8, 4 / 4 | No: exploratory diagnostic only. |
| STAT_CS_instructions | 6 | 12, 6 / 6 | 8, 4 / 4 | No: exploratory diagnostic only. |
| STAT_GS_branch | 6 | 4, 2 / 2 | 4, 2 / 2 | No: insufficient for model inference. |
| STAT_GS_cycles | 6 | 4, 2 / 2 | 4, 2 / 2 | No: insufficient for model inference. |
| STAT_GS_instructions | 6 | 4, 2 / 2 | 4, 2 / 2 | No: insufficient for model inference. |
| TOP baseline | 4 | 4,152, 1,136 / 3,016 | 3,592, 1,219 / 2,373 | Yes, as an initial condition-held-out baseline. |
| TOP richer v1 | 10 | 4,152, 1,136 / 3,016 | 3,592, 1,219 / 2,373 | Yes, as an initial condition-held-out baseline. |

The TIME_DELTA and STAT features are `count`, `mean`, `std`, `min`, `max`, and `median`. TOP v1 uses `count`, `mean`, `max`, `sum`, `std`, `min`, `median`, `q1`, `q3`, and `iqr`.

## 3. Analysis method and statistical limits

For each dataset, the following read-only summaries were calculated:

- class medians per feature in TRAIN;
- a standardized mean difference (attack minus normal, pooled-standard-deviation scale) and a univariate TRAIN AUC for class separation;
- a two-sample Kolmogorov–Smirnov (KS) distance comparing TRAIN and TEST within the same class, per feature.

For each family below, the table reports the feature with the largest absolute standardized difference and the feature/class with the largest KS distance. These are descriptive extrema, not feature selection. With six or fewer samples per class, standardized effects can be extreme, AUC can equal 1.0 by chance, and exact KS p-values are coarse. They must not be interpreted as confirmed generalization or used to rank families.

## 4. TIME_DELTA analysis

TIME_DELTA measures authentication interval (`time_diff`) distributions, whereas TOP measures symbol-level overhead distributions. It is therefore semantically distinct from TOP.

| Evidence from TRAIN / shift check | Result |
|---|---|
| Samples | 6 normal and 6 attack TRAIN series; 4 and 4 TEST series. |
| Largest TRAIN separation | `count`: attack/normal medians 2,244 / 245; standardized difference +39.12; univariate AUC 1.00. |
| Other strong TRAIN differences | Attack median `mean` 0.1689 vs normal 1.4206; attack median `std` 0.0836 vs normal 2.4437; each has train AUC 1.00. |
| Largest same-class shift | Attack `mean`, KS=1.00, exact p=0.0095; attack `std`, `max`, and `median` also KS=1.00. |

The apparent signal is large, but it is entangled with severe condition shift and only 12 training observations. The count gap is especially vulnerable to source/run-level effects. TIME_DELTA is not adequate for credible standalone model claims now. It is a plausible **future** complementary timing channel only if substantially more independent condition runs are collected and a verified common deployment window is established.

## 5. STAT/CS analysis

STAT/CS measures overall CS resource-consumption distributions (`branch`, `cycles`, `instructions`), which are conceptually different from TOP's per-symbol overhead series. Each metric is a separate dataset and must remain separate.

| Dataset | Largest TRAIN separation | Largest within-class TRAIN→TEST shift | Interpretation |
|---|---|---|---|
| `STAT_CS_branch` | `min`: d=-4.59; train AUC 1.00. Attack/normal medians: 0.000135 / 0.1331. | Attack `count`: KS=1.00, p=0.0095. | Strong-looking but only 6 training series per class and shifted. |
| `STAT_CS_cycles` | `mean`: d=-8.87; train AUC 1.00. Attack/normal medians: 0.01538 / 0.02522. | Attack `count`: KS=1.00, p=0.0095. | Same sample-size and condition-shift limitation. |
| `STAT_CS_instructions` | `std`: d=+5.46; train AUC 1.00. Attack/normal medians: 45.24 / 0.152. | Attack `count`: KS=1.00, p=0.0095. | Highly variable attack series; not enough samples to establish reliability. |

All three CS datasets have 12 TRAIN and 8 TEST series. Their perfect TRAIN univariate separations are not evidence that a classifier would be robust: each test partition has only four observations per class, and the counts/other summaries differ by condition. CS STAT is not suitable for a claimed standalone ML detector with this dataset size. It is a candidate future resource-consumption channel, subject to additional independently collected conditions.

## 6. STAT/GS analysis

STAT/GS measures overall GS resource-consumption distributions and is likewise semantically different from TOP. However, it is the least statistically informative family here.

| Dataset | Largest TRAIN separation | Largest within-class TRAIN→TEST shift | Interpretation |
|---|---|---|---|
| `STAT_GS_branch` | `count`: d=+27.58; train AUC 1.00. | Attack `count` / `max`: KS=1.00, p=0.333. | 2 observations per class: no inferential value. |
| `STAT_GS_cycles` | `median`: d=+76.85; train AUC 1.00. | Several features KS=1.00, p=0.333. | 2 observations per class: no inferential value. |
| `STAT_GS_instructions` | `count`: d=+27.58; train AUC 1.00. | Several features KS=1.00, p=0.333. | 2 observations per class: no inferential value. |

With two TRAIN series per class and two TEST series per class, an AUC of 1.00 merely records the ordering of four observations. The KS p-value floor of 0.333 illustrates the lack of resolution. No standalone GS STAT training, feature ranking, or fusion-weight inference is scientifically defensible from these samples.

## 7. TOP analysis and shift

TOP is per-kernel-symbol overhead, with thousands of labelled series and therefore the only adequately sized family for the current standalone modelling work. The four-feature baseline's strongest single TRAIN separator was `mean` (absolute univariate AUC 0.645; standardized difference -0.208). In richer v1, the largest simple class separation is `q3` (absolute AUC 0.648; d=-0.238); model-level importance also highlights `min`, `q1`, and `median`.

TOP still has meaningful held-out shift. In the baseline representation, attack `count` and `sum` have KS=0.146 (p < 5e-25), and attack `max` KS=0.104 (p < 1e-12). In v1, attack `min` has the largest observed shift (KS=0.198, p < 7e-46). These values explain why improvements in ranking do not automatically yield a low-FPR operating point on held-out conditions.

Unlike the tiny families, TOP's large row count makes these shifts precisely detectable. It does not remove the core limitation that all rows still arise from only two training condition directories, so random row CV may be optimistic for condition transfer.

## 8. Complementarity assessment

### What the evidence supports

- **Semantic distinction:** TIME_DELTA captures authentication timing; STAT/CS and STAT/GS capture aggregate resource use; TOP captures kernel-symbol-level overhead. These are different measurement definitions in the source hierarchy.
- **Different within-family patterns:** TIME_DELTA and STAT show large descriptive class effects in their own summaries, while TOP has weaker individual effects but strong multivariate performance with many rows.
- **Potential future value:** timing and aggregate-resource measurements could plausibly add signals not represented by TOP summary statistics.

### What the evidence does not support

The data do not provide a verified way to pair a TIME_DELTA series, a STAT series, and a TOP series as measurements of the same event or decision instance. Therefore:

- cross-family row-wise correlations were not calculated;
- incremental predictive value conditional on TOP cannot be estimated;
- no claim of measured complementarity can be made;
- a supervised meta-classifier cannot be trained from the current unpaired processed rows.

Feature-name differences alone are not evidence of complementarity. The current conclusion is only that the families are **semantically non-identical candidates for future investigation**, not that fusion will improve detection.

## 9. Suitability decision

| Family | Standalone ML now | Future fusion candidate | Reason |
|---|---|---|---|
| TIME_DELTA | No, diagnostic only | Conditional yes | Different timing measurement, but 12 TRAIN series and no verified fusion key. |
| STAT/CS | No, diagnostic only | Conditional yes | Different aggregate CS resource measurement, but 12 TRAIN series/metric and major condition shift. |
| STAT/GS | No | Not currently | Only 4 TRAIN series/metric; gather more data first. |
| TOP | Yes, baseline/research only | Conditional yes | Thousands of rows and demonstrated ranking signal, but high FPR/condition shift remain. |

“Conditional” means that a fusion unit must be externally and verifiably defined; it does not authorize pairing the existing source arrays.

## 10. Recommended future late-fusion architecture

The approved future direction is prediction-level late fusion, never a mixed raw-feature row:

```text
verified runtime decision window / authentication session ID
        ├─ TIME_DELTA family model  → timing probability
        ├─ STAT/CS family model     → CS-resource probability
        ├─ STAT/GS family model     → GS-resource probability
        └─ TOP family model         → TOP probability
                                           ↓
                              fusion policy / meta-classifier
                                           ↓
                              final EVShield attack probability
```

The key requirement is upstream: the production data-collection system must attach a verified common decision-window/session identifier to each family score. The current CICEV2023 files do not provide it, so this architecture cannot be fitted or validated as a supervised fusion model from the existing processed CSVs. Before a learned meta-classifier, a future protocol could evaluate separately timestamped family alarms at deployment; it must not synthesize pairings from row order, entity name, condition, or label.

## 11. Leakage safeguards

1. Keep all source series from a condition directory within its approved partition.
2. Never join arrays or processed rows by index, row position, entity alone, class, or condition metadata.
3. Do not make raw symbol, metric identity, condition, or class names model predictors.
4. Fit any family model, scaler, threshold, calibration method, or fusion weight using TRAIN data only.
5. For a future meta-classifier, train it only from probabilities attached to a verified common runtime decision ID; generate those base probabilities out-of-fold on TRAIN to prevent stacking leakage.
6. Reserve TEST for one final frozen evaluation; do not choose family weights or a fusion rule from TEST.
7. Do not interpret tiny-family TEST results as a reason to alter TOP features, thresholds, or model selection.

## 12. Recommended Step 18

Do not begin fusion modelling from the current files. Step 18 should be a **fusion-feasibility and data-collection design**: define a verified runtime authentication/session or observation-window key, specify how each family produces one probability for that same key, and collect enough independent condition directories for every family. Pre-register a grouped TRAIN-only protocol for base-model OOF predictions and a fusion policy.

Only after that evidence exists should the project evaluate separate family models and a late-fusion baseline. Until then, TOP richer v1 remains the only sufficiently supported family-level ML result, with its frozen threshold and documented operating limitations.
