# EVShield Phase B — Live Telemetry and Inference Design

## 1. Scope and decision boundary

This is a design-only document for connecting future live charging-station telemetry to the existing frozen `TOP_richer_stats_v1` model. It does not implement telemetry, change the Phase A service, expose an ML API, train a model, generate attacks, or modify any ML/dataset artifact.

The current model is a `RandomForestClassifier` trained on one complete labelled TOP kernel-symbol series per sample. Its only input is the following ordered, ten-value numeric vector:

```text
count, mean, max, sum, std, min, median, q1, q3, iqr
```

The runtime inference threshold is the saved TRAIN-OOF-selected value 0.55.

## 2. What Phase A currently emits

The charging server currently writes structured JSON application logs to stdout. It can emit these event types:

| Event | Available fields | Meaning |
|---|---|---|
| `charging_server_started` | `timestamp`, `host`, `port` | Simulator lifecycle. |
| `authentication` | `timestamp`, `auth_event_id`, `ev_id`, `authorized`, `simulated` | Simulated successful authentication event. |
| `charging_start` | `timestamp`, `session_id`, `ev_id`, `charger_id`, `status`, `started_at` | In-memory charging-session start. |
| `charging_stop` | `timestamp`, `session_id`, `ev_id`, `charger_id`, `status`, `started_at`, `stopped_at` | In-memory charging-session stop. |

It also keeps active-session count in memory. These are application events and identifiers. Phase A does **not** currently collect any of the following:

- Linux Perf/TOP `branch`, `cycles`, or `instructions` measurements;
- kernel-symbol names or per-symbol numeric samples;
- CPU overhead series;
- per-request resource counters;
- a persistent run ID, collector ID, clock-health record, or propagated `decision_id`.

## 3. What does and does not map to the current model

The CICEV2023 TOP representation is a per-kernel-symbol performance series. Each training sample has source metadata equivalent to:

```text
TOP context + entity + metric (branch|cycles|instructions) + kernel_symbol + label
```

The ten model values summarize the numeric values from that one series. Accordingly:

| Live datum | Maps to current TOP input? | Reason |
|---|---|---|
| Phase A event timestamp | No | A timestamp is not a TOP performance-counter value. |
| `auth_event_id`, `session_id`, `ev_id`, `charger_id` | No | These are identifiers/provenance, never model features. |
| Authentication/start/stop event count | No | It is application traffic telemetry, not per-symbol TOP overhead. |
| Active-session count | No | It is application state, not an observed TOP series. |
| HTTP request duration, if later logged | No, not for this model | It may be useful future telemetry, but it is not a CICEV2023 TOP metric. |
| A collected series of compatible Perf values for one kernel symbol and one TOP metric | Potentially | Only after collection equivalence to the training measurement semantics is demonstrated. |

Therefore, the current Phase A logs cannot legitimately be sent to `ml/inference/predict.py`. Converting application timestamps, session counts, or IDs into `count`, `mean`, or any other TOP feature would invent a measurement relationship and be invalid.

## 4. Required compatible TOP telemetry

To form one legitimate current-model input, a future collector must emit a complete finite numeric series with immutable provenance:

```text
collector target/context
metric = branch | cycles | instructions
kernel_symbol
series scope start/end timestamps
numeric values[]
collector ID, host/container ID, counter/profiler configuration
future decision/run provenance when available
```

The collector must preserve the kernel symbol even though it is not an input feature; it is necessary to establish that the series is one legal TOP sample and to audit collection compatibility. The live pipeline must not combine values from different symbols, metrics, collector targets, contexts, entities, or scopes.

Compatibility is not yet proven merely by using a tool called `perf`. Before production-like inference, a collection pilot must establish that the chosen profiler, event definitions, units/scaling, aggregation behavior, target process/container, and sampling scope are compatible with the CICEV2023 TOP measurements. If they are not, the existing model must not be presented as valid for that telemetry.

## 5. Exact feature extraction

For one valid series `x = [x1, ..., xn]`, require `n >= 1`, numeric non-Boolean values, and every value finite. Produce features in this exact order:

| Feature | Required calculation |
|---|---|
| `count` | `n` |
| `mean` | arithmetic mean of `x` |
| `max` | largest value in `x` |
| `sum` | sum of `x` |
| `std` | population standard deviation, `ddof=0` |
| `min` | smallest value in `x` |
| `median` | 50th percentile |
| `q1` | 25th percentile |
| `q3` | 75th percentile |
| `iqr` | `q3 - q1` |

