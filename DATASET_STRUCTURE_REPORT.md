# CICEV2023 Dataset Structure Report

## Scope and method

This report describes the files currently present in `ml/dataset` on 2026-08-08. The directory contains **123 valid JSON files** (about 21 MB), no CSV files, and no packet-capture files. The largest individual JSON file is about 1.4 MB; files were inspected one at a time, rather than loading the whole collection at once.

The official CICEV2023 documentation supplied with this project was used only to interpret the directory names. It describes `STAT`, `TOP`, and `TIME_DELTA` as Perf-derived measurements of Charging Stations (CS) and the Grid Server (GS).

## Important finding: this is not a row/column dataset

None of the available JSON measurement files is a flat table. Consequently, they have no CSV-style *row count*, *column count*, or *column names*. They instead contain nested numeric observations (`data_point` arrays). This report uses **A/N observations** to mean the number of scalar values in `data_point` arrays below the `attack` and `normal` keys. These are not interchangeable with independent ML rows; a later preprocessing step must define one observation window/record per model sample.

There are no CSV files, so there are no CSV column names or CSV dtypes to report.

## Source measurement schemas

| File family | Files | Nested structure / field names | Value dtype | Missing values | Duplicate rows | Example record |
|---|---:|---|---|---:|---|---|
| `STAT/CS/STAT*.json` | 15 | `CS_ID -> {branch, cycles, instructions} -> {attack, normal} -> data_point[]` | JSON numbers | 0 JSON `null` values | Not applicable: no rows | `2-39-89-25 > branch > attack > data_point`: `[0.1902552204176334, 0.1816849027192578, 0.17535678942653882]` |
| `STAT/GS/STAT*.json` | 16 | `GS_1 -> {branch, cycles, instructions} -> {attack, normal} -> data_point[]` | JSON numbers | 0 | Not applicable: no rows | `GS_1 > branch > normal > data_point`: `[0.19124627942827568, 0.19100269744172757, 0.19088695882860898]` |
| `TOP/CS/TOP.json` | 16 | `CS_ID -> {branch, cycles, instructions} -> {attack, normal} -> kernel_symbol -> data_point[]` | JSON numbers | 0 | Not applicable: no rows | `2-39-89-25 > branch > attack > __update_load_avg_se > data_point`: `[3.26, 2.94, 2.41]` |
| `TOP/GS/TOP*.json` or `G.json` | 16 | `GS_1 -> {branch, cycles, instructions} -> {attack, normal} -> kernel_symbol -> data_point[]` | JSON numbers | 0 | Not applicable: no rows | `GS_1 > branch > normal > dequeue_task_fair > data_point`: `[8.81, 6.08, 4.69]` |
| `TIME_DELTA/TIME_DELTA.json` | 16 | `CS_ID -> time_diff -> {attack, normal} -> data_point[]` | JSON numbers | 0 | Not applicable: no rows | `2-39-89-25 > time_diff > attack > data_point`: `[0.021532, 0.040581, 0.059613]` |

All **79** source measurement files contain both explicit target keys, `attack` and `normal`. Thus, there is **no single label column**. Normal and attack observations are already stored together in every source file, but a future preprocessing step must flatten them and create a target column from the enclosing key (for example, `label=0` for normal and `label=1` for attack, if that convention is chosen later).

## Feature dictionary for EVShield

The definitions in this section come from the supplied official CICEV2023 documentation's **Feature description** section and are checked against the keys actually present in the local JSON files. The local source files use the keys `time_diff`, `branch`, `cycles`, and `instructions`; the documentation uses the human-readable feature names below. A value is treated as a JSON number because that is what the files contain. A physical unit is not stated in either the inspected JSON or the supplied documentation unless noted otherwise.

