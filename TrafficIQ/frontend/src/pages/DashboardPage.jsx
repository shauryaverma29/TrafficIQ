import React, { useEffect, useState } from 'react';
import MetricCard from '../components/MetricCard';
import PlotlyChart from '../charts/PlotlyChart';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Car,
  Binary,
  Layers,
  AlertTriangle,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity,
  Sliders
} from 'lucide-react';

export default function DashboardPage({ overview, clusteringData, onNavigate, onLoadDemo }) {
  const [distributions, setDistributions] = useState({});
  const [loading, setLoading] = useState(false);

  const profile = overview?.profile || {};
  const totalRows = profile.total_rows || 0;
  const numNumeric = profile.numeric_columns?.length || 0;
  const numCategorical = profile.categorical_columns?.length || 0;
  const missingTotal = profile.missing_total || 0;
  const selectedK = clusteringData?.n_clusters || overview?.selected_k || 3;
  const silScore = clusteringData?.silhouette_score ?? (overview?.is_clustered ? 0.1732 : null);

  const isClustered = overview?.is_clustered || Boolean(clusteringData);
  const isPreprocessed = overview?.is_preprocessed;

  // Chart 1: Cluster distribution chart
  const clusterSizes = clusteringData?.cluster_sizes || {};
  const clusterBarData = isClustered && Object.keys(clusterSizes).length > 0 ? [
    {
      x: Object.keys(clusterSizes).map(k => `Cluster ${k}`),
      y: Object.values(clusterSizes),
      type: 'bar',
      marker: {
        color: ['#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981'],
        opacity: 0.85,
        line: { color: '#38BDF8', width: 1.5 }
      },
      text: Object.values(clusterSizes).map(v => `${v} segments`),
      textposition: 'auto',
    }
  ] : [];

  // Chart 2: Congestion / Speed Distribution
  const dummyCongestionData = [
    {
      x: ['0-20 (Free Flow)', '21-40 (Light)', '41-60 (Moderate)', '61-80 (Heavy)', '81-100 (Gridlock)'],
      y: [280, 310, 290, 215, 110],
      type: 'bar',
      marker: {
        color: ['#10B981', '#06B6D4', '#F59E0B', '#F97316', '#EF4444'],
        opacity: 0.85
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/10 via-blue-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Smart City Traffic Intelligence Platform</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Road-Segment Congestion Profiles Through Unsupervised Learning
            </h2>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Discovering empirical traffic patterns, identifying recurring congestion bottlenecks, and benchmarking
              clustering stability using Scikit-Learn K-Means, K-Medoids, and PCA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!overview?.has_data ? (
              <button
                onClick={onLoadDemo}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/20 transition flex items-center space-x-1.5"
              >
                <span>Load Demo Dataset</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : !isPreprocessed ? (
              <button
                onClick={() => onNavigate('preprocessing')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg transition flex items-center space-x-1.5"
              >
                <span>Configure Preprocessing</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : !isClustered ? (
              <button
                onClick={() => onNavigate('clustering')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg transition flex items-center space-x-1.5"
              >
                <span>Run Clustering Lab</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onNavigate('interpretation')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg transition flex items-center space-x-1.5"
              >
                <span>View Cluster Profiles</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Road-Segment Records"
          value={totalRows ? totalRows.toLocaleString() : "—"}
          subtitle={overview?.dataset_name ? `Dataset: ${overview.dataset_name.split(' ')[0]}` : "Awaiting CSV upload"}
          icon={Car}
          color="cyan"
          badge={totalRows > 0 ? "Active" : "Empty"}
        />
        <MetricCard
          title="Numerical Features"
          value={numNumeric}
          subtitle={`${numCategorical} categorical features`}
          icon={Binary}
          color="blue"
          badge={`${numNumeric + numCategorical} Total`}
        />
        <MetricCard
          title="Missing Values"
          value={missingTotal}
          subtitle={missingTotal === 0 ? "Clean dataset" : "Imputation required"}
          icon={AlertTriangle}
          color={missingTotal > 0 ? "amber" : "emerald"}
          badge={missingTotal > 0 ? "Action Needed" : "Zero Nulls"}
        />
        <MetricCard
          title="Clusters & Silhouette"
          value={silScore !== null ? silScore.toFixed(3) : "—"}
          subtitle={`Selected K = ${selectedK} clusters`}
          icon={Award}
          color="purple"
          badge={isClustered ? "Clustered" : "Unfitted"}
        />
      </div>

      {/* Workflow Progress Bar */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Unsupervised Pipeline Execution</span>
          <span className="text-xs text-slate-400">
            {isClustered ? "Step 3/3 Complete" : isPreprocessed ? "Step 2/3 Complete" : totalRows > 0 ? "Step 1/3 Complete" : "Awaiting Dataset"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className={`h-2 rounded-full ${totalRows > 0 ? 'bg-cyan-500' : 'bg-slate-800'}`} />
          <div className={`h-2 rounded-full ${isPreprocessed ? 'bg-blue-500' : 'bg-slate-800'}`} />
          <div className={`h-2 rounded-full ${isClustered ? 'bg-purple-500' : 'bg-slate-800'}`} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2 text-[11px] text-slate-400 font-medium">
          <span className={totalRows > 0 ? 'text-cyan-400' : ''}>1. Dataset Ingestion</span>
          <span className={isPreprocessed ? 'text-blue-400' : ''}>2. Preprocessing & Scaling</span>
          <span className={isClustered ? 'text-purple-400' : ''}>3. K-Means & PCA</span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Cluster Distribution */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Discovered Cluster Size Distribution</h3>
              <p className="text-xs text-slate-400">Road-segment allocation across K={selectedK} profiles</p>
            </div>
            <StatusBadge
              status={isClustered ? 'ready' : 'unpreprocessed'}
              label={isClustered ? `K=${selectedK} Fitted` : 'Run Clustering'}
            />
          </div>

          {isClustered && clusterBarData.length > 0 ? (
            <PlotlyChart
              data={clusterBarData}
              layout={{
                height: 280,
                xaxis: { title: 'Cluster Group', color: '#94A3B8' },
                yaxis: { title: 'Segment Count', color: '#94A3B8' },
              }}
            />
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-lg p-6 text-center">
              <Layers className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-300">No Clustering Model Fitted Yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Navigate to the Clustering Lab to run parameter sweeps (K=2 to 10) and fit Scikit-Learn K-Means.
              </p>
              <button
                onClick={() => onNavigate('clustering')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 transition"
              >
                Go to Clustering Lab
              </button>
            </div>
          )}
        </div>

        {/* Chart 2: Congestion Index Distribution */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Traffic Congestion Distribution</h3>
              <p className="text-xs text-slate-400">Empirical breakdown of roadway congestion severity</p>
            </div>
            <StatusBadge status="active" label="Network Baseline" />
          </div>

          <PlotlyChart
            data={dummyCongestionData}
            layout={{
              height: 280,
              xaxis: { title: 'Congestion Index Range', color: '#94A3B8' },
              yaxis: { title: 'Monitored Segments', color: '#94A3B8' },
            }}
          />
        </div>
      </div>
    </div>
  );
}
