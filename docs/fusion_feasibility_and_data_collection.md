# EVShield Minor Project — Fusion Feasibility and Data-Collection Design

## 1. Current limitation

The current CICEV2023 subset has no verified event ID, transaction ID, session ID, synchronized timestamp, measurement-window ID, or run-level key that joins `TIME_DELTA`, `STAT`, and `TOP` arrays. Their counts and lengths differ, and the `data_point[]` index has no documented cross-family meaning.

Therefore the current Mini Project can validly model one complete labelled series within a family, but it cannot validly create a cross-family row or supervised fusion target. Pairing on array position, condition directory, entity, class, or label would be fabricated alignment and is prohibited.

## 2. Why current supervised fusion is invalid

A learned late-fusion model needs one set of family probabilities and one label for the **same decision instance**. The existing processed rows do not establish that relationship:

```text
TIME_DELTA series A  ─┐
STAT series B        ├─ no verified evidence that these are one event/window
TOP series C         ┘
```

Consequently, the current files cannot support:

- row-wise raw-feature concatenation;
- correlations between family rows;
- a probability vector such as `[p_time, p_stat_cs, p_top]` for a known common sample;
- a supervised stacking/meta-classifier; or
- test-set fusion-weight tuning.

The Mini Project's condition-level split and one-series sample definition remain correct for the data it has. The future Minor Project must collect different metadata; it must not retrofit pseudo-IDs onto these files.

## 3. Minimum future data structure

Future collection requires an explicit, immutable `decision_id` that is shared by every family observation belonging to one stated authentication decision or measurement window. It must be generated before measurements begin, not inferred during preprocessing.

Minimum tables/records are:

| Record | Required identity and time fields | Required provenance and label fields | Measurement payload |
|---|---|---|---|
| `decision` | `decision_id`, `experiment_run_id`, `auth_transaction_id` when available, start/end timestamps from one clock | scenario, targeting strategy, Gaussian setting, `label`, `label_source`, attack-injection/control ID | decision outcome/audit metadata only |
| `time_delta_observation` | `decision_id`, measurement start/end, collector ID | CS/GS context and entity ID | raw interval values or predeclared within-decision summary |
| `stat_observation` | `decision_id`, measurement start/end, collector ID | context (`CS`/`GS`), entity ID, metric | raw counter samples or predeclared within-decision summary |
| `top_observation` | `decision_id`, measurement start/end, collector ID | context, entity ID, metric, `kernel_symbol` | symbol-specific raw values or predeclared within-decision summary |

`decision_id` is a key, never a model feature. `experiment_run_id`, collector ID, source host, and scenario are likewise audit/split metadata, not predictors unless a separately justified deployment design authorizes them.

## 4. How the common identifier must be generated

### Event-level primary design

At the first durable step of EV authentication, the instrumented authentication coordinator creates a cryptographically random or monotonically unique `auth_transaction_id`. It also creates `decision_id` (a UUID is suitable) and records:

```text
decision_id
auth_transaction_id
experiment_run_id
start_time_utc and monotonic_start_time
CS entity / GS entity context
scenario/control assignment and label source
```

The coordinator passes `decision_id` in the internal request context to every instrumented CS/GS component and profiling collector. Each collector writes it alongside its measurement. At authentication completion, the coordinator writes the end times and immutable ground-truth label reference. A collector that cannot receive the ID must not silently attach its data by nearest timestamp; it must be marked unlinked and excluded from supervised fusion training.

This makes the linkage an observed collection fact rather than a post-hoc assumption.

### Measurements inside one decision

The collection protocol must predefine decision boundaries and collector behavior:

1. open measurement scope when `decision_id` is issued;
2. record every family measurement with the same ID and its own start/end time;
3. close the scope at the recorded decision end, with a predeclared grace interval only if justified and logged;
4. retain raw observations in family-specific child records;
5. derive family-specific features only from child records with that `decision_id`.

If a family produces multiple series in one decision, do not pair their individual values. Aggregate **within that family's records for the known decision** using a pre-registered rule. For example, preserve TOP symbol subrecords, summarize each symbol series, then form a fixed TOP family feature block or family score according to a TRAIN-only vocabulary/aggregation rule. Store aggregation coverage (number of series, observed duration, missing-family flag) as quality metadata. The same predeclared rule must apply to all partitions.

## 5. Option A — event-level synchronization

### Required data

