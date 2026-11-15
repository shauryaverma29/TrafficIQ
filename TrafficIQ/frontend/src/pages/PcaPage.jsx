import React, { useState, useEffect } from 'react';
import PlotlyChart from '../charts/PlotlyChart';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';
import {
  Activity,
  Layers,
  Sparkles,
  Info,
  Box,
  Eye
} from 'lucide-react';

export default function PcaPage({ overview, onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [pcaData, setPcaData] = useState(null);
  const [view3D, setView3D] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const isPreprocessed = overview?.is_preprocessed;
  const isClustered = overview?.is_clustered;

  useEffect(() => {
    if (isPreprocessed) {
      loadPcaData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreprocessed, isClustered]);

  const loadPcaData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await api.getPca();
      setPcaData(data);
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error || 'Failed to compute PCA.' });
    } finally {
      setLoading(false);
    }
  };

  // Color palette for clusters
  const clusterColors = ['#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#6366F1'];

  // Prepare 2D Plotly traces per cluster
  const traces2D = [];
  const traces3D = [];

  if (pcaData?.points_2d) {
    const pointsByCluster = {};
    pcaData.points_2d.forEach((pt) => {
      const c = pt.cluster;
      if (!pointsByCluster[c]) pointsByCluster[c] = [];
      pointsByCluster[c].push(pt);
    });

    Object.entries(pointsByCluster).forEach(([c, pts]) => {
      const color = clusterColors[parseInt(c) % clusterColors.length];
      traces2D.push({
        x: pts.map(p => p.x),
        y: pts.map(p => p.y),
        mode: 'markers',
        type: 'scatter',
        name: `Cluster ${c}`,
        marker: {
          color: color,
          size: 7,
          opacity: 0.8,
          line: { color: '#0F172A', width: 0.5 }
        },
        text: pts.map(p => {
          const m = p.meta || {};
          return `<b>Cluster ${c}</b><br/>Segment: ${m.segment_id || p.id}<br/>Speed: ${m.average_speed_kmh || '—'} km/h<br/>Vol: ${m.traffic_volume || '—'}<br/>Congestion: ${m.congestion_index || '—'}`;
        }),
        hoverinfo: 'text'
      });
    });
  }

  if (pcaData?.points_3d) {
    const pointsByCluster3D = {};
    pcaData.points_3d.forEach((pt) => {
      const c = pt.cluster;
      if (!pointsByCluster3D[c]) pointsByCluster3D[c] = [];
      pointsByCluster3D[c].push(pt);
    });

    Object.entries(pointsByCluster3D).forEach(([c, pts]) => {
      const color = clusterColors[parseInt(c) % clusterColors.length];
      traces3D.push({
        x: pts.map(p => p.x),
        y: pts.map(p => p.y),
        z: pts.map(p => p.z),
        mode: 'markers',
        type: 'scatter3d',
        name: `Cluster ${c}`,
        marker: {
          color: color,
          size: 4,
          opacity: 0.85
        },
        text: pts.map(p => `Cluster ${c} | Segment ${p.meta?.segment_id || p.id}`),
        hoverinfo: 'text'
      });
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4" />
              <span>Dimensionality Reduction</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Principal Component Analysis (PCA)</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Projects the standardized multi-feature traffic matrix into orthogonal principal components,
              revealing underlying geometric separation and cluster boundaries.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setView3D(!view3D)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition flex items-center space-x-1.5 ${
                view3D
                  ? 'bg-purple-950/80 border-purple-500 text-purple-200'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>{view3D ? "Switch to 2D PCA" : "Switch to 3D PCA"}</span>
            </button>
          </div>
        </div>

        {/* Variance Stats Row */}
        {pcaData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800">
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
              <span className="text-[11px] text-slate-400 block">PC1 Explained Variance</span>
              <span className="text-lg font-bold font-mono text-cyan-400">
                {(pcaData.explained_variance_ratio[0] * 100).toFixed(1)}%
              </span>
            </div>
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
              <span className="text-[11px] text-slate-400 block">PC2 Explained Variance</span>
              <span className="text-lg font-bold font-mono text-blue-400">
                {(pcaData.explained_variance_ratio[1] * 100).toFixed(1)}%
              </span>
            </div>
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
              <span className="text-[11px] text-slate-400 block">2D Cumulative Variance</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {(pcaData.cumulative_variance_ratio[1] * 100).toFixed(1)}%
              </span>
            </div>
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
              <span className="text-[11px] text-slate-400 block">Segments Projected</span>
              <span className="text-lg font-bold font-mono text-purple-400">
                {pcaData.total_points_rendered}
              </span>
            </div>
          </div>
        )}
      </div>

      {loading && <LoadingSpinner message="Performing eigenvector decomposition and computing PCA projections..." />}

      {/* Main Scatter Plot */}
      {pcaData && (
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white">
                {view3D ? "3D Principal Component Scatter" : "2D Principal Component Projection (PC1 vs PC2)"}
              </h3>
              <p className="text-xs text-slate-400">Hover over any point to inspect individual road segment sensor metrics</p>
            </div>
            <StatusBadge status="ready" label={view3D ? "3D Interactive Space" : "2D Orthogonal Projection"} />
          </div>

          {!view3D ? (
            <PlotlyChart
              data={traces2D}
              layout={{
                height: 480,
                xaxis: {
                  title: `PC1 (${(pcaData.explained_variance_ratio[0] * 100).toFixed(1)}% variance)`,
                  color: '#94A3B8',
                  zeroline: true,
                  zerolinecolor: '#334155'
                },
                yaxis: {
                  title: `PC2 (${(pcaData.explained_variance_ratio[1] * 100).toFixed(1)}% variance)`,
                  color: '#94A3B8',
                  zeroline: true,
                  zerolinecolor: '#334155'
                },
                legend: { x: 0.02, y: 0.98, bgcolor: 'rgba(15, 23, 42, 0.7)' }
              }}
            />
          ) : (
            <PlotlyChart
              data={traces3D}
              layout={{
                height: 520,
                scene: {
                  xaxis: { title: 'PC1', color: '#94A3B8' },
                  yaxis: { title: 'PC2', color: '#94A3B8' },
                  zaxis: { title: 'PC3', color: '#94A3B8' },
                  bgcolor: 'transparent'
                },
                legend: { x: 0.02, y: 0.98, bgcolor: 'rgba(15, 23, 42, 0.7)' }
              }}
            />
          )}
        </div>
      )}

      {/* Feature Loadings Section */}
      {pcaData?.loadings && (
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-2">Principal Component Loadings (Feature Contributions)</h3>
          <p className="text-xs text-slate-400 mb-4">
            Component loadings indicate the relative weight of each normalized traffic feature along the eigenvector axes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pcaData.loadings.slice(0, 2).map((comp, idx) => (
              <div key={idx} className="rounded-lg bg-slate-950 border border-slate-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase font-mono">{comp.component} Loadings</span>
                  <span className="text-[11px] text-slate-400">{(comp.explained_variance * 100).toFixed(1)}% variance</span>
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  {Object.entries(comp.top_features).slice(0, 6).map(([feat, weight]) => (
                    <div key={feat} className="flex items-center justify-between">
                      <span className="text-slate-300 truncate max-w-[200px]">{feat}</span>
                      <span className={`font-semibold ${weight > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {weight > 0 ? `+${weight}` : weight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
