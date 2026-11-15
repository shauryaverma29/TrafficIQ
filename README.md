# TrafficIQ 🚦
### Road-Segment Congestion Profile Discovery Using Unsupervised Machine Learning

TrafficIQ is an interactive traffic analytics platform designed to discover hidden traffic patterns and identify road-segment congestion profiles using unsupervised machine learning techniques.

The project applies clustering algorithms to traffic data to identify groups of road segments with similar traffic characteristics. It also provides interactive visualisations, clustering evaluation metrics, and interpretable cluster profiles to understand traffic behaviour.

---

## 📌 Project Overview

Traffic congestion is a major challenge in modern urban transportation systems. Understanding traffic patterns across different road segments can help identify similarities in traffic behaviour and provide insights into congestion characteristics.

TrafficIQ uses unsupervised learning to analyse traffic data without predefined labels. By applying clustering techniques, the system discovers naturally occurring groups of road-segment observations based on their traffic-related features.

The platform provides an interactive environment for dataset exploration, preprocessing, clustering experiments, performance evaluation, and visual interpretation.

## 🎯 Project Objectives

- Prepare and preprocess the selected Kaggle Traffic Prediction Dataset.
- Identify relevant numerical and categorical features.
- Handle missing values, duplicates, and potential outliers.
- Encode categorical variables and standardise numerical features.
- Implement K-Means clustering across multiple cluster counts.
- Compare Euclidean and Manhattan distance-based clustering approaches where appropriate.
- Evaluate clustering performance using WCSS, Silhouette Score, and Davies-Bouldin Index.
- Apply Principal Component Analysis (PCA) for dimensionality reduction and visualisation.
- Interpret discovered congestion profiles using cluster statistics.
- Evaluate clustering stability across different configurations and random initialisations.
- Document dataset limitations, potential biases, and responsible-use considerations.

## ✨ Key Features

### 1. Dataset Exploration
- CSV dataset upload.
- Dataset preview and statistical summary.
- Numerical and categorical feature identification.
- Missing value detection.
- Duplicate record detection.
- Feature distribution and correlation analysis.

### 2. Data Preprocessing
- Missing value imputation.
- Categorical feature encoding.
- Numerical feature standardisation.
- Outlier analysis using the IQR method.
- Feature selection.
- Before-and-after preprocessing comparison.

### 3. Clustering Analysis
- K-Means clustering.
- Multiple cluster count experiments.
- Euclidean distance-based clustering.
- Manhattan distance comparison using K-Medoids where applicable.
- Configurable clustering parameters.

### 4. Clustering Evaluation
- Within-Cluster Sum of Squares (WCSS).
- Silhouette Score.
- Davies-Bouldin Index.
- Elbow Method.
- Comparison of different clustering configurations.

### 5. PCA Visualisation
- Two-dimensional PCA projection.
- Interactive cluster scatter plots.
- Explained variance analysis.
- Cluster separation visualisation.

### 6. Cluster Interpretation
- Cluster-wise statistical summaries.
- Cluster size and distribution.
- Feature profile comparisons.
- Identification of traffic behaviour patterns.
- Interpretation of congestion-related characteristics.

### 7. Stability Analysis
- Comparison across random initialisations.
- Adjusted Rand Index (ARI).
- Cluster assignment consistency.
- Stability evaluation across tested configurations.

### 8. Report Generation
- Downloadable clustering reports.
- Processed dataset export.
- Cluster-labelled dataset export.
- Evaluation results export.

---

## 🧠 Machine Learning Methodology

The project follows a structured unsupervised learning workflow.

```text
Kaggle Traffic Prediction Dataset
              |
              v
       Data Exploration
              |
              v
       Data Preprocessing
              |
              v
       Feature Selection
              |
              v
      Feature Standardisation
              |
              v
       Clustering Analysis
              |
       +------+------+
       |             |
       v             v
     K-Means      K-Medoids
    (Euclidean)   (Manhattan)
       |             |
       +------+------+
              |
              v
     Clustering Evaluation
              |
              v
       PCA Visualisation
              |
              v
      Cluster Interpretation
              |
              v
       Stability Analysis
              |
              v
       Final Project Report
```

