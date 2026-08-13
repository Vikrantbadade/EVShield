# ML Integration Readiness

## Evidence status

- **Confirmed** statements below come directly from the current repository files.
- **Inferred** statements follow from those contracts but have not been exercised as a live integration.
- **Unknown** statements identify evidence that is not present in the repository and must not be assumed.

## 1. Existing inference entry point

**Confirmed:** The frozen inference entry point is [ml/inference/predict.py](../ml/inference/predict.py). It is a one-shot Python command-line program: it reads one JSON object from standard input and writes one JSON result to standard output.

The documented invocation is:

```bash
./.venv/bin/python ml/inference/predict.py
```

For example, another local process can start this command, provide one feature JSON object on stdin, and parse its stdout JSON. The script has no HTTP server, message queue, or persistent process mode.

**Confirmed:** The current code can be called by another local Python process through a subprocess without changing its ML behavior. It loads the model and artifacts afresh for each invocation.

## 2. Model artifact

**Confirmed:** The inference script loads this saved artifact:

```text
ml/experiments/TOP_richer_stats_v1/random_forest_standard/model.joblib
```

It is the frozen `RandomForestClassifier` selected for `TOP_richer_stats_v1`. The script requires `predict_proba` and verifies that the model classes are exactly `0` and `1`, resolving the attack-probability column from class `1` rather than assuming a probability-column position.

**Confirmed:** The deployed threshold is not hard-coded in Python. It is loaded from:

```text
ml/experiments/TOP_richer_stats_v1/operating_point/selected_threshold.json
```

Its recorded selected value is `0.55`; classification is `probability_attack >= threshold`.

## 3. Preprocessing

**Confirmed:** `predict.py` does not accept raw TOP series and does not run the dataset preprocessing pipeline. It validates an already engineered ten-feature vector, orders it into a one-row pandas DataFrame, and scores it with the saved model.

**Confirmed:** The frozen feature schema is read from:

```text
ml/processed/TOP_richer_stats_v1/schema.json
```

The script first looks for `ml/processed/feature_columns.json`; that file is not present in the current repository, so it falls back to the `feature_columns` list stored in the saved experiment configuration:

```text
ml/experiments/TOP_richer_stats_v1/random_forest_standard/experiment_config.json
```

**Confirmed:** There is no scaler, imputer, encoder, calibration artifact, or kernel-symbol vocabulary used by this inference path. Raw symbol name is metadata in the training schema, not a model feature. The broader [ml/preprocessing_pipeline.py](../ml/preprocessing_pipeline.py) is not invoked by `predict.py`.

## 4. Frozen 10-feature contract

**Confirmed:** The model accepts exactly these numeric input fields, in this order:

| Order | Feature |
|---:|---|
| 1 | `count` |
| 2 | `mean` |
| 3 | `max` |
| 4 | `sum` |
| 5 | `std` |
| 6 | `min` |
| 7 | `median` |
| 8 | `q1` |
| 9 | `q3` |
| 10 | `iqr` |

The inference program rejects missing fields, extra fields, Boolean values, non-numeric values, `NaN`, and infinite values. Identifiers, labels, timestamps, context, entity, metric, and kernel symbol must not be supplied as model-input fields.

## 5. Exact feature calculations

**Confirmed:** [ml/build_top_richer_stats_v1.py](../ml/build_top_richer_stats_v1.py) defines the training representation. For one non-empty, finite numeric source series `x = [x1, ..., xn]`:

| Feature | Definition |
|---|---|
| `count` | `n` |
| `mean` | arithmetic mean of `x` |
| `max` | maximum of `x` |
| `sum` | sum of `x` |
| `std` | population standard deviation, `numpy.std(x, ddof=0)` |
| `min` | minimum of `x` |
| `median` | `numpy.quantile(x, 0.50, method="linear")` |
| `q1` | `numpy.quantile(x, 0.25, method="linear")` |
| `q3` | `numpy.quantile(x, 0.75, method="linear")` |
| `iqr` | `q3 - q1` |

The original sample definition is one complete labelled TOP `data_point[]` series for one kernel symbol, metric, context/entity, and source scope. Calculations are performed only within that one series; values from different symbols, metrics, contexts, entities, or scopes are not combined.

## 6. Current inference input contract

**Confirmed:** Input is a JSON object supplied on stdin, not a filename, CSV, command-line argument, or raw CICEV2023 JSON document. The required shape is:

```json
{
  "count": 0.0,
  "mean": 0.0,
  "max": 0.0,
  "sum": 0.0,
  "std": 0.0,
  "min": 0.0,
  "median": 0.0,
  "q1": 0.0,
  "q3": 0.0,
  "iqr": 0.0
}
```

The numeric values above are placeholders only. A valid input must contain real, finite values produced with the frozen definitions in Section 5.

Malformed JSON, a non-object JSON value, missing/extra keys, and invalid feature values cause the program to write a JSON error to stderr and exit with code `1`.

## 7. Current inference output contract

**Confirmed:** On success, stdout contains one JSON object in this form:

```json
{
  "probability_attack": 0.0,
  "predicted_label": 0,
  "label": "NORMAL",
  "threshold": 0.55
}
```

`probability_attack` is rounded to four decimal places. `predicted_label` is `1` and `label` is `"ATTACK"` when the unrounded probability is at least the artifact-loaded threshold; otherwise they are `0` and `"NORMAL"`.

