# EVShield Mini Project — Data Dictionary

## Scope

This dictionary covers only the verified CICEV2023 subset selected for the EVShield Mini Project:

- Binary classes: `normal` and `attack`.
- Attack scenarios: `Correct_ID` and `Wrong_ID`.
- Attack-strategy conditions: `Gaussian_Off` only, with both available random-targeting settings (`Random_CS_OFF` and `Random_CS_ON`).

The source data are nested JSON documents, not a flat table. Fields below describe the values that will be extracted during a later, approved preprocessing step. No model-ready dataset exists yet.

## Feature dictionary

| Feature name | Description | Data type | Source | Example | Role in the ML pipeline | Preprocessing required? |
|---|---|---|---|---|---|---|
| `time_delta` (stored as `time_diff`) | Interval between the immediately preceding and subsequent authentication events. | JSON number; observed decimal values | `TIME_DELTA/TIME_DELTA.json` at `CS_ID -> time_diff -> attack/normal -> data_point[]` | `0.021532` | Authentication-timing signal; candidate numeric predictor. | **Yes.** Extract values from nested arrays; create the target from the enclosing class branch. Unit and alignment with other families are not determined from the dataset. |
| `cs_stat_branch` (stored as `branch`) | Number of branch commands executed by the CS profiling target. | JSON number; observed decimal values | `STAT/CS/STAT.json` at `CS_ID -> branch -> attack/normal -> data_point[]` | `0.1902552204176334` | CS total-resource-consumption signal. | **Yes.** Flatten nested arrays and define observation windows/alignment before combining with other features. |
| `cs_stat_cycles` (stored as `cycles`) | Number of cycles consumed by the CS profiling target. | JSON number; observed decimal values | `STAT/CS/STAT.json` at `CS_ID -> cycles -> attack/normal -> data_point[]` | `0.00005644440124416796` | CS total-resource-consumption signal. | **Yes.** Flatten nested arrays and define observation windows/alignment before combining with other features. |
| `cs_stat_instructions` (stored as `instructions`) | Number of instructions used by the CS profiling target. | JSON number; observed decimal values | `STAT/CS/STAT.json` at `CS_ID -> instructions -> attack/normal -> data_point[]` | `0.23453762700189426` | CS total-resource-consumption signal. | **Yes.** Flatten nested arrays and define observation windows/alignment before combining with other features. |
| `gs_stat_branch` (stored as `branch`) | Number of branch commands executed by the GS profiling target. | JSON number; observed decimal values | `STAT/GS/STAT.json` at `GS_1 -> branch -> attack/normal -> data_point[]` | `0.18914202765121696` | GS total-resource-consumption signal. | **Yes.** Flatten nested arrays and define observation windows/alignment before combining with other features. |
| `gs_stat_cycles` (stored as `cycles`) | Number of cycles consumed by the GS profiling target. | JSON number; observed decimal values | `STAT/GS/STAT.json` at `GS_1 -> cycles -> attack/normal -> data_point[]` | `0.003618175092936803` | GS total-resource-consumption signal. | **Yes.** Flatten nested arrays and define observation windows/alignment before combining with other features. |
| `gs_stat_instructions` (stored as `instructions`) | Number of instructions used by the GS profiling target. | JSON number; observed decimal values | `STAT/GS/STAT.json` at `GS_1 -> instructions -> attack/normal -> data_point[]` | `1.0664361698903235` | GS total-resource-consumption signal. | **Yes.** Flatten nested arrays and define observation windows/alignment before combining with other features. |
| `cs_top_branch_overhead` (stored as `branch`) | Linux-kernel/library-symbol overhead information based on branch instructions used by the CS profiling target. | JSON number; observed decimal values, grouped by kernel symbol | `TOP/CS/TOP.json` at `CS_ID -> branch -> attack/normal -> kernel_symbol -> data_point[]` | `3.26` for `__update_load_avg_se` | Fine-grained CS overhead signal. | **Yes.** Flatten arrays and convert/aggregate the varying kernel-symbol dimension into a fixed feature schema. |
| `cs_top_cycle_overhead` (stored as `cycles`) | Linux-kernel/library-symbol overhead information based on cycles used by the CS profiling target. | JSON number; observed decimal values, grouped by kernel symbol | `TOP/CS/TOP.json` at `CS_ID -> cycles -> attack/normal -> kernel_symbol -> data_point[]` | `4.97` for `dequeue_task_fair` | Fine-grained CS overhead signal. | **Yes.** Flatten arrays and convert/aggregate the varying kernel-symbol dimension into a fixed feature schema. |
| `cs_top_instruction_overhead` (stored as `instructions`) | Linux-kernel/library-symbol overhead information based on instructions used by the CS profiling target. | JSON number; observed decimal values, grouped by kernel symbol | `TOP/CS/TOP.json` at `CS_ID -> instructions -> attack/normal -> kernel_symbol -> data_point[]` | `2.55` for `dequeue_task_fair` | Fine-grained CS overhead signal. | **Yes.** Flatten arrays and convert/aggregate the varying kernel-symbol dimension into a fixed feature schema. |
| `gs_top_branch_overhead` (stored as `branch`) | Linux-kernel/library-symbol overhead information based on branch instructions used by the GS profiling target. | JSON number; observed decimal values, grouped by kernel symbol | `TOP/GS/TOP.json` at `GS_1 -> branch -> attack/normal -> kernel_symbol -> data_point[]` | `2.76` for `enqueue_hrtimer` | Fine-grained GS overhead signal. | **Yes.** Flatten arrays and convert/aggregate the varying kernel-symbol dimension into a fixed feature schema. |
| `gs_top_cycle_overhead` (stored as `cycles`) | Linux-kernel/library-symbol overhead information based on cycles used by the GS profiling target. | JSON number; observed decimal values, grouped by kernel symbol | `TOP/GS/TOP.json` at `GS_1 -> cycles -> attack/normal -> kernel_symbol -> data_point[]` | `1.4` for `dequeue_task_fair` | Fine-grained GS overhead signal. | **Yes.** Flatten arrays and convert/aggregate the varying kernel-symbol dimension into a fixed feature schema. |
| `gs_top_instruction_overhead` (stored as `instructions`) | Linux-kernel/library-symbol overhead information based on instructions used by the GS profiling target. | JSON number; observed decimal values, grouped by kernel symbol | `TOP/GS/TOP.json` at `GS_1 -> instructions -> attack/normal -> kernel_symbol -> data_point[]` | `2.44` for `dequeue_task_fair` | Fine-grained GS overhead signal. | **Yes.** Flatten arrays and convert/aggregate the varying kernel-symbol dimension into a fixed feature schema. |

