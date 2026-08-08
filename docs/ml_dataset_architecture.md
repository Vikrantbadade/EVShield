# EVShield Mini Project — ML Dataset Architecture

This document defines the approved dataset architecture for the Mini Project preprocessing stage.

Important constraints:

- This is a design document only.
- No preprocessing code is implemented here.
- No processed dataset is created here.
- No ML model is trained here.
- The original dataset under `ml/dataset` remains untouched.
- The approved condition-directory split remains unchanged.
- The approved sample definition remains unchanged: one complete labelled `data_point[]` series = one ML sample.
- No array-index alignment is allowed.
- No fabricated event IDs or pseudo-event keys are allowed.
- TOP vocabulary remains learned from training data only.

## 1. Final sample identity

The final ML sample is not a merged cross-family row.

The final ML sample is defined as:

```text
(condition_directory, source_family, profiling_context, entity_id, metric_or_symbol, class_label)
```

More concretely:

- `condition_directory` = one approved condition directory
- `source_family` = `TIME_DELTA`, `STAT`, or `TOP`
- `profiling_context` = `CS` or `GS` for STAT/TOP; for TIME_DELTA this may be the same entity context but is still treated as a separate family
- `entity_id` = the source entity identifier such as `2-39-89-25`
- `metric_or_symbol` =
  - for `TIME_DELTA`: `time_diff`
  - for `STAT`: `branch`, `cycles`, or `instructions`
  - for `TOP`: the kernel symbol name (for example: `dequeue_task_fair`) within a metric and profiling context
- `class_label` = `normal` or `attack`, encoded as `0` or `1`

This means:

- one raw `data_point[]` series is one sample
- one family-specific series remains one sample
- multiple families are never merged into the same sample by positional index

This is the core design rule that prevents false alignment.

## 2. Family-specific datasets

The preprocessing output must remain family-aware.

We will produce three explicit family dataset families, not one mixed classifier dataset:

1. `TIME_DELTA_dataset`
   - contains only samples from `TIME_DELTA`
   - each sample represents one `time_diff` series

2. `STAT_baseline_datasets`
   - contains six separate baseline datasets, one for each metric + profiling-context pair:
     - `STAT_CS_branch`
     - `STAT_CS_cycles`
     - `STAT_CS_instructions`
     - `STAT_GS_branch`
     - `STAT_GS_cycles`
     - `STAT_GS_instructions`
   - each sample represents one metric series under its exact source context
   - family identity and profiling context are explicit in the dataset name and metadata, not in the raw predictor vector

3. `TOP_baseline_dataset`
   - contains samples from `TOP/CS` and `TOP/GS`
   - each sample represents one kernel-symbol series under a metric, profiling context, and class
   - the baseline TOP representation intentionally does not use the `K = 20` training-only vocabulary
   - the raw symbol remains metadata only
   - this vocabulary is reserved for a future grouped TOP representation / Minor Project extension, not the Mini Project baseline

This structure allows us to evaluate each family independently and compare performance fairly.

## 3. Feature schema for each family

### 3.1 TIME_DELTA feature schema

For a raw `TIME_DELTA` sample:

- input series: one `data_point[]` array for `time_diff`
- feature representation:
  - `time_delta_count`
  - `time_delta_mean`
  - `time_delta_std`
  - `time_delta_min`
  - `time_delta_max`
  - `time_delta_median`
- label:
  - `label` = 0 for `normal`, 1 for `attack`

This family is modeled as a distribution summary of the time-difference series. The series order is not treated as a verified event chronology and is not used for cross-family alignment.

### 3.2 Final STAT representation

The final STAT design is: separate STAT datasets by metric and profiling context, not one mixed STAT matrix with all metrics together.

Recommended approach: A — separate STAT model/dataset for each metric and profiling context.

Why this is the correct final design:

- one raw STAT sample = one metric series (`branch`, `cycles`, or `instructions`) under `CS` or `GS`
- the metric identity is part of the source semantics, not a predictor feature
- mixing all six metric/context combinations into one row would require metric identity columns that are effectively metadata, which would silently leak a source label into the predictor vector if not handled carefully
- the dataset structure remains aligned with the actual source hierarchy: a sample is one series, not a whole family bundle

