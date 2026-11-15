import React from 'react';
import {
  ShieldAlert,
  Info,
  Layers,
  Sparkles,
  Cpu,
  Database,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Scale
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-6">
      {/* Project Academic Header */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-lg">
        <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Academic Machine Learning Project</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          TrafficIQ: Road-Segment Congestion Profiles Through Unsupervised Learning
        </h2>
        <p className="mt-1.5 text-sm text-slate-400 max-w-3xl leading-relaxed">
          An interactive, production-grade unsupervised machine learning platform engineered to discover empirical traffic congestion patterns,
          segment urban corridors without ground-truth supervisory labels, evaluate distance metric behaviors (Euclidean vs. Manhattan),
          and rigorously audit cluster stability and methodological limitations.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Domain</span>
            <span className="text-white font-semibold">Urban Traffic & Smart Cities</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Methodology</span>
            <span className="text-cyan-400 font-semibold font-mono">K-Means, K-Medoids & PCA</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Validation Metric</span>
            <span className="text-emerald-400 font-semibold font-mono">Silhouette, DB & ARI</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Implementation</span>
            <span className="text-purple-400 font-semibold font-mono">React + Flask + Scikit-Learn</span>
          </div>
        </div>
      </div>

      {/* Section 10: Responsible Use & Limitations (Crucial requirement from prompt) */}
      <div className="rounded-xl bg-slate-900/90 border border-amber-800/40 p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <ShieldAlert className="w-5 h-5" />
          <span>Section 10: Methodological Limitations & Responsible Use</span>
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight">
          Critical Considerations for Algorithmic Traffic Clustering
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The models implemented within TrafficIQ are designed strictly for <b>exploratory data analysis</b> and <b>decision support</b>.
          Discovered clusters should not be treated as permanent real-world road classifications, nor should they be utilized to dictate high-stakes municipal policy without rigorous human oversight.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Bias 1 */}
          <div className="rounded-lg bg-slate-950 border border-slate-800 p-4">
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>1. Dataset Sampling Bias</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Traffic observations are often collected from fixed loop detectors or connected vehicles. Arterials or neighborhoods lacking dense sensor infrastructure are systematically underrepresented, potentially biasing global cluster centers towards major highways.
            </p>
          </div>

          {/* Bias 2 */}
          <div className="rounded-lg bg-slate-950 border border-slate-800 p-4">
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>2. Missing & Noisy Sensor Data</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Physical loop detectors and radar sensors experience hardware glitches, optical obstruction during storms, and communication packet drops. Imputation strategies (mean/median) restore continuity but can dampen true variance in localized shockwave congestion.
            </p>
          </div>

          {/* Bias 3 */}
          <div className="rounded-lg bg-slate-950 border border-slate-800 p-4">
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>3. Temporal & Seasonal Limitations</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              A sample captured during specific months or day-types cannot capture macro-scale seasonal fluctuations, construction seasons, public holidays, or pandemic-induced telecommuting shifts without continuous retraining.
            </p>
          </div>

          {/* Bias 4 */}
          <div className="rounded-lg bg-slate-950 border border-slate-800 p-4">
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>4. Sensitivity to Feature Scaling & Selection</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Distance metrics (Euclidean and Manhattan) are highly sensitive to the scale and mix of included variables. Omitting road occupancy or adding extra categorical flags can alter Voronoi cluster boundaries significantly.
            </p>
          </div>

          {/* Bias 5 */}
          <div className="rounded-lg bg-slate-950 border border-slate-800 p-4">
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>5. Mathematical Assumptions of K-Means</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Standard K-Means assumes spherical, isotropic cluster geometry of comparable variance in Euclidean space. It can struggle when traffic states follow non-linear curved manifolds (e.g. queue discharge curves in speed-flow diagrams).
            </p>
          </div>

          {/* Bias 6 */}
          <div className="rounded-lg bg-slate-950 border border-slate-800 p-4">
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>6. Limitations of PCA Projections</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              PCA is a linear orthogonal transformation that maximizes variance. While 2D PCA visualizes global spread, subtle non-linear cluster separations along minor components may be flattened in a 2D projection.
            </p>
          </div>
        </div>
      </div>

      {/* Full Stack Architecture Overview */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-lg space-y-4">
        <h3 className="text-base font-bold text-white">Full-Stack System Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-lg bg-slate-950 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold">
              <Cpu className="w-4 h-4" />
              <span>Frontend Layer</span>
            </div>
            <ul className="text-slate-400 space-y-1 list-disc list-inside">
              <li>React 18 & Vite bundler</li>
              <li>Tailwind CSS Dark City styling</li>
              <li>Plotly.js dynamic vector charts</li>
              <li>Lucide React iconography</li>
              <li>Axios REST API integration</li>
            </ul>
          </div>

          <div className="rounded-lg bg-slate-950 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center space-x-2 text-blue-400 font-bold">
              <Layers className="w-4 h-4" />
              <span>Backend ML Engine</span>
            </div>
            <ul className="text-slate-400 space-y-1 list-disc list-inside">
              <li>Python 3.11 & Flask REST API</li>
              <li>Scikit-Learn K-Means & PCA</li>
              <li>Scipy L1 Manhattan K-Medoids (PAM)</li>
              <li>Multi-seed Adjusted Rand Index (ARI)</li>
              <li>ReportLab automated PDF compilation</li>
            </ul>
          </div>

          <div className="rounded-lg bg-slate-950 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center space-x-2 text-purple-400 font-bold">
              <Database className="w-4 h-4" />
              <span>Data Pipeline</span>
            </div>
            <ul className="text-slate-400 space-y-1 list-disc list-inside">
              <li>Pandas DataFrame operations</li>
              <li>StandardScaler & MinMaxScaler</li>
              <li>IQR outlier detection</li>
              <li>One-hot dummy encoding</li>
              <li>CSV export and ingestion pipelines</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
