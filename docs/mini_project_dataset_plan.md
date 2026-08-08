# EVShield Mini Project — Dataset Pipeline Plan

## Purpose and scope

This is a plan only. It does not create processed data, alter CICEV2023 files, or train a model.

The Mini Project is limited to binary classification (`normal` versus `attack`) using the verified non-Gaussian `Correct_ID` and `Wrong_ID` CICEV2023 conditions. `Wrong_EV_TS`, `Wrong_CS_TS`, and every `Gaussian_On` condition are reserved for a later Minor Project.

```text
CICEV2023 source files
        ↓
File selection
        ↓
Normal/Attack labeling
        ↓
Feature selection
        ↓
Data cleaning
        ↓
Train/test split
        ↓
ML dataset
```

## 1. CICEV2023 source files

**Input**

The local CICEV2023 JSON collection at `ml/dataset/`. Its useful source families are:

- `TIME_DELTA/TIME_DELTA.json`: `time_diff` numeric arrays.
- `STAT/CS/STAT.json` and `STAT/GS/STAT.json`: `branch`, `cycles`, and `instructions` numeric arrays.
- `TOP/CS/TOP.json` and `TOP/GS/TOP.json`: `branch`, `cycles`, and `instructions` numeric arrays grouped by Linux kernel symbol.

Each source file contains nested `normal` and `attack` branches. They are not flat rows, and the documentation does not establish direct index-by-index alignment between the three families.

**Processing**

Read one JSON file at a time. Preserve its relative source path and its nested context: scenario, random-targeting setting, Gaussian setting, profiling target, entity ID, metric, class branch, and—only for `TOP`—kernel symbol.

**Output**

A traceable raw-observation staging representation. Each scalar observation is linked to its original source file and context.

**Why this is necessary**

The source data are nested JSON, not a model-ready table. Keeping source context makes preprocessing reproducible and prevents accidental mixing of incompatible measurements.

## 2. File selection

**Input**

All JSON files under `ml/dataset/`.

**Processing**

Select only these 20 verified measurement files:

```text
Correct_ID/Random_CS_OFF/Gaussian_Off/{STAT/CS/STAT.json, STAT/GS/STAT.json,
  TIME_DELTA/TIME_DELTA.json, TOP/CS/TOP.json, TOP/GS/TOP.json}
Correct_ID/Random_CS_ON/Gaussian_Off/{STAT/CS/STAT.json, STAT/GS/STAT.json,
  TIME_DELTA/TIME_DELTA.json, TOP/CS/TOP.json, TOP/GS/TOP.json}
Wrong_ID/Random_CS_OFF/Gaussian_Off/{STAT/CS/STAT.json, STAT/GS/STAT.json,
  TIME_DELTA/TIME_DELTA.json, TOP/CS/TOP.json, TOP/GS/TOP.json}
Wrong_ID/Random_CS_ON/Gaussian_Off/{STAT/CS/STAT.json, STAT/GS/STAT.json,
  TIME_DELTA/TIME_DELTA.json, TOP/CS/TOP.json, TOP/GS/TOP.json}
```

Exclude `Wrong_EV_TS`, `Wrong_CS_TS`, every `Gaussian_On` directory, and processed-analysis artifacts such as `final_dataset.json`, `feature_combination.json`, and `basis_symbol.json`.

**Output**

The fixed Mini Project source manifest: 20 files, covering Correct_ID and Wrong_ID attacks under both available random-targeting settings, without Gaussian attacks.

**Why this is necessary**

It keeps the Mini Project binary and manageable while retaining two verified attack mechanisms and both available non-Gaussian targeting settings.

## 3. Normal/Attack labeling

**Input**

The `normal` and `attack` branches inside each selected JSON file.

**Processing**

When flattening an observation:

- assign `label = 0` and `class_name = normal` to a value below the `normal` branch;
- assign `label = 1` and `class_name = attack` to a value below the `attack` branch.

Retain `attack_scenario` (`Correct_ID` or `Wrong_ID`) and `random_targeting` (`off` or `on`) as metadata only. Do not include them as predictor columns.

**Output**

A binary-labelled staging dataset with source and scenario provenance.

