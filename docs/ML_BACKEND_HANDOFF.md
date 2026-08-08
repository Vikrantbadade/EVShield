# EVShield ML → Backend/Frontend Handoff

## 1. Scope and current implementation

EVShield is a local ML-based EV-authentication attack-detection Mini Project using the CICEV2023 dataset. The current selected model is a TOP richer-statistics Random Forest. It runs entirely locally: there is no external ML API, cloud inference, or ML API key.

This handoff describes the implemented Mini Project only. The future Minor Project ideas—new synchronized collection, per-family models, and late fusion—are design work only and are **not** implemented.

## 2. Current final model

| Item | Current value |
|---|---|
| Experiment | `TOP_richer_stats_v1` |
| Selected configuration | `random_forest_standard` |
| Model type | scikit-learn `RandomForestClassifier` |
| Saved model | `ml/experiments/TOP_richer_stats_v1/random_forest_standard/model.joblib` |
| Training features | 10, in the exact order below |
| Label mapping | `0 = normal`, `1 = attack` |
| Inference threshold | `0.55`, loaded from `ml/experiments/TOP_richer_stats_v1/operating_point/selected_threshold.json` |
| Selection protocol | TRAIN-only five-fold `StratifiedKFold(shuffle=True, random_state=42)`; highest mean PR-AUC, then ROC-AUC, then F1 |

Feature order:

```text
count, mean, max, sum, std, min, median, q1, q3, iqr
```

`predict.py` verifies this saved experiment order against the versioned dataset schema before it scores input. The model class mapping is also checked at runtime: its classes must be exactly `{0, 1}`, and the probability for class `1` is used as `probability_attack`.

## 3. Held-out TEST performance

The following are aggregate held-out TEST results, not results from an individual `predict.py` call. One prediction is only one model output; it is not model accuracy.

The Step 15 model-selection evaluation used the pre-frozen threshold 0.50:

| Metric | TEST result @ 0.50 |
|---|---:|
| Accuracy | 0.6960 |
| Precision | 0.7559 |
| Recall | 0.7973 |
| F1 | 0.7760 |
| ROC-AUC | 0.7577 |
| PR-AUC | 0.8676 |
| False-positive rate | 0.5012 |
| Confusion matrix | `[[608, 611], [481, 1892]]` |

Rows of the confusion matrix are actual normal/attack; columns are predicted normal/attack.

The current inference policy uses 0.55. That threshold was selected from TRAIN-only out-of-fold (OOF) predictions, then frozen before being applied once to saved TEST probabilities. Its held-out TEST operating result is precision 0.7740, recall 0.7606, F1 0.7673, FPR 0.4323, and confusion matrix `[[692, 527], [568, 1805]]`. ROC-AUC and PR-AUC are score-ranking metrics and do not change when only the decision threshold changes.

## 4. TRAIN/TEST design

Whole condition directories, not random rows, define the split:

```text
TRAIN
  Correct_ID/Random_CS_ON/Gaussian_Off
  Wrong_ID/Random_CS_OFF/Gaussian_Off

TEST
  Correct_ID/Random_CS_OFF/Gaussian_Off
  Wrong_ID/Random_CS_ON/Gaussian_Off
```

One complete labelled TOP kernel-symbol `data_point[]` series is one ML sample. Arrays were never aligned by index, and TIME_DELTA/STAT data were never joined to TOP rows. TEST data was loaded only after TRAIN-only model selection. The 0.55 threshold was selected from TRAIN OOF predictions only—not from TEST metrics.

## 5. TOP richer-statistics feature engineering

Each vector was derived from the finite numeric values in **one complete TOP `data_point[]` series** for a kernel symbol, metric, entity, profiling context, and label. The ten values are not generic EV telemetry fields.

| Feature | Meaning |
|---|---|
| `count` | Number of values in that one series. |
| `mean` | Arithmetic mean of the series. |
| `max` | Largest series value. |
| `sum` | Sum of all series values. |
| `std` | Population standard deviation (`ddof=0`). |
| `min` | Smallest series value. |
| `median` | 50th percentile. |
| `q1` | 25th percentile, NumPy linear quantile method. |
| `q3` | 75th percentile, NumPy linear quantile method. |
| `iqr` | `q3 - q1`. |

The extraction implementation is [build_top_richer_stats_v1.py](../ml/build_top_richer_stats_v1.py). It validates non-empty finite numeric `data_point[]` arrays and fails rather than imputing values. Raw symbol name, condition, context, entity, and metric are retained as provenance metadata; they are not model inputs.

## 6. Raw input versus model input

**`ml/inference/predict.py` does not accept raw CICEV2023 JSON or arbitrary EV telemetry.** It accepts exactly one already-engineered TOP richer-statistics vector:

