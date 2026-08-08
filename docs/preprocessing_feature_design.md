# EVShield Mini Project — Preprocessing Feature Design

This document is the approved design for the preprocessing feature layer only. It is a design and approval gate, not an implementation. No preprocessing code, no transformed dataset, and no model training are created or executed here.

## Scope and status

This design covers the approved Mini Project subset:

- `Correct_ID/Random_CS_ON/Gaussian_Off`
- `Correct_ID/Random_CS_OFF/Gaussian_Off`
- `Wrong_ID/Random_CS_ON/Gaussian_Off`
- `Wrong_ID/Random_CS_OFF/Gaussian_Off`

It applies the approved sample definition:

- One complete labelled `data_point[]` series = one raw ML sample.
- Do not join `TIME_DELTA`, `STAT`, and `TOP` by array index.
- Use a condition-directory train/test split and keep all related series from one condition in the same partition.

## Data observations from the inspected files

The dataset inspection confirms:

- `TIME_DELTA`, `STAT`, and `TOP` are all nested JSON objects with numeric `data_point[]` arrays.
- There are no `NaN`, `Inf`, or `null` values in the selected Mini Project files.
- There are no empty `data_point[]` arrays in the selected Mini Project files.
- There are no malformed or non-numeric scalar values in the selected files.
- Each raw series is a complete numeric measurement block under a specific source file, entity ID, metric, and class branch.

This means the feature design does not need to invent missing-value logic for the selected Mini Project subset. It should still validate and fail fast for future malformed files.

## Sample-to-row construction and the no-alignment rule

### 1. What uniquely identifies one final ML row

One final ML row is uniquely identified by the following logical tuple:

```text
condition_directory
+ entity_id
+ class_label (normal = 0, attack = 1)
+ profiling_context (CS or GS)
```

This is the row identity used for the final feature matrix after the per-family summary statistics have been computed. The key point is that the row is not identified by a raw array index, a scalar position inside a `data_point[]`, or an event ID.

### 2. Is a final ML row built from one source series or from multiple feature-family series?

A final ML row is built from multiple feature-family series, but only by concatenating independently summarized features from the same logical profile.

Specifically:

- one raw sample = one complete labelled `data_point[]` series
- one final model row = one aggregated profile for a given condition + entity + class + profiling context
- each feature family (`TIME_DELTA`, `STAT/CS`, `STAT/GS`, `TOP/CS`, `TOP/GS`) contributes its own summary block
- these summary blocks are concatenated into one final vector and are not joined by position index

This is how the implementation can legitimately include all five feature families without inventing cross-family alignment.

### 3. If multiple feature families are combined, what verified key/context allows that combination?

There is no verified event-level key that allows a literal row-to-row join between `TIME_DELTA`, `STAT`, and `TOP` arrays.

The combination is allowed only at the level of the source profile, not at the level of individual raw values.

The valid context is:

```text
condition_directory + entity_id + class_label + profiling_context
```

For example:

- `Correct_ID/Random_CS_ON/Gaussian_Off`
- `2-39-89-25`
- `attack`
- `CS`

This profile is a valid row identifier because all feature-family series under that context belong to the same source condition and profiling target, even though they are not the same raw array and are not aligned by index.

### 4. If there is no verified cross-family key, how can all five families be included legitimately?

Because the final `X` row is a summary vector, not a raw aligned event record.

The process is:

1. Keep each raw series separate.
2. Summarize each raw series independently.
3. Save the summaries under a fixed feature name.
4. Concatenate the summary blocks for the same logical profile.
5. Assign the final label from the enclosing class branch.

This does not mean we matched `TIME_DELTA[i]` to `STAT[i]` or `TOP[i]`.

It means:

- `TIME_DELTA` contributes a distribution summary for the `time_diff` series
- `STAT/CS` contributes distribution summaries for `branch`, `cycles`, and `instructions`
- `STAT/GS` contributes distribution summaries for `branch`, `cycles`, and `instructions`
- `TOP/CS` contributes summary statistics and symbol-vocabulary features for the CS kernel-symbol series
- `TOP/GS` contributes summary statistics and symbol-vocabulary features for the GS kernel-symbol series

These are different observations from the same source condition and same entity/class profile, summarized independently and combined into one row only after the summary stage.

No array-index alignment is used anywhere in this process.

### 5. Concrete examples from the actual JSON hierarchy

