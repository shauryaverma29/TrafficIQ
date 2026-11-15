import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, color = "cyan", badge }) {
  const colorMap = {
    cyan: "from-cyan-500/20 to-blue-600/5 text-cyan-400 border-cyan-500/20",
    blue: "from-blue-500/20 to-indigo-600/5 text-blue-400 border-blue-500/20",
    purple: "from-purple-500/20 to-pink-600/5 text-purple-400 border-purple-500/20",
    emerald: "from-emerald-500/20 to-teal-600/5 text-emerald-400 border-emerald-500/20",
    amber: "from-amber-500/20 to-orange-600/5 text-amber-400 border-amber-500/20"
  };

  const accentColor = colorMap[color] || colorMap.cyan;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800 p-5 shadow-lg hover:border-slate-700 transition-all duration-200">
      <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl ${accentColor} blur-2xl pointer-events-none rounded-full`} />
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 ${color === 'cyan' ? 'text-cyan-400' : color === 'purple' ? 'text-purple-400' : 'text-blue-400'}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <div className="text-2xl font-bold tracking-tight text-white font-mono">{value ?? "—"}</div>
        {badge && <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">{badge}</span>}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-400 flex items-center">
          {subtitle}
        </p>
      )}
    </div>
  );
}
