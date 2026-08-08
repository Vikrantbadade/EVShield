# EVShield Mini Project — TOP Feature Strategy

## Scope

This is an analysis and plan only. It uses the selected Mini Project `TOP/CS/TOP.json` and `TOP/GS/TOP.json` files from these four non-Gaussian conditions:

```text
Correct_ID/Random_CS_OFF/Gaussian_Off
Correct_ID/Random_CS_ON/Gaussian_Off
Wrong_ID/Random_CS_OFF/Gaussian_Off
Wrong_ID/Random_CS_ON/Gaussian_Off
```

No data was modified, transformed, or used for training.

## What the TOP files actually contain

TOP data are nested as:

```text
profiling target (CS ID or GS_1)
  -> metric (branch, cycles, instructions)
    -> class (attack or normal)
      -> kernel symbol
        -> data_point[]
```

The kernel-symbol set is not fixed. A symbol can occur in one source, class, target, or metric and not another. `data_point` arrays are also variable in length.

### Observed vocabulary in the selected Mini Project files

| TOP target | Metric | Distinct symbols, union | Attack symbols | Normal symbols | Symbols in both classes | Attack-only | Normal-only |
|---|---|---:|---:|---:|---:|---:|---:|
| CS | `branch` | 121 | 115 | 43 | 37 | 78 | 6 |
| CS | `cycles` | 158 | 155 | 33 | 30 | 125 | 3 |
| CS | `instructions` | 138 | 132 | 55 | 49 | 83 | 6 |
| GS | `branch` | 399 | 372 | 249 | 222 | 150 | 27 |
| GS | `cycles` | 413 | 376 | 316 | 279 | 97 | 37 |
| GS | `instructions` | 396 | 365 | 246 | 215 | 150 | 31 |

These counts are descriptive only; they must **not** be reused directly to choose model features because they were measured using both classes and all selected files. In particular, attack-only symbols show why a vocabulary selected from the full dataset could leak label or test-distribution information.

## Terms used in the comparison

The sample-definition analysis recommends that one raw TOP sample is one complete labelled `data_point` series with its target, metric, and kernel-symbol context. To make that variable-length series fixed width, the following four numeric summaries are considered:

```text
count = number of values in the series
mean  = arithmetic mean of the values
max   = maximum value
sum   = sum of values
```

These are proposed transformations, not yet approved preprocessing. Their units and cross-family temporal alignment are not determined by the dataset.

## Strategy comparison

| Approach | Information retained | Information lost | Resulting feature count | Computational complexity | Leakage risk | Suitability for the Mini Project |
|---|---|---|---|---|---|---|
| 1. Mean / max / sum / count aggregation only | The distribution scale, total, peak, and number of values in each individual symbol series. | Kernel-symbol identity; temporal order; shape beyond the four summaries. Distinct symbols with similar summary values become indistinguishable. | **4 numeric features** per series. If data are instead pooled across symbols, it remains 4 per target/metric context, but that is a different sample definition. | Low: one pass over each `data_point` array. | Low if summaries are computed independently per sample. Scaling still must be fitted on training data only. | Good as a simple baseline, but likely discards useful symbol-level information that TOP explicitly provides. |
| 2. Top-K kernel symbols | Retains identity for K selected symbols; with per-symbol summaries, preserves their numeric behavior. | All symbols outside K are discarded or collapsed; rare but informative symbols may be lost; temporal order remains lost. | With the recommended per-series sample definition: 4 summaries + K symbol indicators (+ optional `other` indicator). With pooled per-context vectors and four summaries per symbol: `4 × K` per target/metric group. | Moderate: count/rank symbols, then build sparse vectors. | **High** if K is selected using all files, test data, or class-specific statistics. Lower only if K is selected from training data without labels. | Potentially useful, but K is arbitrary and a no-`other` implementation is brittle for the observed variable vocabulary. |
| 3. Fixed vocabulary learned from training data | Retains identity for every retained training symbol, plus numeric summaries. Allows an explicit unknown/other-symbol representation. | Symbols never seen in training are not individually represented; temporal order remains lost. | `4 + V + 1` for a per-series vector: four summaries, V training-vocabulary indicators, and one unknown/other indicator. V is chosen from training data; it is not fixed yet. A vocabulary can also be built separately for each TOP target/metric group. | Moderate: build vocabulary once from training data, then encode series. Sparse storage is appropriate when V is large. | **Low when done correctly:** split first, learn V from training files only, and map test-only symbols to `other`. **High** if V is learned before the split. | **Recommended.** It preserves more dataset-provided information than pure aggregation and has a clear no-leakage rule. |
| 4. Use the existing processed feature-selection artifacts | The local dataset has `basis_symbol.json`, `feature_combination.json`, `full_feature_information.json`, and `final_dataset.json` files that identify/select symbols. | Their generation method and applicability to the Mini Project schema are not fully documented in the inspected project files. They cover only two different scenario/condition paths. | Not determined from dataset. | Low to consume, but their semantics would need separate verification. | High: the artifacts appear to be derived from attack/normal data and are outside the selected Mini Project subset; using them could import label/test information. | Not suitable for the Mini Project baseline. Keep only as future research reference. |

## Recommended approach

Use a **fixed kernel-symbol vocabulary learned from training data only**, combined with per-series `count`, `mean`, `max`, and `sum` summaries and an explicit `other` category for unseen symbols.

### Planned representation

For each TOP `data_point` series, preserve this metadata during preprocessing:

```text
source_file, scenario, random_targeting,
profiling_target (CS or GS), metric,
kernel_symbol, label
```

Build a training-only token such as:

```text
CS|branch|__update_load_avg_se
GS|cycles|dequeue_task_fair
```

Then represent each series using:

```text
series_count, series_mean, series_max, series_sum,
one-hot(training_symbol_token) or other_symbol
```

The source path, scenario, class name, and label remain metadata/target rather than predictors. Whether to use one shared vocabulary or one vocabulary per TOP target/metric group remains an approval decision; the latter is easier to interpret because CS and GS metrics are structurally distinct in the data.

### Why this recommendation fits the data

- The dataset explicitly preserves kernel symbols, so discarding them entirely would lose recorded information.
- The observed CS and GS vocabularies are variable and sizable, making an uncontrolled all-files vocabulary unsafe.
- Training-only vocabulary learning protects the test partition from contributing feature choices.
- An `other` category allows valid transformation of test-time symbols that are absent from training.
- The strategy does not assume that TOP values align by index with `STAT` or `TIME_DELTA` values.

## Decisions required before implementation

1. Select the vocabulary rule: all training symbols or training-only top-K by frequency.
2. Select the value of K if a top-K cap is used.
3. Decide whether vocabularies are separate for CS/GS and each metric.
4. Confirm the four numeric summaries or approve alternatives.
5. Split source groups before learning the vocabulary or fitting any scaling.

Until these decisions are approved, this document is a strategy recommendation only.
