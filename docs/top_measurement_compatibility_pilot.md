# EVShield Phase B1 — TOP Measurement Compatibility Pilot

## 1. Scope and current status

This document designs a safe, local feasibility pilot for determining whether the Phase A Docker charging-server process can yield measurements compatible with the frozen `TOP_richer_stats_v1` model. No host commands, `perf` commands, container inspection, system-configuration changes, process attachment, or measurement collection were run while preparing this design.

Consequently, the current host's actual `perf` availability, PMU event availability, Docker PID visibility, privilege state, and kernel-symbol visibility are **not yet determined**. The commands below must be approved and their outputs recorded before making a compatibility claim.

The scope is limited to the locally owned `evshield-charging-server` container. It excludes attack generation, external hosts, CICEV2023 data, model changes, ML APIs, telemetry implementation, and any system setting change.

## 2. Compatibility target

The current frozen model accepts one numeric vector in this order:

```text
count, mean, max, sum, std, min, median, q1, q3, iqr
```

Each vector must come from one complete finite TOP series with fixed provenance:

```text
one collector target/context + one TOP metric + one kernel symbol + one declared scope
```

The required TOP metrics are `branch`, `cycles`, and `instructions`. Phase A application logs do not contain these values. A successful pilot must therefore establish a path from compatible host-level Linux performance observations to a provenance-preserving, per-symbol numeric series. A generic process CPU total or HTTP latency is not a legal substitute.

## 3. Commands requiring approval

### A. Read-only environment and availability checks

These commands only inspect local host/container metadata; they do not collect performance samples or alter configuration.

| Command | Purpose |
|---|---|
| `command -v perf && perf --version` | Determine whether the Linux perf executable is installed and identify its version. |
| `uname -a` | Record kernel/host context relevant to perf support. |
| `cat /proc/sys/kernel/perf_event_paranoid` | Read the current perf access restriction; do not change it. |
| `cat /proc/sys/kernel/kptr_restrict` | Read kernel-symbol address restriction; do not change it. |
| `id && grep -E 'Cap(Eff|Prm|Bnd)' /proc/self/status` | Record the pilot user's identity and effective Linux capabilities. |
| `docker ps --filter name=evshield-charging-server` | Verify that the owned charging-server container is running. |
| `docker inspect evshield-charging-server` | Inspect container PID, network, mounts, and configured privileges. |
| `docker top evshield-charging-server -eo pid,ppid,user,comm,args` | Identify the container's host-visible Node.js process PID. |
| `perf list --details cycles instructions branches` | Determine whether the hardware event aliases requested by the model are available on this host. |

Expected evidence: perf binary/version, kernel version, current restrictions, container host PID, Node process command, and whether `cycles`, `instructions`, and `branches` resolve to available events.

### B. Approved measurement-collection checks — do not run yet

These commands attach only to the verified local charging-server host PID. They are collection commands and require separate explicit approval after the environment checks are reviewed.

| Command template | Purpose |
|---|---|
| `perf stat -e cycles,instructions,branches -p <HOST_NODE_PID> -- sleep 10` | Tests whether the host can count the three aggregate hardware events for the owned Node.js process during a fixed ten-second observation. This produces aggregate totals only; it is not a model input or a compatibility proof. |
| `perf record -e cycles,instructions,branches -p <HOST_NODE_PID> -g -- sleep 10` | Tests whether samples can be attributed to call stacks/symbols for the owned process. Output must be written to an isolated pilot directory, not the repository or ML paths. |
| `perf report --stdio --no-children` | Inspects the resulting local recording for symbol attribution. It must be run only after a successful approved `perf record`. |

No command may be run against an unknown PID, a non-local container, or any process outside `evshield-charging-server`.

## 4. Environment and perf availability assessment

Status: **not yet measured**.

The Phase A implementation and repository do not establish any host-level fact about Kali Linux perf packages, kernel configuration, CPU PMU pass-through, virtual-machine restrictions, or Docker daemon settings. `perf` may be absent, installed but permission-restricted, or available only for a subset of events.

The environment-check output must report:

- perf version and kernel version;
- whether the `cycles`, `instructions`, and `branches` event aliases are listed and usable;
- the current `perf_event_paranoid` and `kptr_restrict` values;
- any error returned by the approved local checks, unchanged and without attempting a workaround.

Do not reduce `perf_event_paranoid`, change `kptr_restrict`, install packages, load kernel modules, or modify Docker daemon settings as part of this pilot.

## 5. Docker process and PID visibility

Linux containers share the host kernel. A host-side perf collector can potentially observe a containerized Node.js process using its **host PID** obtained from `docker top` or container inspection. A PID visible inside the container is not automatically the same PID visible to a host-side collector.

The safe preferred pilot topology is:

