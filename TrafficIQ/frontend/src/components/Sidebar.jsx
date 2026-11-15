import React from 'react';
import {
  LayoutDashboard,
  Database,
  SlidersHorizontal,
  Network,
  Lightbulb,
  Activity,
  FileText,
  Info,
  CarFront,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, datasetOverview }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'dataset', label: 'Dataset Explorer', icon: Database },
    { id: 'preprocessing', label: 'Data Preprocessing', icon: SlidersHorizontal },
    { id: 'clustering', label: 'Clustering Lab', icon: Network },
    { id: 'pca', label: 'PCA Visualisation', icon: Activity },
    { id: 'interpretation', label: 'Cluster Interpretation', icon: Lightbulb },
    { id: 'stability', label: 'Stability Analysis', icon: Activity },
    { id: 'report', label: 'Project Report', icon: FileText },
    { id: 'about', label: 'About Project', icon: Info },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <CarFront className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                TrafficIQ
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                ML
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Smart City Intelligence</p>
          </div>
        </div>
        <p className="mt-2.5 text-[11px] text-slate-400 leading-snug italic border-l-2 border-cyan-500/40 pl-2">
          Discover Hidden Traffic Patterns Through Unsupervised Learning
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Analytics Pipeline
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent text-cyan-400 border-l-2 border-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Pipeline Status Summary in Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 font-medium">Status</span>
          <span className={`inline-flex items-center text-[11px] font-semibold ${
            datasetOverview?.is_clustered
              ? 'text-emerald-400'
              : datasetOverview?.is_preprocessed
              ? 'text-cyan-400'
              : datasetOverview?.has_data
              ? 'text-blue-400'
              : 'text-slate-500'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
            {datasetOverview?.is_clustered
              ? `Clustered (K=${datasetOverview.selected_k || 3})`
              : datasetOverview?.is_preprocessed
              ? 'Preprocessed'
              : datasetOverview?.has_data
              ? 'Dataset Loaded'
              : 'No Dataset'}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 truncate font-mono">
          {datasetOverview?.dataset_name || 'Upload CSV or Load Demo'}
        </div>
      </div>
    </aside>
  );
}
