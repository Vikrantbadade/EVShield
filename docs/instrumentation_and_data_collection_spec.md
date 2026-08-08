# EVShield Minor Project — Instrumentation and Data-Collection Specification

## 1. Purpose

This specification defines a future, local collection protocol for EV authentication telemetry that can legally support family-specific models and supervised late fusion:

```text
TIME_DELTA + STAT + TOP → family probabilities → late fusion → DDoS score
```

It is design-only. It does not change the Mini Project dataset, preprocessing, split, models, or artifacts. The preferred design is event-level synchronization using an explicitly collected `decision_id`; fixed time windows are a fallback only.

## 2. Current limitation

The current CICEV2023 subset contains no verified cross-family event/decision/window identifier or synchronized timestamp. Its variable-length arrays cannot be joined by index, entity, condition, label, or nearest time. The existing one-complete-series sample definition remains valid for the Mini Project, but cannot produce a supervised fusion example.

## 3. Collection architecture

```text
Authentication coordinator
        │ creates and records decision_id
        ▼
EV authentication request context
        ├──────────────► CS instrumentation
        ├──────────────► GS instrumentation
        └──────────────► profiling-collector scope
                              │
                              ▼
              TIME_DELTA / STAT / TOP observations
                              │  each carries decision_id,
                              │  timestamps, context, provenance
                              ▼
                     normalized records
                              │  foreign-key and quality validation
                              ▼
                validated decision-level dataset
                              ▼
                    family-specific models
                              ▼
             group-aware OOF family probabilities
                              ▼
                       late fusion policy
                              ▼
                   final EVShield DDoS score
```

`decision_id`, transaction IDs, run IDs, collector IDs, host IDs, condition names, and labels are provenance/split fields—not ordinary predictor features.

## 4. decision_id lifecycle

### Creation

1. At the first durable entry point of an EV authentication attempt, the authentication coordinator creates a new `decision_id`.
2. It must be globally unique for the collection corpus (UUIDv4/UUIDv7 or another documented collision-resistant generator is acceptable) and immutable after creation.
3. The coordinator records it with `auth_transaction_id` if the protocol provides one, `experiment_run_id`, UTC and monotonic start timestamps, EV/CS/GS context, and the planned control/attack assignment.
4. The coordinator opens a profiling scope keyed by `decision_id` before dispatching operations to CS or GS.

### Propagation

The coordinator must include `decision_id` in the internal authentication request context passed to:

- EV authentication handlers;
- CS services and their performance collectors;
- GS services and their performance collectors; and
- TIME_DELTA, STAT, and TOP collection adapters.

Each collector must write the received ID verbatim, its own collector identifier, and start/end timestamps into each emitted record. Propagation is an instrumentation obligation; it must not be reconstructed from log order or timestamps.

### Completion

At authentication completion or terminal failure, the coordinator writes end timestamps, terminal outcome, and an immutable label reference. It then closes the profiling scope. A predeclared post-completion grace interval may be used only for collector flushes; its duration and every included late record must be logged.

### Propagation failure

If a collector does not receive `decision_id`, it must emit an explicit `unlinked` status and failure reason. It must not attach the observation to the nearest decision/window. Unlinked records are retained for operational debugging but excluded from supervised family-model and fusion training. A pilot fails if required collectors produce any unlinked records for otherwise eligible decisions.

## 5. experiment_run_id and experiment control

An `experiment_run_id` is created by the experiment orchestrator before any authentication decision in a run. It identifies one independent collection batch and records:

- run start/end timestamps, orchestrator version, operator/automation identity;
- hardware/firmware/software configuration identifiers;
- EV/CS/GS topology and collector versions;
- scenario (`normal`, `Correct_ID`, `Wrong_ID`, or a future approved scenario), targeting setting, Gaussian setting, and attack-injection configuration;
- attack injection start/stop/control references.

