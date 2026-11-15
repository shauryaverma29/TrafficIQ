import React from 'react';

export default function StatusBadge({ status, label, className = "" }) {
  let colors = "bg-slate-800 text-slate-300 border-slate-700";

  switch (status) {
    case 'success':
    case 'ready':
    case 'High Stability':
      colors = "bg-emerald-950/60 text-emerald-300 border-emerald-700/50";
      break;
    case 'active':
    case 'preprocessed':
    case 'clustered':
    case 'Moderate Stability':
      colors = "bg-cyan-950/60 text-cyan-300 border-cyan-700/50";
      break;
    case 'warning':
    case 'unpreprocessed':
    case 'Low / Sensitive Stability':
      colors = "bg-amber-950/60 text-amber-300 border-amber-700/50";
      break;
    case 'error':
      colors = "bg-rose-950/60 text-rose-300 border-rose-700/50";
      break;
    case 'purple':
      colors = "bg-purple-950/60 text-purple-300 border-purple-700/50";
      break;
    default:
      colors = "bg-slate-800/80 text-slate-300 border-slate-700/60";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {label || status}
    </span>
  );
}