**Why this is necessary**

The dataset has no label column. The class exists only as the enclosing JSON key, so it must be made explicit during preprocessing.

## 4. Feature selection

**Input**

The labelled raw-observation staging dataset.

**Processing**

Use the verified feature families:

- authentication timing: `time_diff`;
- CS total resource consumption: `branch`, `cycles`, `instructions` from `STAT/CS`;
- GS total resource consumption: `branch`, `cycles`, `instructions` from `STAT/GS`;
- CS overhead: `branch`, `cycles`, `instructions` from `TOP/CS`, keyed by kernel symbol;
- GS overhead: `branch`, `cycles`, `instructions` from `TOP/GS`, keyed by kernel symbol.

`CS_ID`, `GS_1`, source path, scenario name, class name, and labels are not predictors. `TOP` kernel symbols are feature identities, not raw identifier columns; a fixed representation must be defined later (for example, an approved aggregation or a vocabulary learned from training data only).

The schema can be specified before splitting, but any data-derived selection—such as choosing TOP symbols by frequency or score—must be fitted on training data only after the split.

**Output**

A documented candidate feature specification, including an explicit rule for representing the variable TOP symbol dimension.

**Why this is necessary**

The files contain different metric families and a variable set of kernel symbols. A fixed feature definition is needed before any classifier can consume the data, and training-only selection prevents test-set leakage.

## 5. Data cleaning

**Input**

Labelled observations and the approved candidate feature specification.

**Processing**

- Validate JSON numeric observations and remove or flag non-finite values if any are encountered.
- Check missingness after flattening. The inspected source files contain no JSON `null` values, but absence must still be measured in the produced table.
- Preserve the distinction between unavailable data and a numeric zero; do not impute values by assumption.
- Check duplicate *processed records* after the record/window definition exists. Do not call repeated scalar values duplicate rows.
- Apply any scaling/normalization only after the train/test split, fitting its parameters on training data.
- Do not align `TIME_DELTA`, `STAT`, and `TOP` values by array index unless a verified alignment rule is established. Their arrays differ in length and source schema.

**Output**

A validated, consistently typed staging dataset and a documented cleaning log.

**Why this is necessary**

Cleaning ensures that model inputs are valid without inventing relationships or units that are not supported by the dataset.

## 6. Train/test split

**Input**

Cleaned, labelled records/windows, with source-file and condition metadata retained.

**Processing**

Define the final independent sample unit before splitting. Split by a group that keeps observations from the same source run/file/condition together, rather than randomly splitting adjacent values from one `data_point` array into both sets. Stratify the binary label where the chosen grouping permits it.

Fit all learned preprocessing steps—scaling, TOP-symbol vocabulary/selection, imputers, and any aggregation thresholds—on training data only, then apply them unchanged to test data.

**Output**

Training and test partitions, plus saved split identifiers and preprocessing configuration.

**Why this is necessary**

The nested arrays contain related sequential values. Group-aware splitting reduces leakage and makes the reported attack-detection result more credible.

## 7. ML dataset

**Input**

The cleaned and split staging data plus an approved, reproducible record/window and TOP-symbol representation rule.

**Processing**

Transform each defined sample/window into a fixed-width numeric feature row. Include only approved numeric timing, STAT, and TOP-derived features. Keep `label` as the target. Preserve provenance fields in a companion metadata table, not in the feature matrix.

**Output**

Two model-ready datasets:

```text
X_train, y_train
X_test,  y_test
```

with companion metadata such as `source_file`, `attack_scenario`, `random_targeting`, feature family, and entity ID.

The exact final feature-column list is intentionally pending because the dataset does not verify a cross-family observation alignment or a fixed TOP-symbol vocabulary.

**Why this is necessary**

Machine-learning models need fixed-width numeric input, while CICEV2023 provides nested, heterogeneous observation arrays. This final transformation bridges those structures without changing the original dataset.

## Approval gate

Before implementation, approval is required for:

1. the independent sample/window definition;
2. the TOP kernel-symbol representation;
3. the group used for the train/test split; and
4. the resulting fixed-width ML schema.

Until then, this document remains a plan only.
