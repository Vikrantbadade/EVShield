# EVShield — Final Architecture & Technical Reference

> **Project**: EVShield — EV Charging Infrastructure Cybersecurity SOC Platform  
> **Phase**: Mini-Project Final (Phases 1–12 complete)  
> **Status**: ✅ COMPLETE — Presentation Ready

---

## 1. Project Objective

EVShield is a cybersecurity Security Operations Centre (SOC) platform designed to monitor, detect, and analyse DDoS attacks targeting Electric Vehicle (EV) charging authentication infrastructure.

The system integrates:
- A real-time React dashboard for operators
- A Node.js/Express REST API backend
- PostgreSQL persistence via Prisma ORM
- A locally-trained CICEV2023 Random Forest ML model for DDoS classification
- CICEV2023 dataset replay for development/testing

---

## 2. Technology Stack

| Layer | Technology | Version |
| :--- | :--- | :--- |
| **Frontend** | React + Vite + TypeScript | React 18, Vite 5 |
| **Styling** | Tailwind CSS (utility) + Vanilla CSS (glass tokens) | Tailwind 3 |
| **Backend** | Node.js + Express | Node v24, Express 4 |
| **ORM** | Prisma | 5.22 |
| **Database** | PostgreSQL | 14+ |
| **ML Runtime** | Python + Scikit-Learn | Python 3.14, sklearn 1.x |
| **ML Model** | RandomForestClassifier | n=400, trained on CICEV2023 |
| **IPC** | Node.js `child_process.spawn` | — |

---

## 3. Frontend Architecture

```
React (Vite + TypeScript)
├── App.tsx                     ← route definitions + PageTransition wrapper
├── pages/
│   ├── LandingPage.tsx         ← marketing / login entry
│   ├── DashboardPage.tsx       ← main SOC overview
│   ├── LiveMonitoringPage.tsx  ← real-time monitoring panel
│   ├── AttackLogsPage.tsx      ← PostgreSQL-backed attack incident log
│   ├── AttackAnalysisPage.tsx  ← detailed attack forensics
│   ├── ChargingNetworkPage.tsx ← SVG topology + station grid
│   ├── MlDetectionPage.tsx     ← model status + live inference form
│   ├── AnalyticsPage.tsx       ← trend charts and analytics
│   ├── AlertsPage.tsx          ← PostgreSQL-backed alert panel
│   └── SettingsPage.tsx        ← SOC settings (localStorage-persisted)
├── components/
│   ├── layout/                 ← AppLayout, Sidebar, Topbar
│   ├── dashboard/              ← SecurityHero, StatCard, MLThreatAlert, etc.
│   ├── network/                ← NetworkTopology (SVG), StationCard, RegionPanel
│   └── ui/                     ← GlassCard, StatusChip, PageTransition, etc.
├── services/
│   ├── apiClient.ts            ← Axios base client
│   ├── dashboardService.ts     ← /api/v1/dashboard
│   ├── stationService.ts       ← /api/v1/stations
│   ├── attackService.ts        ← /api/v1/attacks
│   ├── alertService.ts         ← /api/v1/alerts
│   ├── analyticsService.ts     ← /api/v1/analytics
│   ├── mlService.ts            ← /api/v1/ml/*
│   └── healthService.ts        ← /api/v1/health
├── context/
│   └── SecurityContext.tsx     ← DDoS simulation state (DO NOT MODIFY)
└── data/
    └── mockStations.ts         ← Demo station data + SVG node positions
```