```text
Kali host perf process
  └── attaches to the verified host PID of evshield-charging-server's Node.js process
```

This avoids placing a privileged profiling tool inside the charging-server container. It also keeps the simulator's published API limited to its existing port.

An in-container collector would require a separately reviewed PID-namespace/host-process visibility design and additional capabilities. It is not part of this pilot.

## 6. Required privileges and capabilities

Status: **host-specific and not yet determined**.

The precise requirement depends on kernel version, `perf_event_paranoid`, user ownership of the target process, and security policy. On modern Linux systems, `CAP_PERFMON` may be sufficient for performance monitoring; older or restrictive configurations may require broader privileges. Kernel call-stack/symbol attribution can also be blocked by kernel-address restrictions, ptrace-style access checks, unavailable symbols, or missing debug information.

For a future collector container, do not use blanket `privileged: true` by default. Start with the host-side approach above. If a containerized collector is later justified, document the minimum required capabilities (potentially `CAP_PERFMON`, and only additional capabilities proven necessary) and its PID namespace configuration. Any such Docker capability change requires separate approval.

## 7. Event and kernel-symbol visibility

### Aggregate events

`perf stat` can test aggregate process counts for `cycles`, `instructions`, and branch-related events. An available alias is necessary but insufficient: it confirms only that the host can request a counter, not that it yields a per-kernel-symbol series compatible with CICEV2023 TOP.

### Kernel-symbol attribution

Per-symbol attribution generally requires a sampling/recording workflow such as `perf record`, followed by symbol resolution through `perf report` or `perf script`. It can fail when:

- hardware sampling events are unavailable or prohibited;
- kernel symbol addresses are restricted;
- kernel/module debug symbols are absent or do not resolve;
- the target process has little relevant kernel activity during the pilot;
- container/host PID namespaces or security policy prevent observation.

Even when symbols appear, the recorded sample weight/count may not have the same unit, scaling, aggregation, or semantic meaning as the source CICEV2023 TOP `data_point[]` values. Symbol visibility is therefore a feasibility result, not an equivalence result.

## 8. Complete-series and sampling design

The model must not receive a single aggregate total or values merged across symbols. A later collector must retain records shaped conceptually as:

```text
scope_id
collector target/context
metric
kernel_symbol
scope_start / scope_end
ordered or unordered numeric values[]
collector configuration/version
completeness status
```

For this pilot, a fixed ten-second `perf stat`/`perf record` duration is only a bounded availability test. It must not be treated as the eventual ML window or used to score the model.

The future collection specification must pre-register:

1. scope opening/closing (preferably an explicitly propagated future `decision_id`);
2. target process/container and its context;
3. exact events, sampling period/frequency, and perf command/options;
4. per-symbol attribution and numeric-value extraction rule;
5. series completeness and minimum-value rule;
6. flush/grace behavior and failure policy; and
7. the fact that values from different symbols/metrics/scopes are never combined.

Only after those details are stable can a series be summarized with the model's exact `ddof=0` and NumPy-linear-quantile feature rule.

## 9. Compatibility assessment

Current assessment: **not established**.

| Requirement | Current evidence | Assessment |
|---|---|---|
| Host has usable perf | No host command executed | Unknown |
| Three metric events available | No `perf list` output | Unknown |
| Charging-server process visible to host | Docker/process inspection not run | Unknown |
| Kernel symbols attributable | No recording/report run | Unknown |
| Complete per-symbol series extractable | No collector design validated | Unknown |
| CICEV2023 measurement semantics reproduced | Dataset lacks enough collector configuration detail; no equivalence study | Not established |

At most, a successful future local recording could establish technical observability of this local Node.js process. It cannot by itself prove that live values are distributionally or semantically compatible with the CICEV2023 TOP representation, or that the existing model is valid for this simulator.

## 10. Limitations and incompatibilities

- The current model was trained on CICEV2023 TOP data, not Phase A Node.js simulator telemetry.
- Phase A has no TOP collector, `decision_id`, run manifest, label-control record, or clock-health metadata.
- `perf stat` aggregate counters are not per-kernel-symbol series.
- `perf record` sampled attribution may produce counts/periods rather than the same overhead quantity as the dataset.
- Host hardware, VM configuration, kernel version, and perf permissions can differ materially from CICEV2023 collection conditions.
- A normal local manual lifecycle produces limited workload; it is unsuitable for a model-performance claim.
- No attack traffic will be generated or labelled in this pilot.

## 11. Recommended next step

Request approval to run only Section 3A's read-only environment checks. Review their outputs before approving any process-attached measurement command. If those checks support a safe local collection attempt, approve one bounded Section 3B recording against the verified `evshield-charging-server` host PID, storing output outside ML/data paths.

Do not connect any recording to the frozen model until a separate collector/window compatibility protocol and data-integrity review are approved.
