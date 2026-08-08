# EVShield Mini Project — Sample-to-ML-Row Reassessment

This document reassesses the sample-to-row design after validating the current preprocessing implementation.

Important constraints:

- No code changes are made in this step.
- No changes are made to the original dataset under `ml/dataset`.
- No processed dataset is created in this step.
- No ML training is performed.
- The approved condition-directory split remains fixed.
- The approved sample definition remains valid: one complete labelled `data_point[]` series = one raw ML sample.
- The no-array-alignment rule remains mandatory.

## 1. Why the current profile-level aggregation collapsed to 4 rows

The current preprocessing implementation grouped all rows by:

- partition (`train` / `test`)
- condition directory
- class label (`normal` / `attack`)
- profiling context (`CS` / `GS`)

This created a row identity like:

```text
(split, condition_directory, class_label, profiling_context)
```

For each partition, the implementation then combined all raw series in that group into one summary row. In a two-class, two-condition design this produced:

```text
2 conditions x 2 labels = 4 rows per partition
```

That is why the current final matrix became:

- train = 4 rows
- test = 4 rows

The collapse happened because the implementation treated the entire condition-specific collection as a single profile, instead of preserving the fact that the dataset contains many independent raw series under the same condition.

This is a scientifically invalid way to define a useful ML dataset for the Mini Project because it discards nearly all of the actual series-level variation. It also does not respect the approved definition that one complete labelled `data_point[]` series is one raw ML sample.

## 2. Actual JSON evidence in the dataset

The inspected JSON confirms that the dataset is already organized as many independent labelled series:

### TIME_DELTA example

```json
{
  "2-39-89-25": {
    "time_diff": {
      "attack": {
        "data_point": [0.196492, 0.152006, 0.181079, ...]
      }
    }
  }
}
```

This is one complete labelled `time_diff` series for one entity under one condition and one class.

### STAT/CS example

```json
{
  "2-39-89-25": {
    "branch": {
      "attack": {
        "data_point": [0.190587, 0.186819, ...]
      }
    },
    "cycles": {
      "attack": {
        "data_point": [ ... ]
      }
    },
    "instructions": {
      "attack": {
        "data_point": [ ... ]
      }
    }
  }
}
```

This is one entity-class profile with three independent metric series.

### TOP/CS example

```json
{
  "2-39-89-25": {
    "branch": {
      "attack": {
        "dequeue_task_fair": {
          "data_point": [4.99, 3.88, 3.37, ...]
        },
        "___slab_alloc": {
          "data_point": [2.92, 2.66, 2.26, ...]
        }
      }
    }
  }
}
```

This shows that TOP is not a flat 1D array; it is a collection of kernel-symbol series under a metric-entity-class profile.

The key point is that these series are valid raw samples, but they are not aligned by array index across families.

## 3. Comparison of candidate sample-to-row designs

### Approach A — Each complete family-specific series becomes one ML sample

This is the most direct interpretation of the approved sample definition.

Definition:

- one raw sample = one complete labelled `data_point[]` series
- row identity = `(condition_directory, source_family, entity_id, metric_or_symbol, class_label)`
- features are derived from that exact series only
- no cross-family joining by position or array index

Approximate sample count:

- hundreds to thousands per partition, depending on the family and condition
- in the inspected subset, the raw series counts already show thousands of samples in each partition, not four

Retained information:

- preserves the full measurement distribution and summary statistics for that exact raw series
- does not require fabricated alignment

Cross-family alignment required?

- No

Leakage risk:

- Low if the condition-directory split is strictly maintained
- no row-level random split across condition groups

Compatible with condition-level train/test split?

- Yes, because the entire condition directories remain together; only the sample construction changes inside each condition

Advantages:

- scientifically valid with the actual dataset structure
- preserves the approved sample definition exactly
- creates a useful number of training samples
- no event ID assumptions
- easy to explain and implement

Disadvantages:

- the feature matrix is family-aware rather than one universal all-family row
- a single global matrix may need family-identifier columns if all families are merged into one table

Suitability for this Mini Project:

- High
- It is the strongest choice for a college Mini Project because it is faithful to the source data and realistic to implement

### Approach B — Chunk or window each `data_point[]` series into multiple sub-samples

Definition:

- split each `data_point[]` into fixed windows/segments
- treat each window as a sample

Approximate sample count:

- larger than A, but depends on chosen window size and overlap

Retained information:

- preserves local temporal structure within each series

Cross-family alignment required?

- No, if each family is processed independently

Leakage risk:

- Low if the entire condition remains in one partition
- moderate if the chunking scheme is not done carefully and windows cross partitions

Compatible with condition-level train/test split?

- Yes, if windows are created only within the condition groups and split is kept at condition level

Advantages:

- preserves more local detail than global summaries
- may improve detection if the measured patterns are local

Disadvantages:

- arbitrary window lengths and overlaps are invented
- makes the dataset more dependent on chunk-design choices than on the actual source semantics
- more complex to justify scientifically for this dataset without a true event or time index

Suitability:

- Medium, but weaker than A because the dataset does not provide a verified event boundary or time-series labeling structure for chunking

### Approach C — Build separate models or separate feature sets for different measurement families

