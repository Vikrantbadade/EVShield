# EVShield Mini Project — ML Sample Definition Analysis

## Scope and conclusion

This analysis uses only the 20 selected non-Gaussian source files from these four verified conditions:

```text
Correct_ID/Random_CS_OFF/Gaussian_Off
Correct_ID/Random_CS_ON/Gaussian_Off
Wrong_ID/Random_CS_OFF/Gaussian_Off
Wrong_ID/Random_CS_ON/Gaussian_Off
```

No data was created, modified, aligned, or used to train a model.

**Recommendation:** for the Mini Project, define one ML sample as **one complete, labelled `data_point` measurement series**, identified by its source file, entity, feature family, metric, and (for `TOP`) kernel symbol. At a later approved preprocessing stage, convert each variable-length series to fixed summary features. Do **not** merge `TIME_DELTA`, `STAT`, and `TOP` values by array index.

This is approach **E** below. It is the most dataset-supported approach because a `data_point` array is the smallest complete labelled measurement unit preserved by the JSON. There is no verified event identifier, timestamp, or shared sequence index that can join the five file families into one authentication-event record.

## What was inspected

For every listed condition, these five files were inspected:

```text
TIME_DELTA/TIME_DELTA.json
STAT/CS/STAT.json
STAT/GS/STAT.json
TOP/CS/TOP.json
TOP/GS/TOP.json
```

For each file, every `data_point` array was counted separately under `attack` and `normal`. The table reports:

`number of arrays; individual-array length range; total scalar observations`.

It does not collapse those values into a fictional common row count.

## Observation counts and array lengths

| Condition | Source file | Attack `data_point` arrays | Normal `data_point` arrays |
|---|---|---|---|
| Correct_ID / Random_CS_OFF / Gaussian_Off | `TIME_DELTA/TIME_DELTA.json` | 2 arrays; 2,212–2,244 values; total 4,456 | 2 arrays; 213–245 values; total 458 |
|  | `STAT/CS/STAT.json` | 6 arrays; 2,044–2,049; total 12,279 | 6 arrays; 2,040–2,092; total 12,396 |
|  | `STAT/GS/STAT.json` | 3 arrays; all 2,053; total 6,159 | 3 arrays; all 1,474; total 4,422 |
|  | `TOP/CS/TOP.json` | 460 arrays; 1–186; total 16,123 | 92 arrays; 1–141; total 5,629 |
|  | `TOP/GS/TOP.json` | 719 arrays; 1–193; total 11,490 | 479 arrays; 1–199; total 11,794 |
| Correct_ID / Random_CS_ON / Gaussian_Off | `TIME_DELTA/TIME_DELTA.json` | 3 arrays; 2,212–2,323; total 6,779 | 3 arrays; 213–324; total 782 |
|  | `STAT/CS/STAT.json` | 9 arrays; 3,720–3,774; total 33,768 | 9 arrays; 3,569–3,677; total 32,679 |
|  | `STAT/GS/STAT.json` | 3 arrays; all 3,739; total 11,217 | 3 arrays; all 2,464; total 7,392 |
|  | `TOP/CS/TOP.json` | 663 arrays; 1–350; total 45,570 | 63 arrays; 1–243; total 5,240 |
|  | `TOP/GS/TOP.json` | 870 arrays; 1–364; total 21,516 | 545 arrays; 1–362; total 21,308 |
| Wrong_ID / Random_CS_OFF / Gaussian_Off | `TIME_DELTA/TIME_DELTA.json` | 3 arrays; 2,212–2,323; total 6,779 | 3 arrays; 213–324; total 782 |
|  | `STAT/CS/STAT.json` | 9 arrays; 3,724–3,769; total 33,711 | 9 arrays; 3,567–3,679; total 32,694 |
|  | `STAT/GS/STAT.json` | 3 arrays; all 3,735; total 11,205 | 3 arrays; all 2,553; total 7,659 |
|  | `TOP/CS/TOP.json` | 675 arrays; 1–355; total 45,461 | 9 arrays; 1–131; total 551 |
|  | `TOP/GS/TOP.json` | 808 arrays; 1–360; total 21,406 | 519 arrays; 1–354; total 21,217 |
| Wrong_ID / Random_CS_ON / Gaussian_Off | `TIME_DELTA/TIME_DELTA.json` | 2 arrays; 2,244–2,323; total 4,567 | 2 arrays; 245–324; total 569 |
|  | `STAT/CS/STAT.json` | 6 arrays; 2,125–2,171; total 12,888 | 6 arrays; 2,195–2,226; total 13,263 |
|  | `STAT/GS/STAT.json` | 3 arrays; all 2,124; total 6,372 | 3 arrays; all 1,551; total 4,653 |
|  | `TOP/CS/TOP.json` | 522 arrays; 1–194; total 18,345 | 206 arrays; 1–199; total 9,873 |
|  | `TOP/GS/TOP.json` | 672 arrays; 1–197; total 11,949 | 442 arrays; 1–209; total 12,493 |

### Direct implications of the counts

- A condition has two or three CS entities, while every GS source has only `GS_1`.
- `STAT` contains one series per entity/metric/class. `TOP` contains many symbol-specific series per entity/metric/class.
- The same source family does not have equal attack and normal series lengths. For example, Correct_ID / Random_CS_OFF `TIME_DELTA` has 2,212 attack values but 213 normal values for its first CS.
- Different families have sharply different counts. In the same condition, `TIME_DELTA` may have two arrays per class, `STAT/CS` six, and `TOP/GS` hundreds.