| Feature name | Meaning | Data type | Example value actually observed | Unit, if known | Source/file | Why it may be useful for DDoS detection |
|---|---|---|---|---|---|---|
| Time delta (`time_diff`) | Interval between the immediately preceding and subsequent authentications. | JSON number in `data_point[]` | `0.021532` | Not determined from dataset | `TIME_DELTA/TIME_DELTA.json`; e.g. `Correct_ID/Random_CS_OFF/Gaussian_Off/TIME_DELTA/TIME_DELTA.json` at `CS_ID -> time_diff -> attack/normal -> data_point[]` | DDoS traffic changes the cadence of authentication attempts; this feature directly represents authentication timing. |
| Instruction overhead (`instructions` in `TOP`) | Overhead information about Linux-kernel libraries and code symbols, based on the number of instructions used by the profiling target (CS or GS). | JSON number in `data_point[]`, grouped by kernel symbol | `3.26` | Not determined from dataset | `TOP/CS/TOP.json` and `TOP/GS/TOP*.json`; e.g. `.../TOP/CS/TOP.json` at `CS_ID -> instructions -> attack/normal -> kernel_symbol -> data_point[]` | Attack processing can change which code symbols execute and their instruction-related overhead. |
| CPU cycle overhead (`cycles` in `TOP`) | Overhead information about Linux-kernel libraries and code symbols, based on cycles used by the profiling target. | JSON number in `data_point[]`, grouped by kernel symbol | `4.97` at `2-39-89-25 -> cycles -> attack -> dequeue_task_fair -> data_point[]` | Not determined from dataset | `TOP/CS/TOP.json` and `TOP/GS/TOP*.json`, under `cycles` | Attack processing can change CPU-cycle overhead and the symbols responsible for it. |
| Branch overhead (`branch` in `TOP`) | Overhead information about Linux-kernel libraries and code symbols, based on the number of branch instructions used by the profiling target. | JSON number in `data_point[]`, grouped by kernel symbol | `3.26` at `2-39-89-25 -> branch -> attack -> __update_load_avg_se -> data_point[]` | Not determined from dataset | `TOP/CS/TOP.json` and `TOP/GS/TOP*.json`, under `branch` | Attack load can alter branch-instruction overhead and its kernel-symbol distribution. |
| Cycles (`cycles` in `STAT`) | Number of cycles consumed by the profiling target. | JSON number in `data_point[]` | `0.00005644440124416796` at `2-39-89-25 -> cycles -> attack -> data_point[]` | Not determined from dataset | `STAT/CS/STAT*.json` and `STAT/GS/STAT*.json`, under `cycles` | Elevated or altered resource consumption can distinguish attack activity from normal authentication activity. |
| Instructions (`instructions` in `STAT`) | Number of instructions used by the profiling target. | JSON number in `data_point[]` | `0.23453762700189426` at `2-39-89-25 -> instructions -> attack -> data_point[]` | Not determined from dataset | `STAT/CS/STAT*.json` and `STAT/GS/STAT*.json`, under `instructions` | Authentication floods may change overall instruction consumption at CS or GS. |
| Branches (`branch` in `STAT`) | Number of branch commands executed by the profiling target. | JSON number in `data_point[]` | `0.1902552204176334` at `2-39-89-25 -> branch -> attack -> data_point[]` | Not determined from dataset | `STAT/CS/STAT*.json` and `STAT/GS/STAT*.json`, under `branch` | A change in overall executed branches may reflect the different processing workload of attack traffic. |

### How the feature families differ

- **Overhead features** are the `TOP` measurements. They are organized by Linux-kernel/library **symbol**, so they identify where overhead occurs. They exist separately for branch, cycle, and instruction measurements.
- **Total resource-consumption features** are the `STAT` measurements. The documentation defines them as total consumed cycles, instructions, and branches at the CS or GS profiling target. Unlike `TOP`, the observed `STAT` schema has no kernel-symbol level beneath the metric.
- **Authentication timing features** are the `TIME_DELTA` measurements. They record the interval between consecutive authentication events at a CS and have the observed `time_diff` key rather than branch/cycle/instruction metrics.

The documentation identifies the Perf-derived quantities but does not state the scale or unit used for the JSON values. In particular, decimal values are observed in all three file families, so interpreting them as raw hardware-counter totals would go beyond the available evidence.

## Per-file source-data inventory

Each row below is a complete experiment-condition directory. The values in cells are `attack / normal` scalar observations. The cell heading identifies the exact file location relative to the condition directory; the filename variants in parentheses were verified in the filesystem.

