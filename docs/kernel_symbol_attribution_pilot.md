# EVShield Phase B3 — Kernel-Symbol Attribution Pilot

## 1. Scope and status

This document defines a least-invasive diagnostic path to determine whether the local Docker charging-server Node.js process can be attributed to user-space or kernel symbols with Linux perf. It does not modify the charging server, Docker privileges/capabilities, host perf settings, ML assets, or source data. It does not generate attack traffic or implement telemetry/inference.

Section 3.1 read-only diagnostics were run on 2026-08-09. The automated Section 4.1/4.2 attempts from this environment could not start because `sudo -n docker inspect` requires an interactive password. Separately, the user reports that Section 4.1 was successfully executed manually in the root context, and that the Section 4.2 kernel probe produced a perf data file containing zero samples. A further read-only diagnostic pass was run; no system/Docker configuration change was made.

## 2. Evidence already measured (Phase B2)

The following evidence is supplied from the completed controlled normal-workload measurement. It is the only performance measurement treated as actual in this report:

| Item | Actual result |
|---|---|
| Target | Docker charging-server Node.js process; PID was reported as `300111` at measurement time. |
| Events | `cpu_atom/cycles`, `cpu_atom/instructions`, `cpu_atom/branches`. |
| Result | All three counters produced aggregate process-level measurements. |
| Counter running proportion | Approximately 46–52% of the requested measurement window. |
| Workload | Controlled normal workload only. |

This establishes that this host can observe aggregate counters for that process under the tested conditions. It does **not** establish a current PID, user-symbol attribution, kernel-symbol attribution, JIT-symbol visibility, per-symbol series, or CICEV2023 TOP compatibility.

The 46–52% running proportion is evidence of counter multiplexing/contention or another scheduling limitation. Any later sample/count interpretation must retain `time_enabled`/`time_running` (or equivalent perf scaling metadata) and must not silently treat partial-running measurements as direct equivalents of the training data.

## 3. Target resolution and read-only diagnostics

PID `300111` is historical and must not be reused blindly. Resolve the target dynamically immediately before a pilot command.

### 3.1 Non-collection commands

These commands inspect only the locally owned container/process and do not collect performance samples or alter configuration.

| Command | What it determines | Output/artifact |
|---|---|---|
| `docker inspect -f '{{.State.Pid}}' evshield-charging-server` | Current host PID of the container init process. | Terminal output: numeric host PID. |
| `docker top evshield-charging-server -eo pid,ppid,user,comm,args` | Finds the actual Node.js process if it differs from the init PID. | Terminal process table. |
| `TARGET_PID="$(docker inspect -f '{{.State.Pid}}' evshield-charging-server)"; ps -p "$TARGET_PID" -o pid,ppid,user,comm,args` | Confirms a resolved PID still belongs to the expected local process. | Terminal process row. |
| `readlink -f /proc/<TARGET_PID>/exe; head -20 /proc/<TARGET_PID>/maps` | Checks whether the host can see the executable and mapped user-space DSOs. | Terminal paths/maps; no sample data. |
| `cat /proc/kallsyms | head -5` | Checks whether kernel symbols are visible or address-masked by current policy. | Terminal sample of available/masked symbols. |
| `find /usr/lib/debug/boot -maxdepth 1 -name 'vmlinux-*' -type f -print` | Checks for a local kernel debug image that may improve symbol resolution. | Terminal file list. |
| `perf list --details cpu_atom/cycles cpu_atom/instructions cpu_atom/branches` | Confirms the exact B2 event names are still recognised by perf. | Terminal event descriptions. |

Interpretation requirements:

- A visible Node executable/mapped libraries only demonstrates host namespace visibility, not useful Node/V8 function names.
- Accessible `/proc/kallsyms` does not guarantee sampled kernel frames resolve; masked addresses or missing debug information remain possible.
- Absence of a `vmlinux` debug image may limit kernel attribution detail but is not a reason to install packages or change host settings in this pilot.

### 3.2 Actual Section 3.1 results

