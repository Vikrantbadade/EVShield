# EVShield — EV Charging Infrastructure Cybersecurity SOC Platform

EVShield is an open-source cybersecurity Security Operations Centre (SOC) platform designed to detect, monitor, and mitigate Distributed Denial-of-Service (DDoS) attacks targeting Electric Vehicle (EV) charging authentication gateways.

---

## 🚀 Key Features

- **Real-Time SOC Dashboard**: Monitor EV charging station telemetry, authentication request rates, and system security posture.
- **Interactive Network Topology**: Visual SVG map showing regional charging nodes (Mumbai, Delhi, Bengaluru, Pune, Hyderabad) with live health indicators.
- **Real Local ML Inference**: Integrated CICEV2023 `RandomForestClassifier` (n=400, frozen threshold 0.55) executing locally via Python subprocess (`child_process.spawn`).
- **PostgreSQL Persistence**: Automatic recording of all ML inference decisions and security telemetry via Prisma ORM.
- **Interactive SOC Settings**: Full settings management (Auto-refresh, Alert thresholds, Reduced motion, ML engine status, System health).
- **DDoS Attack Simulation**: Integrated interactive demo simulation mode to test frontend SOC alert responses.

---

## 🏗️ Architecture

```
React (Vite + TS)  ──HTTP/REST──> Express API ──> PostgreSQL (Prisma ORM)
                                       │
                                child_process.spawn
                                       │
                                       ▼
                                Python ML Service
                        (model.joblib + extract_and_predict.py)
```

For complete technical documentation, see [`docs/final_architecture.md`](docs/final_architecture.md).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js v24, Express 4, Prisma ORM 5.22, PostgreSQL 14+
- **Machine Learning**: Python 3.14, Scikit-Learn 1.x, Joblib, NumPy, Pandas
- **Dataset**: CICEV2023 EV Authentication Security Benchmark

---

## 🏁 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (v24 recommended)
- **Python**: 3.10+ with packages: `pip install scikit-learn joblib numpy pandas`
- **PostgreSQL**: Local or remote instance running

### 1. Backend Setup
```bash
cd backend
cp .env.example .env

# Configure PostgreSQL connection in .env:
# DATABASE_URL="postgresql://postgres:12345678@localhost:5432/evshield_db?schema=public"

npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```
Backend will start on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:5173`.

---

## 🧠 Machine Learning Model Verification

You can verify the ML pipeline directly using Python CLI scripts:

```bash
# 1. Direct prediction using pre-calculated 10-feature vector
py ml/inference/predict.py < sample_vector.json

# 2. Extract features from CICEV2023 kernel time series & predict
py ml/inference/extract_and_predict.py < sample_series.json
```

### ML Performance Summary (Held-Out TEST Set @ 0.50 Threshold)
- **Accuracy**: 69.60%
- **Precision**: 75.59%
- **Recall**: 79.73%
- **F1 Score**: 77.60%
- **ROC-AUC**: 0.7577

---

## 📁 Repository Structure

```
EVShield/
├── backend/                  # Node.js + Express REST API & Prisma schema
├── Frontend/                 # React + Vite + TypeScript SOC web client
├── ml/                       # CICEV2023 ML model, feature engineering & inference scripts
│   ├── experiments/          # Trained model.joblib, metrics.json & threshold.json
│   ├── inference/            # extract_and_predict.py & predict.py
│   └── dataset/              # CICEV2023 dataset samples
└── docs/                     # Architectural documents & dataset specifications
```

---

## 🔒 Security & Environment
Do not commit sensitive secrets or passwords. Environment variables are managed via `.env` files (excluded via `.gitignore`). Refer to `.env.example` for required configuration keys.

---

## 📄 License
This project is developed as part of an EV Charging Cybersecurity Mini-Project.