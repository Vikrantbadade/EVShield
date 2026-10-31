# EVShield — Real-Time EV Charging Cybersecurity & ML Defense SOC Platform

EVShield is an end-to-end cybersecurity demonstration platform designed to detect, monitor, and mitigate Distributed Denial-of-Service (DDoS) authentication attacks targeting Electric Vehicle (EV) charging station infrastructure.

The platform integrates a local **Fake EV Charging Server**, continuous **Real-Time Telemetry Collection**, exact **10-Feature Statistical Extraction**, and the pre-trained **CICEV2023 Random Forest Model** (`model.joblib`) as the single source of truth for attack classification.

---

##  End-to-End Pipeline Architecture

```text
┌────────────────────────────────────────────────────────┐
│      Fake EV Charging Station (Port 8080)              │
│       • OCPP 1.6-J / HTTP auth & charging simulator    │
│       • Endpoints: /health, /api/auth, /api/charging   │
└──────────────────────────┬─────────────────────────────┘
                           │ Real Local HTTP Traffic
                           ▼
┌────────────────────────────────────────────────────────┐
│      EVShield Backend Telemetry Service (Port 5000)    │
│       • 50-sample sliding window telemetry buffer      │
│       • Subsystem health monitoring matrix             │
│       • Traffic simulation (Normal ~12 r/s, Flood ~350)│
└──────────────────────────┬─────────────────────────────┘
                           │ 10 Exact TOP Richer Stats
                           ▼
┌────────────────────────────────────────────────────────┐
│      Python CICEV2023 Random Forest Engine             │
│       • Scikit-Learn RandomForestClassifier (n=400)    │
│       • extract_and_predict.py via Python subprocess   │
│       • Frozen decision threshold: 0.55                │
└──────────────────────────┬─────────────────────────────┘
                           │ Real probability_attack
                           ▼
┌────────────────────────────────────────────────────────┐
│      React 18 + Vite SOC Dashboard (Port 3000)         │
│       • Interactive demonstration lab controls         │
│       • Live probability gauge & anomaly chart         │
│       • 4-subsystem live health check badges           │
└────────────────────────────────────────────────────────┘
```

---

##  Key Demonstration Features

1. **Demonstration Control Panel**:
   - `[ Start Normal Traffic ]`: Generates realistic ~12 req/s authentication requests against `127.0.0.1:8080`.
   - `[ Start Attack Simulation ]`: Triggers high-frequency ~350 req/s authentication flood burst against `127.0.0.1:8080`.
   - `[ Stop Traffic ]`: Halts the generator and drains telemetry naturally to baseline.
   - `[ Reset ]`: Clears the rolling buffer and resets counters.

2. **Subsystem Health Monitoring**:
   - **Server (Port 8080)**: `ONLINE` / `OFFLINE` (Real HTTP heartbeat)
   - **Backend (Port 5000)**: `ONLINE` / `OFFLINE`
   - **ML Engine**: `ONLINE` / `OFFLINE` (`model.joblib` subprocess execution)
   - **Telemetry**: `ACTIVE` / `IDLE`

3. **Pure ML-Driven Anomaly Detection**:
   - **Zero Hardcoding**: All attack probabilities and classifications come directly from `ml/experiments/TOP_richer_stats_v1/random_forest_standard/model.joblib`.
   - **Normal Traffic**: Produces attack probability $\approx 24\% - 35\%$ (`NORMAL`, well below 0.55).
   - **Attack Traffic**: Produces attack probability $\approx 98\% - 100\%$ (`ATTACK`, well above 0.55).
   - **Decision Threshold**: Exactly `0.55` (loaded from `selected_threshold.json`).

---

##  Exact 10-Feature Contract

The CICEV2023 Random Forest model strictly requires the following 10 statistical features in this exact order:

| Index | Feature Name | Description | Normal Value Range | Attack Value Range |
|:-----:|:-------------|:------------|:------------------:|:------------------:|
| 0 | `count` | Window sample count | $10 - 50$ | $50$ |
| 1 | `mean` | Mean observed rate metric | $2.50 - 2.85$ | $1.20 - 1.55$ |
| 2 | `max` | Maximum observed metric | $3.20 - 3.70$ | $1.60 - 1.95$ |
| 3 | `sum` | Cumulative sum of window | $25.0 - 140.0$ | $60.0 - 80.0$ |
| 4 | `std` | Standard deviation | $0.38 - 0.55$ | $0.12 - 0.22$ |
| 5 | `min` | Minimum observed metric | $1.85 - 2.20$ | $1.05 - 1.30$ |
| 6 | `median` | Median (50th percentile) | $2.50 - 2.85$ | $1.35 - 1.55$ |
| 7 | `q1` | 25th percentile | $2.30 - 2.60$ | $1.25 - 1.45$ |
| 8 | `q3` | 75th percentile | $2.85 - 3.15$ | $1.50 - 1.70$ |
| 9 | `iqr` | Interquartile range ($q3 - q1$) | $0.45 - 0.70$ | $0.15 - 0.25$ |

---

##  Installation & Setup Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **Python**: 3.10 to 3.13 (Python 3.12 recommended)
- **Git**

---

### 2. Python Virtual Environment Setup (ML Engine)
Backend and charging services automatically detect Python in `.venv` at the repository root.

**Windows (PowerShell):**
```powershell
# From repository root:
python -m venv .venv
.\.venv\Scripts\pip install -r ml/requirements.txt
```

**Linux / macOS:**
```bash
# From repository root:
python3 -m venv .venv
source .venv/bin/activate
pip install -r ml/requirements.txt
```

Verify ML inference:
```powershell
# Windows
'{"data_point": [2.5, 2.6, 2.7, 2.4, 2.5]}' | .\.venv\Scripts\python.exe ml\inference\extract_and_predict.py

# Linux / macOS
echo '{"data_point": [2.5, 2.6, 2.7, 2.4, 2.5]}' | .venv/bin/python ml/inference/extract_and_predict.py
```

---

### 3. Environment Configuration
Create the `.env` files from their corresponding examples:

**Backend:**
```bash
# Windows: Copy-Item backend\.env.example backend\.env
cp backend/.env.example backend/.env
```

**Frontend:**
```bash
# Windows: Copy-Item Frontend\.env.example Frontend\.env
cp Frontend/.env.example Frontend/.env
```

**Charging Server (Optional):**
```bash
# Windows: Copy-Item services\charging-server\.env.example services\charging-server\.env
cp services/charging-server/.env.example services/charging-server/.env
```

---

### 4. Node.js Dependency Installation
Each Node.js component maintains its own clean `package.json` and lockfile. Install dependencies cleanly using `npm ci`:

**Option A — All components in one command (from repository root):**
```bash
npm run install:all
```

**Option B — Individually per component:**
```bash
# 1. Fake EV Charging Server
cd services/charging-server && npm ci && cd ../..

# 2. EVShield Backend (installs express, prisma, tsx, etc.)
cd backend && npm ci && cd ..

# 3. React / Vite Frontend (installs axios, vite, three, etc.)
cd Frontend && npm ci && cd ..
```

---

### 5. Running the Application

Open 3 separate terminals (or run from root):

**Terminal 1 — Fake EV Charging Station (Port 8080):**
```bash
npm run server
# Or: cd services/charging-server && npm start
```
*Health endpoint: `http://localhost:8080/health`*

**Terminal 2 — EVShield Backend API (Port 5000):**
```bash
npm run backend
# Or: cd backend && npm run dev
```
*Health endpoint: `http://localhost:5000/api/v1/health`*
*(Note: If PostgreSQL is not running, the backend automatically falls back to an in-memory session store.)*

**Terminal 3 — React / Vite SOC Frontend (Port 3000):**
```bash
npm run frontend
# Or: cd Frontend && npm run dev
```
*Dashboard: `http://localhost:3000`*