```json
{
  "count": 14.0,
  "mean": 2.496428571428571,
  "max": 3.26,
  "sum": 34.95,
  "std": 0.3929123337855613,
  "min": 1.96,
  "median": 2.47,
  "q1": 2.15,
  "q3": 2.7275,
  "iqr": 0.5775000000000001
}
```

Node.js cannot send arbitrary telemetry to this script. It must either:

1. already have these exact ten TOP features for one complete valid TOP series; or
2. coordinate with the ML developer before adding a separately approved raw-telemetry feature-extraction path.

Do not invent a raw telemetry-to-feature conversion, use a partial series, or create/fill missing values.

## 7. Inference script contract

Run from the EVShield project root:

```bash
./.venv/bin/python ml/inference/predict.py
```

Pass one JSON object to stdin. The script resolves the project root from its own file path, then loads:

- the saved `model.joblib`;
- `experiment_config.json` for feature order (validated against `ml/processed/TOP_richer_stats_v1/schema.json`); and
- `selected_threshold.json` for the frozen threshold.

It accepts only the ten required keys, in any JSON key order. It rejects missing keys, extra keys, booleans, non-numeric values, NaN, and infinity. Errors are JSON written to stderr and cause a non-zero exit; stdout is reserved for a successful JSON response.

No scaler or TOP vocabulary is applied: this selected Random Forest was trained directly on the ten engineered numeric features. The generic processed scaler/vocabulary artifacts referenced in older/general instructions do not exist for this experiment.

## 8. Inference output

Successful stdout is one JSON object:

```json
{
  "probability_attack": 0.72,
  "predicted_label": 1,
  "label": "ATTACK",
  "threshold": 0.55
}
```

`predicted_label=0` / `NORMAL` means `probability_attack < 0.55`. `predicted_label=1` / `ATTACK` means `probability_attack >= 0.55`. The probability is rounded to four decimal places for presentation.

## 9. Node.js integration contract

Input to the backend ML adapter: one JSON object containing exactly the ten features above. Output from the adapter: the successful JSON object produced by `predict.py` unchanged, or a handled error derived from its JSON stderr/non-zero exit.

```text
React
  ↓
Node.js / Express
  ↓  stdin: one engineered JSON vector
local Python predict.py
  ↓
model.joblib
  ↓  stdout: prediction JSON
Node.js
  ↓
React
```

Node.js may invoke this local Python process and communicate through stdin/stdout. It must **not** load `joblib` itself, retrain or alter the model, change 0.55, reorder features, invent missing values/features, or send raw CICEV2023 telemetry as if it were a model vector.

## 10. Current limitations

- This is a local research/Mini Project prototype, not a production DDoS-prevention system.
- False positives remain material (FPR 43.23% at the current frozen 0.55 operating point), and false negatives remain material (FNR 23.94%).
- The model uses TOP-family statistics only. TIME_DELTA and STAT were not combined with TOP.
- Supervised cross-family fusion is not implemented because the current dataset has no verified common event/window identifier across families.
- Synchronized collection and late fusion are future Minor Project work described in the design documents; they are not current backend capabilities.

## 11. Dataset boundaries

The final experiment includes only these settings in its approved four condition directories:

- attack scenarios: `Correct_ID` and `Wrong_ID`;
- targeting: `Random_CS_OFF` and `Random_CS_ON`;
- Gaussian setting: `Gaussian_Off`.

It excludes `Wrong_EV_TS`, `Wrong_CS_TS`, and `Gaussian_On`. The original `ml/dataset/` corpus remains untouched; processed datasets and experiment artifacts are versioned outputs.

## 12. File map

| Purpose | Location |
|---|---|
| Original CICEV2023 source data | `ml/dataset/` |
| Original preprocessing pipeline | `ml/preprocessing_pipeline.py` |
| Richer TOP extractor | `ml/build_top_richer_stats_v1.py` |
| Baseline TOP processed data | `ml/processed/TOP_baseline_dataset/` |
| Selected-model processed data/schema | `ml/processed/TOP_richer_stats_v1/{train.csv,test.csv,schema.json,validation.json}` |
| Model-selection script | `ml/top_richer_stats_v1_experiments.py` |
| Threshold-analysis script/artifacts | `ml/top_richer_stats_v1_operating_point.py`, `ml/experiments/TOP_richer_stats_v1/operating_point/` |
| Selected saved model | `ml/experiments/TOP_richer_stats_v1/random_forest_standard/model.joblib` |
| Saved metrics/predictions | `ml/experiments/TOP_richer_stats_v1/random_forest_standard/{metrics.json,predictions.csv,confusion_matrix.json}` |
| Inference entry point | `ml/inference/predict.py` |
| Detailed ML audit | `docs/ml_completion_audit.md` |
