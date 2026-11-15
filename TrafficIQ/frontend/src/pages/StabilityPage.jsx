import React, { useState, useEffect } from 'react';
import PlotlyChart from '../charts/PlotlyChart';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';
import {
  Activity,
  Play,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

export default function StabilityPage({ overview }) {
  const [loading, setLoading] = useState(false);
  const [stabilityData, setStabilityData] = useState(null);
  const [selectedK, setSelectedK] = useState(overview?.selected_k || 3);
  const [feedback, setFeedback] = useState(null);

  const isPreprocessed = overview?.is_preprocessed;

  useEffect(() => {
    if (isPreprocessed && !stabilityData) {
      handleRunStability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreprocessed]);

  const handleRunStability = async () => {
    if (!isPreprocessed) {
      setFeedback({ type: 'warning', text: 'Dataset must be preprocessed first.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.runStability({
        n_clusters: parseInt(selectedK),
        seeds: [10, 42, 101, 777, 2024],
      });
      setStabilityData(res);
      setFeedback({ type: 'success', text: `Completed 5-seed stability benchmarking with Mean ARI = ${res.mean_ari} (${res.stability_tier})` });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error || 'Failed to execute stability analysis.' });
    } finally {
      setLoading(false);
    }
  };

  // ARI Matrix Heatmap
  const seedLabels = stabilityData?.seeds_tested ? stabilityData.seeds_tested.map(s => `Seed ${s}`) : [];
  const matrixData = stabilityData?.ari_matrix ? [
    {
      z: stabilityData.ari_matrix,
      x: seedLabels,
      y: seedLabels,
      type: 'heatmap',
      colorscale: [
        [0, '#0F172A'],
        [0.5, '#0284C7'],
        [1, '#10B981']
      ],
      zmin: 0,
      zmax: 1
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4" />
              <span>Reproducibility & Sensitivity Benchmarking</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Cluster Stability Analysis (Adjusted Rand Index)</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Evaluates whether the discovered congestion profiles are robust geometric structures or sensitive artifacts
              of random seed initializations by computing pairwise Adjusted Rand Index (ARI).
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-slate-300 font-semibold">Clusters (K):</label>
              <input
                type="number"
                min="2"
                max="10"
                value={selectedK}
                onChange={(e) => setSelectedK(e.target.value)}
                className="w-16 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs font-bold focus:outline-none"
              />
            </div>
            <button
              onClick={handleRunStability}
              disabled={loading || !isPreprocessed}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg transition flex items-center space-x-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Re-run Stability Check</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className={`mt-4 p-3 rounded-lg text-xs font-medium flex items-center space-x-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
              : 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      {loading && <LoadingSpinner message="Fitting multi-seed KMeans models and calculating Adjusted Rand Index matrix..." />}

      {/* Stability Metrics Cards */}
      {stabilityData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Mean Adjusted Rand Index</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{stabilityData.mean_ari}</div>
            <p className="text-[11px] text-slate-500 mt-1">1.0 = identical cluster assignments</p>
          </div>

          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Stability Classification</span>
            <div className="mt-1">
              <StatusBadge status={stabilityData.stability_tier} label={stabilityData.stability_tier} />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Across 5 independent random initializations</p>
          </div>

          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Minimum Pairwise ARI</span>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{stabilityData.min_ari}</div>
            <p className="text-[11px] text-slate-500 mt-1">Worst-case initialization alignment</p>
          </div>

          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Standard Deviation</span>
            <div className="text-2xl font-bold font-mono text-purple-400 mt-1">&plusmn;{stabilityData.std_ari}</div>
            <p className="text-[11px] text-slate-500 mt-1">Variance across initializations</p>
          </div>
        </div>
      )}

      {/* Stability Assessment Narrative */}
      {stabilityData && (
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-2">Empirical Assessment of Discovered Clusters</h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800">
            {stabilityData.assessment}
          </p>
        </div>
      )}

      {/* ARI Correlation Matrix Heatmap & Pairwise Comparisons */}
      {stabilityData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Heatmap */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-2">Adjusted Rand Index Agreement Matrix</h3>
            <p className="text-xs text-slate-400 mb-2">
              Cross-agreement between 5 independent random seed initializations [10, 42, 101, 777, 2024]
            </p>
            <PlotlyChart
              data={matrixData}
              layout={{
                height: 320,
                margin: { t: 20, r: 20, b: 60, l: 60 }
              }}
            />
          </div>

          {/* Pairwise Runs & Inertia List */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Run Inertia Variation Across Seeds</h3>
              <p className="text-xs text-slate-400 mb-3">
                Inertia values achieved by K-Means convergence for each random initialization
              </p>

              <div className="space-y-2 font-mono text-xs">
                {stabilityData.run_inertias?.map((run) => (
                  <div key={run.seed} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-cyan-400">Random Seed: {run.seed}</span>
                    <span className="text-white font-bold">Inertia: {run.inertia}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
              Low inertia variance across seeds confirms that the k-means++ initialization heuristic successfully avoids suboptimal local minima.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
