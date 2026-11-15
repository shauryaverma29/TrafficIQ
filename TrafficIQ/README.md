# TrafficIQ: Road-Segment Congestion Profiles Through Unsupervised Learning

> **Tagline:** *Discover Hidden Traffic Patterns Through Unsupervised Learning*  
> **Course:** Unsupervised Machine Learning | Academic Capstone Project

---

## 1. Project Overview

**TrafficIQ** is an interactive, production-grade web application engineered to discover empirical road-segment congestion profiles without requiring supervisory labels. By ingesting multidimensional sensor data (such as vehicle volume, speeds, roadway occupancy percentages, and environmental variables), the system uses Scikit-Learn machine learning algorithms to:

1. **Profile & Clean Datasets:** Detect missing observations, compute IQR outlier statistics, eliminate duplicate sensor pings, and encode categorical road characteristics.
2. **Standardize Feature Space:** Apply `StandardScaler` (z-score normalization) or `MinMaxScaler` to equilibrate feature scales before distance computation.
3. **Optimize Clusters:** Evaluate multi-K sweeps ($K=2$ to $10$) across Within-Cluster Sum of Squares (WCSS / Inertia), Silhouette Score, and Davies-Bouldin Index.
4. **Compare Distance Metrics:** Benchmark standard Euclidean $K$-Means against $K$-Medoids utilizing L1 Manhattan (cityblock) distance to assess sensitivity to outlier traffic spikes.
5. **Project Manifolds with PCA:** Reduce high-dimensional feature spaces into 2D and 3D orthogonal coordinates with explained variance ratios and eigenvector component loadings.
6. **Interpret Discovered Profiles:** Dynamically generate statistically grounded descriptions (e.g., *"Cluster 1 exhibits 42% lower average speeds and 78% higher congestion indices than the global baseline"*).
7. **Audit Partitioning Stability:** Execute multi-seed clustering ($5$ distinct random seeds) and measure assignment agreement via the Adjusted Rand Index (ARI).
8. **Export Formal Deliverables:** Generate downloadable academic PDF research reports (compiled using ReportLab) and export CSV datasets (processed features, clustered road segments, and evaluation tables).

---

## 2. System Architecture

```
TrafficIQ/
│
├── frontend/                     # React 18 + Vite + Tailwind CSS User Interface
│   ├── src/
│   │   ├── charts/
│   │   │   └── PlotlyChart.jsx   # Dark-themed responsive Plotly.js chart wrapper
│   │   ├── components/
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx       # 9-page sidebar navigation
│   │   │   └── StatusBadge.jsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── DatasetPage.jsx
│   │   │   ├── PreprocessingPage.jsx
│   │   │   ├── ClusteringPage.jsx
│   │   │   ├── PcaPage.jsx
│   │   │   ├── InterpretationPage.jsx
│   │   │   ├── StabilityPage.jsx
│   │   │   ├── ReportPage.jsx
│   │   │   └── AboutPage.jsx
│   │   ├── services/
│   │   │   └── api.js            # Axios client communicating with Flask REST API
│   │   ├── App.jsx               # Application controller & state synchronization
│   │   ├── index.css             # Tailwind base & glassmorphic styling
│   │   └── main.jsx
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js            # Configured with proxy to http://localhost:5000
│
├── backend/                      # Python Flask REST API & Scikit-Learn Engine
│   ├── app.py                    # Flask server entry point & CORS configuration
│   ├── requirements.txt          # Python library specifications
│   ├── models/
│   │   └── state_manager.py      # In-memory session state management
│   ├── preprocessing/
│   │   ├── cleaner.py            # Missing value imputation, duplicates, IQR outliers
│   │   ├── encoder.py            # Categorical one-hot encoding
│   │   ├── feature_selector.py   # Automated feature type & ID detection
│   │   └── scaler.py             # StandardScaler & MinMaxScaler
│   ├── clustering/
│   │   ├── kmeans_engine.py      # Scikit-learn KMeans, WCSS, Silhouette, Davies-Bouldin
│   │   ├── kmedoids_engine.py    # L1 Manhattan K-Medoids (PAM) distance comparison
│   │   └── stability_engine.py   # Multi-seed Adjusted Rand Index (ARI) analysis
│   ├── visualization/
│   │   ├── pca_engine.py         # 2D/3D PCA & eigenvector feature loadings
│   │   └── interpretation_engine.py # Evidence-grounded natural language profile generator
│   ├── reports/
│   │   └── pdf_generator.py      # ReportLab academic PDF generator
│   └── routes/
│       ├── dataset_routes.py     # CSV upload, demo dataset, correlations, outliers
│       ├── preprocessing_routes.py # Preprocessing execution & audit logging
│       ├── clustering_routes.py  # Elbow parameter sweeps, KMeans, Manhattan comparison
│       ├── pca_routes.py         # PCA projection endpoints
│       ├── interpretation_routes.py # Dynamic cluster interpretation endpoints
│       ├── stability_routes.py   # Multi-seed ARI stability endpoints
│       └── report_routes.py      # PDF downloads & CSV export endpoints
│
├── data/
│   ├── traffic_kaggle_demo.csv   # Pre-bundled 1,205-row realistic traffic sensor dataset
│   ├── generate_data.py          # Synthetic dataset generator script
│   └── README.md                 # Dataset provenance & schema documentation
│
├── README.md
└── .gitignore
```

