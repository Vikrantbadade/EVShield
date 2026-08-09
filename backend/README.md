# EVShield Backend API & Persistent Data Layer

Express + TypeScript REST API backend for **EVShield** — protecting EV charging authentication infrastructure against DDoS attacks.

---

## Overview & Architecture

The EVShield backend connects the React frontend to PostgreSQL via Prisma ORM and orchestrates local Python Machine Learning inference (CICEV2023 `RandomForestClassifier`).

```
React Frontend (Port 5173)
        ↓ (HTTP REST)
Node.js / Express Backend (Port 5000)
        ├──────────────────────────┐
        ↓ (Prisma ORM Client)      ↓ (child_process.spawn)
PostgreSQL                     Python ML Service
(evshield_db:5432)             ml/inference/extract_and_predict.py
                                   ↓
                               model.joblib (RandomForest n=400)
```

---

## Directory Structure

```
backend/
├── prisma/
│   ├── schema.prisma           # Database schema (5 models)
│   └── seed.ts                 # Database seed script
├── src/
│   ├── app.ts                  # Express App configuration & middleware
│   ├── server.ts               # HTTP Server listener & entry point
│   ├── config/
│   │   ├── env.ts              # Strongly typed environment configuration
│   │   └── database.ts         # PrismaClient singleton & connection checker
│   ├── routes/                 # API endpoint routers (/api/v1/*)
│   ├── controllers/            # Controller layer handling HTTP req/res
│   ├── services/               # Services (PostgreSQL Prisma queries + ML spawn)
│   ├── middleware/             # Error handling, 404, request validation
│   ├── schemas/                # Zod request validation schemas
│   ├── types/                  # TypeScript interface contracts
│   └── utils/                  # Standardized API response helpers
├── package.json
├── tsconfig.json
└── README.md
```

---

## Setup & Running

### Prerequisites
- Node.js v18+ (tested v24.19.0)
- PostgreSQL 14+ database `evshield_db` on port 5432
- Python 3.10+ with `scikit-learn`, `joblib`, `numpy`, `pandas`

### Installation & Execution
```bash
# 1. Install dependencies
npm install

# 2. Configure environment (.env)
cp .env.example .env

# 3. Migrate and seed PostgreSQL
npx prisma migrate dev --name init
npx prisma db seed

# 4. Typecheck & Build
npm run typecheck
npm run build

# 5. Start dev server
npm run dev
# -> Listening on http://localhost:5000
```

---

## API Endpoints (`/api/v1`)

| Method | Endpoint | Description | Data Source |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Health check & DB latency | PostgreSQL ping |
| `GET` | `/api/v1/dashboard` | Aggregated security metrics | Prisma aggregations |
| `GET` | `/api/v1/attacks` | List attack incidents | `AttackIncident` table |
| `GET` | `/api/v1/stations` | List charging stations telemetry | `ChargingStation` table |
| `GET` | `/api/v1/alerts` | List security alerts | `SecurityAlert` table |
| `GET` | `/api/v1/analytics` | Network threat analytics | Prisma aggregations |
| `GET` | `/api/v1/ml/status` | ML model status (`READY`, `isDemo: false`) | Local ML adapter |
| `GET` | `/api/v1/ml/metrics` | CICEV2023 evaluation metrics | `metrics.json` artifact |
| `POST` | `/api/v1/ml/predict` | Run local ML inference | Python subprocess (`model.joblib`) → saved to `MLPrediction` |

---

## ML Integration Layer

`ml.service.ts` executes predictions by spawning a Python child process (`child_process.spawn`):

1. Accepts either `REPLAY_SERIES` (`data_point[]` + `symbol`) or `ENGINEERED_VECTOR` (10 TOP features).
2. Spawns `ml/inference/extract_and_predict.py` using Python.
3. Python extracts features using `build_top_richer_stats_v1.py` and runs `predict.py` against `model.joblib` @ threshold `0.55`.
4. Result (classification, confidence, threshold, mode) is returned to Node.js.
5. Node.js persists every inference to PostgreSQL `MLPrediction` (`isDemo: false`).