| Scenario / condition path | `STAT/CS/STAT*.json` | `STAT/GS/STAT*.json` | `TIME_DELTA/TIME_DELTA.json` | `TOP/CS/TOP.json` | `TOP/GS/TOP*.json` |
|---|---:|---:|---:|---:|---:|
| `Correct_ID/Random_CS_OFF/Gaussian_Off` | 12,297 / 12,414 | 6,168 / 4,431 | 4,462 / 464 | 17,503 / 5,905 | 13,647 / 13,231 |
| `Correct_ID/Random_CS_OFF/Gaussian_On` | 1,560 / 2,817 | 717 / 1,263 | 573 / 575 | 0 / 1,938 | 1,089 / 2,673 |
| `Correct_ID/Random_CS_ON/Gaussian_Off` | 33,795 / 32,706 | 11,226 / 7,401 | 6,788 / 791 | 47,559 / 5,429 | 24,126 / 22,943 |
| `Correct_ID/Random_CS_ON/Gaussian_On` | 2,418 / 4,197 | 7,401 / 1,272 | 817 / 791 | 54 / 1,192 | 22,943 / 2,997 |
| `Wrong_CS_TS/Random_CS_Off/Gaussian_Off` | 33,819 / 32,691 (`STAT (1).json`) | 11,196 / 7,443 | 6,788 / 791 | 50,474 / 811 | 24,009 / 22,242 (`TOP (1).json`) |
| `Wrong_CS_TS/Random_CS_Off/Gaussian_On` | 2,349 / 4,008 | 735 / 1,242 (`STAT (1).json`) | 817 / 791 | 513 / 1,391 | 1,169 / 2,931 (`TOP (1).json`) |
| `Wrong_CS_TS/Random_CS_On/Gaussian_Off` | 11,967 / 12,021 | 5,973 / 4,329 (`STAT (1).json`) | 4,462 / 464 | 19,435 / 6,375 | 12,933 / 12,740 (`G.json`) |
| `Wrong_CS_TS/Random_CS_On/Gaussian_On` | 2,223 / 3,984 | 714 / 1,242 (`STAT (1).json`) | 807 / 791 | 226 / 2,351 | 1,084 / 2,675 (`TOP (1).json`) |
| `Wrong_EV_TS/Random_CS_Off/Gaussian_Off` | 31,974 / 31,080 | 5,997 / 7,041 (`STAT (1).json`) | 6,788 / 791 | 47,572 / 12,874 | 20,979 / 21,438 (`TOP (1).json`) |
| `Wrong_EV_TS/Random_CS_Off/Gaussian_On` | 2,379 / 4,080 | 741 / 1,263 (`STAT (1).json`) | 817 / 791 | 43 / 1,803 | 1,166 / 2,782 (`TOP (1).json`) |
| `Wrong_EV_TS/Random_CS_On/Gaussian_Off` | 5,502 / 5,463 | 3,324 / 4,191 (`STAT (1).json`) | 2,215 / 216 | 10,696 / 7,486 | 10,999 / 11,815 |
| `Wrong_EV_TS/Random_CS_On/Gaussian_On` | **Absent** | 714 / 1,242 (`STAT (1).json`) | 798 / 791 | 226 / 2,351 | 1,084 / 2,675 (`TOP (1).json`) |
| `Wrong_ID/Random_CS_OFF/Gaussian_Off` | 33,738 / 32,721 | 11,214 / 7,668 | 6,788 / 791 | 47,486 / 578 | 23,830 / 22,774 |
| `Wrong_ID/Random_CS_OFF/Gaussian_On` | 2,328 / 4,215 | 738 / 1,371 | 817 / 791 | 463 / 2,470 | 1,014 / 2,970 |
| `Wrong_ID/Random_CS_ON/Gaussian_Off` | 12,906 / 13,281 | 6,381 / 4,662 | 4,573 / 575 | 19,911 / 10,491 | 13,965 / 13,819 |
| `Wrong_ID/Random_CS_ON/Gaussian_On` | 2,418 / 4,197 | 7,401 / 1,272 | 817 / 791 | 54 / 1,192 | 22,943 / 2,997 |

The table represents all source measurement files: 16 conditions × five expected file types, minus the absent `Wrong_EV_TS/Random_CS_On/Gaussian_On/STAT/CS/STAT.json` file.

## Processed datasets and metadata

Four files are explicitly named `final_dataset.json`; they are nested processed/feature-selection outputs, not flat training tables. Their root fields are `branch`, `cycles`, and `instructions`; each contains `common`, `exclusive`, and `all` feature-combination groups, and each selected combination retains `attack` and `normal` data plus `combined_sampling_resolution`.

| Filename and path | Attack observations | Normal observations | Null values | Example |
|---|---:|---:|---:|---|
| `final_dataset.json` — `Wrong_CS_TS/Random_CS_Off/Gaussian_On/TOP/CS/` | 5,499 | 6,003 | 0 | `branch > common > ['psi_group_change'] > attack`: `[7.33, 12.69, 15.45]` |
| `final_dataset.json` — `Wrong_CS_TS/Random_CS_Off/Gaussian_On/TOP/GS/` | 7,806 | 15,619 | 0 | `branch > common > ['psi_group_change'] > normal`: `[21.71, 25.16, 20.95]` |
| `final_dataset.json` — `Wrong_ID/Random_CS_OFF/Gaussian_On/TOP/CS/` | 12,531 | 14,919 | 0 | `branch > common > ['psi_group_change'] > attack`: `[8.06, 7.55, 5.1]` |
| `final_dataset.json` — `Wrong_ID/Random_CS_OFF/Gaussian_On/TOP/GS/` | 8,665 | 15,813 | 0 | `branch > common > ['psi_group_change'] > normal`: `[12.47, 12.47, 12.47]` |

The remaining **40 JSON files** are feature-selection or analysis artifacts named `basis_symbol`, `feature_combination`, `full_feature_information`, `unique_intersection`, `sam_res_diff_and_mean`, `elbow_point_information`, `kernel_record`, `ratio_information`, `cs_avg_elbow_point`, `cs_avg_overhead`, `cs_record_size`, and `gs_record_size`. They do not provide a consistent row-based ML schema and should be treated as supporting metadata rather than directly concatenated with source observations.

## Data quality and labeling conclusion

- Every JSON file in `ml/dataset` parsed successfully.
- The 79 source data files have only numeric `data_point` values and no JSON `null` values. For a nested JSON collection, absence of a field cannot be measured as a conventional per-column missing-value rate.
- Duplicate **rows** cannot be calculated because the source is not row-based. This report deliberately does not call repeated scalar values duplicate records.
- The local collection already contains both normal and attack data, but only as nested branches. A model-ready dataset does **not** yet exist; it will need a documented flattening/windowing process and an explicit target column.
- `Wrong_EV_TS/Random_CS_On/Gaussian_On` has no `STAT/CS` file, so later preprocessing must account for this incomplete modality rather than assuming every condition has every source type.

No dataset files were modified during this inspection.