---

## 3. Installation & Setup Guide

### Prerequisites
- **Python:** 3.10 or higher
- **Node.js:** v18 or higher (LTS recommended)
- **Visual Studio Code**

---

### Step 1: Backend Setup (Flask REST API)

1. Open a terminal in the `TrafficIQ/backend` directory:
   ```bash
   cd TrafficIQ/backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (Command Prompt / PowerShell):**
     ```powershell
     python -m venv venv
     venv\Scripts\activate
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Launch the Flask ML server:
   ```bash
   python app.py
   ```
   *The backend will boot on `http://localhost:5000` and automatically preload the demonstration Kaggle traffic dataset.*

---

### Step 2: Frontend Setup (React + Vite)

1. Open a second terminal in the `TrafficIQ/frontend` directory:
   ```bash
   cd TrafficIQ/frontend
   ```

2. Install npm packages:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The web application will be accessible at `http://localhost:5173`.*

---

## 4. REST API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend service health & state verification |
| `POST` | `/api/dataset/upload` | Ingest and profile custom user CSV file |
| `POST` | `/api/dataset/load-demo` | Reload bundled Kaggle traffic prediction demonstration dataset |
| `GET` | `/api/dataset/overview` | Retrieve row/column counts, missing values, duplicates, and feature types |
| `GET` | `/api/dataset/preview` | Retrieve first $N$ sample rows |
| `GET` | `/api/dataset/correlations` | Compute Pearson correlation matrix across numeric features |
| `GET` | `/api/dataset/distributions` | Retrieve histogram bin distributions for features |
| `GET` | `/api/dataset/outliers` | Compute 1.5 $\times$ IQR outlier statistics |
| `POST` | `/api/preprocessing/preprocess` | Apply missing imputation, encoding, deduplication, and scaling |
| `POST` | `/api/clustering/elbow-evaluation` | Evaluate $K=2..10$ across WCSS, Silhouette, and Davies-Bouldin |
| `POST` | `/api/clustering/run` | Fit final Scikit-Learn KMeans model and generate profiles |
| `POST` | `/api/clustering/compare-manhattan` | Benchmark Euclidean KMeans against Manhattan K-Medoids |
| `GET` | `/api/pca/` | Compute 2D/3D PCA coordinates and component feature loadings |
| `GET` | `/api/interpretation/` | Retrieve cluster means table, z-score heatmap data, and narratives |
| `POST` | `/api/stability/` | Compute multi-seed Adjusted Rand Index (ARI) matrix |
| `GET` | `/api/report/pdf` | Compile and stream publication-quality academic PDF report |
| `GET` | `/api/report/export/processed-csv` | Download standardized preprocessed feature matrix |
| `GET` | `/api/report/export/clustered-csv` | Download dataset with assigned cluster labels |
| `GET` | `/api/report/export/metrics-csv` | Download multi-K evaluation metrics table |

---

## 5. Mathematical & Methodological Foundations

### A. Distance Metrics: Euclidean vs. Manhattan
Standard Scikit-Learn $K$-Means minimizes squared Euclidean distance (L2 norm):
$$J = \sum_{j=1}^{k} \sum_{x_i \in S_j} \|x_i - \mu_j\|_2^2$$
Because centroid updates represent continuous arithmetic averages ($\mu_j = \frac{1}{|S_j|} \sum x_i$), the algorithm is inherently grounded in squared Euclidean loss.

To compare against **Manhattan (L1) distance** without distorting centroid geometry, TrafficIQ implements a dedicated **$K$-Medoids (Partitioning Around Medoids - PAM)** workflow. Medoids are constrained to actual observed road segments ($m_j \in X$), minimizing sum of cityblock distances:
$$J_{L1} = \sum_{j=1}^{k} \sum_{x_i \in S_j} \|x_i - m_j\|_1$$
This formulation is notably more robust against severe sensor noise and extreme outlier traffic gridlocks.

### B. Principal Component Analysis (PCA)
Eigenvector decomposition of the feature covariance matrix identifies orthogonal principal axes:
$$\mathbf{X}^T \mathbf{X} \mathbf{v}_i = \lambda_i \mathbf{v}_i$$
The application presents 2D and 3D projections along with exact cumulative explained variance and component loading coefficients.

### C. Cluster Stability via Adjusted Rand Index (ARI)
To confirm that discovered clusters reflect genuine geometric manifolds rather than local minima artifacts, TrafficIQ trains models across multiple independent random seeds ($10, 42, 101, 777, 2024$) and computes pairwise agreement using the Adjusted Rand Index:
$$\text{ARI} = \frac{\text{Index} - \text{Expected Index}}{\text{Max Index} - \text{Expected Index}}$$
An average score exceeding $0.85$ confirms high algorithmic stability and reproducible congestion profiles.

---

## 6. Responsible Use & Methodological Limitations

As detailed in Section 10 of the application:
1. **Exploratory Nature:** Discovered clusters reflect mathematical partitions based on geometric distances in the sample and must not be treated as deterministic or permanent roadway classifications.
2. **Sampling Bias:** Observations gathered from fixed detectors may underrepresent non-instrumented corridors.
3. **Temporal Invariance:** Static clustering does not account for long-term urban shifts without recurring calibration.
4. **Decision Support:** Outputs are intended exclusively to guide human traffic engineers and urban planning analysts rather than serve as autonomous policy enforcement triggers.
