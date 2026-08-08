# EVShield Mini Project — Train/Test Split Strategy

## Decision summary

Use a **condition-directory group holdout**. A condition directory is the complete verified combination of attack scenario, random-targeting setting, and Gaussian setting. For the approved Mini Project subset, it is the strongest complete grouping available in the files.

Use this fixed primary split:

```text
Training condition groups
  Correct_ID/Random_CS_ON/Gaussian_Off
  Wrong_ID/Random_CS_OFF/Gaussian_Off

Test condition groups
  Correct_ID/Random_CS_OFF/Gaussian_Off
  Wrong_ID/Random_CS_ON/Gaussian_Off
```

All five selected source files and both `attack`/`normal` branches belonging to one condition directory must remain in the same partition. The Top-K vocabulary, TOP summaries, scaling, and any other learned preprocessing must be fitted using training condition groups only.

This is a plan only. No split, preprocessing, or model training has been performed.

## Partition contract (mandatory)

For each condition directory listed above:

- keep the complete directory in its assigned partition;
- keep all five selected source files together: `TIME_DELTA`, `STAT/CS`, `STAT/GS`, `TOP/CS`, and `TOP/GS`;
- keep both the `normal` and `attack` branches together; and
- keep every nested `data_point` array/value from that condition in the same partition.

The implementation must **not** randomly split individual `data_point` values, `data_point` arrays, kernel-symbol series, entities, or source files from the same condition between training and test. No training-derived artifact may be recomputed after test data are read.

## Verified grouping structure

The selected Mini Project data have exactly four complete non-Gaussian condition directories. Under the approved sample definition, one complete `data_point` array/series is one raw sample before later summarization.

| Condition directory | CS IDs present | GS IDs present | Attack series | Normal series | Total series |
|---|---|---|---:|---:|---:|
| `Correct_ID/Random_CS_OFF/Gaussian_Off` | `2-39-89-25`, `2-39-131-30` | `GS_1` | 1,190 | 582 | 1,772 |
| `Correct_ID/Random_CS_ON/Gaussian_Off` | `2-39-89-25`, `2-39-139-28`, `2-39-131-30` | `GS_1` | 1,548 | 623 | 2,171 |
| `Wrong_ID/Random_CS_OFF/Gaussian_Off` | `2-39-89-25`, `2-39-139-28`, `2-39-131-30` | `GS_1` | 1,498 | 543 | 2,041 |
| `Wrong_ID/Random_CS_ON/Gaussian_Off` | `2-39-139-28`, `2-39-131-30` | `GS_1` | 1,205 | 659 | 1,864 |

Every condition has both classes. The proposed training split has 3,046 attack and 1,166 normal raw series (4,212 total); the test split has 2,395 attack and 1,241 normal raw series (3,636 total).

These are counts of nested source series, not a claim of independent events. The later summary transformation must not change the group assignment.

## Grouping options investigated

| Grouping | Verified availability | Leakage protection | Limitation | Decision |
|---|---|---|---|---|
| Source file | 20 selected files: `TIME_DELTA`, `STAT/CS`, `STAT/GS`, `TOP/CS`, and `TOP/GS` for each condition. | Better than a scalar-level random split: it keeps all series from one file together. | The five files in one condition describe the same scenario/strategy configuration and share CS/GS context. Splitting them across partitions would still expose condition-related structure to both sets. | Too fine; do not use as the primary group. |
| Scenario | Two values: `Correct_ID` and `Wrong_ID`. | A leave-one-scenario-out experiment would test an unseen attack mechanism. | Only two groups. A primary split would train on one attack scenario and test on the other, so it would not represent the stated Mini Project target of detecting both included scenarios. | Reserve as a future robustness experiment, not the primary split. |
| CS ID | Three CS-like keys occur: `2-39-89-25`, `2-39-139-28`, and `2-39-131-30`. | Could test some CS-target generalization for CS-only data. | CS IDs recur across conditions; `GS_1` appears in all conditions and has no corresponding per-CS identifier. It cannot group the full CS+GS dataset without placing all GS data in one partition or dropping it. | Do not use as the primary group. |
| Random-targeting condition | Two values: `Random_CS_OFF` and `Random_CS_ON`. | A train-on-one/test-on-the-other experiment tests transfer across targeting strategy. | Only two groups, and one partition would never see the other targeting setting during training. It also does not separate Correct_ID from Wrong_ID condition context on its own. | Reserve as a robustness experiment, not the primary split. |
| Feature family / metric / kernel symbol | All are explicit JSON context fields. | None as a sample-independence group. | They are parts of a measurement, not independent collection runs. Splitting by them would omit whole feature types from one partition. | Never use as the split group. |
| Class branch | `attack` and `normal` are explicit branches. | None. | It is the target, so grouping by it makes a valid binary train/test evaluation impossible. | Never use as the split group. |
| Condition directory: scenario + random-targeting + Gaussian setting | Four complete groups are verified in the selected subset. | Keeps all five source files, classes, entities, metrics, and TOP series from a configuration together. Prevents a source condition from appearing in both train and test. | Only four groups are available. The result is an inter-condition estimate, not proof of broad real-world generalization. | **Primary split group.** |

## Why condition-level grouping is the appropriate available choice

1. The source files do not contain timestamps, event IDs, sequence IDs, or documented cross-family array alignment.
2. Within a condition directory, all five source families are part of the same verified scenario/strategy configuration. A file-level or scalar-level split would put closely related configuration data into both partitions.
3. Each condition contains both `attack` and `normal` branches, so condition-level holdout preserves the binary task in training and testing.
4. The diagonal 2-versus-2 allocation gives both partitions both attack scenarios and both random-targeting settings:

   | Partition | Correct_ID | Wrong_ID | Random_CS_OFF | Random_CS_ON |
   |---|---:|---:|---:|---:|
   | Train | Yes | Yes | Yes | Yes |
   | Test | Yes | Yes | Yes | Yes |

5. Both partitions contain thousands of raw series. However, TOP has many more series than STAT or TIME_DELTA, so later model construction must document how feature-family representation and class imbalance are handled. No balancing rule is decided here.

## Required split procedure when implementation is approved

1. Assign the complete four condition directories to the fixed train/test sets above.
2. Extract and summarize only training-source series to determine the training-only Top-K vocabulary (K = 20 separately for CS/branch, CS/cycles, CS/instructions, GS/branch, GS/cycles, and GS/instructions).
3. Map any test-only TOP symbol to the approved `other` representation.
4. Fit scaling, imputation, and any data-derived thresholds on training data only.
5. Apply the frozen training transformations to test data without recomputing vocabulary, scaling, or selection rules.
6. Freeze and reuse the resulting vocabulary, Top-K selections, `other` mapping, scaling parameters, imputation parameters, thresholds, feature-selection decisions, and every other data-derived preprocessing decision.
7. Preserve the following metadata for auditability: `condition_directory`, `source_file`, `attack_scenario`, `random_targeting`, `gaussian_setting`, CS ID or GS identifier where applicable, and the original nested source context (feature family, metric, class branch, and TOP kernel symbol where present). Metadata does not belong in the predictor matrix unless explicitly approved later.

## Limitations and future evaluation

- The local Mini Project subset has only four independent condition-directory groups; it has no verified run/session identifier that would support a larger independent group split.
- A reported score from the primary split should be described as performance on held-out dataset conditions, not as a universal deployment estimate.
- After the Mini Project baseline, useful robustness evaluations include leave-one-scenario-out, train-on-random-off/test-on-random-on, and the Gaussian/timestamp-manipulation scenarios reserved for the Minor Project.

No code, split files, processed data, or trained models were created.