One run must contain an explicitly documented control regime. Do not mix untracked attacks and normal traffic in a run. `experiment_run_id` is the minimum group unit for later partitioning; it must never occur in both TRAIN and TEST.

## 6. Timestamp and synchronization protocol

Every coordinator and collector record must carry both:

- `timestamp_utc` in a documented common format; and
- `monotonic_timestamp` or monotonic start/end counters local to its host.

The coordinator records decision `start_time_utc`, `end_time_utc`, `start_monotonic`, and `end_monotonic`. Each observation records its own start/end equivalents, collector host, clock source, offset estimate, and synchronization-health status.

Timestamps audit scope and data quality; they are not a substitute for `decision_id`. Before the pilot, define and freeze:

- the clock synchronization method and monitoring interval;
- a maximum allowed clock-offset tolerance;
- the allowed collection-flush grace period; and
- the rule for records that fall outside a decision's scope.

Records exceeding a tolerance, with negative duration, or outside scope are quarantined and cannot enter supervised fusion data.

## 7. Labeling protocol

### Label fields

Every `decision` record must carry:

```text
label                 0 = normal, 1 = attack
label_source          controlled_normal | controlled_attack_injection | verified incident | other-approved-source
label_reference       immutable control/injection/incident record ID
label_assigned_at_utc
label_confidence      documented collection-quality state
```

### Controlled normal and attack experiments

- **Normal controls:** execute authentication with attack injection disabled; the orchestrator records a control manifest and verifies the absence of an active injection for the decision interval.
- **Attacks:** enable one preapproved scenario/configuration through the orchestrator; record the injection ID, exact activation interval, target setting, and scenario parameters. A decision gets `label=1` only when its `decision_id` is created within the verified attack-control scope and the injection record confirms activation.
- **Ambiguous decisions:** a decision overlapping an uncertain start/stop, mixed state, or failed label-control check is marked `label_valid=false` and excluded from supervised use.

No label is inferred from model output, a source path, or a profiler measurement.

## 8. Collector protocol by family

| Family | Required association with `decision_id` | Required provenance | Measurement handling |
|---|---|---|---|
| TIME_DELTA | Collector opens/closes its interval scope with the decision | CS/GS context, entity ID, collector ID, source host, start/end times | Retain raw interval observations or a documented raw reference; aggregate only within this decision later. |
| STAT/CS | CS collector receives the propagated ID before counter capture | `context=CS`, `cs_id`, metric (`branch`, `cycles`, `instructions`), collector/host/time | Store metric records under the decision; do not mix a different decision's samples. |
| STAT/GS | GS collector receives the propagated ID before counter capture | `context=GS`, `gs_id`, metric, collector/host/time | Same rule; GS identity remains distinct from CS identity. |
| TOP/CS | CS TOP collector receives the ID | `context=CS`, `cs_id`, metric, `kernel_symbol`, collector/host/time | Preserve one symbol-specific child record per symbol/metric/decision. |
| TOP/GS | GS TOP collector receives the ID | `context=GS`, `gs_id`, metric, `kernel_symbol`, collector/host/time | Preserve one symbol-specific child record per symbol/metric/decision. |

Kernel symbols are source metadata in `top_observation`, never discarded during collection. Later representation (including any symbol vocabulary) must be learned from TRAIN data only. Multiple values or series within a known decision may be summarized only inside the same family/decision, using an aggregation policy frozen before TEST.

## 9. Proposed normalized schema

The future corpus uses normalized records, followed by a derived decision-level view only after foreign-key validation.

