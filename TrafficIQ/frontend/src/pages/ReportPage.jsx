import React from 'react';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';
import {
  FileText,
  FileDown,
  Table,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Download,
  ExternalLink
} from 'lucide-react';

export default function ReportPage({ overview, clusteringData }) {
  const isClustered = overview?.is_clustered || Boolean(clusteringData);
  const isPreprocessed = overview?.is_preprocessed;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4" />
              <span>Academic Documentation & Exports</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Project Report & Data Export Suite</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Download formal PDF research reports and export machine-readable CSV artifacts, including the
              standardized feature matrix, clustered road segment datasets, and multi-K evaluation metrics.
            </p>
          </div>

          <a
            href={api.pdfReportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold text-xs tracking-wide shadow-lg shadow-cyan-600/25 transition shrink-0 flex items-center space-x-2"
          >
            <FileDown className="w-4 h-4" />
            <span>Generate Official PDF Report</span>
          </a>
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Artifact 1: Processed CSV */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                <Table className="w-4 h-4" />
              </div>
              <StatusBadge status={isPreprocessed ? 'ready' : 'unpreprocessed'} label={isPreprocessed ? 'Available' : 'Pending Preprocessing'} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Standardized Feature Matrix (CSV)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export preprocessed dataset with missing values imputed, categorical variables one-hot encoded, and numerical features scaled.
            </p>
          </div>

          <a
            href={api.exportProcessedCsvUrl}
            download="trafficiq_processed_features.csv"
            className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              isPreprocessed
                ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                : 'bg-slate-950 text-slate-600 border border-slate-800 pointer-events-none'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Processed Features (.csv)</span>
          </a>
        </div>

        {/* Artifact 2: Clustered CSV */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/40">
                <Table className="w-4 h-4" />
              </div>
              <StatusBadge status={isClustered ? 'ready' : 'unpreprocessed'} label={isClustered ? 'Available' : 'Pending Clustering'} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Clustered Road Segments (CSV)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export the full original dataset with an additional <code className="text-cyan-400 font-mono">cluster_label</code> column assigned to each road segment observation.
            </p>
          </div>

          <a
            href={api.exportClusteredCsvUrl}
            download="trafficiq_clustered_road_segments.csv"
            className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              isClustered
                ? 'bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700'
                : 'bg-slate-950 text-slate-600 border border-slate-800 pointer-events-none'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Clustered Dataset (.csv)</span>
          </a>
        </div>

        {/* Artifact 3: Metrics CSV */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-800/40">
                <Table className="w-4 h-4" />
              </div>
              <StatusBadge status={overview?.is_preprocessed ? 'ready' : 'unpreprocessed'} label="Multi-K Metrics" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Clustering Evaluation Metrics (CSV)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export parameter optimization evaluations across K=2..10, including WCSS/Inertia, Silhouette Scores, and Davies-Bouldin indices.
            </p>
          </div>

          <a
            href={api.exportMetricsCsvUrl}
            download="trafficiq_clustering_metrics.csv"
            className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 transition flex items-center justify-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Evaluation Table (.csv)</span>
          </a>
        </div>
      </div>

      {/* Comprehensive Report Contents Preview */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-lg space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight">Report Structure & Methodological Contents</h3>
        <p className="text-xs text-slate-400">
          The generated PDF adheres to formal academic research conventions and includes the following fully rendered sections:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-400 font-mono">Section 1: Executive Summary</span>
            <p className="text-slate-400 text-[11px]">Problem framing, unsupervised discovery objectives, and key findings across road networks.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-400 font-mono">Section 2: Data Preprocessing & Quality Engineering</span>
            <p className="text-slate-400 text-[11px]">Audit log of imputation methods, one-hot encoding, duplicate removal, and StandardScaler parameterization.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-400 font-mono">Section 3: Clustering Evaluation & Model Selection</span>
            <p className="text-slate-400 text-[11px]">Inertia (Elbow method), Silhouette score, and Davies-Bouldin metrics alongside mathematical distance analysis.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-400 font-mono">Section 4: Discovered Road-Segment Congestion Profiles</span>
            <p className="text-slate-400 text-[11px]">Calculated statistical feature means, deviations from global baseline, and descriptive interpretations.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-400 font-mono">Section 5: Multi-Seed Stability & Sensitivity Analysis</span>
            <p className="text-slate-400 text-[11px]">Pairwise Adjusted Rand Index (ARI) benchmarking across 5 independent seed initializations.</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-400 font-mono">Section 6: Responsible Use, Bias & Limitations</span>
            <p className="text-slate-400 text-[11px]">Explicit discussion of temporal/spatial sampling bias, metric sensitivity, and non-permanent nature of clusters.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
