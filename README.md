# TrafficIQ – Road-Segment Congestion Profiles Through Unsupervised Learning

This repository contains the complete **TrafficIQ** web application and machine learning engine for the Unsupervised Learning project.

All application code, models, and data are organized inside the [`TrafficIQ/`](file:///c:/Users/VICTUS/OneDrive/Desktop/unsupervised/TrafficIQ) directory.

## Quickstart Instructions

### 1. Backend (Flask ML Server)
```bash
cd TrafficIQ/backend
python -m venv venv

# Windows:
venv\Scripts\activate

# Install dependencies:
pip install -r requirements.txt

# Run server:
python app.py
```
Backend runs on `http://localhost:5000`.

---

### 2. Frontend (React + Vite + Tailwind CSS)
```bash
cd TrafficIQ/frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

For complete architectural details, mathematical notes on Euclidean vs. Manhattan distance, and API documentation, see the [TrafficIQ README](file:///c:/Users/VICTUS/OneDrive/Desktop/unsupervised/TrafficIQ/README.md).