**Note:** Standard K-Means uses Euclidean distance. Manhattan distance is evaluated separately through K-Medoids to maintain methodological correctness.

## 📊 Evaluation Metrics

| Metric | Purpose |
|---|---|
| WCSS | Measures within-cluster variation |
| Silhouette Score | Measures cluster cohesion and separation |
| Davies-Bouldin Index | Evaluates similarity between clusters |
| Adjusted Rand Index | Measures consistency between clustering assignments |

The final configuration will be selected by considering multiple evaluation metrics, cluster interpretability, and stability rather than relying on a single score.

## 🛠️ Technology Stack

**Frontend**
- React.js
- Vite
- Tailwind CSS
- JavaScript
- Plotly.js

**Backend**
- Python
- Flask
- REST APIs

**Machine Learning and Data Processing**
- Scikit-learn
- Pandas
- NumPy
- SciPy

**Visualisation**
- Plotly
- PCA
- Interactive charts and heatmaps

**Development Tools**
- Visual Studio Code
- Git
- GitHub

---

## 📁 Project Structure

```text
TrafficIQ/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── charts/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── routes/
│   ├── models/
│   ├── preprocessing/
│   ├── clustering/
│   ├── visualization/
│   └── reports/
│
├── data/
│   └── README.md
│
├── README.md
└── .gitignore
```

---

## ⚙️ Installation and Setup

### Prerequisites

Make sure you have installed:

- Python 3.10 or above
- Node.js and npm
- Git
- Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/TrafficIQ.git

cd TrafficIQ
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the environment on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask server:

```bash
python app.py
```

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

---

## 📂 Dataset

**Dataset:** Traffic Prediction Dataset

**Source:** Kaggle

The project uses traffic-related observations to discover patterns across road segments.

The dataset is uploaded through the application in CSV format.

The actual dataset structure is inspected dynamically to identify available features, data types, and missing values.

Only relevant features are selected for clustering. Identifier columns and non-informative variables are excluded unless there is a valid analytical reason to include them.

---

## 📈 Expected Outcomes

The project aims to produce:

- Meaningful groups of road-segment observations.
- Identification of similarities in traffic behaviour.
- Comparison of different clustering configurations.
- Visual understanding of cluster separation using PCA.
- Quantitative evaluation of clustering quality.
- Interpretable cluster profiles based on actual dataset characteristics.
- Insights into the stability and limitations of discovered traffic patterns.

Actual findings and numerical results will be documented after running the analysis on the selected dataset.

---

## ⚠️ Limitations and Responsible Use

- Clustering results depend on feature selection and preprocessing decisions.
- K-Means is sensitive to initialisation and the selected number of clusters.
- PCA may result in information loss during dimensionality reduction.
- Missing or inaccurate observations can affect discovered patterns.
- Dataset sampling and geographic representation may introduce bias.
- Discovered clusters represent exploratory patterns, not permanent real-world road categories.

TrafficIQ is intended for academic exploration and traffic pattern discovery. Its results should not be treated as definitive traffic classifications or used for high-stakes transportation decisions without further validation.

---

## 🎓 Academic Information

**Project Title:** Road-Segment Congestion Profiles for Traffic Pattern Discovery Through Clustering

**Subject:** Unsupervised Learning

**Project Type:** Machine Learning / Data Analytics

**Primary Algorithm:** K-Means Clustering

**Additional Comparison:** K-Medoids with Manhattan Distance

**Dimensionality Reduction:** Principal Component Analysis (PCA)

---

## 👨‍💻 Author

Developed as an academic project to explore unsupervised machine learning techniques and their application in traffic pattern discovery.

---

## 📜 License

This project is developed for educational and academic purposes. A suitable open-source license can be added when the repository is published.
