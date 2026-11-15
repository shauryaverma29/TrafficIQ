import React, { useState, useEffect } from 'react';
import PlotlyChart from '../charts/PlotlyChart';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';
import {
  Upload,
  Database,
  FileSpreadsheet,
  AlertTriangle,
  Copy,
  Table,
  BarChart3,
  Flame,
  CheckCircle2,
  Info
} from 'lucide-react';

export default function DatasetPage({ overview, onDatasetChange, onLoadDemo }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [correlations, setCorrelations] = useState(null);
  const [outliers, setOutliers] = useState(null);
  const [distributions, setDistributions] = useState(null);
  const [selectedDistCol, setSelectedDistCol] = useState(null);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview', 'correlations', 'distributions', 'outliers'
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (overview?.has_data) {
      loadExplorationData();
    }
  }, [overview]);

  const loadExplorationData = async () => {
    try {
      const [prev, corr, out, dist] = await Promise.all([
        api.getPreview(10),
        api.getCorrelations(),
        api.getOutliers(),
        api.getDistributions()
      ]);
      setPreviewData(prev);
      setCorrelations(corr);
      setOutliers(out);
      setDistributions(dist.distributions || {});
      if (dist.distributions && Object.keys(dist.distributions).length > 0) {
        setSelectedDistCol(Object.keys(dist.distributions)[0]);
      }
    } catch (err) {
      console.error("Failed to load exploration data", err);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setFeedback(null);
    try {
      const res = await api.uploadDataset(file);
      setFeedback({ type: 'success', text: `Uploaded ${file.name} successfully!` });
      onDatasetChange();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error || "Failed to upload CSV file." });
    } finally {
      setUploading(false);
    }
  };

  const profile = overview?.profile || {};
  const totalRows = profile.total_rows || 0;
  const totalCols = profile.total_columns || 0;
  const numNumeric = profile.numeric_columns || [];
  const numCategorical = profile.categorical_columns || [];
  const missingCount = profile.missing_total || 0;
  const dupCount = profile.duplicate_count || 0;

  // Correlation heatmap data
  const heatmapData = correlations?.matrix ? [
    {
      z: correlations.matrix,
      x: correlations.features,
      y: correlations.features,
      type: 'heatmap',
      colorscale: [
        [0, '#0F172A'],
        [0.5, '#0284C7'],
        [1, '#22D3EE']
      ],
      hoverongaps: false
    }
  ] : [];

  // Distribution histogram data
  const activeDist = selectedDistCol && distributions?.[selectedDistCol];
  const distBarData = activeDist ? [
    {
      x: activeDist.bin_edges.slice(0, -1).map((val, idx) => `${val} - ${activeDist.bin_edges[idx + 1]}`),
      y: activeDist.counts,
      type: 'bar',
      marker: {
        color: '#06B6D4',
        line: { color: '#38BDF8', width: 1 }
      }
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Upload & Demo Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Card */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Upload Traffic Dataset (CSV)</h3>
              <p className="text-xs text-slate-400">Supports Kaggle Traffic datasets or custom roadway sensor CSVs</p>
            </div>
          </div>

          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-xs text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700 bg-slate-950 border border-slate-800 rounded-lg p-1.5 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-xs tracking-wide shrink-0 transition"
              >
                {uploading ? "Analyzing..." : "Upload & Analyze"}
              </button>
            </div>
          </form>

          {feedback && (
            <div className={`mt-3 p-3 rounded-lg text-xs font-medium flex items-center space-x-2 ${
              feedback.type === 'success' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50' : 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedback.text}</span>
            </div>
          )}
        </div>

        {/* Demo Dataset Quick Card */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Database className="w-4 h-4" />
              <span>Kaggle Demonstration Data</span>
            </div>
            <h4 className="text-sm font-bold text-white">Preloaded Realistic Traffic Dataset</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Includes 1,200+ road segments with sensor metrics: traffic volume, speeds, congestion indices, occupancy, and weather conditions.
            </p>
          </div>

          <button
            onClick={onLoadDemo}
            className="mt-4 w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 font-semibold text-xs transition"
          >
            Reload Kaggle Demo Dataset
          </button>
        </div>
      </div>

      {/* Dataset Profile Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3.5">
          <span className="text-[11px] font-medium text-slate-400">Total Rows</span>
          <div className="text-lg font-bold text-white font-mono">{totalRows.toLocaleString()}</div>
        </div>
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3.5">
          <span className="text-[11px] font-medium text-slate-400">Total Columns</span>
          <div className="text-lg font-bold text-white font-mono">{totalCols}</div>
        </div>
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3.5">
          <span className="text-[11px] font-medium text-slate-400">Numeric Features</span>
          <div className="text-lg font-bold text-cyan-400 font-mono">{numNumeric.length}</div>
        </div>
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3.5">
          <span className="text-[11px] font-medium text-slate-400">Categorical Features</span>
          <div className="text-lg font-bold text-purple-400 font-mono">{numCategorical.length}</div>
        </div>
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3.5">
          <span className="text-[11px] font-medium text-slate-400">Missing Values</span>
          <div className={`text-lg font-bold font-mono ${missingCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{missingCount}</div>
        </div>
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3.5">
          <span className="text-[11px] font-medium text-slate-400">Duplicate Rows</span>
          <div className={`text-lg font-bold font-mono ${dupCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{dupCount}</div>
        </div>
      </div>

      {/* Column Breakdown Badges */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Inspected Column Types</h4>
          <span className="text-xs text-slate-500">Auto-detected schema for unsupervised clustering</span>
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-xs text-cyan-400 font-semibold mr-2">Numerical:</span>
            {numNumeric.map(col => (
              <span key={col} className="inline-block text-xs px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 mr-1.5 mb-1.5 font-mono">
                {col}
              </span>
            ))}
          </div>
          <div>
            <span className="text-xs text-purple-400 font-semibold mr-2">Categorical:</span>
            {numCategorical.map(col => (
              <span key={col} className="inline-block text-xs px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 mr-1.5 mb-1.5 font-mono">
                {col}
              </span>
            ))}
          </div>
          {profile.id_like_columns?.length > 0 && (
            <div>
              <span className="text-xs text-slate-400 font-semibold mr-2">ID / Candidate Exclusions:</span>
              {profile.id_like_columns.map(col => (
                <span key={col} className="inline-block text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 mr-1.5 mb-1.5 font-mono">
                  {col}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exploration Tabs: Preview, Correlation, Distribution, Outliers */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg overflow-hidden">
        <div className="border-b border-slate-800 flex items-center space-x-1 px-4 pt-3 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'preview'
                ? 'text-cyan-400 border-cyan-400 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <Table className="w-3.5 h-3.5" />
              <span>Dataset Preview</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('correlations')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'correlations'
                ? 'text-cyan-400 border-cyan-400 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <Flame className="w-3.5 h-3.5" />
              <span>Correlation Heatmap</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('distributions')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'distributions'
                ? 'text-cyan-400 border-cyan-400 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Feature Distributions</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('outliers')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'outliers'
                ? 'text-cyan-400 border-cyan-400 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>IQR Outlier Analysis</span>
            </span>
          </button>
        </div>

        <div className="p-5">
          {/* Tab 1: Dataset Preview Table */}
          {activeTab === 'preview' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60">
                      {previewData?.columns?.map(col => (
                        <th key={col} className="p-3 font-semibold text-slate-300 font-mono">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {previewData?.records?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        {previewData.columns.map(col => (
                          <td key={col} className="p-3 whitespace-nowrap">
                            {row[col] === null || row[col] === undefined ? (
                              <span className="text-amber-400 italic">null</span>
                            ) : (
                              String(row[col])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-right text-[11px] text-slate-500">
                Displaying first 10 sample road-segment observations from {totalRows} total records
              </div>
            </div>
          )}

          {/* Tab 2: Correlation Heatmap */}
          {activeTab === 'correlations' && (
            <div>
              <p className="text-xs text-slate-400 mb-3">
                Pearson correlation coefficients between continuous roadway features. Negative correlations (e.g. speed vs congestion) highlight congested corridors.
              </p>
              {heatmapData.length > 0 ? (
                <PlotlyChart
                  data={heatmapData}
                  layout={{
                    height: 400,
                    margin: { t: 30, r: 30, b: 80, l: 120 }
                  }}
                />
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">Insufficient numerical columns to compute correlations</div>
              )}
            </div>
          )}

          {/* Tab 3: Feature Distributions */}
          {activeTab === 'distributions' && (
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <label className="text-xs font-semibold text-slate-300">Select Feature:</label>
                <select
                  value={selectedDistCol || ''}
                  onChange={(e) => setSelectedDistCol(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                >
                  {distributions && Object.keys(distributions).map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>

                {activeDist && (
                  <div className="text-xs text-slate-400 space-x-3 font-mono">
                    <span>Mean: <b className="text-white">{activeDist.mean}</b></span>
                    <span>Median: <b className="text-white">{activeDist.median}</b></span>
                    <span>Std: <b className="text-white">{activeDist.std}</b></span>
                  </div>
                )}
              </div>

              {distBarData.length > 0 ? (
                <PlotlyChart
                  data={distBarData}
                  layout={{
                    height: 340,
                    xaxis: { title: `${selectedDistCol} Bins`, color: '#94A3B8' },
                    yaxis: { title: 'Frequency', color: '#94A3B8' }
                  }}
                />
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">No distribution data loaded</div>
              )}
            </div>
          )}

          {/* Tab 4: IQR Outliers */}
          {activeTab === 'outliers' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-400">
                  Potential sensor outliers detected using the 1.5 &times; IQR threshold. Outliers reflect extreme congestion spikes or sensor anomalies.
                </p>
                <span className="text-xs font-semibold text-amber-400">
                  {outliers?.total_rows_with_outliers || 0} rows flagged ({outliers?.total_rows_with_outliers_pct || 0}%)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-300">
                      <th className="p-3">Feature</th>
                      <th className="p-3">Q1 (25%)</th>
                      <th className="p-3">Q3 (75%)</th>
                      <th className="p-3">IQR</th>
                      <th className="p-3">Lower Bound</th>
                      <th className="p-3">Upper Bound</th>
                      <th className="p-3">Outlier Count</th>
                      <th className="p-3">% Flagged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {outliers?.column_outliers && Object.entries(outliers.column_outliers).map(([col, stats]) => (
                      <tr key={col} className="hover:bg-slate-800/40">
                        <td className="p-3 font-semibold text-cyan-300">{col}</td>
                        <td className="p-3">{stats.q1}</td>
                        <td className="p-3">{stats.q3}</td>
                        <td className="p-3">{stats.iqr}</td>
                        <td className="p-3">{stats.lower_bound}</td>
                        <td className="p-3">{stats.upper_bound}</td>
                        <td className={`p-3 font-bold ${stats.outlier_count > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                          {stats.outlier_count}
                        </td>
                        <td className="p-3">{stats.outlier_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
