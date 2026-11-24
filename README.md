# TrafficIQ 🚦
### Smart Traffic Analysis and Urban Road Information Platform

TrafficIQ is a web-based platform designed to explore traffic patterns, analyse road-segment congestion, and make road-related information more accessible. It combines machine-learning-based traffic analysis with citizen-oriented features for reporting and discovering road issues.

The project aims to make traffic information useful not only for technical users but also for everyday commuters.

---

## 📌 Project Overview

TrafficIQ focuses on two major areas:

1. **Traffic Analytics:** Exploring traffic datasets and identifying patterns using unsupervised machine learning.
2. **Urban Road Information:** Providing a platform for road-issue reporting, nearby issue discovery, parking information, construction updates, and accessibility-related information.

## ✨ Features

### 1. Traffic Analytics
- Traffic dataset exploration and preview.
- Numerical and categorical feature identification.
- Missing-value and duplicate-record analysis.
- Data preprocessing and feature scaling.
- K-Means clustering workflow.
- PCA-based data visualisation.
- Cluster interpretation and analysis.
- Traffic feature correlation analysis.

### 2. Citizen Reporting System
Designed to allow citizens to report road-related problems, such as:
- Potholes and damaged roads.
- Fallen trees and branches.
- Waterlogging.
- Road blockages.
- Damaged traffic signals.
- Accident debris.

Reports can include descriptions, locations, photographs, and issue details where supported by the application.

### 3. Reported Issues Near Me
- Discover nearby reported road issues.
- Location-based issue discovery.
- View issue categories and report information.
- Help commuters become aware of road problems.

### 4. Smart Parking Finder
- Explore registered parking locations.
- Find parking information in one place.
- Display availability and pricing when reliable information is available.

### 5. Road Construction and Diversion Updates
- View road maintenance information.
- Explore construction and closure updates.
- Display diversion information where available.

### 6. Accessibility-Friendly Road Information
- Highlight reported footpath problems.
- Identify accessibility barriers.
- Share information about damaged crossings and missing ramps.

---

## 🧠 Machine Learning Methodology

TrafficIQ uses unsupervised learning to explore similarities between road-segment observations.

**K-Means Clustering**

K-Means groups similar traffic observations based on selected numerical features. It helps explore different traffic patterns without requiring predefined congestion labels.

**Principal Component Analysis (PCA)**

PCA reduces the dimensions of numerical data and helps visualise patterns in a two-dimensional representation.

**Data Preprocessing**

The workflow includes:
- Missing-value handling.
- Duplicate-record handling.
- Feature scaling.
- Numerical and categorical feature inspection.

**Evaluation Metrics**

The clustering workflow is designed to support:
- Within-Cluster Sum of Squares (WCSS).
- Silhouette Score.
- Davies–Bouldin Index.
- Elbow Method.

Final metric values should be taken from successfully executed experiments rather than assumed.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Development Server | Vite |
| Backend | Python |
| API Framework | Flask |
| Database | SQLite |
| Machine Learning | Scikit-learn |
| Data Processing | Pandas, NumPy |
| Visualisation | Matplotlib |
| Clustering | K-Means |
| Dimensionality Reduction | PCA |
| Version Control | Git and GitHub |

---

## 🏗️ Project Architecture

```text
TrafficIQ/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app.py
│   ├── database/
│   ├── routes/
│   ├── models/
│   ├── preprocessing/
│   ├── clustering/
│   └── visualization/
│
├── README.md
└── requirements.txt
```

*The directory structure above is a high-level representation. Adjust it to match the actual files in your repository.*

---

## ⚙️ Installation and Setup

### Prerequisites

Install the following:
- Python 3.10 or later (depending on project dependencies).
- Node.js and npm.
- Git.

### 1. Clone the repository

```bash
git clone https://github.com/shauryaverma29/TrafficIQ.git
cd TrafficIQ
```

### 2. Set up the backend

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
python app.py
```

### 3. Set up the frontend

Open another terminal:

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

Open the local frontend URL displayed in your terminal, usually:

```text
http://localhost:5173
```

The backend and frontend must both be running for API-connected features to work.

---

## 📊 Dataset

TrafficIQ uses a traffic prediction dataset for exploring road-segment traffic patterns.

The dataset includes fields such as:
- Road name and road type.
- Hour of day and day of week.
- Traffic volume.
- Average speed.
- Congestion index.
- Occupancy percentage.
- Weather condition.
- Incident indicator.

**Dataset source:** Add the exact Kaggle dataset URL used in your final project here.

---

## 🔗 API Overview

The backend includes API routes used by the frontend. Routes observed during development include:

```text
/api/stats/summary
/api/hazards/traffic-correlation
/api/dataset/overview
```

Check the backend source code for the complete and current API route list.

---

## 🎯 Project Objectives

- Make traffic data easier to understand.
- Explore congestion patterns using unsupervised learning.
- Provide an accessible interface for traffic-data analysis.
- Bring citizen-reported road issues into the same platform.
- Improve access to
