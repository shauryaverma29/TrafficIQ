import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';
import {
  SlidersHorizontal,
  CheckCircle2,
  Trash2,
  Settings,
  Scale,
  Sparkles,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

export default function PreprocessingPage({ overview, onPreprocessed, onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [numericImputation, setNumericImputation] = useState('median');
  const [categoricalImputation, setCategoricalImputation] = useState('mode');
  const [handleDuplicates, setHandleDuplicates] = useState(true);
  const [scalingMethod, setScalingMethod] = useState('standard');
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const profile = overview?.profile || {};
  const allNumeric = profile.numeric_columns || [];
  const allCategorical = profile.categorical_columns || [];
  const idColumns = profile.id_like_columns || [];

  useEffect(() => {
    // Initialize default recommended features
    if (overview?.recommendations) {
      const recs = [
        ...(overview.recommendations.recommended_numeric || []),
        ...(overview.recommendations.recommended_categorical || [])
      ];
      setSelectedFeatures(recs);
    } else {
      setSelectedFeatures([...allNumeric, ...allCategorical]);
    }
  }, [overview]);

  const toggleFeature = (col) => {
    if (selectedFeatures.includes(col)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== col));
    } else {
      setSelectedFeatures([...selectedFeatures, col]);
    }
  };

  const selectAll = () => {
    setSelectedFeatures([...allNumeric, ...allCategorical]);
  };

  const deselectAll = () => {
    setSelectedFeatures([]);
  };

  const handleApplyPreprocessing = async () => {
    if (selectedFeatures.length === 0) {
      setFeedback({ type: 'error', text: 'Please select at least one feature for clustering.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.preprocess({
        selected_features: selectedFeatures,
        numeric_imputation: numericImputation,
        categorical_imputation: categoricalImputation,
        handle_duplicates: handleDuplicates,
        scaling_method: scalingMethod,
      });
      setResult(res);
      setFeedback({ type: 'success', text: 'Preprocessing successfully applied and logged!' });
      onPreprocessed();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error || 'Failed to apply preprocessing.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Feature Pipeline Configuration</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Data Preprocessing & Standardisation Module</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Configure missing value imputation strategies, categorical encoding, duplicate handling, and feature scaling
              required for distance-based clustering algorithms.
            </p>
          </div>

          <button
            onClick={handleApplyPreprocessing}
            disabled={loading || selectedFeatures.length === 0}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-600/25 transition shrink-0 flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply Preprocessing</span>
          </button>
        </div>

        {feedback && (
          <div className={`mb-6 p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
              : 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
          }`}>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedback.text}</span>
            </div>
            {result && (
              <button
                onClick={() => onNavigate('clustering')}
                className="px-3 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1 transition"
              >
                <span>Proceed to Clustering Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Preprocessing Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Missing Numeric */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
            <label className="text-xs font-bold text-slate-300 block mb-1">Numerical Imputation</label>
            <p className="text-[11px] text-slate-500 mb-2">Handling sensor missing values</p>
            <select
              value={numericImputation}
              onChange={(e) => setNumericImputation(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="median">Median (Robust to Outliers)</option>
              <option value="mean">Mean (Arithmetic Average)</option>
            </select>
          </div>

          {/* Missing Categorical */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
            <label className="text-xs font-bold text-slate-300 block mb-1">Categorical Imputation</label>
            <p className="text-[11px] text-slate-500 mb-2">Strategy for text columns</p>
            <select
              value={categoricalImputation}
              onChange={(e) => setCategoricalImputation(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="mode">Mode (Most Frequent Class)</option>
              <option value="missing">Tag as 'Missing' Indicator</option>
            </select>
          </div>

          {/* Duplicate Handling */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
            <label className="text-xs font-bold text-slate-300 block mb-1">Duplicate Handling</label>
            <p className="text-[11px] text-slate-500 mb-2">Redundant sensor observations</p>
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="dup_check"
                checked={handleDuplicates}
                onChange={(e) => setHandleDuplicates(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 focus:ring-0 focus:ring-offset-0"
              />
              <label htmlFor="dup_check" className="text-xs text-slate-300 cursor-pointer">
                Remove Exact Duplicates
              </label>
            </div>
          </div>

          {/* Feature Scaling */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
            <label className="text-xs font-bold text-slate-300 block mb-1">Numerical Scaling</label>
            <p className="text-[11px] text-slate-500 mb-2">Distance metric standardisation</p>
            <select
              value={scalingMethod}
              onChange={(e) => setScalingMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="standard">StandardScaler (z = (x - μ) / σ)</option>
              <option value="minmax">MinMaxScaler ([0, 1] range)</option>
            </select>
          </div>
        </div>

        {/* Feature Selection Section */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Select Features for Clustering</h3>
              <p className="text-xs text-slate-400">
                Identifiers and single-value columns are excluded by default to avoid biasing geometric distances.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={selectAll}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
              >
                Select All Valid
              </button>
              <button
                onClick={deselectAll}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {allNumeric.map(col => {
              const isSelected = selectedFeatures.includes(col);
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => toggleFeature(col)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-mono truncate font-semibold">{col}</span>
                  <span className="text-[10px] text-cyan-400/80 mt-1 uppercase font-medium">Numeric</span>
                </button>
              );
            })}

            {allCategorical.map(col => {
              const isSelected = selectedFeatures.includes(col);
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => toggleFeature(col)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-950/60 border-purple-500/60 text-purple-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-mono truncate font-semibold">{col}</span>
                  <span className="text-[10px] text-purple-400/80 mt-1 uppercase font-medium">Categorical (One-Hot)</span>
                </button>
              );
            })}
          </div>

          {idColumns.length > 0 && (
            <div className="mt-3 text-[11px] text-slate-500 flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Identifiers auto-excluded from clustering: {idColumns.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {loading && <LoadingSpinner message="Applying data cleaning, one-hot encoding, and numerical scaling..." />}

      {/* Before & After Comparison + Decision Log */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Before & After Stats */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-3">Before vs. After Comparison</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Before */}
              <div className="rounded-lg bg-slate-950 border border-slate-800 p-3.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Original State</span>
                <div className="space-y-1.5 text-xs font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span>Rows:</span> <b className="text-white">{result.before_stats.rows}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Features:</span> <b className="text-white">{result.before_stats.columns}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Missing Values:</span> <b className="text-amber-400">{result.before_stats.missing_values}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Duplicates:</span> <b className="text-amber-400">{result.before_stats.duplicates}</b>
                  </div>
                </div>
              </div>

              {/* After */}
              <div className="rounded-lg bg-slate-950 border border-cyan-800/40 p-3.5">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block mb-2">Preprocessed State</span>
                <div className="space-y-1.5 text-xs font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span>Cleaned Rows:</span> <b className="text-white">{result.after_stats.rows}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Encoded Dimensions:</span> <b className="text-cyan-400">{result.after_stats.final_feature_dimension}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Missing Values:</span> <b className="text-emerald-400">0</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Scaling Method:</span> <b className="text-purple-400">{result.after_stats.scaling_applied}</b>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block mb-2">Preprocessed Features Matrix ({result.scaled_columns?.length} Dimensions)</span>
              <div className="flex flex-wrap gap-1.5">
                {result.scaled_columns?.map(col => (
                  <span key={col} className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Automatic Decision Log */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-3">Auditable Preprocessing Decision Log</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
              {result.decision_log?.map((d, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-cyan-400 mb-0.5">
                    <span>{d.stage?.replace('_', ' ')}</span>
                    {d.column && <span className="font-mono lowercase text-slate-400">{d.column}</span>}
                  </div>
                  <p className="text-slate-300">{d.action || `${d.strategy} imputation with fill value ${d.fill_value} for ${d.imputed_count} record(s)`}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
