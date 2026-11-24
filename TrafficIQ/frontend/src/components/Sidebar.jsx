import React, { useState } from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Navigation,
  Car,
  Construction,
  Accessibility,
  Search,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Database,
  SlidersHorizontal,
  Network,
  Activity,
  Lightbulb,
  FileText,
  Info,
  CarFront,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, datasetOverview, authorityToken, theme }) {
  const [mlSectionOpen, setMlSectionOpen] = useState(false);
  const isDark = theme !== 'light';

  // ── Theme-aware token shortcuts ──────────────────────────────────────────
  const t = {
    aside:        isDark ? 'bg-slate-950 border-slate-800'          : 'bg-white border-slate-200',
    brand:        isDark ? 'border-slate-800/80'                    : 'border-slate-200',
    groupLabel:   isDark ? 'text-slate-500'                         : 'text-slate-400',
    navIdle:      isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
    navActive:    isDark ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent text-cyan-600 border-l-2 border-cyan-500 shadow-sm'
                        : 'bg-gradient-to-r from-cyan-100 via-blue-50 to-transparent text-cyan-700 border-l-2 border-cyan-500 shadow-sm',
    navHighlight: isDark ? 'bg-rose-950/30 text-rose-300 hover:bg-rose-950/50 border border-rose-800/40'
                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200',
    iconActive:   'text-cyan-500',
    iconHighlight:isDark ? 'text-rose-400' : 'text-rose-500',
    iconIdle:     isDark ? 'text-slate-500' : 'text-slate-400',
    sectionDiv:   isDark ? 'border-slate-900'  : 'border-slate-200',
    authActive:   isDark ? 'bg-gradient-to-r from-emerald-500/15 to-transparent text-emerald-400 border-l-2 border-emerald-400 shadow-sm'
                        : 'bg-gradient-to-r from-emerald-50 to-transparent text-emerald-700 border-l-2 border-emerald-500 shadow-sm',
    badgeAuth:    isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    badgeLogin:   isDark ? 'bg-slate-900 text-slate-500 border border-slate-800'
                        : 'bg-slate-100 text-slate-500 border border-slate-200',
    mlLabel:      isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700',
    mlActive:     isDark ? 'bg-cyan-950/60 text-cyan-400 border-l-2 border-cyan-400'
                        : 'bg-cyan-50 text-cyan-700 border-l-2 border-cyan-500',
    mlIdle:       isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100',
    footer:       isDark ? 'border-slate-800/80 bg-slate-900/40 text-slate-400'
                        : 'border-slate-200 bg-slate-50 text-slate-500',
    footerMono:   isDark ? 'text-slate-500' : 'text-slate-400',
  };

  const citizenNavItems = [
    { id: 'dashboard',         label: 'City Dashboard',         icon: LayoutDashboard },
    { id: 'report-hazard',     label: 'Report a Road Issue',    icon: AlertTriangle, highlight: true },
    { id: 'nearby-issues',     label: 'Issues Near Me',         icon: Navigation },
    { id: 'parking-finder',    label: 'Smart Parking Finder',   icon: Car },
    { id: 'road-updates',      label: 'Road & Diversion Updates', icon: Construction },
    { id: 'accessibility-roads',label: 'Accessible Road Info',  icon: Accessibility },
    { id: 'track-report',      label: 'Track My Report',        icon: Search },
  ];

  const authorityNavItems = [
    { id: 'authority-portal', label: 'Authority Control Centre', icon: ShieldCheck,
      badge: authorityToken ? 'Active' : 'Login' },
  ];

  const mlNavItems = [
    { id: 'dataset',        label: 'Dataset Explorer',      icon: Database },
    { id: 'preprocessing',  label: 'Data Preprocessing',    icon: SlidersHorizontal },
    { id: 'clustering',     label: 'Clustering Lab',        icon: Network },
    { id: 'pca',            label: 'PCA Visualisation',     icon: Activity },
    { id: 'interpretation', label: 'Cluster Interpretation',icon: Lightbulb },
    { id: 'stability',      label: 'Stability Analysis',    icon: Activity },
    { id: 'report',         label: 'Project Report & PDF',  icon: FileText },
    { id: 'about',          label: 'About & Methodology',   icon: Info },
  ];

  const isMlPage = mlNavItems.some(i => i.id === currentPage);

  return (
    <aside className={`w-64 border-r flex flex-col h-screen sticky top-0 shrink-0 transition-colors duration-300 ${t.aside}`}>

      {/* Brand Header */}
      <div className={`p-4 border-b ${t.brand}`}>
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <CarFront className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                TrafficIQ
              </span>
              <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 rounded ${
                isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' : 'bg-cyan-100 text-cyan-700 border border-cyan-200'
              }`}>
                Civic
              </span>
            </div>
            <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Smart City Operations
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">

        {/* Citizen Services */}
        <div className="space-y-1">
          <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${t.groupLabel}`}>
            Public Citizen Services
          </div>
          {citizenNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 text-left ${
                  isActive       ? t.navActive :
                  item.highlight ? t.navHighlight :
                                   t.navIdle
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${
                    isActive       ? t.iconActive :
                    item.highlight ? t.iconHighlight :
                                     t.iconIdle
                  }`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Municipal Authority */}
        <div className={`space-y-1 pt-1 border-t ${t.sectionDiv}`}>
          <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${t.groupLabel}`}>
            Municipal & Police
          </div>
          {authorityNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive ? t.authActive : t.navIdle
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-500' : t.iconIdle}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  authorityToken ? t.badgeAuth : t.badgeLogin
                }`}>
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Research & ML (Collapsible) */}
        <div className={`space-y-1 pt-1 border-t ${t.sectionDiv}`}>
          <button
            onClick={() => setMlSectionOpen(!mlSectionOpen)}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${t.mlLabel}`}
          >
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3 h-3 text-cyan-500" />
              <span>Research & ML Analytics</span>
            </div>
            {mlSectionOpen || isMlPage
              ? <ChevronDown className={`w-3.5 h-3.5 ${t.iconIdle}`} />
              : <ChevronRight className={`w-3.5 h-3.5 ${t.iconIdle}`} />}
          </button>

          {(mlSectionOpen || isMlPage) && (
            <div className="space-y-0.5 pl-1 animate-in fade-in">
              {mlNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                      isActive ? t.mlActive : t.mlIdle
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-500' : t.iconIdle}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer Status */}
      <div className={`p-3 border-t text-[11px] flex items-center justify-between transition-colors duration-300 ${t.footer}`}>
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>TrafficIQ Active</span>
        </span>
        <span className={`text-[10px] font-mono ${t.footerMono}`}>v2.0 Citizen</span>
      </div>
    </aside>
  );
}
