import React, { useState, useEffect } from 'react';
import PlotlyChart from '../charts/PlotlyChart';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';
import {
  Network,
  Play,
  Sliders,
  CheckCircle2,
  TrendingDown,
  Award,
  Sparkles,
  ArrowRight,
  GitCompare,
  HelpCircle
} from 'lucide-react';

export default function ClusteringPage({ overview, onClustered, onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [elbowLoading, setElbowLoading] = useState(false);
  const [manhattanLoading, setManhattanLoading] = useState(false);

  // Configuration parameters
  const [kMin, setKMin] = useState(2);
  const [kMax, setKMax] = useState(8);
  const [selectedK, setSelectedK] = useState(overview?.selected_k || 3);
  const [nInit, setNInit] = useState(10);
  const [maxIter, setMaxIter] = useState(300);
  const [randomSeed, setRandomSeed] = useState(42);

  // Results
  const [elbowResults, setElbowResults] = useState(null);
  const [clusteringResult, setClusteringResult] = useState(null);
  const [manhattanComparison, setManhattanComparison] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const isPreprocessed = overview?.is_preprocessed;

  // Run initial parameter sweep on mount if preprocessed
  useEffect(() => {
    if (isPreprocessed && !elbowResults) {
      handleRunElbow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreprocessed]);

  const handleRunElbow = async () => {
    if (!isPreprocessed) {
      setFeedback({ type: 'warning', text: 'Dataset must be preprocessed prior to running clustering experiments.' });
      return;
    }

    setElbowLoading(true);
    setFeedback(null);
    try {
      const res = await api.runElbow({
        k_min: parseInt(kMin),
        k_max: parseInt(kMax),
        n_init: parseInt(nInit),
        max_iter: parseInt(maxIter),
        random_state: parseInt(randomSeed),
      });
      setElbowResults(res.results);
      if (res.results?.recommended_k) {
        setSelectedK(res.results.recommended_k);
      }
      setFeedback({ type: 'success', text: `Evaluated K=${kMin} through K=${kMax} across WCSS, Silhouette, and Davies-Bouldin metrics.` });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error || 'Failed to evaluate elbow parameters.' });
    } finally {
      setElbowLoading(false);
    }
  };

  const handleRunFinalClustering = async () => {
    if (!isPreprocessed) {
      setFeedback({ type: 'warning', text: 'Dataset must be preprocessed first.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.runClustering({
        n_clusters: parseInt(selectedK),
        n_init: parseInt(nInit),
        max_iter: parseInt(maxIter),
        random_state: parseInt(randomSeed),
      });
      setClusteringResult(res.clustering_evaluation);
      setFeedback({ type: 'success', text: `K-Means clustering successfully fitted with K=${selectedK} clusters!` });
      onClustered(res.clustering_evaluation);
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error || 'Failed to fit KMeans model.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompareManhattan = async () => {
    if (!isPreprocessed) return;
    setManhattanLoading(true);
    try {
      const res = await api.compareManhattan({
        n_clusters: parseInt(selectedK),
        random_state: parseInt(randomSeed),
      });
      setManhattanComparison(res);
    } catch (err) {
      console.error(err);
    } finally {
      setManhattanLoading(false);
    }
  };

  // Plotly Charts: Elbow (WCSS)
  const elbowChartData = elbowResults ? [
    {
      x: elbowResults.k_range,
      y: elbowResults.wcss,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Inertia (WCSS)',
      line: { color: '#06B6D4', width: 3 },
      marker: { color: '#22D3EE', size: 8 }
    }
  ] : [];

  // Plotly Charts: Silhouette & Davies-Bouldin
  const evaluationChartData = elbowResults ? [
    {
      x: elbowResults.k_range,
      y: elbowResults.silhouette_scores,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Silhouette (Higher is Better)',
      line: { color: '#10B981', width: 2.5 },
      marker: { size: 7, color: '#34D399' }
    },
    {
      x: elbowResults.k_range,
      y: elbowResults.davies_bouldin_scores,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Davies-Bouldin (Lower is Better)',
      yaxis: 'y2',
      line: { color: '#8B5CF6', width: 2.5, dash: 'dot' },
      marker: { size: 7, color: '#A78BFA' }
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Network className="w-4 h-4" />
              <span>Unsupervised Machine Learning Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">K-Means Clustering Lab & Parameter Optimization</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Evaluate multi-K parameter sweeps with Scikit-Learn KMeans, measure Within-Cluster Sum of Squares (Inertia),
              Silhouette Scores, Davies-Bouldin indices, and compare against Manhattan K-Medoids.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleRunElbow}
              disabled={elbowLoading || !isPreprocessed}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-300 font-semibold text-xs border border-slate-700 transition"
            >
              {elbowLoading ? "Evaluating K Range..." : "Sweep K=2..10"}
            </button>
            <button
              onClick={handleRunFinalClustering}
              disabled={loading || !isPreprocessed}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition flex items-center space-x-1.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Fit Final K={selectedK} Model</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className={`mb-6 p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
              : feedback.type === 'warning'
              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
              : 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
          }`}>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedback.text}</span>
            </div>
            {clusteringResult && (
              <button
                onClick={() => onNavigate('interpretation')}
                className="px-3 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1 transition"
              >
                <span>Interpret Profiles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Hyperparameters Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Target Clusters (K)</label>
            <input
              type="number"
              min="2"
              max="15"
              value={selectedK}
              onChange={(e) => setSelectedK(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-sm font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Min K (Sweep)</label>
            <input
              type="number"
              min="2"
              max="6"
              value={kMin}
              onChange={(e) => setKMin(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-sm focus:outline-none"
            />
          </div>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Max K (Sweep)</label>
            <input
              type="number"
              min="4"
              max="15"
              value={kMax}
              onChange={(e) => setKMax(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-sm focus:outline-none"
            />
          </div>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
            <label className="text-[11px] font-bold text-slate-400 block mb-1">n_init (Restarts)</label>
            <input
              type="number"
              min="5"
              max="50"
              value={nInit}
              onChange={(e) => setNInit(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-sm focus:outline-none"
            />
          </div>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Max Iterations</label>
            <input
              type="number"
              min="50"
              max="1000"
              value={maxIter}
              onChange={(e) => setMaxIter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-sm focus:outline-none"
            />
          </div>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Random Seed</label>
            <input
              type="number"
              value={randomSeed}
              onChange={(e) => setRandomSeed(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-purple-300 font-mono text-sm focus:outline-none"
            />
          </div>
        </div>
      </div>

      {(loading || elbowLoading) && (
        <LoadingSpinner message={loading ? "Fitting definitive Scikit-Learn KMeans model..." : "Executing multi-K evaluation sweep..."} />
      )}

      {/* Elbow Curve & Silhouette Comparison Charts */}
      {elbowResults && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Elbow Curve */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-white">Elbow Curve: Inertia (WCSS)</h3>
                <p className="text-xs text-slate-400">Sum of squared Euclidean distances to assigned cluster centers</p>
              </div>
              <StatusBadge status="active" label="Euclidean L2" />
            </div>

            <PlotlyChart
              data={elbowChartData}
              layout={{
                height: 300,
                xaxis: { title: 'Number of Clusters (K)', color: '#94A3B8', dtick: 1 },
                yaxis: { title: 'Inertia / WCSS', color: '#94A3B8' }
              }}
            />
          </div>

          {/* Chart 2: Silhouette & Davies-Bouldin */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-white">Silhouette Score & Davies-Bouldin Index</h3>
                <p className="text-xs text-slate-400">Cluster cohesion vs separation trade-off</p>
              </div>
              <span className="text-xs font-mono text-emerald-400">
                Best K = {elbowResults.best_k_silhouette} (Sil: {elbowResults.best_silhouette_value})
              </span>
            </div>

            <PlotlyChart
              data={evaluationChartData}
              layout={{
                height: 300,
                xaxis: { title: 'Number of Clusters (K)', color: '#94A3B8', dtick: 1 },
                yaxis: { title: 'Silhouette Score', color: '#10B981' },
                yaxis2: {
                  title: 'Davies-Bouldin Index',
                  color: '#8B5CF6',
                  overlaying: 'y',
                  side: 'right'
                },
                legend: { x: 0.1, y: 1.15, orientation: 'h' }
              }}
            />
          </div>
        </div>
      )}

      {/* Active Model Metrics Cards */}
      {clusteringResult && (
        <div className="rounded-xl bg-slate-900/90 border border-cyan-800/40 p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-semibold uppercase text-cyan-400 tracking-wider">Active Fitted Model</span>
              <h3 className="text-base font-bold text-white">Scikit-Learn KMeans (K={clusteringResult.n_clusters})</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCompareManhattan}
                disabled={manhattanLoading}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-semibold text-xs border border-purple-800/40 flex items-center space-x-1.5 transition"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>{manhattanLoading ? "Computing..." : "Compare with Manhattan K-Medoids"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Silhouette Score</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{clusteringResult.silhouette_score}</span>
            </div>
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Davies-Bouldin Index</span>
              <span className="text-xl font-bold font-mono text-purple-400">{clusteringResult.davies_bouldin_index}</span>
            </div>
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Inertia (WCSS)</span>
              <span className="text-xl font-bold font-mono text-cyan-400">{clusteringResult.inertia}</span>
            </div>
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Calinski-Harabasz</span>
              <span className="text-xl font-bold font-mono text-blue-400">{clusteringResult.calinski_harabasz_score}</span>
            </div>
          </div>

          {/* Cluster Sizes Breakdown */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Cluster Segment Allocation</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {Object.entries(clusteringResult.cluster_sizes).map(([cid, count]) => {
                const pct = clusteringResult.cluster_percentages?.[cid] || 0;
                return (
                  <div key={cid} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-cyan-400 font-bold">Cluster {cid}:</span>
                    <div className="text-white font-mono mt-0.5 font-semibold">{count} segments ({pct}%)</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Manhattan Distance Comparison Section */}
      {manhattanComparison && (
        <div className="rounded-xl bg-slate-900/90 border border-purple-800/40 p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <GitCompare className="w-4 h-4" />
            <span>Mathematical Distance Metric Comparison</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Euclidean K-Means vs. Manhattan K-Medoids (L1 Norm)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Euclidean KMeans */}
            <div className="rounded-xl bg-slate-950 border border-cyan-800/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-cyan-400 uppercase">Standard K-Means</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">Euclidean (L2)</span>
              </div>
              <div className="space-y-2 text-xs font-mono text-slate-300">
                <div className="flex justify-between">
                  <span>Silhouette (Euclidean):</span>
                  <b className="text-white">{manhattanComparison.kmeans_euclidean.silhouette_euclidean}</b>
                </div>
                <div className="flex justify-between">
                  <span>Silhouette (Manhattan):</span>
                  <b className="text-slate-400">{manhattanComparison.kmeans_euclidean.silhouette_manhattan}</b>
                </div>
                <div className="flex justify-between">
                  <span>Davies-Bouldin Index:</span>
                  <b className="text-purple-400">{manhattanComparison.kmeans_euclidean.davies_bouldin_index}</b>
                </div>
                <div className="flex justify-between">
                  <span>Centroid Formulation:</span>
                  <span className="text-slate-400">Continuous arithmetic means</span>
                </div>
              </div>
            </div>

            {/* Manhattan K-Medoids */}
            <div className="rounded-xl bg-slate-950 border border-purple-800/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-purple-400 uppercase">K-Medoids (PAM)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">Manhattan (L1)</span>
              </div>
              <div className="space-y-2 text-xs font-mono text-slate-300">
                <div className="flex justify-between">
                  <span>Silhouette (Manhattan):</span>
                  <b className="text-white">{manhattanComparison.kmedoids_manhattan.silhouette_manhattan}</b>
                </div>
                <div className="flex justify-between">
                  <span>Silhouette (Euclidean):</span>
                  <b className="text-slate-400">{manhattanComparison.kmedoids_manhattan.silhouette_euclidean}</b>
                </div>
                <div className="flex justify-between">
                  <span>Davies-Bouldin Index:</span>
                  <b className="text-purple-400">{manhattanComparison.kmedoids_manhattan.davies_bouldin_index}</b>
                </div>
                <div className="flex justify-between">
                  <span>Medoid Formulation:</span>
                  <span className="text-slate-400">Actual road segments (discrete)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Academic explanation of Manhattan vs Euclidean */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <span className="font-bold text-slate-300 block mb-1">Methodological Rationale:</span>
            {manhattanComparison.mathematical_notes?.map((note, idx) => (
              <p key={idx}>• {note}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