Definition:

- TIME_DELTA gets one model/family matrix
- STAT/CS gets another
- STAT/GS gets another
- TOP/CS gets another
- TOP/GS gets another
- optionally combine their outputs later by stacked prediction or voting

Approximate sample count:

- same order as A within each family

Retained information:

- keeps each measurement family distinct
- avoids false cross-family alignment

Cross-family alignment required?

- No

Leakage risk:

- Low if each family matrix respects the same split

Compatible with condition-level train/test split?

- Yes

Advantages:

- very honest with respect to the source structure
- does not pretend that all families are the same kind of sample
- easier to audit by family

Disadvantages:

- it is not a single unified ML pipeline unless ensemble logic is added later
- more modeling complexity than needed for the Mini Project baseline

Suitability:

- Medium
- valid, but less direct than simply treating each raw series as an independent sample

### Approach D — One row per condition/entity/class/profile with all families aggregated after summary

This is the current profile-level design and is the one that collapsed to 4 rows.

Approximate sample count:

- 4 rows per partition (for the current design)

Retained information:

- only the summary distribution of all series in the group, not the actual series-level variability

Cross-family alignment required?

- It appears to require a pseudo-alignment, even though the dataset provides no verified event-level key

Leakage risk:

- low in the sense of no train/test leakage, but high in the sense of information loss and pseudo-sampling

Compatible with condition-level train/test split?

- Yes structurally, but not useful for model training

Advantages:

- very simple to compute
- yields a small table

Disadvantages:

- destroys the actual raw-series sample count
- not scientifically defensible for the dataset as given
- inconsistent with the approved sample definition
- effectively turns the dataset into one summary row per class/condition

Suitability:

- Not suitable for the Mini Project objective

## 4. Recommended approach

### Recommendation: Approach A, with family-specific sample identity and no cross-family row fusion

Use this rule:

- one complete labelled `data_point[]` series = one raw ML sample
- each row is built from one exact series only
- the row identity should be a tuple like:

```text
(condition_directory, source_family, entity_id, metric_or_symbol, class_label)
```

Examples:

```text
(Correct_ID/Random_CS_ON/Gaussian_Off, TIME_DELTA, 2-39-89-25, time_diff, attack)
(Correct_ID/Random_CS_ON/Gaussian_Off, STAT/CS, 2-39-89-25, branch, attack)
(Correct_ID/Random_CS_ON/Gaussian_Off, TOP/CS, 2-39-89-25, branch:dequeue_task_fair, attack)
```

This respects the actual JSON hierarchy and the approved sample definition.

### Why this is the best fit

1. Scientifically valid samples
   - It matches the actual dataset structure.
   - It does not invent a hidden event alignment.

2. Sufficient number of samples
   - The dataset has thousands of raw series, not four.
   - This gives a realistic ML training set for a Mini Project.

3. No fabricated event alignment
   - We do not match `TIME_DELTA[i]` to `STAT[i]` or to `TOP[i]`.

4. No train/test leakage
   - The condition-directory holdout remains the grouping boundary.
   - All raw series from one condition stay together in the same partition.

5. Compatibility with scope
   - It respects the approved Mini Project subset and the source-file design.
   - It keeps the project aligned with the original requirements.

6. Reasonable complexity
   - It is straightforward to implement using a series-level parser and per-series summary extraction.
   - It is far simpler and more defensible than arbitrary chunking or unverified cross-family fusion.

## 5. Why the profile-level row design should not be used again

The profile-level row design is not a valid final ML sample design for this dataset because it turns a many-series dataset into a single summary per class-condition combination. It hides the actual sample count and makes the feature matrix nearly empty from an ML perspective.

The profile-level row should be considered a summary/diagnostic view only, not the final ML row definition.

## 6. Final recommended sample-to-row rule

The final row construction should be:

- one raw series = one sample
- one raw series is defined by exactly one complete labelled `data_point[]` under a source family, metric, class branch, and entity context
- feature extraction is performed on that series only
- the final sample matrix is family-aware and not cross-family aligned
- the train/test split remains at the condition-directory level

This is the most defensible design for EVShield Mini Project and the only one that preserves sample count while respecting the dataset structure.

## 7. Important implementation guardrails

- Do not assign a single row to a whole condition directory.
- Do not concatenate `TIME_DELTA`, `STAT`, and `TOP` by index position.
- Do not create a pseudo-event key from array position or sample count.
- Do not merge families together unless a verified shared identifier exists in the data.
- Do not use random row splitting within a condition directory.
- Do not fit preprocessing on test data.
- Keep TOP vocabulary learning on train data only.

## 8. Summary

The root cause of the 4-row collapse is the mistaken definition of one final row as a whole condition-level profile rather than one complete raw `data_point[]` series. The proper fix is not to invent more aggregation; it is to restore the series-level sample definition and keep each family in its own valid sample space.

The recommended design is:

- one complete labelled raw series = one sample
- no cross-family alignment
- condition-directory train/test split remains unchanged
- family-aware feature extraction
- training-only Top-K vocabulary learning
- no 4-row-per-partition collapse

This is the design that best balances scientific validity, sample count, implementation effort, and compliance with the approved project constraints.