- propagated `decision_id` and, where available, `auth_transaction_id`;
- common-clock event start/end timestamps and collector timestamps;
- `experiment_run_id`, context/entity identifiers, source host/collector identifier;
- ground-truth attack/control record linked to the decision;
- family-specific raw records keyed by the same ID.

### Advantages

- matches the EVShield security question: classify an authentication decision;
- gives an explicit label and one legal fusion unit;
- supports precise per-decision coverage and missingness auditing;
- enables OOF base probabilities and supervised late fusion without invented joins.

### Disadvantages and risks

- requires instrumentation across the authentication path and profiling collectors;
- asynchronous/background collector data may arrive late or lack context propagation;
- ID reuse, propagation failure, clock mismatch, or broad grace periods can create leakage/misattribution.

### Suitability

This is the preferred future approach **if** the EV authentication stack and collectors can propagate the ID. It is not claimed to be present in the existing CICEV2023 files.

## 6. Option B — fixed time-window synchronization

### Design

For collectors that cannot receive an event context, a trusted coordinator emits non-overlapping window records:

```text
experiment_run_id + window_sequence = measurement_window_id
window_start_utc + window_end_utc
```

All collectors use a synchronized clock and attach `measurement_window_id` only when their sample time is inside the declared half-open interval `[start, end)`. The coordinator records the label rule for the entire window, for example a single known attack/control state. Windows containing mixed or ambiguous states are marked unusable for supervised training.

### Advantages

- works for continuous or asynchronous telemetry;
- does not require application-level transaction-context propagation to every collector;
- can provide repeated, explicitly bounded observations when there is no one-to-one transaction event.

### Disadvantages and leakage risks

- an authentication event may cross window boundaries;
- a window can contain multiple events or a mixture of normal and attack activity;
- clock skew and adjacent overlapping windows can duplicate near-identical activity across partitions;
- the window length itself becomes a scientific design choice that must be frozen before evaluation.

### Required data

- synchronized collector clocks, clock-offset monitoring, and a coordinator-issued `measurement_window_id`;
- non-overlap policy, window duration, start/end times, and completeness indicators;
- run ID, context/entity/metric/symbol metadata, and an unambiguous window label source.

### Suitability

Fixed windows are an acceptable fallback for continuous profiling only when events cannot be instrumented. They are less natural for the EV authentication decision and have greater label-contamination risk.

## 7. Comparison and recommendation

| Criterion | Option A: event-level | Option B: fixed window |
|---|---|---|
| Fusion unit | One known authentication decision | One declared telemetry interval |
| Label attribution | Directly tied to transaction/control record | Valid only if window has one unambiguous state |
| Collector requirement | Context/ID propagation | Clock synchronization and coordinator windows |
| Main failure mode | Missing/wrong propagated ID | Mixed events, clock skew, boundary contamination |
| Fit for EVShield | Strongest, if instrumentable | Fallback for background telemetry |
| Supports supervised stacking | Yes, with complete linked decisions | Yes, only after window-label validity is shown |

**Conditional recommendation: Option A, event-level synchronization.** EVShield's stated goal is authentication-attack detection, so a transaction-bound decision is the most defensible fusion unit. This is a future collection recommendation, not a finding about the current files. If end-to-end ID propagation cannot be guaranteed, do not approximate it with the current data; first run a feasibility test of Option B with clock and label-quality validation.

## 8. Future dataset schema

The Minor Project should retain normalized family records plus a legal, derived decision-level modelling view. The normalized records preserve raw provenance; the derived view is constructed only by a verified `decision_id`.

```text
decision
  decision_id (primary key)
  experiment_run_id
  auth_transaction_id
  start/end timestamps and clock metadata
  scenario/control metadata
  label, label_source, label_confidence

family_measurement
  decision_id (foreign key)
  family = TIME_DELTA | STAT | TOP
  context = CS | GS
  entity_id, metric, kernel_symbol (TOP only)
  collector_id, source host, start/end timestamps
  raw measurement reference / values
  collection-completeness status

family_feature_or_score
  decision_id (foreign key)
  family model version
  family feature coverage metadata
  out-of-fold / inference probability

fusion_example
  decision_id (primary key)
  p_time_delta, p_stat_cs, p_stat_gs, p_top
  permitted missing-family indicators
  label
```