#### Example A — TIME_DELTA profile

```json
Correct_ID/Random_CS_ON/Gaussian_Off/TIME_DELTA/TIME_DELTA.json
{
  "2-39-89-25": {
    "time_diff": {
      "attack": {
        "data_point": [0.196492, 0.152006, ...]
      },
      "normal": {
        "data_point": [0.211212, 0.184901, ...]
      }
    }
  }
}
```

This raw series is one `time_diff` distribution for the `2-39-89-25` CS entity under the `Correct_ID/Random_CS_ON/Gaussian_Off` condition and the `attack` or `normal` branch.

It is summarized independently into features such as:

- `time_delta_count`
- `time_delta_mean`
- `time_delta_std`
- `time_delta_min`
- `time_delta_max`
- `time_delta_median`

#### Example B — STAT/CS profile

```json
Correct_ID/Random_CS_ON/Gaussian_Off/STAT/CS/STAT.json
{
  "2-39-89-25": {
    "branch": {
      "attack": { "data_point": [0.1905879, 0.1868195, ...] }
    },
    "cycles": {
      "attack": { "data_point": [0.0000564, ...] }
    },
    "instructions": {
      "attack": { "data_point": [0.2345376, ...] }
    }
  }
}
```

This provides three separate numeric series for the same CS entity and attack class. Each series is summarized separately before concatenation into the row.

#### Example C — TOP/CS profile

```json
Correct_ID/Random_CS_ON/Gaussian_Off/TOP/CS/TOP.json
{
  "2-39-89-25": {
    "branch": {
      "attack": {
        "dequeue_task_fair": { "data_point": [4.99, 3.88, ...] },
        "___slab_alloc": { "data_point": [2.92, 2.66, ...] }
      }
    }
  }
}
```

This is not a join to the `TIME_DELTA` or `STAT` arrays. It is a separate kernel-symbol distribution under the same condition/entity/class profile. The TOP raw symbol series is first summarized within each symbol and then converted to a fixed-width vocabulary-based representation through the approved training-only Top-K mapping.

### 6. Confirmation: no array-index alignment will be used

This is confirmed explicitly:

- We do not link `TIME_DELTA[i]` with `STAT[i]`.
- We do not link `STAT[i]` with `TOP[i]`.
- We do not join by the index position inside `data_point[]` arrays.
- We do not assume equal array lengths across families or equal number of raw observations.
- We do not create a pseudo-event row by zipping arrays.

Instead, we summarize each family independently and concatenate the resulting numeric feature blocks into one final row for the same condition/entity/class/profile.

This preserves the dataset’s actual structure, respects the no-alignment requirement, and keeps the final feature matrix scientifically legitimate for the Mini Project.

## Final clarification

The correct mental model is:

- one raw sample = one complete labelled series
- one final feature row = one aggregated profile built from all the per-family summary blocks for that profile
- no joining by array index
- no event-level cross-family alignment assumption
- all family summaries are combined only after independent summarization and only under the approved logical profile key

This is the only valid way to include all five feature families in a single fixed-width ML dataset without inventing unsupported alignment.

## 1) Final TIME_DELTA representation

### Candidate representations considered

A. Raw values only
- Pros: preserves every measured value in the series.
- Cons: variable-length arrays create non-fixed feature width; impossible to pass a single ML row without padding or truncation; not compatible with the project requirement for a fixed-width tabular matrix.
- Leakage risk: low if used only within sample, but not fixed-width and not suitable for a clean feature matrix.
- Suitability: not suitable.

B. Mean / max / sum / count only
- Pros: fixed-width and easy to compute.
- Cons: discards dispersion and outlier structure; assumes the common global distribution is enough for the series, which is not supported by the data documentation.
- Suitability: acceptable as a minimal baseline, but weaker than a fuller distribution summary.

C. Count + mean + std + min + max + median
- Pros: captures scale, central tendency, variability, and robust central location; all are computable from each raw `data_point[]` array; no alignment assumption is required; fixed-width, interpretable, and compatible with the approved sample definition.
- Cons: still discards the full sequence order and any non-summarized trajectory details, but the dataset documentation does not provide timing semantics that would justify a richer time-series model.
- Leakage risk: low, if computed per sample and not across train/test.
- Suitability: strong for the Mini Project.

### Final decision

For each `TIME_DELTA` `data_point[]` series, use the following six numerical summary features:

