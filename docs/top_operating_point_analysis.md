# EVShield Mini Project — TRAIN-Only Operating-Point Analysis

## Outcome

The frozen operating-point rule selected **0.55** from TRAIN out-of-fold (OOF) predictions. It is the highest-recall evaluated threshold satisfying the predeclared OOF constraint `FPR <= 30%`.

Applied once to the already saved TEST probabilities of the selected Step 15 model, threshold 0.55 reduced v1 FPR from 50.12% to 43.23%, but did not achieve a 30% TEST FPR. This is reported as held-out generalization evidence only; it did not change the threshold, model, feature set, or any other decision.

## 1. Scope and leakage safeguards

The selected Step 15 `random_forest_standard` configuration was kept fixed: `RandomForestClassifier(random_state=42, n_estimators=400, min_samples_leaf=1)`. No final model was refitted and no new model configuration or feature version was created.

To obtain the requested OOF TRAIN probabilities, five temporary fold models were fitted with the existing `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)` procedure. This is cross-validation scoring, not a new final-model training run. Each validation score came from a fold model that did not fit that row.

Threshold selection used only the 4,152 TRAIN rows and their OOF probabilities. The saved TEST prediction file was not read until after the threshold was selected and written to `selected_threshold.json`. The final TEST calculation only re-thresholded those existing probabilities; it did not call `fit` or tune against TEST.

No changes were made to `ml/dataset/`, `ml/preprocessing_pipeline.py`, the TOP baseline dataset/artifacts, or `TOP_richer_stats_v1` data/features/model.

## 2. Predeclared selection rule

Evaluate thresholds from 0.10 to 0.90 in increments of 0.05 on TRAIN OOF predictions. Select among thresholds with `FPR <= 0.30` by:

1. highest attack recall;
2. then highest F1;
3. then highest precision.

The thresholds satisfying the OOF FPR constraint were 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, and 0.90. Threshold 0.55 has the highest recall among them and was frozen before TEST was accessed.

## 3. TRAIN OOF threshold table

| Threshold | Precision | Recall | F1 | FPR | FNR | TP | TN | FP | FN |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0.10 | 0.7368 | 0.9987 | 0.8480 | 0.9472 | 0.0013 | 3012 | 60 | 1076 | 4 |
| 0.15 | 0.7455 | 0.9973 | 0.8532 | 0.9040 | 0.0027 | 3008 | 109 | 1027 | 8 |
| 0.20 | 0.7580 | 0.9920 | 0.8594 | 0.8407 | 0.0080 | 2992 | 181 | 955 | 24 |
| 0.25 | 0.7712 | 0.9857 | 0.8654 | 0.7764 | 0.0143 | 2973 | 254 | 882 | 43 |
| 0.30 | 0.7874 | 0.9748 | 0.8711 | 0.6989 | 0.0252 | 2940 | 342 | 794 | 76 |
| 0.35 | 0.8107 | 0.9655 | 0.8814 | 0.5986 | 0.0345 | 2912 | 456 | 680 | 104 |
| 0.40 | 0.8302 | 0.9483 | 0.8853 | 0.5150 | 0.0517 | 2860 | 551 | 585 | 156 |
| 0.45 | 0.8543 | 0.9290 | 0.8901 | 0.4208 | 0.0710 | 2802 | 658 | 478 | 214 |
| 0.50 | 0.8757 | 0.9085 | 0.8918 | 0.3424 | 0.0915 | 2740 | 747 | 389 | 276 |
| **0.55** | **0.8911** | **0.8820** | **0.8865** | **0.2861** | **0.1180** | **2660** | **811** | **325** | **356** |
| 0.60 | 0.9018 | 0.8558 | 0.8782 | 0.2474 | 0.1442 | 2581 | 855 | 281 | 435 |
| 0.65 | 0.9169 | 0.8236 | 0.8678 | 0.1981 | 0.1764 | 2484 | 911 | 225 | 532 |
| 0.70 | 0.9307 | 0.7878 | 0.8533 | 0.1558 | 0.2122 | 2376 | 959 | 177 | 640 |
| 0.75 | 0.9394 | 0.7507 | 0.8345 | 0.1285 | 0.2493 | 2264 | 990 | 146 | 752 |
| 0.80 | 0.9492 | 0.7003 | 0.8060 | 0.0995 | 0.2997 | 2112 | 1023 | 113 | 904 |
| 0.85 | 0.9631 | 0.6409 | 0.7697 | 0.0651 | 0.3591 | 1933 | 1062 | 74 | 1083 |
| 0.90 | 0.9741 | 0.5726 | 0.7212 | 0.0405 | 0.4274 | 1727 | 1090 | 46 | 1289 |