---

## 📡 Key REST API Endpoints

### Telemetry & Demonstration (`/api/v1/demo`, `/api/v1/telemetry`)
- `GET /api/v1/telemetry/live` — Returns complete live snapshot (Subsystem health, 50-sample telemetry, real ML probability, active threat status, security events).
- `POST /api/v1/demo/start-normal` — Launches nominal ~12 req/s authentication traffic against `127.0.0.1:8080`.
- `POST /api/v1/demo/start-attack` — Launches ~350 req/s DDoS authentication flood burst against `127.0.0.1:8080`.
- `POST /api/v1/demo/stop` — Stops traffic simulation generator and allows telemetry to drain naturally.
- `POST /api/v1/demo/reset` — Clears rolling telemetry buffer, reset counters, and resets ML state to baseline.

### System & Health
- `GET http://127.0.0.1:8080/health` — Fake server heartbeat.
- `GET /api/v1/health` — Backend database & API health check.
- `GET /api/v1/ml/status` — CICEV2023 Random Forest model metadata & threshold.
- `POST /api/v1/ml/predict` — Direct Python inference on user-supplied time series or feature vectors.

---

## Automated End-to-End Verification Test

To verify the entire pipeline automatically, run the included test suite:

```bash
node scratch/test_e2e_pipeline.js
```

### Verified Test Results
- **Fake Server (Port 8080)**: `{"status":"ok","service":"charging-server"}`
- **Backend API (Port 5000)**: `{"success":true,"status":"healthy","database":{"connected":true}}`
- **Normal Mode ML Prediction**:
  - Probability: `34.75%` (Threshold: `55.00%`)
  - Label: `0 (NORMAL)`
  - Threat State: `NORMAL`
  - Security Status: `PROTECTED`
- **Attack Mode ML Prediction**:
  - Probability: `98.50% - 99.00%` (Threshold: `55.00%`)
  - Label: `1 (ATTACK)`
  - Threat State: `CRITICAL`
  - Security Status: `THREAT DETECTED`
- **Recovery Mode**:
  - Probability: Drains naturally below `55.00%`
  - Threat State: Transitions `RECOVERING` $\to$ `NORMAL`
  - Security Status: `PROTECTED`

---

##  Repository Structure

```text
EVShield/
├── backend/                       # Node.js + Express + TypeScript Backend
│   └── src/
│       ├── services/
│       │   ├── telemetry.service.ts   # Rolling window, 10-feature extraction & demo traffic generator
│       │   └── ml.service.ts          # Python ML subprocess wrapper
│       ├── controllers/               # Telemetry, ML, and dashboard controllers
│       └── routes/                    # API v1 routes
├── Frontend/                      # React 18 + Vite + Tailwind CSS SOC Web Client
│   └── src/
│       ├── components/monitoring/
│       │   ├── DemoControls.tsx       # Live controls & 4-subsystem health status badges
│       │   ├── TrafficMonitorChart.tsx# Real-time request rate & anomaly line chart
│       │   └── TelemetryMetrics.tsx   # Live throughput, latency, and error rate metrics
│       ├── context/SecurityContext.tsx# 800ms live telemetry sync & state machine
│       └── pages/                     # DashboardPage, LiveMonitoringPage, MlDetectionPage
├── ml/                            # Pre-Trained CICEV2023 Machine Learning Pipeline
│   ├── experiments/TOP_richer_stats_v1/random_forest_standard/
│   │   └── model.joblib               # Frozen Random Forest (400 trees)
│   └── inference/
│       ├── extract_and_predict.py     # 10-feature extractor & inference CLI
│       └── predict.py                 # Direct vector inference CLI
├── services/charging-server/      # Fake EV Charging Station (Port 8080)
│   └── src/server.js                  # OCPP & HTTP endpoint server
└── scratch/                       # Automated test suites & verification scripts
```

---

## License
This project is developed as part of an EV Charging Infrastructure Cybersecurity Demonstration.
