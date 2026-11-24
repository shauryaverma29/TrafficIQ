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

  // Existing ML Dataset Endpoints
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

  // Citizen Road Hazard Reporting
  submitHazard: (formDataOrJson) => {
    const isFormData = formDataOrJson instanceof FormData;
    return client.post('/hazards/submit', formDataOrJson, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }).then(r => r.data);
  },
  checkDuplicates: (payload) => client.post('/hazards/check-duplicates', payload).then(r => r.data),
  getPublicHazards: (params = {}) => client.get('/hazards/public', { params }).then(r => r.data),
  getNearbyHazards: (lat, lng, radius = 5, category = 'All', status = 'All') => {
    return client.get('/hazards/nearby', {
      params: { lat, lng, radius, category, status }
    }).then(r => r.data);
  },
  trackReport: (reportId) => client.get(`/hazards/track/${reportId}`).then(r => r.data),
  findMyReports: (params = {}) => client.get('/hazards/find', { params }).then(r => r.data),
  getTrafficCorrelations: () => client.get('/hazards/traffic-correlation').then(r => r.data),

  // Smart Parking Finder
  getParkingFacilities: (params = {}) => client.get('/parking/facilities', { params }).then(r => r.data),
  reportIncorrectParking: (payload) => client.post('/parking/report-incorrect', payload).then(r => r.data),
  addParkingFacility: (payload, token) => client.post('/parking/manage/add', payload, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.data),
  updateParkingFacility: (facilityId, payload, token) => client.put(`/parking/manage/update/${facilityId}`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.data),
  getParkingIssues: (token) => client.get('/parking/manage/issues', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.data),

  // Road Construction & Diversion Updates
  getRoadUpdates: (params = {}) => client.get('/road-updates/', { params }).then(r => r.data),
  getRoadUpdate: (id) => client.get(`/road-updates/${id}`).then(r => r.data),
  publishRoadUpdate: (payload, token) => client.post('/road-updates/publish', payload, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.data),
  editRoadUpdate: (id, payload, token) => client.put(`/road-updates/update/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.data),

  // Accessibility-Friendly Road Information
  getAccessibilityReports: (params = {}) => client.get('/accessibility/reports', { params }).then(r => r.data),
  submitAccessibilityReport: (formDataOrJson) => {
    const isFormData = formDataOrJson instanceof FormData;
    return client.post('/accessibility/report', formDataOrJson, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }).then(r => r.data);
  },

  // Authority Authentication & Control Centre
  authorityLogin: (credentials) => client.post('/authority/login', credentials).then(r => r.data),
  getAuthorityProfile: (token) => client.get('/authority/me', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.data),
  getAuthorityReports: (params = {}, token) => client.get('/authority/reports/all', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.data),
  verifyReport: (reportId, remarks, token) => client.post(`/authority/reports/${reportId}/verify`, { remarks }, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.data),
  assignReport: (reportId, payload, token) => client.post(`/authority/reports/${reportId}/assign`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.data),
  updateReportStatus: (reportId, formDataOrJson, token) => {
    const isFormData = formDataOrJson instanceof FormData;
    return client.post(`/authority/reports/${reportId}/status`, formDataOrJson, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {})
      }
    }).then(r => r.data);
  },
  rejectReport: (reportId, reason, token) => client.post(`/authority/reports/${reportId}/reject`, { rejection_reason: reason }, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.data),
  overrideSeverity: (reportId, payload, token) => client.post(`/authority/reports/${reportId}/override-severity`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.data),
  getAuditLog: (token) => client.get('/authority/audit-log', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.data),

  // Live Dashboard Statistics
  getDashboardSummary: () => client.get('/stats/summary').then(r => r.data),

  // Report & Export URLs
  pdfReportUrl: '/api/report/pdf',
  exportProcessedCsvUrl: '/api/report/export/processed-csv',
  exportClusteredCsvUrl: '/api/report/export/clustered-csv',
  exportMetricsCsvUrl: '/api/report/export/metrics-csv',
};

export default api;