- `time_delta_count`
- `time_delta_mean`
- `time_delta_std`
- `time_delta_min`
- `time_delta_max`
- `time_delta_median`

Why this is the chosen representation:

- The dataset gives no verified event ID, sequence ID, or timestamp that would justify event-level alignment or sequence modeling.
- The values in `TIME_DELTA` are numeric intervals (`time_diff`) and behave like a distribution, not a joinable table.
- The mean and spread summarize the series while respecting the dataset’s constraints.
- The median reduces sensitivity to a small number of extreme values, which is useful because the inspected arrays include a wide range of values.
- These summaries are compatible with the approved sample definition and produce a fixed-width feature row.

## 2) Final STAT representation

`STAT/CS` and `STAT/GS` include three metrics:

- `branch`
- `cycles`
- `instructions`

For each metric series, we use the same distribution summary design as `TIME_DELTA`:

- `count`
- `mean`
- `std`
- `min`
- `max`
- `median`

### Why not raw values?

- The raw arrays are variable-length.
- There is no trusted cross-family alignment that would allow combining one raw `STAT` array with a raw `TIME_DELTA` array at the same position.
- A fixed-width ML matrix requires summarization.

### Why this is appropriate

- These `STAT` metrics represent aggregate resource-consumption measurements and are naturally describable by central tendency and spread.
- The dataset documentation identifies them as resource signals, not as event-indexed rows.
- The values are all positive numeric values with no missingness in the selected subset, so summary metrics are stable and interpretable.

### Exact STATS feature groups

For each of the following source families, compute six summary features for each of the three metrics:

- `STAT/CS/branch`
- `STAT/CS/cycles`
- `STAT/CS/instructions`
- `STAT/GS/branch`
- `STAT/GS/cycles`
- `STAT/GS/instructions`

This results in 18 features for `STAT/CS` and 18 features for `STAT/GS`.

## 3) Final TOP representation

TOP is already approved as:

- count
- mean
- max
- sum
- training-only Top-K kernel-symbol vocabulary with `K = 20`
- separate vocabularies for:
  - `CS/branch`
  - `CS/cycles`
  - `CS/instructions`
  - `GS/branch`
  - `GS/cycles`
  - `GS/instructions`
- unseen symbols map to `other`

This design remains unchanged.

### TOP summary features

For each raw TOP symbol series, compute:

- `top_count`
- `top_mean`
- `top_max`
- `top_sum`

The implementation does not use the symbol name itself as a raw identifier column. Instead, the symbol name is represented through the training-only vocabulary and the `other` fallback.

### TOP vocabulary rules

- Learn vocabularies only from training condition groups.
- Use separate vocabularies for each TOP target/metric pair.
- Keep `K = 20` for each vocabulary.
- If a test-only symbol is not in the training vocabulary, set it to `other`.
- Build and freeze these learned objects before test-data transformation.

This directly prevents test-set influence on the feature space.

## 4) Scaling decision

### Recommendation

Use scaling only for the continuous summary features required by logistic regression.

- Continuous summary features: `count`, `mean`, `std`, `min`, `max`, `median`, `sum` and similar numeric features
- One-hot TOP vocabulary features: keep as binary indicators and do not scale

### Exact scaling rule

- Fit a `StandardScaler` on training data only for the continuous summary features.
- Apply the fitted scaler to test data only.
- Do not fit a scaler on the full dataset.
- Keep model-specific scaling decisions explicit:
  - Logistic Regression: recommended to use `StandardScaler`
  - Random Forest: no scaling required; tree splits are invariant to monotonic scaling
  - XGBoost: no scaling required for normal use; scaling is not necessary and may add unnecessary pipeline complexity

### Why this is fair and practical

- Logistic Regression depends on feature scale for stable optimization.
- Random Forest and XGBoost do not need scaling to be competitive on these numeric features.
- This allows the final preprocessing pipeline to support all three candidate models without unnecessarily forcing a tree-model scale.

### Implementation note

The final pipeline should expose a model-specific switch:

- `use_scaler = True` for logistic regression
- `use_scaler = False` for Random Forest/XGBoost

The scaler should be fit only on training data and frozen before test transformation.

## 5) Missing and invalid-value strategy

### Actual inspected state of the selected dataset

For all selected Mini Project files in the approved split:

- no `null` values
- no `NaN` values
- no `Inf` values
- no empty arrays
- no negative numeric values in the value arrays inspected
- no malformed entries

