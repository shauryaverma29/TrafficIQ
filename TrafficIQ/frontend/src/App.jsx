import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ReportHazardPage from './pages/ReportHazardPage';
import NearbyIssuesPage from './pages/NearbyIssuesPage';
import ParkingFinderPage from './pages/ParkingFinderPage';
import RoadUpdatesPage from './pages/RoadUpdatesPage';
import AccessibilityRoadsPage from './pages/AccessibilityRoadsPage';
import TrackReportPage from './pages/TrackReportPage';
import AuthorityPortalPage from './pages/AuthorityPortalPage';

// Existing ML Research Pages
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

  // ── Theme: 'dark' | 'light' ─────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('trafficiq_theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    localStorage.setItem('trafficiq_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // Authority authentication state
  const [authorityToken, setAuthorityToken] = useState(() => {
    return localStorage.getItem('trafficiq_authority_token') || null;
  });
  const [authorityUser, setAuthorityUser] = useState(() => {
    const saved = localStorage.getItem('trafficiq_authority_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleSetAuthorityToken = (token) => {
    setAuthorityToken(token);
    if (token) {
      localStorage.setItem('trafficiq_authority_token', token);
    } else {
      localStorage.removeItem('trafficiq_authority_token');
    }
  };

  const handleSetAuthorityUser = (user) => {
    setAuthorityUser(user);
    if (user) {
      localStorage.setItem('trafficiq_authority_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('trafficiq_authority_user');
    }
  };

  const pageTitles = {
    // Citizen Services
    dashboard: { title: 'Smart City Public Operations', subtitle: 'Live citizen hazard monitoring, smart parking, and traffic ML intelligence' },
    'report-hazard': { title: 'Report a Road Hazard', subtitle: 'Citizen defect submission with GPS verification, smart priority advice & photo evidence' },
    'nearby-issues': { title: 'Reported Issues Near Me', subtitle: 'Proximity hazard explorer with interactive map and verified authority badges' },
    'parking-finder': { title: 'Smart Parking Finder', subtitle: 'Verified parking garages, surface lots, tariffs, and sensor-backed availability' },
    'road-updates': { title: 'Road Construction & Diversions', subtitle: 'Official municipal road advisories, planned civil works, and verified detours' },
    'accessibility-roads': { title: 'Accessible Road Information', subtitle: 'Pedestrian barrier audits, dropped curbs, and universal mobility reporting' },
    'track-report': { title: 'Track My Report', subtitle: 'Monitor inspection status, assigned maintenance squads, and official remarks' },
    'authority-portal': { title: 'Authority Control Centre', subtitle: 'Official verification desk, squad dispatch, and infrastructure management' },

    // Existing Machine Learning Research Pages
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
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${
      theme === 'light'
        ? 'bg-slate-100 text-slate-900'
        : 'bg-[#0B0F19] text-slate-100'
    }`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        datasetOverview={overview}
        authorityToken={authorityToken}
        theme={theme}
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
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Citizen Public Services */}
            {currentPage === 'dashboard' && (
              <DashboardPage
                overview={overview}
                clusteringData={clusteringData}
                onNavigate={setCurrentPage}
                onLoadDemo={handleLoadDemo}
              />
            )}

            {currentPage === 'report-hazard' && (
              <ReportHazardPage
                onNavigate={setCurrentPage}
                onReportSubmitted={(report) => {
                  fetchOverview();
                }}
              />
            )}

            {currentPage === 'nearby-issues' && (
              <NearbyIssuesPage
                onNavigate={setCurrentPage}
              />
            )}

            {currentPage === 'parking-finder' && (
              <ParkingFinderPage
                authorityToken={authorityToken}
                onNavigate={setCurrentPage}
              />
            )}

            {currentPage === 'road-updates' && (
              <RoadUpdatesPage
                authorityToken={authorityToken}
                onNavigate={setCurrentPage}
              />
            )}

            {currentPage === 'accessibility-roads' && (
              <AccessibilityRoadsPage
                onNavigate={setCurrentPage}
              />
            )}

            {currentPage === 'track-report' && (
              <TrackReportPage
                onNavigate={setCurrentPage}
              />
            )}

            {currentPage === 'authority-portal' && (
              <AuthorityPortalPage
                authorityToken={authorityToken}
                setAuthorityToken={handleSetAuthorityToken}
                authorityUser={authorityUser}
                setAuthorityUser={handleSetAuthorityUser}
              />
            )}

            {/* Existing ML Research Pages */}
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
