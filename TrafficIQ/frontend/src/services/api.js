import axios from 'axios';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // System Health
  health: () => client.get('/health').then(r => r.data),

  // Dataset Endpoints
  uploadDataset: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('/dataset/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  loadDemoDataset: () => client.post('/dataset/load-demo').then(r => r.data),
  getOverview: () => client.get('/dataset/overview').then(r => r.data),
  getPreview: (limit = 10) => client.get(`/dataset/preview?limit=${limit}`).then(r => r.data),
  getCorrelations: () => client.get('/dataset/correlations').then(r => r.data),
  getDistributions: (column = null) => {
    const url = column ? `/dataset/distributions?column=${column}` : '/dataset/distributions';
    return client.get(url).then(r => r.data);
  },
  getOutliers: () => client.get('/dataset/outliers').then(r => r.data),

  // Preprocessing Endpoints
  preprocess: (config) => client.post('/preprocessing/preprocess', config).then(r => r.data),
  getPreprocessingSummary: () => client.get('/preprocessing/preprocessing-summary').then(r => r.data),
  resetPreprocessing: () => client.post('/preprocessing/reset-preprocessing').then(r => r.data),

  // Clustering Endpoints
  runElbow: (config) => client.post('/clustering/elbow-evaluation', config).then(r => r.data),
  runClustering: (config) => client.post('/clustering/run', config).then(r => r.data),
  compareManhattan: (config) => client.post('/clustering/compare-manhattan', config).then(r => r.data),

  // PCA Endpoints
  getPca: () => client.get('/pca/').then(r => r.data),

  // Interpretation Endpoints
  getInterpretation: () => client.get('/interpretation/').then(r => r.data),

  // Stability Analysis Endpoints
  runStability: (config) => client.post('/stability/', config).then(r => r.data),

  // Report & Export URLs
  pdfReportUrl: '/api/report/pdf',
  exportProcessedCsvUrl: '/api/report/export/processed-csv',
  exportClusteredCsvUrl: '/api/report/export/clustered-csv',
  exportMetricsCsvUrl: '/api/report/export/metrics-csv',
};

export default api;
