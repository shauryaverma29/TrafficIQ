import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import DatasetPage from './pages/DatasetPage';
import PreprocessingPage from './pages/PreprocessingPage';
import ClusteringPage from './pages/ClusteringPage';
import PcaPage from './pages/PcaPage';
import InterpretationPage from './pages/InterpretationPage';
import StabilityPage from './pages/StabilityPage';
import ReportPage from './pages/ReportPage';
import AboutPage from './pages/AboutPage';
import api from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [overview, setOverview] = useState(null);
  const [clusteringData, setClusteringData] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);

  const pageTitles = {
    dashboard: { title: 'Smart City Traffic Dashboard', subtitle: 'Real-time overview of road-segment clustering metrics' },
    dataset: { title: 'Dataset Explorer & Ingestion', subtitle: 'Upload CSV or benchmark with Kaggle Traffic Prediction data' },
    preprocessing: { title: 'Data Preprocessing Module', subtitle: 'Imputation strategies, categorical encoding, and standardisation' },
    clustering: { title: 'K-Means Clustering Lab', subtitle: 'Multi-K parameter optimization and Manhattan distance benchmarking' },
    pca: { title: 'PCA Dimensionality Reduction', subtitle: '2D & 3D orthogonal projections and eigenvector feature loadings' },
    interpretation: { title: 'Cluster Interpretation & Profiles', subtitle: 'Evidence-grounded statistical characterization of congestion states' },
    stability: { title: 'Cluster Stability Analysis', subtitle: 'Multi-seed validation via pairwise Adjusted Rand Index (ARI)' },
    report: { title: 'Project Report & Data Export', subtitle: 'Download academic PDF reports and export clustered CSV artifacts' },
    about: { title: 'About Project & Responsible Use', subtitle: 'Methodological limitations, bias audits, and architectural notes' },
  };

  const fetchOverview = async () => {
    try {
      const data = await api.getOverview();
      setOverview(data);
      setIsOnline(true);
    } catch (err) {
      console.error("Failed to fetch overview", err);
      setIsOnline(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleLoadDemo = async () => {
    setLoading(true);
    try {
      await api.loadDemoDataset();
      await fetchOverview();
    } catch (err) {
      console.error("Failed to load demo", err);
    } finally {
      setLoading(false);
    }
  };

  const currentMeta = pageTitles[currentPage] || { title: 'TrafficIQ', subtitle: '' };

  return (
    <div className="flex h-screen bg-[#0B0F19] text-slate-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        datasetOverview={overview}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          onRefresh={fetchOverview}
          onLoadDemo={handleLoadDemo}
          isOnline={isOnline}
          loading={loading}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'dashboard' && (
              <DashboardPage
                overview={overview}
                clusteringData={clusteringData}
                onNavigate={setCurrentPage}
                onLoadDemo={handleLoadDemo}
              />
            )}

            {currentPage === 'dataset' && (
              <DatasetPage
                overview={overview}
                onDatasetChange={fetchOverview}
                onLoadDemo={handleLoadDemo}
              />
            )}

            {currentPage === 'preprocessing' && (
              <PreprocessingPage
                overview={overview}
                onPreprocessed={fetchOverview}
                onNavigate={setCurrentPage}
              />
            )}

            {currentPage === 'clustering' && (
              <ClusteringPage
                overview={overview}
                onClustered={(data) => {
                  setClusteringData(data);
                  fetchOverview();
                }}
                onNavigate={setCurrentPage}
              />
            )}

            {currentPage === 'pca' && (
              <PcaPage
                overview={overview}
                onNavigate={setCurrentPage}
              />
            )}

            {currentPage === 'interpretation' && (
              <InterpretationPage
                overview={overview}
                onNavigate={setCurrentPage}
              />
            )}

            {currentPage === 'stability' && (
              <StabilityPage
                overview={overview}
              />
            )}

            {currentPage === 'report' && (
              <ReportPage
                overview={overview}
                clusteringData={clusteringData}
              />
            )}

            {currentPage === 'about' && (
              <AboutPage />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