The official documentation describes these as Perf-derived measurements. It does not state a physical unit or scaling for the JSON values; no unit is asserted here.

## Target and classes

| Field/class | Verified representation | Planned Mini Project representation | Role |
|---|---|---|---|
| Target label | The source JSON has an enclosing `attack` or `normal` key; there is no existing label column. | Generate `label` during preprocessing: `0` for `normal`, `1` for `attack`. | Binary target; never an input feature. |
| Normal class | `normal` branch within every selected JSON file. | `label = 0`, `class_name = normal`. | Negative class. |
| Attack class | `attack` branch within every selected JSON file. | `label = 1`, `class_name = attack`. | Positive class, comprising Correct_ID and Wrong_ID attack samples. |
| `attack_scenario` | Source directory name: `Correct_ID` or `Wrong_ID`. | Preserve as metadata; do not use as a predictor. | Traceability and later per-scenario evaluation. |
| `random_targeting` | Source directory names `Random_CS_OFF` and `Random_CS_ON`. | Preserve as metadata; do not use as a predictor unless later justified. | Traceability and split/evaluation control. |
| `gaussian_strategy` | All selected files are below `Gaussian_Off`. | Preserve as metadata with value `off`; do not use as a predictor. | Scope control. |
| `CS_ID` / `GS_1` | JSON object keys identifying the profiled CS or GS. | Preserve as metadata; do not use as a predictor. | Source traceability. |
| `kernel_symbol` | JSON object key below a `TOP` metric, such as `dequeue_task_fair`. | Preserve as feature identity during TOP transformation, not as an unprocessed identifier column. | Determines which TOP overhead series a value belongs to. |

## Dataset sources and files used

All files below are relative to `ml/dataset/`. For each file, both the `normal` and `attack` branches are used.

```text
Correct_ID/Random_CS_OFF/Gaussian_Off/STAT/CS/STAT.json
Correct_ID/Random_CS_OFF/Gaussian_Off/STAT/GS/STAT.json
Correct_ID/Random_CS_OFF/Gaussian_Off/TIME_DELTA/TIME_DELTA.json
Correct_ID/Random_CS_OFF/Gaussian_Off/TOP/CS/TOP.json
Correct_ID/Random_CS_OFF/Gaussian_Off/TOP/GS/TOP.json

Correct_ID/Random_CS_ON/Gaussian_Off/STAT/CS/STAT.json
Correct_ID/Random_CS_ON/Gaussian_Off/STAT/GS/STAT.json
Correct_ID/Random_CS_ON/Gaussian_Off/TIME_DELTA/TIME_DELTA.json
Correct_ID/Random_CS_ON/Gaussian_Off/TOP/CS/TOP.json
Correct_ID/Random_CS_ON/Gaussian_Off/TOP/GS/TOP.json

Wrong_ID/Random_CS_OFF/Gaussian_Off/STAT/CS/STAT.json
Wrong_ID/Random_CS_OFF/Gaussian_Off/STAT/GS/STAT.json
Wrong_ID/Random_CS_OFF/Gaussian_Off/TIME_DELTA/TIME_DELTA.json
Wrong_ID/Random_CS_OFF/Gaussian_Off/TOP/CS/TOP.json
Wrong_ID/Random_CS_OFF/Gaussian_Off/TOP/GS/TOP.json

Wrong_ID/Random_CS_ON/Gaussian_Off/STAT/CS/STAT.json
Wrong_ID/Random_CS_ON/Gaussian_Off/STAT/GS/STAT.json
Wrong_ID/Random_CS_ON/Gaussian_Off/TIME_DELTA/TIME_DELTA.json
Wrong_ID/Random_CS_ON/Gaussian_Off/TOP/CS/TOP.json
Wrong_ID/Random_CS_ON/Gaussian_Off/TOP/GS/TOP.json
```

Excluded from this Mini Project: every `Gaussian_On` condition, all `Wrong_EV_TS` and `Wrong_CS_TS` scenarios, and the dataset's processed-analysis artifacts (including `final_dataset.json`, `feature_combination.json`, and `basis_symbol.json`).

No model has been trained and no dataset data has been created or modified.