Therefore the final STAT family is represented as six separate model datasets:

```text
STAT_CS_branch
STAT_CS_cycles
STAT_CS_instructions
STAT_GS_branch
STAT_GS_cycles
STAT_GS_instructions
```

Each dataset uses the same fixed feature vector for one series:

- `count`
- `mean`
- `std`
- `min`
- `max`
- `median`

Example schema names:

```text
stat_cs_branch_count
stat_cs_branch_mean
stat_cs_branch_std
stat_cs_branch_min
stat_cs_branch_max
stat_cs_branch_median

stat_gs_cycles_count
stat_gs_cycles_mean
stat_gs_cycles_std
stat_gs_cycles_min
stat_gs_cycles_max
stat_gs_cycles_median
```

This yields a fixed-width numeric feature vector with exactly 6 features per STAT model/dataset.

It does not require cross-series alignment, because each row is still one raw series. It keeps the model interpretable and avoids metric-name leakage through raw predictors.

### 3.3 Final TOP representation

The final TOP baseline design is: one raw kernel-symbol series remains one sample; the sample is represented only by its numeric summary statistics, with the raw kernel symbol string kept as metadata rather than a predictor.

Baseline TOP representation (approved Mini Project):

- one kernel-symbol `data_point[]` series = one sample
- features:
  - `top_count`
  - `top_mean`
  - `top_max`
  - `top_sum`
- raw symbol name = metadata only
- no K = 20 vocabulary in the baseline model

Why this is the correct final design:

- one raw TOP sample = one kernel-symbol `data_point[]` series
- the symbol name is part of the source identity, not a model feature
- the approved Mini Project baseline intentionally does not use the `K = 20` vocabulary
- a one-hot symbol identity would explicitly use the raw kernel symbol as a predictor, which violates the approved design requirement that such identifiers should not be used as uncontrolled predictors
- a K-symbol fixed block per sample would collapse multiple kernel-symbol samples into a single row and would violate the approved sample definition by mixing separate raw series into one observation
- the Top-K vocabulary remains reserved for a future grouped TOP representation / Minor Project extension and is not part of the baseline MINI PROJECT family-aware dataset

Therefore, the baseline TOP dataset uses one row per kernel-symbol series with exactly these 4 features:

- `top_count`
- `top_mean`
- `top_max`
- `top_sum`

This is the fixed-width numeric representation for a raw TOP sample.

The rule is:

```text
TOP sample = [count, mean, max, sum] + metadata(label, condition, family, context, entity, symbol_name)
```

The raw symbol name is not used as a predictor. It remains metadata for auditability.

The `K = 20` training-only vocabulary is not used in the baseline TOP model, but it remains available for future grouped TOP feature engineering with explicit design approval.

This keeps the model fixed-width, numeric, leakage-safe, and compatible with the approved sample definition.

### 3.4 Exact family-specific model count and feature count

Final fixed-width counts:

- TIME_DELTA baseline model: 6 features
  - `count`, `mean`, `std`, `min`, `max`, `median`
- STAT baseline models: 6 features each
  - six independent datasets/models:
    - `STAT_CS_branch`
    - `STAT_CS_cycles`
    - `STAT_CS_instructions`
    - `STAT_GS_branch`
    - `STAT_GS_cycles`
    - `STAT_GS_instructions`
- TOP baseline model: 4 features per sample
  - `count`, `mean`, `max`, `sum`

Unified multi-metric matrices are intentionally not the baseline design because they would either:

- require fabricated shared sample identity across unlike series, or
- silently encode the metric name as a predictor

The architecture therefore keeps the family identity explicit and the model input fixed-width without violating the no-alignment rule.

## 4. Labels

The label encoding remains:

```text
normal = 0
attack = 1
```

For each family dataset:

- the original class branch is extracted from the source JSON
- the class label is assigned as above
- the label is stored as a numeric target column (`label`) in the final family-specific dataset

Label preservation rules:

- no class information is used as a predictor feature
- metadata fields such as condition directory or source file remain metadata only
- source metadata is preserved for auditability but is not incorporated into the feature matrix unless explicitly approved later