| Diagnostic | Observed result | Interpretation |
|---|---|---|
| `docker inspect -f '{{.State.Pid}}' evshield-charging-server` | Docker CLI reached `/var/run/docker.sock` but returned `permission denied`. A second permitted read-only attempt had the same result. | The current diagnostic environment cannot query Docker metadata; the current container host PID is unknown here. |
| `docker top evshield-charging-server -eo pid,ppid,user,comm,args` | Same Docker socket `permission denied` result. | The Node.js process table could not be observed. |
| Dynamic PID + `ps` | No PID was resolved; no arbitrary/historical PID was used. The PID-dependent `ps`, `/proc/<pid>/exe`, and `/proc/<pid>/maps` checks therefore could not produce valid target results. | User-space executable/DSO visibility for the actual container process remains unknown. |
| `cat /proc/kallsyms \| head -5` | Symbol names were visible, but every displayed address was `0000000000000000` (including `_stext` and `_text`). | Kernel addresses are masked to this diagnostic process. This does not prove that perf cannot name symbols, but it is an adverse condition for direct kernel symbol/debug resolution. |
| `find /usr/lib/debug/boot -maxdepth 1 -name 'vmlinux-*' -type f -print` | No matching file was returned. | No local kernel debug image was found at this standard path by this check. Other locations were not searched. |
| `perf list --details cpu_atom/cycles cpu_atom/instructions cpu_atom/branches` | `perf` executed and returned exit code 0, but emitted no matching event definition text. | The perf executable is available, but this exact command does not confirm that the three event specifications are listed/usable for sampling. Event availability remains unknown from Section 3.1. |

No result above is a model input, a collected TOP series, or evidence of CICEV2023 compatibility.

## 4. Sample-collection commands requiring prior approval

The commands below attach only to a dynamically verified local charging-server PID. They collect samples and write an artifact under a temporary directory outside this repository, so they must not be run until explicitly approved.

First define the isolated output location and resolve/confirm the current target:

```bash
PILOT_DIR="$(mktemp -d /tmp/evshield-perf-symbol-pilot.XXXXXX)"
TARGET_PID="$(docker inspect -f '{{.State.Pid}}' evshield-charging-server)"
ps -p "$TARGET_PID" -o pid,ppid,user,comm,args
```

### 4.1 User-space attribution probe

```bash
perf record --all-user -e cpu_atom/cycles/ -F 99 -p "$TARGET_PID" \
  -o "$PILOT_DIR/user-cycles.data" -- sleep 10
```

- **Measures:** cycle-overflow samples restricted to user-space execution of the verified Node process, at a requested sampling frequency of 99 Hz.
- **Why:** It is the least invasive symbol-attribution probe: one event, one process, one bounded duration, no kernel frames.
- **Artifact:** `$PILOT_DIR/user-cycles.data`, a local perf recording; it contains sample metadata and must not be committed or placed under `ml/`.
- **Does not prove:** TOP compatibility, complete per-symbol series, or Node/V8 JIT function names.

Inspect only after the recording succeeds:

```bash
perf report --stdio -i "$PILOT_DIR/user-cycles.data" \
  --sort comm,dso,symbol | head -120
```

This renders a terminal symbol report; it does not alter the model or charging server.

### 4.2 Kernel-attribution probe

Run only if the user-space probe and the read-only symbol checks are reviewed first:

```bash
perf record --all-kernel -e cpu_atom/cycles/ -F 99 -p "$TARGET_PID" \
  -o "$PILOT_DIR/kernel-cycles.data" -- sleep 10
```

- **Measures:** cycle-overflow samples restricted to kernel execution while the verified Node process is scheduled.
- **Why:** Tests whether kernel frames can be attributed to named kernel symbols for this workload.
- **Artifact:** `$PILOT_DIR/kernel-cycles.data`.

Inspect it with:

```bash
perf report --stdio -i "$PILOT_DIR/kernel-cycles.data" \
  --sort comm,dso,symbol | head -120
```

### 4.3 Other event probes

Only after a successful, interpretable cycles probe, repeat separate bounded recordings for the remaining events:

```bash
perf record --all-kernel -e cpu_atom/instructions/ -F 99 -p "$TARGET_PID" \
  -o "$PILOT_DIR/kernel-instructions.data" -- sleep 10

perf record --all-kernel -e cpu_atom/branches/ -F 99 -p "$TARGET_PID" \
  -o "$PILOT_DIR/kernel-branches.data" -- sleep 10
```

Each command measures one event in a separate observation. Separate files prevent incorrectly treating samples from different events as a single numeric series. Reports must retain the event name, collection duration, target PID/container identity, perf version, and running/enabled statistics where available.

### 4.4 Actual Section 4.1 execution result

The following was the approved command sequence attempted from the EVShield project directory:

```bash
PILOT_DIR="$(mktemp -d /tmp/evshield-perf-symbol-pilot.XXXXXX)"
TARGET_PID="$(sudo -n docker inspect -f '{{.State.Pid}}' evshield-charging-server)"
ps -p "$TARGET_PID" -o pid,ppid,user,comm,args
sudo -n perf --version
sudo -n perf record --all-user -e cpu_atom/cycles/ -F 99 -p "$TARGET_PID" \
  -o "$PILOT_DIR/user-cycles.data" -- sleep 10
```