The full machine-readable table is `ml/experiments/TOP_richer_stats_v1/operating_point/threshold_metrics.csv`.

## 4. Selected operating point: TRAIN-only evidence

At threshold 0.55, OOF TRAIN precision is 89.11%, recall is 88.20%, F1 is 88.65%, FPR is 28.61%, and FNR is 11.80% (`TN=811`, `FP=325`, `FN=356`, `TP=2660`). Threshold 0.50 has higher recall (90.85%) but fails the FPR constraint (34.24%). Thresholds above 0.55 meet the constraint but have lower recall, so the tie-breakers are not needed.

This table also makes the trade-off visible: 0.60 supplies an additional OOF FPR reduction (24.74%) at recall 85.58%; 0.80 has FPR 9.95% but recall falls to 70.03%. These are alternatives for future policy discussion, not competing thresholds selected with TEST results.

## 5. Locked TEST result at the frozen threshold

The saved Step 15 TEST probabilities were thresholded exactly once at 0.55:

```text
confusion matrix = [[692, 527],
                    [568, 1805]]
```

| Measure | TEST result at threshold 0.55 |
|---|---:|
| Precision | 0.7740 |
| Attack recall | 0.7606 |
| F1 | 0.7673 |
| FPR | 0.4323 |
| FNR | 0.2394 |
| TP / TN / FP / FN | 1,805 / 692 / 527 / 568 |

The TRAIN OOF FPR constraint does not fully transfer to the held-out conditions: TEST FPR is 43.23%, rather than the 28.61% OOF estimate. This is consistent with the previously documented condition shift. The threshold remains frozen; no response to this result was made.

## 6. Comparison of the three fixed operating points

| Model / threshold | Precision | Recall | F1 | FPR | FNR | TN / FP / FN / TP |
|---|---:|---:|---:|---:|---:|---:|
| Baseline TOP XGBoost balanced @ 0.50 | 0.7596 | 0.6098 | 0.6765 | 0.3757 | 0.3902 | 761 / 458 / 926 / 1447 |
| Richer TOP v1 Random Forest @ 0.50 | 0.7559 | 0.7973 | 0.7760 | 0.5012 | 0.2027 | 608 / 611 / 481 / 1892 |
| Richer TOP v1 Random Forest @ **0.55** | **0.7740** | **0.7606** | **0.7673** | **0.4323** | **0.2394** | **692 / 527 / 568 / 1805** |

Relative to v1 at 0.50, the TRAIN-selected threshold removes 84 TEST false positives and increases precision, but misses 87 additional attacks. Relative to the baseline at 0.50, it still detects 358 more attacks, but creates 69 more false positives and has a higher FPR.

## 7. Limitations

- The threshold rule was estimated from random stratified OOF folds inside only two TRAIN conditions; those scores can remain optimistic for unseen-condition transfer.
- The 30% FPR constraint is satisfied on OOF TRAIN but not on TEST, showing that a fixed operating point does not eliminate the condition-shift problem.
- This analysis evaluates one security policy. It does not establish that 30% is an operationally acceptable FPR, and it does not make the detector production-ready.
- No TEST-based retuning is permitted. Any future threshold-policy change requires a separately approved TRAIN-only validation protocol and should not overwrite this result.

## 8. Artifacts

All artifacts are under `ml/experiments/TOP_richer_stats_v1/operating_point/`:

- `threshold_metrics.csv`
- `selected_threshold.json`
- `train_oof_predictions.csv`
- `test_threshold_predictions.csv`
- `operating_point_summary.json`

The implementation is `ml/top_richer_stats_v1_operating_point.py`.