### Final strategy

For the Mini Project baseline:

- Do not impute anything.
- Perform validation during preprocessing.
- If a malformed series appears in future data, fail the file with a clear validation error rather than silently inventing a value.

### Fallback rule for future datasets

If future data introduces missing numeric values under a new source variant, the fallback method should be:

- median imputation fitted on training data only
- applied only to continuous summary features
- not applied to binary TOP vocabulary indicators

This preserves the no-leakage rule and matches the approved behavior for learned preprocessing.

## 6) Final feature schema

The final transformed row should contain the following groups:

1. `TIME_DELTA` summary features (6)
2. `STAT/CS` summary features (18)
3. `STAT/GS` summary features (18)
4. `TOP/CS` summary features (12)
5. `TOP/GS` summary features (12)
6. `TOP/CS` learned vocabulary indicators (training-only; size depends on the training vocabulary, up to `K = 20` per metric group)
7. `TOP/GS` learned vocabulary indicators (training-only; size depends on the training vocabulary, up to `K = 20` per metric group)
8. `label`

### Exact symbolic schema

```text
feature_1  = time_delta_count
feature_2  = time_delta_mean
feature_3  = time_delta_std
feature_4  = time_delta_min
feature_5  = time_delta_max
feature_6  = time_delta_median

feature_7  = stat_cs_branch_count
feature_8  = stat_cs_branch_mean
feature_9  = stat_cs_branch_std
feature_10 = stat_cs_branch_min
feature_11 = stat_cs_branch_max
feature_12 = stat_cs_branch_median
feature_13 = stat_cs_cycles_count
feature_14 = stat_cs_cycles_mean
feature_15 = stat_cs_cycles_std
feature_16 = stat_cs_cycles_min
feature_17 = stat_cs_cycles_max
feature_18 = stat_cs_cycles_median
feature_19 = stat_cs_instructions_count
feature_20 = stat_cs_instructions_mean
feature_21 = stat_cs_instructions_std
feature_22 = stat_cs_instructions_min
feature_23 = stat_cs_instructions_max
feature_24 = stat_cs_instructions_median

feature_25 = stat_gs_branch_count
feature_26 = stat_gs_branch_mean
feature_27 = stat_gs_branch_std
feature_28 = stat_gs_branch_min
feature_29 = stat_gs_branch_max
feature_30 = stat_gs_branch_median
feature_31 = stat_gs_cycles_count
feature_32 = stat_gs_cycles_mean
feature_33 = stat_gs_cycles_std
feature_34 = stat_gs_cycles_min
feature_35 = stat_gs_cycles_max
feature_36 = stat_gs_cycles_median
feature_37 = stat_gs_instructions_count
feature_38 = stat_gs_instructions_mean
feature_39 = stat_gs_instructions_std
feature_40 = stat_gs_instructions_min
feature_41 = stat_gs_instructions_max
feature_42 = stat_gs_instructions_median

feature_43 = top_cs_branch_count
feature_44 = top_cs_branch_mean
feature_45 = top_cs_branch_max
feature_46 = top_cs_branch_sum
feature_47 = top_cs_cycles_count
feature_48 = top_cs_cycles_mean
feature_49 = top_cs_cycles_max
feature_50 = top_cs_cycles_sum
feature_51 = top_cs_instructions_count
feature_52 = top_cs_instructions_mean
feature_53 = top_cs_instructions_max
feature_54 = top_cs_instructions_sum

feature_55 = top_gs_branch_count
feature_56 = top_gs_branch_mean
feature_57 = top_gs_branch_max
feature_58 = top_gs_branch_sum
feature_59 = top_gs_cycles_count
feature_60 = top_gs_cycles_mean
feature_61 = top_gs_cycles_max
feature_62 = top_gs_cycles_sum
feature_63 = top_gs_instructions_count
feature_64 = top_gs_instructions_mean
feature_65 = top_gs_instructions_max
feature_66 = top_gs_instructions_sum

feature_67... = top_cs_branch_vocab_1 ... top_cs_branch_vocab_V1
feature_... = top_cs_cycles_vocab_1 ... top_cs_cycles_vocab_V2
feature_... = top_cs_instructions_vocab_1 ... top_cs_instructions_vocab_V3
feature_... = top_gs_branch_vocab_1 ... top_gs_branch_vocab_V4
feature_... = top_gs_cycles_vocab_1 ... top_gs_cycles_vocab_V5
feature_... = top_gs_instructions_vocab_1 ... top_gs_instructions_vocab_V6

label = 0 | 1
```