| Requested evidence | Actual result |
|---|---|
| Fresh target PID | Not resolved. `sudo -n docker inspect` returned `sudo: a password is required`. The supplied historical PID was not reused. |
| Process verification | Not run because there was no dynamically resolved PID to verify. |
| Perf version | Not reached; the command sequence stopped at Docker PID resolution. |
| `perf record` | **Not executed.** |
| Recording success | No recording occurred. |
| Artifact path | A temporary directory was created by `mktemp`, but no `user-cycles.data` artifact was written. The exact path was not emitted before the failed PID-resolution command. |
| `perf report` | **Not executed**, because no recording succeeded. |
| User-space symbols | Not observed. Node/V8/JIT/native/unknown classification remains unknown. |

This is an observed execution failure caused by the current command environment's Docker privilege boundary, not evidence that perf cannot perform user-space attribution when executed in the manually verified root context. No fallback PID, Docker privilege change, configuration change, or Section 4.2/4.3 command was attempted.

### 4.5 User-supplied Section 4.1 result and actual Section 4.2 execution result

The following Section 4.1 result was supplied by the user after the root-context manual probe; it was not rerun by this environment:

| Section 4.1 evidence | Reported result |
|---|---|
| Event | `cpu_atom/cycles/` |
| Recording | Succeeded with 111 samples. |
| Lost samples | 0. |
| Report | Resolved Node/V8/native symbols; JIT entries were visible. |
| Conclusion supported | User-space symbol attribution works for the Docker charging-server process in the manually verified root context. |

The approved Section 4.2 automated command sequence attempted in this environment was:

```bash
PILOT_DIR="$(mktemp -d /tmp/evshield-perf-symbol-pilot.XXXXXX)"
TARGET_PID="$(sudo -n docker inspect -f '{{.State.Pid}}' evshield-charging-server)"
ps -p "$TARGET_PID" -o pid,ppid,user,comm,args
sudo -n perf record --all-kernel -e cpu_atom/cycles/ -F 99 -p "$TARGET_PID" \
  -o "$PILOT_DIR/kernel-cycles.data" -- sleep 10
```

| Requested Section 4.2 evidence | Actual result |
|---|---|
| Fresh target PID and process verification | Not available: `sudo -n docker inspect` returned `sudo: a password is required`; no historical PID was reused. |
| Kernel recording | **Not executed.** |
| Kernel samples / sample count | No samples captured; count unavailable. |
| Lost samples | Unavailable because no recording started. |
| Artifact path | A new temporary pilot directory was created, but no `kernel-cycles.data` artifact was written; its exact path was not emitted before PID resolution failed. |
| Perf report | **Not executed**, because no recording succeeded. |
| Resolved kernel symbols | Not observed. |
| Unknown/unresolved entries | Not observed. |
| User/kernel sample distinction | User-space attribution is reported from the manual Section 4.1 run; kernel-space samples were not collected here, so no direct comparison is available. |

The user-space and kernel probes are conceptually distinguishable by their explicit `--all-user` and `--all-kernel` filters, but that distinction has not yet been demonstrated in paired local report output. No Section 4.3 event recording, feature construction, ML inference, telemetry implementation, or configuration workaround was attempted.

### 4.6 User-supplied zero-sample kernel result

The user subsequently reported these manual root-context diagnostics for the current charging-server process:

| Item | Manual observed value |
|---|---|
| Current PID | `300111` |
| Process | `node src/server.js` |
| Current processor (PSR) | `11` |
| CPU affinity | `0-11` |
| `Cpus_allowed_list` | `0-11` |
| `cpu_atom` PMU CPU coverage | `8-11` |
| `cpu_core` PMU CPU coverage | `0-7` |
| `kernel.perf_event_paranoid` | `3` |
| `kernel.nmi_watchdog` | `1` |

The user also reported a manually executed Section 4.2 kernel-space probe that created a `perf.data` file but captured **zero samples**. Its perf header reports `first sample = 0`, `last sample = 0`, and `duration = 0 ms`. This establishes that a recording artifact was created, but it provides no kernel-symbol attribution, no sample count beyond zero, and no model-ready series.

`perf data info` is unsupported by the installed perf version, `7.0.12`; this is a tooling limitation rather than evidence about kernel sampling. The data file was not opened or reprocessed by this diagnostic environment.

## 4.7 Read-only diagnostics after the zero-sample kernel result

The following commands were run without attaching perf, collecting samples, changing a setting, or inspecting ML assets:

```bash
cat /proc/sys/kernel/perf_event_paranoid
cat /proc/sys/kernel/nmi_watchdog
cat /proc/sys/kernel/kptr_restrict
cat /proc/sys/kernel/perf_event_mlock_kb
find /sys/bus/event_source/devices -maxdepth 1 -mindepth 1 -printf '%f\n' | sort
cat /sys/bus/event_source/devices/cpu_atom/type
cat /sys/bus/event_source/devices/cpu_atom/cpus
cat /sys/bus/event_source/devices/cpu_core/type
cat /sys/bus/event_source/devices/cpu_core/cpus
perf list --details
docker inspect -f '{{.State.Status}} pid={{.State.Pid}} started={{.State.StartedAt}}' evshield-charging-server
docker top evshield-charging-server -eo pid,ppid,user,stat,comm,args
```

| Diagnostic | Observed fact | Implication for zero kernel samples |
|---|---|---|
| `kernel.perf_event_paranoid` | `3` | This is a strict restriction for unprivileged perf use. It does not explain a manually root-run probe by itself, but it prevents this non-root environment from independently repeating/diagnosing the target. No setting was changed. |
| `kernel.nmi_watchdog` | `1` | NMI watchdog is enabled and can reserve/use a hardware performance counter. It may increase counter pressure/multiplexing; it is not proof of the zero-sample cause. It remains unchanged. |
| `kernel.kptr_restrict` | `0` | Kernel pointers are not restricted by this setting in the current diagnostic environment. This favors possible name/address resolution after samples exist, but cannot create kernel samples. |
| `kernel.perf_event_mlock_kb` | `516` | Current perf mmap-lock limit. It did not block the reported data-file creation; its role in the zero sample count is unknown. |
| PMU devices | Both `cpu_atom` and `cpu_core` exist. | The host has heterogeneous PMU domains; event/CPU affinity matters. |
| `cpu_atom` | PMU type `10`, CPUs `8-11`. | `cpu_atom/cycles/` is associated with Atom CPUs 8–11. A target scheduled only on Core CPUs cannot be assumed to provide equivalent Atom-PMU sampling. |
| `cpu_core` | PMU type `4`, CPUs `0-7`. | A Node process may run on a different PMU domain as it is scheduled/migrates. Target CPU affinity was not observable here. |
| `perf list --details` filtered for the three `cpu_atom` aliases | No matching definition text was emitted by this invocation. | This does not prove aliases are unavailable: B2 and the successful manual user-space recording demonstrate the cycles event was usable in that root context. It does mean this output alone cannot verify event syntax/sampling behavior for every PMU domain. |
| Docker process state | Docker socket access again returned `permission denied` in this environment. Separately, manual root-context diagnostics identified PID `300111` as `node src/server.js`, with PSR 11 and allowed CPUs 0–11. | The current target/process state is established by user-supplied root-context evidence, but was not independently observable from this diagnostic environment. |

### Bounded interpretation

The reported contrast—111 user-space cycle samples versus zero kernel-space cycle samples—shows that the manual normal workload produced observable user-mode execution but no captured kernel-mode samples under the Section 4.2 configuration. The cause is **unknown**. The read-only/manual facts establish context only; they do not identify a cause.

The observed CPU facts do **not** establish a CPU-domain mismatch: PID 300111 had PSR 11, which lies within the `cpu_atom` PMU range 8–11, and its allowed CPU range covered both PMU domains. The pilot cannot infer why kernel sampling remained at zero from this information.

The zero-sample outcome is **not** explained by `kptr_restrict`: that setting affects address visibility/resolution, while the recording had no samples to resolve. The absence of `/usr/lib/debug/boot/vmlinux-*` may limit detailed symbol names after samples exist, but likewise does not explain a zero sample count.

No additional recording is authorized by these findings. In particular, do not switch to `cpu_core`, alter affinity, disable NMI watchdog, lower `perf_event_paranoid`, change Docker permissions, or retry `perf record` without a separately approved diagnostic design.

## 5. User-space and Node/V8 JIT attribution

### What perf may show

For Node.js, perf may resolve the Node executable, shared libraries, native frames, or generic entries such as `[JIT]`, `[unknown]`, or unresolved addresses. This is an inference about likely outcomes, not a measured result for this host/container.

Node/V8 JIT code often lacks stable ELF symbol names. Useful JIT function attribution can require Node to be launched with its own approved profiling/JIT-map option (for example, a Node perf-profiling flag) and a compatible perf JIT-dump processing workflow. The current charging-server command must not be changed during this pilot, so JIT-specific attribution is **not expected to be available by default and is not a pilot requirement**.