Raw TOP kernel symbols remain source identity within child records. A TOP family model may use a predeclared TRAIN-only symbol representation, but raw identifiers should not be indiscriminately passed to the fusion model. CS/GS context remains explicit in record provenance and family-model routing.

## 9. Future train/test strategy

The future primary split must be by independent collection group, not by individual decision or family record. At minimum, `experiment_run_id` must identify a run that is not shared across partitions. Prefer a split that holds out full runs, capture days, hardware/firmware configurations, and attack-execution instances where enough groups exist.

Required rules:

1. every record with one `decision_id` stays in one partition;
2. all family records and derived scores for a decision stay in that partition;
3. adjacent or overlapping time windows from a run remain together;
4. feature schemas, symbol vocabularies, scalers, calibration, family thresholds, and fusion weights are fit on TRAIN only;
5. TEST is used once after the full family and fusion design is frozen.

For stacking, generate base-family predictions for TRAIN decisions through group-aware OOF folds. Fit the meta-classifier only on those OOF probabilities. Then refit base models on full TRAIN, produce one probability per TEST decision, and apply the frozen fusion model exactly once. This prevents the fusion model from learning from base predictions generated on their own fit rows.

## 10. Leakage prevention and quality gates

- Validate every foreign-key relation: each included fusion example must have a recorded `decision_id` and an approved label source.
- Reject duplicate IDs, conflicting labels, overlapping event scopes, and records outside the decision/window boundaries.
- Record clock offset and collector health; reject or quarantine records exceeding a predeclared synchronization tolerance.
- Never infer a link from nearest timestamp, entity alone, row index, scenario, or class.
- Keep run, session, collector, host, and transaction identifiers out of predictor columns unless an explicit production-use case is reviewed for leakage risk.
- Define missing-family behavior before modelling. Do not fill a missing family probability with a label-dependent value; either reject incomplete decisions or train a documented missingness-aware policy using TRAIN only.
- Audit class balance and attack mechanism distribution by run before splitting. A single attack injection or run must never be represented in both TRAIN and TEST.

## 11. Minor Project roadmap

```text
Current Mini Project
  family-aware extraction + TOP richer model + frozen operating-point evidence
        ↓
Instrumented Minor Project collection
  verified decision_id, run ID, clock metadata, labels, raw family records
        ↓
Per-family TRAIN-only models
  TIME_DELTA probability + STAT probabilities + TOP probability
        ↓
Group-aware OOF family probabilities on verified decision IDs
        ↓
Late-fusion policy / meta-classifier
        ↓
Final DDoS probability
        ↓
Local inference service → Node.js backend → SOC dashboard
```

The SOC dashboard should display the final probability plus family probabilities, measurement coverage, model version, threshold/policy version, and the decision/run provenance needed for investigation. It should not claim a causal explanation merely from a feature or family score.

## 12. Reusable Mini Project components

- the binary label convention (`normal=0`, `attack=1`);
- condition/run-aware grouping and the train-only fitting discipline;
- per-series numerical validation and finite-value checks;
- family-aware storage, metadata audit patterns, and no-index-alignment safeguard;
- TOP richer v1 feature definitions and its reproducible experiment artifact structure;
- PR-AUC, ROC-AUC, recall, FPR/FNR, confusion-matrix, and OOF threshold-analysis reporting;
- the local-only model/artifact workflow.

These assets are reusable as engineering patterns, not as authorization to merge the existing unpaired rows.

## 13. New data required

Before fusion modelling, collect a sufficient number of independent, labelled authentication decisions across:

- normal controls and each included attack mechanism;
- both targeting settings and additional independent runs;
- multiple CS and GS entities, hardware/software states, and collection days where feasible;
- complete or explicitly documented partial family coverage;
- attack start/stop/control records linked to the decision/window;
- synchronized timestamps, collector clock health, and immutable run/session/decision identifiers.

The collection plan should predefine a minimum number of independent runs per class/condition and reserve entire unseen runs for TEST. A numeric sample-size target cannot be justified from the current four condition groups alone; it should follow a pilot variance/effect-size study on properly linked future decisions.

## 14. Recommended Step 19

Step 19 should be an instrumentation and collection-protocol specification, followed by a small pilot that validates ID propagation, timestamp synchronization, label fidelity, and family-coverage rates. Its success criterion is data-integrity validation—not model accuracy. Only after that pilot demonstrates valid linked decisions and enough independent runs should the project approve new preprocessing, per-family model experiments, and late-fusion evaluation.
