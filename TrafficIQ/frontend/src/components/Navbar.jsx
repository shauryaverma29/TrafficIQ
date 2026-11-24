import React from 'react';
import { Database, FileDown, RefreshCw, CheckCircle2, AlertCircle, Sun, Moon } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ title, subtitle, onRefresh, onLoadDemo, isOnline, loading, theme, onToggleTheme }) {
  const isDark = theme !== 'light';

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
          <span>{title}</span>
        </h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-3">
        {/* Backend Connectivity Status */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs">
          {isOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-medium">Backend ML Active</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-400 font-medium">Backend Offline</span>
            </>
          )}
        </div>

        {/* Load Demo Dataset */}
        <button
          onClick={onLoadDemo}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-800/40 hover:border-cyan-700 transition"
          title="Load bundled Kaggle traffic prediction demonstration dataset"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Load Demo Data</span>
        </button>

        {/* Download PDF */}
        <a
          href={api.pdfReportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md shadow-cyan-600/20 transition"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>Download PDF</span>
        </a>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          title="Refresh dataset state"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* ── Dark / Light Mode Toggle ─────────────────────────────────── */}
        <button
          onClick={onToggleTheme}
          className="theme-toggle-btn relative flex items-center justify-between w-14 h-7 rounded-full border border-slate-700 bg-slate-900 hover:border-slate-600 px-1 transition"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {/* Sun icon */}
          <Sun className={`w-3.5 h-3.5 transition-colors ${isDark ? 'text-slate-600' : 'text-amber-400'}`} />
          {/* Moon icon */}
          <Moon className={`w-3.5 h-3.5 transition-colors ${isDark ? 'text-cyan-400' : 'text-slate-400'}`} />
          {/* Sliding pill */}
          <span
            className={`absolute top-0.5 w-6 h-6 rounded-full shadow transition-all duration-300 ease-in-out ${
              isDark
                ? 'translate-x-7 bg-slate-700'
                : 'translate-x-0 bg-amber-400'
            }`}
          />
        </button>
      </div>
    </header>
  );
}