`q1`, `median`, and `q3` must use the NumPy `quantile(..., method="linear")` definition used by [build_top_richer_stats_v1.py](../ml/build_top_richer_stats_v1.py). No scaling, imputation, vocabulary encoding, metadata feature, cross-series aggregation, or threshold change is permitted.

The output supplied to the existing inference script must contain only the ten numeric fields. The script independently rejects missing, extra, non-numeric, NaN, and infinite values, verifies model class mapping, and applies its stored threshold.

## 6. Live collection scope/window

The current training corpus does not document a wall-clock duration, event count, or request count for each TOP series. Consequently, Phase B cannot scientifically select an arbitrary five-second, one-minute, or N-request inference window and call it equivalent to training data.

The required conceptual window is instead:

```text
one complete collection scope
  for one collector target/context + one metric + one kernel symbol
  containing only values observed within that scope
```

The exact opening/closing rule, minimum collection duration, minimum sample count, flush grace period, and collector configuration require a pre-registered instrumentation pilot. A future event-level `decision_id` scope is preferred for data collection because it provides verifiable provenance. Phase A's existing `auth_event_id` is not automatically a `decision_id` and must not be retrofitted as one without an approved lifecycle/propagation design.

For live display or operational use before a new model is trained, incomplete scopes, empty series, mixed-symbol series, missing collector provenance, or values outside the established compatibility policy must be rejected/quarantined rather than scored.

## 7. Normal and attack telemetry in a future lab

Future controlled collection can produce labels only through an experiment-control record:

- **Normal control:** the simulator executes documented ordinary authentication/charging activity while the approved attack control is inactive.
- **Attack control:** a separately approved, bounded lab experiment activates a recorded attack scenario; the control record must identify its interval and configuration.
- **Telemetry:** the same TOP collector observes the same declared target/configuration in both cases and records its measurements with provenance.

The label must come from the verified control/run record, never from the model score, a source path, a raw symbol, or a timestamp heuristic. This document does not design or implement attack generation. A live operational inference score normally has no ground-truth label at prediction time.

## 8. Additional instrumentation required

Phase A alone is insufficient. A future approved implementation needs:

1. A TOP-compatible Linux performance collector, with its precise events, target selection, sampling/aggregation configuration, and collector version recorded.
2. A collection-scope coordinator that creates an immutable `decision_id` before measurement and propagates it to the charging server and collector. It must also record run, timing, and label/control provenance.
3. Common-clock/clock-health metadata and start/end timestamps for coordinator and collector.
4. A window validator that rejects invalid or mixed provenance before feature extraction.
5. An exact feature-extraction component that shares the frozen feature definitions above and checks all values are finite.
6. A data-integrity pilot proving ID propagation, collector coverage, symbol/metric preservation, label fidelity, and collection compatibility before model claims.

The existing `instrumentation_and_data_collection_spec.md` remains the authority for the future decision/run/label schema and leakage controls.

## 9. Future telemetry transport and isolation

The recommended future lab flow is internal-only on the existing `evshield-lab` Docker network:

```text
charging-server
  │ application event context / future decision scope
  ▼
TOP telemetry collector
  │ complete, provenance-tagged symbol series
  ▼
feature-window validator and extractor
  │ exact 10-feature JSON, only after validation
  ▼
ML inference adapter
  │ invokes the frozen local model/inference contract
  ▼
internal prediction result
```

The collector/extractor must not publish raw host-performance telemetry to a host port by default. Future services should communicate on `evshield-lab`; only an explicitly approved backend gateway should eventually be host-exposed. A local internal request/message contract must include schema version, collection scope ID, metric, symbol, provenance, collection completeness, and the feature vector. Identifiers remain audit fields and must be removed before the model call.

No database, WebSocket, React connection, or external/cloud ML endpoint is required for this design phase.

## 10. Future files/services (not created in Phase B)

The following are future implementation candidates, subject to separate approval:

```text
services/telemetry-collector/          # TOP-compatible collection only
services/feature-extractor/            # validates one series and computes frozen features
services/ml-inference-adapter/         # local wrapper around the existing model contract
services/charging-server/src/...        # decision-context propagation changes only after approval
docs/telemetry_collection_protocol.md  # frozen collector/window compatibility contract
docker-compose.telemetry.yml            # internal collector/extractor/inference topology
```

The expected feature extraction logic must be versioned independently from the existing training pipeline; it must reproduce its definitions, not modify it. No current file is authorized to change.

## 11. Phase B conclusion

The existing model can score only a complete, compatible TOP kernel-symbol performance series summarized into the fixed ten-feature vector. Phase A application logs are valuable future provenance/context, but are not model-equivalent telemetry. Additional TOP instrumentation and a data-integrity/measurement-compatibility pilot are required before any live scoring connection is defensible.