## 5. Train/test separation

The train/test split remains exactly the approved condition-directory group holdout:

Training conditions:

```text
Correct_ID/Random_CS_ON/Gaussian_Off
Wrong_ID/Random_CS_OFF/Gaussian_Off
```

Test conditions:

```text
Correct_ID/Random_CS_OFF/Gaussian_Off
Wrong_ID/Random_CS_ON/Gaussian_Off
```

This must be preserved independently for each family dataset.

Important rules:

- all raw samples from one condition directory stay together in the same partition
- no random row-level split is allowed within a condition
- no source file is split across train and test
- no scalar-level split of the same raw series is allowed
- all preprocessing fitted on training samples only is frozen before test data are transformed

This preserves the condition-level holdout for every family dataset without forcing cross-family row compatibility.

## 6. TOP vocabulary learning

The baseline Mini Project TOP representation intentionally does not use the `K = 20` vocabulary.

For the approved baseline dataset:

- one kernel-symbol `data_point[]` series = one sample
- features = `count`, `mean`, `max`, `sum`
- raw symbol name = metadata only

The `K = 20` training-only vocabulary is reserved for a future grouped TOP representation / Minor Project extension and is not included in the baseline TOP model.

Therefore, no vocabulary mapping is learned for the baseline TOP dataset. This avoids inventing a synthetic symbol-encoding layer for a sample definition that already uses a valid raw series as one observation.

## 7. Later evaluation of the family-specific datasets

The final architecture allows independent baseline evaluations for each measurement family.

### 7.1 TIME_DELTA baseline

- train a model on `TIME_DELTA_dataset`
- evaluate accuracy, precision, recall, F1, ROC-AUC, confusion matrix
- compare the family-specific performance against the other families

### 7.2 STAT baseline models

The STAT family is evaluated as six separate baseline models, not as one single `STAT_dataset`:

- `STAT_CS_branch`
- `STAT_CS_cycles`
- `STAT_CS_instructions`
- `STAT_GS_branch`
- `STAT_GS_cycles`
- `STAT_GS_instructions`

Each model uses the same fixed feature vector for its one metric series:

- `count`
- `mean`
- `std`
- `min`
- `max`
- `median`

Each dataset is evaluated with the same metrics and the approved condition-level train/test split.

### 7.3 TOP baseline

- train a model on `TOP_baseline_dataset`
- evaluate with the same metrics
- keep the raw kernel-symbol name only as metadata
- do not use the `K = 20` vocabulary in this baseline model

This design is consistent with the requirement that the measurements are semantically different families and should be judged independently.

## 8. Future feature-fusion experiment without violating the no-alignment rule

A future fusion experiment is possible, but it must not pretend there is verified cross-family event alignment.

The correct future design is a late fusion or stacking design, not a row-wise concatenation design.

Example future architecture:

1. Train and evaluate separate models for:
   - `TIME_DELTA_dataset`
   - `STAT_dataset`
   - `TOP_dataset`
2. Obtain family-level prediction scores or probabilities.
3. Combine the outputs using:
   - weighted averaging
   - soft voting
   - stacking with a meta-classifier
4. Keep the family identity explicit in the fusion logic.

This is allowed because the fusion happens at the prediction level, not at the raw sample level.

It does not require array-index alignment, event IDs, or fabricated event pairing.

Important prohibition:

- Do not create a single mixed dataset by concatenating `TIME_DELTA`, `STAT`, and `TOP` rows as if they were the same observation type.
- Do not infer any unknown shared event stream across families.
- Do not merge families by row position or by `data_point` array index.

## 9. Final architecture summary

The approved architecture is therefore:

- one complete labelled `data_point[]` series = one sample
- family-specific storage is explicit
- training and testing are done by condition-directory holdout
- feature extraction is done per family
- TOP vocabulary is trained only on train data
- family-level models are evaluated independently
- any late fusion is postponed until a verified fusion method is explicitly approved

This preserves integrity, avoids leakage, respects the dataset structure, and supports a reasonable scientific baseline for the Mini Project.