### Design System
- **Glassmorphism** — `backdrop-filter: blur`, translucent warm-cream backgrounds
- **Colour palette** — warm sand/taupe/peach + cyber cyan (#19BFA3) / blue (#52A8FF) / danger (#E85C68)
- **Typography** — Inter (UI), JetBrains Mono (code/labels), Manrope (headings)
- **Animations** — CSS transitions only; respects `prefers-reduced-motion`
- **Text selection** — globally fixed via `*::selection` to cyan-tinted highlight visible on all glass surfaces

---

## 4. Backend Architecture

```
Express REST API (TypeScript)
├── src/
│   ├── server.ts                   ← app entry, CORS, middleware
│   ├── config/
│   │   └── database.ts             ← Prisma client singleton
│   ├── routes/
│   │   ├── health.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── station.routes.ts
│   │   ├── attack.routes.ts
│   │   ├── alert.routes.ts
│   │   ├── analytics.routes.ts
│   │   └── ml.routes.ts
│   └── services/
│       ├── dashboard.service.ts    ← aggregates DB data
│       ├── station.service.ts      ← ChargingStation queries
│       ├── attack.service.ts       ← AttackIncident queries
│       ├── alert.service.ts        ← SecurityAlert queries
│       ├── analytics.service.ts    ← analytics aggregation
│       └── ml.service.ts           ← ML pipeline orchestration + Prisma persistence
```

### Response Envelope (all endpoints)
```typescript
{
  "success": true,
  "data": { ... }
}
```

---

## 5. PostgreSQL Database Architecture

### Schema (Prisma)

```prisma
model ChargingStation {
  stationId       String   @id
  name            String
  region          String
  status          String
  latitude        Float?
  longitude       Float?
  totalChargers   Int
  activeChargers  Int
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model AttackIncident {
  incidentId      String   @id
  attackType      String
  severity        String
  targetStation   String?
  requestsPerSec  Float
  startTime       DateTime
  endTime         DateTime?
  isActive        Boolean  @default(false)
  peakRequests    Float?
  createdAt       DateTime @default(now())
}

model SecurityAlert {
  alertId         String   @id
  type            String
  severity        String
  message         String
  stationId       String?
  isRead          Boolean  @default(false)
  createdAt       DateTime @default(now())
}

model MLPrediction {
  predictionId    String   @id
  classification  String
  confidence      Float
  modelVersion    String
  rawFeatureRef   String?
  createdAt       DateTime @default(now())
}

model SystemEvent {
  eventId         String   @id
  type            String
  message         String
  severity        String?
  metadata        Json?
  createdAt       DateTime @default(now())
}
```

---

## 6. ML Architecture

### 6.1 Model

| Property | Value |
| :--- | :--- |
| Algorithm | `sklearn.ensemble.RandomForestClassifier` |
| n_estimators | 400 |
| random_state | 42 |
| n_features_in_ | 10 |
| Artifact | `ml/experiments/TOP_richer_stats_v1/random_forest_standard/model.joblib` |

### 6.2 CICEV2023 Dataset

- **Full name**: CICEV2023 EV Authentication Security Benchmark
- **Conditions**: Correct_ID, Replay_ID × Random_CS_OFF/ON × Gaussian_Off/On/Both
- **Metrics**: TOP (time-on-phase), TIME_DELTA, STAT
- **Raw data**: `ml/dataset/` (nested JSON by condition/metric/label/symbol)

### 6.3 Feature Engineering

Source: [`ml/build_top_richer_stats_v1.py`](file:///c:/Users/aryan/Desktop/Mini-Project/EVShield/ml/build_top_richer_stats_v1.py) — `summarize()` function.

Given a kernel-symbol time series `data_point[]`:

| Feature | Formula |
| :--- | :--- |
| `count` | `len(series)` |
| `mean` | `numpy.mean(series)` |
| `max` | `numpy.max(series)` |
| `sum` | `numpy.sum(series)` |
| `std` | `numpy.std(series, ddof=0)` — population SD |
| `min` | `numpy.min(series)` |
| `median` | `numpy.median(series)` |
| `q1` | `numpy.quantile(series, 0.25, method='linear')` |
| `q3` | `numpy.quantile(series, 0.75, method='linear')` |
| `iqr` | `q3 - q1` |

### 6.4 Decision Threshold

- **Threshold**: `0.55` (selected from `selected_threshold.json`)
- **Rule**: maximise recall subject to FPR ≤ 0.30; then F1; then precision
- **Train OOF metrics @0.55**: precision 0.891, recall 0.882, F1 0.887, FPR 0.286

### 6.5 Model Evaluation (held-out TEST set @0.50)

| Metric | Value |
| :--- | ---: |
| Accuracy | 69.6% |
| Precision | 75.6% |
| Recall | 79.7% |
| F1 Score | 77.6% |
| ROC-AUC | 0.7577 |
| PR-AUC | 0.8676 |
| FPR | 50.1% |

Source: `ml/experiments/TOP_richer_stats_v1/random_forest_standard/metrics.json`

---

## 7. Replay Mode (Development)

**Current execution path:**

```
CICEV2023 raw kernel-symbol series (fixture)
        ↓
ml/inference/extract_and_predict.py
        ↓  [ summarize() from build_top_richer_stats_v1.py ]
10-feature vector
        ↓
ml/inference/predict.py
        ↓  [ model.joblib + selected_threshold.json ]
{ probability_attack, label, threshold, mode }
        ↓
Node.js ml.service.ts (child_process.spawn)
        ↓
MLPrediction saved to PostgreSQL
        ↓
Express API response
        ↓
React MlDetectionPage
```

All API responses include `mode: "REPLAY_SERIES"` or `mode: "ENGINEERED_VECTOR"`.  
All PostgreSQL records include `rawFeatureRef: "local-inference://REPLAY_SERIES"`.  
`isDemo: false` — the real model is used, not a random number generator.

---

## 8. Future Live Architecture (Linux Only)

> ⚠️ **NOT IMPLEMENTED** — requires Linux host with `perf_event_open` capability.

```
Docker Charging Server (OCPP Authentication workload)
        ↓
Linux perf-compatible TOP collector
        ↓
Real-time kernel-symbol series (per charging session)
        ↓
ml/inference/extract_and_predict.py (same feature extractor)
        ↓
ml/inference/predict.py (same model.joblib)
        ↓
NORMAL / ATTACK decision
        ↓
Express API → PostgreSQL → React
```

The `perf_event_open` syscall is a Linux kernel facility. It is not available on Windows. All Windows development uses CICEV2023 replay fixtures as a substitute.

---

## 9. API Reference

Base URL: `http://localhost:5000/api/v1`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/health` | Backend + PostgreSQL health check |
| GET | `/dashboard` | Aggregated SOC summary |
| GET | `/stations` | All charging stations |
| GET | `/stations/:id` | Single station details |
| GET | `/attacks` | All attack incidents |
| GET | `/attacks/:id` | Single attack details |
| GET | `/alerts` | All security alerts |
| GET | `/alerts/:id` | Single alert details |
| GET | `/analytics` | Trend / analytics data |
| GET | `/ml/status` | ML model status |
| GET | `/ml/metrics` | ML evaluation metrics |
| POST | `/ml/predict` | Run inference (body: feature vector or raw series) |

---

## 10. Security Considerations

- **No secrets in source**: `.env` is gitignored; `.env.example` provided with placeholder values.
- **Subprocess safety**: `child_process.spawn` with explicit `python` path and argument array — no shell injection.
- **Input validation**: ML predict endpoint validates presence of required fields before spawning Python.
- **No exposed stack traces**: Backend returns structured error responses; stack traces are logged server-side only.
- **No external ML APIs**: All inference is local. No OpenAI, Hugging Face, or cloud ML calls.

---

## 11. Known Limitations

1. **Linux perf tracing** — Not available on Windows. All ML inference uses CICEV2023 replay input.
2. **FPR at 50%** — Model performance is acceptable for a Mini Project. The CICEV2023 dataset feature families (TIME_DELTA, STAT) were not fused with TOP features due to absence of a common event/window identifier.
3. **Demo data** — ChargingStation, AttackIncident, SecurityAlert seeded with demo records (3 each). Production would ingest real OCPP telemetry.
4. **No authentication** — API has no JWT/session auth. Suitable for Mini Project; production requires auth middleware.
5. **Single-node** — No load balancing or clustering. Production would use PM2 or containerisation.

---

## 12. How to Run the Project

### Prerequisites
- Node.js ≥ 18 (tested: v24.19.0)
- Python ≥ 3.10 (tested: 3.14.4)
- PostgreSQL ≥ 14 running locally
- `pip install scikit-learn joblib numpy pandas`

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL=postgresql://USER:PASS@localhost:5432/evshield_db
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
# → http://localhost:5000
```

### Frontend Setup
```bash
cd Frontend
npm install
npm run dev
# → http://localhost:5173
```

### Verify ML
```bash
# Direct Python inference test
echo '{"count":14,"mean":2.4964,"max":3.26,"sum":34.95,"std":0.3929,"min":1.96,"median":2.47,"q1":2.15,"q3":2.7275,"iqr":0.5775}' | py ml/inference/predict.py
# Expected: {"probability_attack": 0.3175, "predicted_label": 0, "label": "NORMAL", "threshold": 0.55}

# Replay series test
echo '{"data_point":[3.26,2.94,2.41,2.13,1.96,2.59,2.1,2.76,2.63,2.36],"symbol":"__update_load_avg_se"}' | py ml/inference/extract_and_predict.py
# Expected: NORMAL or ATTACK with extracted_features
```

### Example API Request
```bash
# Health check
curl http://localhost:5000/api/v1/health

# ML predict (ENGINEERED_VECTOR)
curl -X POST http://localhost:5000/api/v1/ml/predict \
  -H "Content-Type: application/json" \
  -d '{"count":14,"mean":2.4964,"max":3.26,"sum":34.95,"std":0.3929,"min":1.96,"median":2.47,"q1":2.15,"q3":2.7275,"iqr":0.5775}'
```

---

## 13. How to Demonstrate the Project

1. Start PostgreSQL.
2. `cd backend && npm run dev` → Backend on `:5000`.
3. `cd Frontend && npm run dev` → Frontend on `:5173`.
4. Open browser → `http://localhost:5173`.
5. Dashboard shows **API ONLINE** status chip.
6. Navigate to **Charging Network** — 5 spread city nodes, no overlap.
7. Navigate to **ML Detection** → model status READY, metrics visible.
8. Click **REPLAY_SERIES** → **Run Prediction** → real model returns NORMAL/ATTACK.
9. Navigate to **Settings** → ML Engine section shows live model details from API.
10. Click **SIMULATE DDoS** (topbar) → dashboard shifts to attack state.
11. Navigate to **Charging Network** — Mumbai node shows ATTACK pulse.
12. Click **END SIMULATION** → returns to normal.
13. Navigate to **Attack Logs** and **Alerts** — PostgreSQL-backed data.
14. Check text selection on any card — clearly readable.
15. Navigate between all pages — smooth 160 ms fade + slide transition.