| Record/table | Primary key | Foreign keys | Required fields | Measurement / label / timestamp fields |
|---|---|---|---|---|
| `decision` | `decision_id` | `experiment_run_id` → run manifest | transaction ID if available, CS/GS routing context, lifecycle status | label, label source/reference/confidence, coordinator start/end UTC + monotonic timestamps |
| `time_delta_observation` | `time_delta_observation_id` | `decision_id` | collector/host ID, context, entity ID, collection status | raw values/reference, observation start/end UTC + monotonic timestamps |
| `stat_observation` | `stat_observation_id` | `decision_id` | context, entity ID, metric, collector/host ID, collection status | raw values/reference, observation start/end timestamps |
| `top_observation` | `top_observation_id` | `decision_id` | context, entity ID, metric, `kernel_symbol`, collector/host ID, collection status | raw values/reference, observation start/end timestamps |
| `family_feature_or_score` | `family_score_id` | `decision_id`, family model version | family name, model/schema version, feature coverage status, inference mode (`OOF`/TRAIN/TEST/runtime) | derived feature reference and/or probability, generation timestamp; no copied label as a predictor |
| `fusion_example` | `decision_id` | family score records and `decision` | one validated probability per required family, coverage/missingness fields, fusion schema version | label copied only as target, OOF/inference provenance, creation timestamp |

An optional `experiment_run` manifest table has primary key `experiment_run_id` and contains all run-level control, topology, and configuration metadata. Every child record must be traceable through `decision_id` to this manifest.

## 10. Missing-data policy

The pilot and later dataset must distinguish four states: `complete`, `unlinked`, `collector_failed`, and `out_of_scope`. Never replace a missing family with a fabricated observation or label-derived probability.

For the first supervised fusion experiment, use a conservative policy: include only `complete` decisions with all required family records and valid labels. Report exclusion counts by run, class, scenario, context, and collector. A later missingness-aware fusion policy requires a separately approved TRAIN-only design and must include explicit coverage indicators.

## 11. Data-quality checks and pilot procedure

### Pilot procedure

1. Freeze ID-generation, clock, label-control, scope, and missing-data rules in a versioned protocol manifest.
2. Run normal-control and preapproved attack-control sessions across at least more than one independent `experiment_run_id`; include CS and GS collection paths and all family collectors.
3. For every decision, reconcile the coordinator record with all child records by `decision_id`.
4. Validate run manifests, labels, timestamps, collector health, entity provenance, and TOP symbol provenance.
5. Produce a data-integrity report by run and label. Do not train a model or calculate ML accuracy in the pilot.

### PASS/FAIL gates

| Check | PASS criterion | FAIL action |
|---|---|---|
| decision ID uniqueness | Every `decision_id` appears once in `decision`; no duplicate primary keys. | Reject run; investigate generator/storage fault. |
| ID propagation | Every required family child record for an eligible decision has its coordinator-issued ID. | Mark decision incomplete; pilot fails for required collector path. |
| orphan records | No included child record lacks a valid `decision` parent. | Quarantine child record; pilot fails if systematic. |
| decision scope | Every included child record is inside the recorded scope or documented grace interval. | Quarantine record; fail the run if unresolved. |
| timestamps | All start ≤ end; clock-health record exists for every collector; offset is within the frozen tolerance. | Quarantine affected records; fail affected collector/run. |
| clock health | No unreported clock reset/drift or missing synchronization check during a run. | Fail run for fusion eligibility. |
| attack labels | Every attack decision has `controlled_attack_injection` plus an active matching injection reference. | Set `label_valid=false`; exclude and investigate. |
| normal labels | Every normal decision has a verified normal-control manifest and no active injection overlap. | Set `label_valid=false`; exclude and investigate. |
| family coverage | Every fusion-eligible decision has required TIME_DELTA, STAT/CS, STAT/GS, TOP/CS, and TOP/GS coverage status `complete`. | Exclude decision under v1 fusion policy; report coverage gap. |
| CS/GS provenance | Required context/entity IDs agree with the coordinator routing record. | Quarantine record; fail if mismatch is not explained. |
| TOP provenance | Every TOP child record retains metric, context, entity, and non-empty kernel symbol. | Quarantine record; fail collector path if systematic. |
| run separation | Each decision maps to exactly one run; runs and overlapping windows have no shared decision IDs. | Reject affected run/group assignment. |
| collection groups | Attack injection/control intervals and their records are wholly contained in one run group. | Redesign run boundaries before modelling. |

