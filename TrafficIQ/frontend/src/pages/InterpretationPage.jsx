import React, { useState, useEffect } from 'react';
import PlotlyChart from '../charts/PlotlyChart';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';
import {
  Lightbulb,
  Table,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  Car,
  Gauge,
  Flame,
  CheckCircle2
} from 'lucide-react';

export default function InterpretationPage({ overview, onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const isClustered = overview?.is_clustered;

  useEffect(() => {
    if (isClustered) {
      loadInterpretation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClustered]);

  const loadInterpretation = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.getInterpretation();
      setData(res);
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error || 'Failed to load cluster interpretations.' });
    } finally {
      setLoading(false);
    }
  };

  const profiles = data?.cluster_profiles || [];
  const meansTable = data?.cluster_means_table || {};
  const heatmapData = data?.standardized_heatmap || [];

  // Plotly Heatmap of standardized z-scores
  const heatmapFeatures = heatmapData.map(h => h.feature);
  const clusterIds = profiles.map(p => `Cluster ${p.cluster_id}`);
  const zMatrix = heatmapFeatures.map(feat => {
    const item = heatmapData.find(h => h.feature === feat);
    return profiles.map(p => (item?.cluster_z_scores?.[String(p.cluster_id)] ?? 0.0));
  });

  const plotHeatmap = heatmapFeatures.length > 0 && clusterIds.length > 0 ? [
    {
      z: zMatrix,
      x: clusterIds,
      y: heatmapFeatures,
      type: 'heatmap',
      colorscale: [
        [0, '#0284C7'],  // Below average (blue)
        [0.5, '#0F172A'], // Baseline (dark)
        [1, '#EC4899']   // Above average (pink/rose)
      ],
      hoverongaps: false
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Lightbulb className="w-4 h-4" />
              <span>Evidence-Grounded Semantics</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Cluster Interpretation & Congestion Profiles</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Mathematically derived profiles based strictly on calculated feature distributions. Each cluster reveals
              empirical congestion dynamics rather than subjective labels.
            </p>
          </div>

          {!isClustered && (
            <button
              onClick={() => onNavigate('clustering')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg transition flex items-center space-x-1.5 shrink-0"
            >
              <span>Run Clustering First</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Academic Disclaimer Callout */}
        <div className="mt-4 p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <b className="text-slate-300">Methodological Note:</b> Unsupervised clustering uncovers mathematical groupings based on spatial proximity in normalized feature space.
            Discovered profiles represent exploratory empirical tendencies in the sample and must not be treated as permanent, deterministic road classifications.
          </p>
        </div>
      </div>

      {loading && <LoadingSpinner message="Calculating cluster averages, z-scores, and natural language descriptions..." />}

      {/* Cluster Cards Grid */}
      {profiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {profiles.map((p) => {
            const cid = p.cluster_id;
            const cardColors = [
              'border-cyan-500/40 from-cyan-950/30',
              'border-blue-500/40 from-blue-950/30',
              'border-purple-500/40 from-purple-950/30',
              'border-pink-500/40 from-pink-950/30',
              'border-emerald-500/40 from-emerald-950/30'
            ];
            const activeStyle = cardColors[cid % cardColors.length];

            return (
              <div
                key={cid}
                className={`rounded-xl bg-gradient-to-b ${activeStyle} to-slate-900/90 border p-5 shadow-lg flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-extrabold text-white font-mono tracking-tight">
                      Cluster {cid}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-950 text-cyan-300 border border-slate-800 font-mono font-semibold">
                      {p.record_count} segments ({p.record_percentage}%)
                    </span>
                  </div>

                  {/* Summary Narrative */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 italic">
                    "{p.summary_narrative}"
                  </p>

                  {/* Key Diagnostics if available */}
                  <div className="space-y-2 mb-4">
                    {p.traffic_diagnostics?.speed_metric && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center space-x-1.5">
                          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Avg Speed:</span>
                        </span>
                        <b className="font-mono text-white">{p.traffic_diagnostics.speed_metric.value} km/h</b>
                      </div>
                    )}
                    {p.traffic_diagnostics?.volume_metric && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center space-x-1.5">
                          <Car className="w-3.5 h-3.5 text-blue-400" />
                          <span>Avg Volume:</span>
                        </span>
                        <b className="font-mono text-white">{p.traffic_diagnostics.volume_metric.value} veh/hr</b>
                      </div>
                    )}
                    {p.traffic_diagnostics?.congestion_metric && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center space-x-1.5">
                          <Flame className="w-3.5 h-3.5 text-purple-400" />
                          <span>Avg Congestion:</span>
                        </span>
                        <b className="font-mono text-purple-300">{p.traffic_diagnostics.congestion_metric.value} / 100</b>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Deviations Pill list */}
                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Significant Distinctions:</span>
                  <div className="flex flex-wrap gap-1">
                    {p.top_deviations?.map((dev, idx) => (
                      <span
                        key={idx}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          dev.pct_diff > 0
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                            : 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                        }`}
                      >
                        {dev.column}: {dev.pct_diff > 0 ? `+${dev.pct_diff.toFixed(1)}%` : `${dev.pct_diff.toFixed(1)}%`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cluster Means Comparison Table */}
      {Object.keys(meansTable).length > 0 && (
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Cluster Means Comparison Table</h3>
              <p className="text-xs text-slate-400">Direct side-by-side numerical averages across all clusters</p>
            </div>
            <StatusBadge status="ready" label="Empirical Averages" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-300">
                  <th className="p-3">Feature Name</th>
                  {profiles.map(p => (
                    <th key={p.cluster_id} className="p-3 text-cyan-400 font-bold">
                      Cluster {p.cluster_id} Mean
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {Object.entries(meansTable).map(([feat, clusterVals]) => (
                  <tr key={feat} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-white">{feat}</td>
                    {profiles.map(p => (
                      <td key={p.cluster_id} className="p-3">
                        {clusterVals[String(p.cluster_id)] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Standardized Profile Heatmap (Z-Scores) */}
      {plotHeatmap.length > 0 && (
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white">Standardized Feature Profile Heatmap (Z-Scores)</h3>
              <p className="text-xs text-slate-400">
                Relative deviations from dataset global mean (Z &gt; 0 represents above-average values; Z &lt; 0 represents below-average)
              </p>
            </div>
            <StatusBadge status="active" label="Standardized (Z-Score)" />
          </div>

          <PlotlyChart
            data={plotHeatmap}
            layout={{
              height: 380,
              margin: { t: 30, r: 30, b: 60, l: 140 }
            }}
          />
        </div>
      )}
    </div>
  );
}