Where each `Vx` is the vocabulary size learned from the training split for that family/metric, capped at `K = 20` per training-only vocabulary. A final `other` indicator is included for any unseen symbol, one per vocabulary group, and the vocabulary features remain binary indicators.

### Metadata fields

The following are preserved as metadata and not used as predictors:

- `condition_directory`
- `source_file`
- `attack_scenario`
- `random_targeting`
- `gaussian_setting`
- `CS_ID` / `GS_ID`
- `kernel_symbol` (used only during TOP vocabulary construction, not as a raw predictor column)
- `label` is the target, not a predictor

## 7) Leakage-prevention rules

The following rules are mandatory:

1. Split the data by condition directory before any learned preprocessing is fit.
2. Fit the TOP vocabulary only on training conditions.
3. Fit the scaler only on training continuous features.
4. Do not compute summaries across train + test data.
5. Do not use metadata fields as predictors.
6. Do not re-learn the vocabulary or scaler after test data are loaded.
7. Freeze all learned preprocessing objects and apply them to the test set.
8. Preserve provenance metadata for traceability and auditability.

## 8) Expected feature count

The exact total feature count is not fixed before training because the vocabulary size is learned from the training data.

The reproducible method is:

```text
N = 6
  + 18                    # STAT/CS
  + 18                    # STAT/GS
  + 12                    # TOP/CS summary stats
  + 12                    # TOP/GS summary stats
  + V_cs_branch + V_cs_cycles + V_cs_instructions
  + V_gs_branch + V_gs_cycles + V_gs_instructions
  + O                     # one other indicator per learned vocab group
```

Where:

- `V_*` is the learned vocabulary size for that TOP family/metric in training, capped at `K = 20`
- `O` is the explicit `other` bucket or indicator per TOP vocabulary group

This means the final feature count is dynamic but completely reproducible and fit-time determined.

## 9) Example transformed ML row

The following is a symbolic example of the transformed row structure, not a literal dataset value:

```text
[
  0.182, 0.154, 0.085, 0.012, 0.493, 0.167,   # TIME_DELTA

  12.0, 0.91, 0.18, 0.13, 1.26, 0.87,       # STAT/CS branch
  19.0, 1.48, 0.27, 0.22, 2.39, 1.41,       # STAT/CS cycles
  21.0, 1.90, 0.31, 0.26, 2.90, 1.82,       # STAT/CS instructions

  9.0, 0.77, 0.12, 0.09, 1.05, 0.71,        # STAT/GS branch
  16.0, 1.33, 0.22, 0.16, 2.12, 1.26,       # STAT/GS cycles
  20.0, 1.82, 0.29, 0.20, 2.77, 1.67,       # STAT/GS instructions

  4.0, 2.34, 3.81, 18.5,                     # TOP/CS branch summary
  5.0, 2.91, 4.36, 22.7,                     # TOP/CS cycles summary
  6.0, 3.04, 4.72, 25.2,                     # TOP/CS instructions summary

  4.0, 2.21, 3.58, 17.6,                     # TOP/GS branch summary
  5.0, 2.76, 4.14, 21.1,                     # TOP/GS cycles summary
  6.0, 2.96, 4.41, 24.7,                     # TOP/GS instructions summary

  0, 0, 1, 0, ..., 0,                       # TOP symbol indicators learned from training
  1, 0, 0, ..., 0,                           # other / vocabulary membership indicators

  1                                         # label: attack = 1
]
```

This is an example structure only. The actual values are not generated here and will be produced only after the approved preprocessing implementation is created.

## Final approval summary

This design resolves the remaining preprocessing decisions:

- `TIME_DELTA` final representation: count + mean + std + min + max + median
- `STAT` final representation: count + mean + std + min + max + median per metric
- `TOP` final representation: count + mean + max + sum + training-only K=20 vocabulary per metric group
- Scaling: StandardScaler only for continuous summary features in logistic regression; no scaling required for tree-based models
- Missing values: none in the selected subset; validation and fail-fast on malformed data; median imputation only as a future fallback if required by new data
- Final schema: fixed-width numeric feature row plus label, with metadata preserved separately and not used as predictors

This is the approved design gate for implementation. No preprocessing code will be written until the design is explicitly approved.