Pilot success means all required collection paths pass the gates for included decisions and all exclusions are explained and auditable. It does **not** mean that any classifier reaches a target accuracy.

## 12. Leakage prevention

1. Keep one `decision_id`, all its family records, and all derived scores in exactly one partition.
2. Keep every `experiment_run_id` intact in exactly one partition; do not split adjacent/overlapping windows or one attack-injection run across partitions.
3. Exclude identifiers, source paths, class names, scenario names, run IDs, collector IDs, and labels from predictor matrices.
4. Fit feature transforms, summary schemas that are data-derived, TOP vocabulary, imputation, scaling, calibration, thresholds, and family model selection on TRAIN only.
5. Generate group-aware OOF base probabilities for TRAIN decisions; use them—not in-sample probabilities—to train a fusion meta-classifier.
6. Fit fusion weights/meta-classifier and any policy threshold from TRAIN OOF evidence only.
7. Freeze all versions and settings, refit base models on full TRAIN, then evaluate TEST once at decision level.
8. Never use nearest timestamp, array index, entity alone, condition, label, or row order to manufacture a family link.

## 13. Future train/test strategy

Use an independent run-level holdout. Group by `experiment_run_id`, and where data volume permits, also hold out capture days, hardware/software configurations, and attack-execution instances. Stratification must be assessed at group level; it must never split a run to balance individual decisions.

Before TEST is opened, freeze:

- family feature definitions and TOP vocabulary rule;
- family model configurations and calibration policy;
- handling of incomplete decisions;
- fusion method (for example, a simple predeclared weighted average or a meta-classifier) and its training protocol; and
- the operating threshold/policy.

Use TEST only for the final frozen family and fusion evaluation. Report coverage, class/run distribution, ROC-AUC, PR-AUC, recall, precision, FPR/FNR, confusion matrices, and run-level variability.

## 14. Minor Project collection roadmap

Collect independent runs covering:

- verified normal controls;
- `Correct_ID` and `Wrong_ID` attacks;
- both `Random_CS_OFF` and `Random_CS_ON` settings;
- future approved attack scenarios only after their labels/control procedures are specified;
- multiple CS entities and GS entities;
- multiple independent runs, attack-injection instances, collection days, and hardware/software states where feasible.

Do not set an exact decision count from the Mini Project's four condition groups. After the integrity pilot, use properly linked pilot data to estimate variability/effect sizes at the **run level**, then pre-register a collection target, class allocation, and held-out-run test plan.

## 15. What can be reused from the Mini Project

- local-only ML workflow and artifact/versioning pattern;
- `normal=0`, `attack=1` convention;
- per-series finite-value validation;
- family-aware provenance and the prohibition on index alignment;
- condition/run-aware holdout discipline;
- TOP richer summary-feature approach as a candidate family baseline;
- PR-AUC, ROC-AUC, precision/recall/F1, FPR/FNR, confusion-matrix, and OOF operating-point reporting.

## 16. What must be newly collected

- coordinator-issued `decision_id` and optional authentication transaction ID;
- run manifests and independent `experiment_run_id` values;
- propagated IDs in every CS/GS/collector record;
- synchronized timestamp and clock-health metadata;
- validated normal-control and attack-injection label references;
- family coverage/completeness and collector-failure states;
- CS/GS routing provenance and TOP kernel-symbol provenance; and
- enough independent, linked runs for group-aware family and fusion evaluation.

## 17. Recommended next action

Approve an instrumentation implementation only after the target EV authentication stack and collector interfaces are identified. The first engineering deliverable should be a protocol-manifest and pilot validator that checks the gates in Section 11, followed by collection of a small integrity pilot. Do not begin new preprocessing, model training, or fusion until that pilot passes.