**Confirmed:** Errors are emitted as JSON on stderr in the form `{"error": "..."}` and are not a successful prediction result.

## 8. Runtime dependencies

**Confirmed:** The inference script imports `joblib`, `numpy`, and `pandas`, in addition to Python standard-library modules. Loading the saved random-forest artifact also requires a compatible scikit-learn installation.

**Confirmed:** The frozen experiment configuration records Python `3.13.9`, NumPy `2.5.1`, pandas `3.0.5`, and scikit-learn `1.9.0`. It also records XGBoost `2.1.1`, but the selected inference model is a scikit-learn random forest and `predict.py` does not import XGBoost.

**Confirmed:** The repository provides a local `.venv` used by the documented command. **Unknown:** No inspected dependency lock file or deployment requirements manifest defines a separately reproducible inference environment.

## 9. Hard-coded paths

**Confirmed:** There are no user-specific absolute paths in `predict.py`. It derives the EVShield project root from the script location and uses the following fixed, versioned relative artifact paths:

```text
ml/experiments/TOP_richer_stats_v1/random_forest_standard/model.joblib
ml/experiments/TOP_richer_stats_v1/random_forest_standard/experiment_config.json
ml/processed/TOP_richer_stats_v1/schema.json
ml/experiments/TOP_richer_stats_v1/operating_point/selected_threshold.json
```

The optional path `ml/processed/feature_columns.json` is also fixed in code, but it is absent and the saved experiment configuration is used instead.

**Inferred:** A future integration should invoke the script from a stable checkout/container image that retains this directory layout, or preserve the same relative paths when packaging it. Altering these paths without modifying `predict.py` would make artifact discovery fail.

## 10. Required telemetry

**Confirmed:** The frozen model cannot consume Phase A application logs directly. `auth_event_id`, `session_id`, `ev_id`, `charger_id`, event timestamps, active-session counts, and charging start/stop events are identifiers or application telemetry, not TOP performance-counter samples.

To create one legitimate input vector, a future collector must provide a complete finite numeric series that is compatible with the original TOP sample definition, with provenance for at least:

```text
collector target/context
metric: branch | cycles | instructions
kernel_symbol
entity/context identity
declared collection scope start/end
numeric values[]
collector and profiler configuration/version
collection completeness and failure status
```

Only the values from one compatible `(scope, context/entity, metric, kernel_symbol)` series may be summarized into the ten model fields. The provenance is essential for validation and audit, but must be excluded from the model feature JSON.

**Unknown:** The repository does not establish that measurements from the Phase A Node.js container, including current host `perf` observations, have the same units, event semantics, sampling/aggregation rule, or distribution as CICEV2023 TOP data.

## 11. Proposed integration boundary

**Inferred:** Once a separately approved, compatible telemetry collector exists, the narrowest no-model-change boundary is:

```text
compatible TOP collector
  -> scope/provenance validator
  -> frozen ten-feature extractor
  -> local subprocess: ml/inference/predict.py
  -> parsed prediction JSON
```

The collector/validator must reject incomplete, mixed-symbol, mixed-metric, non-finite, or semantically unverified series before the feature extractor calls the frozen inference program. The adapter must pass only the ten keys in the exact schema and preserve the returned threshold rather than replacing it.

**Confirmed:** The existing stdin/stdout contract is technically suitable for a local Python subprocess wrapper without changing model code. **Unknown:** No production adapter, internal transport protocol, service ownership model, throughput characterization, or concurrency policy has been implemented or defined yet.

## 12. Risks / incompatibilities

- **Confirmed:** The training representation is per-kernel-symbol TOP data; aggregate process counters, HTTP timing, application-event counts, and session state are not interchangeable with it.
- **Confirmed:** The current inference program does no raw-series feature extraction. Supplying arbitrary statistics merely because their field names match would bypass the training sample definition and be invalid.
- **Confirmed:** The 0.55 threshold is a frozen TRAIN-OOF-selected artifact. An integration must not replace or retune it from live observations.
- **Confirmed:** The current charging server emits structured application events but no branch/cycle/instruction samples or kernel-symbol series.
- **Unknown:** The required live collection window, sample-frequency/aggregation rule, handling of profiler multiplexing, and evidence of CICEV2023 measurement equivalence have not been established.
- **Unknown:** The performance and operational suitability of launching a fresh Python process and loading the model for every live feature vector have not been measured.
- **Inferred:** A wrapper can be technically correct while its output remains scientifically unjustified if the telemetry collector cannot prove measurement compatibility.

## 13. Recommended next implementation step

Do not connect the current charging-server logs to the model. First complete a separately approved TOP measurement-compatibility and collection-scope protocol: define one complete per-symbol series, its event/sampling semantics, provenance, completeness rules, and equivalence checks against the frozen training definition.

After that protocol establishes compatible telemetry, the next bounded implementation can be a local validator/extractor that reproduces Section 5 exactly and invokes `predict.py` as an unchanged subprocess. It must be tested with controlled fixtures before any live charging-server connection, ML API, dashboard, or threshold change is considered.

## Conclusion

The existing frozen inference can **technically** be connected to a future local telemetry collector without modifying the ML model: its JSON stdin/stdout contract and saved artifacts are explicit. It cannot yet be **safely or validly** connected to Phase A application logs, because compatible per-kernel-symbol TOP telemetry and its measurement-equivalence evidence do not yet exist.