These observations rule out a common record count based on the raw array lengths.

## Alignment evidence

| Question | Finding | Evidence from inspected files | Consequence |
|---|---|---|---|
| Do timestamps exist? | **No explicit timestamps were found.** | The inspected schemas contain `time_diff`, but no `timestamp`, `time_stamp`, or equivalent timestamp field. | `time_diff` is an interval value, not a join key. |
| Do event IDs exist? | **No event-ID field was found.** | No `event_id` or equivalent structural field occurs in the inspected JSON. Some TOP kernel-symbol names contain words such as `event`, but those are symbol names, not event identifiers. | Individual authentication events cannot be joined across files. |
| Do sequence IDs exist? | **No sequence-ID field was found.** | No `sequence`, `sequence_id`, or equivalent structural field occurs. | Array position is the only ordering-like property visible, but it has no documented shared meaning. |
| Do CS IDs provide alignment? | **Only partial grouping, not alignment.** | `TIME_DELTA`, `STAT/CS`, and `TOP/CS` share CS-like keys such as `2-39-89-25`; GS files instead use only `GS_1`. The number and length of arrays under a shared CS differ. | CS ID can group data by target, but cannot safely pair scalar values, arrays, or events. |
| Do array indices have documented meaning? | **Not determined from dataset/documentation.** | The documentation defines feature meanings but does not define `data_point[i]` as a timestamped or cross-file event index. | Index-based joins would be an unsupported assumption. |
| Can the five measurements be aligned by index? | **No.** | Their array counts, entities, and lengths differ materially within the same condition and class. | Do not zip, truncate, pad, or join arrays by index. |
| Is windowing or aggregation needed? | **Yes, for a fixed-width ML dataset.** | `data_point` arrays have variable lengths (from 1 to 364 in inspected TOP arrays and thousands in STAT/TIME_DELTA arrays). | A later approved transform must summarize or window each series without inventing cross-family alignment. |

## Comparison of candidate ML-sample definitions

| Option | Definition | Dataset evidence supporting it | Risks / limitations | Decision |
|---|---|---|---|---|
| A | One scalar `data_point` value = one sample | Each value is numeric and occurs beneath an explicit `attack` or `normal` branch. | It creates highly related sequential samples; it cannot combine the five families without unsupported index alignment; TOP values depend on symbol context; train/test leakage risk is high if values from the same series are split. | Not recommended as the combined Mini Project sample definition. |
| B | Fixed-size contiguous window within an array = one sample | Arrays have an intrinsic stored order. A window can be formed within one series without cross-file joining. | Window size and boundary have no documented physical/event meaning; no timestamps confirm duration; it still cannot combine families by window index. | Possible later experiment, but not the initial recommendation. |
| C | One authentication event = one sample | The documentation discusses authentication events. | The local JSON lacks an event ID, timestamp, and shared sequence key. No event-level join can be verified. | Not dataset-supported with this local subset. |
| D | One CS/time interval = one sample | CS IDs group CS-related data; `time_diff` represents an authentication interval. | No timestamps or explicit interval boundaries exist; GS has no matching CS ID; arrays under the same CS have different lengths. | Not dataset-supported without an external, documented alignment rule. |
| E | One complete labelled `data_point` array/series = one sample, later represented by approved distribution summaries | A series has a stable source path, entity, metric, optional TOP kernel symbol, class branch, and finite numeric values. It is the smallest complete labelled unit actually preserved by all families. | Series have variable lengths and TOP has variable symbols, so summary statistics and a feature-identity representation are required. Split must keep related series from the same source condition together. | **Recommended for the Mini Project.** |

## Recommended sample definition

### One ML sample

One sample is one full source series:

```text
source file
+ entity ID (CS ID or GS_1)
+ feature family (TIME_DELTA, STAT, TOP)
+ metric (time_diff, branch, cycles, instructions)
+ class branch (normal or attack)
+ kernel symbol (TOP only)
+ complete data_point[] array
```

The later model row should be a fixed set of summaries derived from that **one array only**. The exact summaries are intentionally not selected here; they require approval. Candidate examples would be distribution properties such as count, minimum, maximum, mean, and variability, but this document does not authorize or implement them.

### Required metadata, not ML predictors

Keep `source_file`, `scenario`, `random_targeting`, `entity_id`, `feature_family`, `metric`, and `kernel_symbol` for provenance and grouped splitting. Do not use the source path, scenario, class name, or label as predictor features.

### Why this is the safest Mini Project choice

It preserves the label and measurement context that the dataset actually provides, works for all five source families, and makes no unsupported claim that values from `TIME_DELTA`, `STAT`, and `TOP` refer to the same authentication event. It also leaves a clear path for a later Minor Project to investigate event/window alignment if additional official raw data or timing metadata becomes available.

## Approval needed before preprocessing

Implementation should wait for approval of:

1. the summary statistics computed from each complete series;
2. the handling of TOP kernel-symbol identity;
3. the grouped train/test split unit; and
4. whether fixed-size windows are later evaluated as a separate experiment.