Even resolved user-space Node/V8 symbols would not match the CICEV2023 requirement for a Linux-kernel-symbol TOP series.

## 6. Kernel-symbol attribution feasibility

Kernel attribution may be possible if all of these hold:

1. perf can attach to the dynamically resolved host PID;
2. the requested `cpu_atom/*` sampling event is permitted;
3. the normal workload causes enough kernel activity during the bounded probe;
4. perf can unwind/resolve kernel frames; and
5. current kernel symbol/debug restrictions permit meaningful names.

Potential blockers include perf permissions, PMU multiplexing, unsupported sampling for an event alias, kernel-address restrictions, unavailable kernel debug symbols, missing call chains, and insufficient workload. Docker itself does not prevent host-side observation when the host PID is visible, but it does not grant perf permission or guarantee symbol resolution.

No Docker `privileged` mode, capabilities, PID namespace change, NMI watchdog change, or `perf_event_paranoid` change is authorized. If the probes fail under present permissions, record the failure and stop; do not work around it by changing the host/container configuration.

## 7. Can recordings form a complete per-symbol series?

Not yet. A perf recording can yield symbol-attributed samples, but a report table is not automatically the model's required `data_point[]` series. To form a candidate series, a future approved collector would need to predefine and preserve:

```text
one scope + one target/context + one event + one kernel symbol
  → repeated numeric observations of the same semantic quantity
```

For example, repeated homogeneous collection epochs could emit one numeric observation per epoch for the same `(scope, metric, kernel_symbol)`. But the collection interval, sample weighting/count rule, missing-symbol behavior, multiplexing correction policy, and completeness criterion are currently undefined. Selecting them after inspecting a desired model result would be invalid.

The 10-second diagnostic recordings described here are only observability probes. They must not be transformed into features, passed to `predict.py`, or treated as a production inference window.

## 8. Compatibility with CICEV2023 TOP

Assessment: **not established; current aggregate-counter success is insufficient.**

| Requirement | B2/B3 evidence | Assessment |
|---|---|---|
| Process-level cycles/instructions/branches observable | B2 aggregate counters succeeded | Technically supported for this controlled workload. |
| User-space symbol attribution | User-supplied manual Section 4.1: 111 samples, zero lost, Node/V8/native/JIT entries resolved | Supported for that manual root-context probe. |
| Kernel-symbol attribution | User-supplied manual Section 4.2 produced a perf data file with zero samples; no kernel-symbol report exists | Not demonstrated. |
| Repeated per-symbol series | No collector/window rule | Not established. |
| Same metric semantics/units as CICEV2023 TOP | CICEV2023 collector configuration is not fully documented locally | Not established. |
| Valid input to frozen model | No compatible complete series | No. |

The source data stores per-symbol `data_point[]` values under TOP `branch`, `cycles`, and `instructions`, but it does not prove that arbitrary host perf sample counts, periods, or weighted counts use the same scale or aggregation. A successful kernel-symbol report would support a future collection feasibility claim only. It would not justify live scoring with the existing model without an explicitly validated compatibility protocol and, if necessary, newly collected compatible training data.

## 9. Limitations

- B2 counters were active for only about 46–52% of the interval; multiplexing can impair comparability and reproducibility. NMI watchdog is currently enabled and may contribute to PMU pressure, but causality was not established.
- The `cpu_atom` and `cpu_core` PMUs serve different CPU ranges (8–11 and 0–7 respectively). Manual evidence places the process on PSR 11 with allowed CPUs 0–11; this does not establish CPU-domain mismatch as the cause of the zero-sample kernel recording.
- The normal manual workload may yield little kernel activity and sparse/no useful symbols.
- Per-event recordings happen at different times; they are not aligned event-by-event and must never be merged by position.
- A PID can change when the container restarts; it must be resolved fresh for every collection.
- Node/V8 JIT attribution is separate from kernel-symbol attribution; the manual Section 4.1 report showed JIT entries, but those entries do not establish TOP-model compatibility.
- Current Phase A has no propagated `decision_id`, run manifest, clock-health fields, or telemetry collector.
- No attack traffic or labels are part of this pilot.

## 10. Recommended next step

The Section 4.1 manual result supports user-space attribution, while the zero-sample Section 4.2 result does not support kernel attribution. Kernel-symbol attribution remains **unestablished**. Before any new recording, review the raw perf record stderr/stdout and the zero-sample data-file header in the manually verified root context. Those are read-only evidence requests, not authorization to change settings or retry collection.

Do not proceed beyond read-only review or interpret any output as a model input without a further approved diagnostic plan.

Do not create a telemetry collector, derive model features, invoke ML inference, or change system/Docker settings from this pilot.
