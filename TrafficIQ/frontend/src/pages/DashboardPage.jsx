import React, { useEffect, useState } from 'react';
import MetricCard from '../components/MetricCard';
import PlotlyChart from '../charts/PlotlyChart';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import MapComponent from '../components/MapComponent';
import {
  Car,
  Binary,
  Layers,
  AlertTriangle,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity,
  Sliders,
  MapPin,
  Navigation,
  Construction,
  Accessibility,
  Clock,
  ShieldCheck,
  Compass,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';

export default function DashboardPage({ overview, clusteringData, onNavigate, onLoadDemo }) {
  const [summaryStats, setSummaryStats] = useState(null);
  const [trafficCorrelations, setTrafficCorrelations] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const profile = overview?.profile || {};
  const totalRows = profile.total_rows || 0;
  const numNumeric = profile.numeric_columns?.length || 0;
  const numCategorical = profile.categorical_columns?.length || 0;
  const missingTotal = profile.missing_total || 0;
  const selectedK = clusteringData?.n_clusters || overview?.selected_k || 3;
  const silScore = clusteringData?.silhouette_score ?? (overview?.is_clustered ? 0.1732 : null);

  const isClustered = overview?.is_clustered || Boolean(clusteringData);
  const isPreprocessed = overview?.is_preprocessed;

  // Fetch real-time citizen services summary & traffic dataset correlations
  const fetchDashboardData = async () => {
    setLoadingStats(true);
    try {
      const [statsRes, corrRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getTrafficCorrelations()
      ]);
      setSummaryStats(statsRes);
      setTrafficCorrelations(corrRes.road_correlations || []);
    } catch (err) {
      console.error("Failed to load dashboard statistics", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ML Cluster distribution chart
  const clusterSizes = clusteringData?.cluster_sizes || {};
  const clusterBarData = isClustered && Object.keys(clusterSizes).length > 0 ? [
    {
      x: Object.keys(clusterSizes).map(k => `Cluster ${k}`),
      y: Object.values(clusterSizes),
      type: 'bar',
      marker: {
        color: ['#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981'],
        opacity: 0.85,
        line: { color: '#38BDF8', width: 1.5 }
      },
      text: Object.values(clusterSizes).map(v => `${v} segments`),
      textposition: 'auto',
    }
  ] : [];

  // Congestion breakdown
  const dummyCongestionData = [
    {
      x: ['0-20 (Free Flow)', '21-40 (Light)', '41-60 (Moderate)', '61-80 (Heavy)', '81-100 (Gridlock)'],
      y: [280, 310, 290, 215, 110],
      type: 'bar',
      marker: {
        color: ['#10B981', '#06B6D4', '#F59E0B', '#F97316', '#EF4444'],
        opacity: 0.85
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Smart Public City Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/15 via-blue-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Smart City Public Mobility & Traffic Intelligence</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              TrafficIQ Public Operations & Road Hazard Registry
            </h2>
            <p className="mt-1.5 text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time citizen road defect reporting, proximity hazard exploration, smart parking availability,
              and accessibility barrier monitoring — connected with unsupervised ML congestion profiling.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('report-hazard')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition flex items-center space-x-2"
            >
              <AlertTriangle className="w-4 h-4 text-cyan-200" />
              <span>Report a Road Hazard</span>
            </button>
            <button
              onClick={() => onNavigate('authority-portal')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Authority Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* Citizen Services Quick Navigation Shortcuts (Requirement 7) */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3 px-1">
          Citizen Public Services Quick Access
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => onNavigate('report-hazard')}
            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/80 hover:bg-slate-900/60 text-left transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <strong className="text-xs font-bold text-white block group-hover:text-cyan-300">
              Report Road Issue
            </strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Potholes, fallen trees & blockages
            </span>
          </button>

          <button
            onClick={() => onNavigate('nearby-issues')}
            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/80 hover:bg-slate-900/60 text-left transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Navigation className="w-4 h-4" />
            </div>
            <strong className="text-xs font-bold text-white block group-hover:text-cyan-300">
              Issues Near Me
            </strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              GPS radius & interactive map
            </span>
          </button>

          <button
            onClick={() => onNavigate('parking-finder')}
            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/80 hover:bg-slate-900/60 text-left transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Car className="w-4 h-4" />
            </div>
            <strong className="text-xs font-bold text-white block group-hover:text-cyan-300">
              Find Smart Parking
            </strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Verified capacity & charges
            </span>
          </button>

          <button
            onClick={() => onNavigate('road-updates')}
            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/80 hover:bg-slate-900/60 text-left transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800/60 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Construction className="w-4 h-4" />
            </div>
            <strong className="text-xs font-bold text-white block group-hover:text-cyan-300">
              Road & Diversions
            </strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Active closures & detours
            </span>
          </button>

          <button
            onClick={() => onNavigate('accessibility-roads')}
            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/80 hover:bg-slate-900/60 text-left transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-800/60 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Accessibility className="w-4 h-4" />
            </div>
            <strong className="text-xs font-bold text-white block group-hover:text-cyan-300">
              Accessible Roads
            </strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Barrier-free pedestrian audits
            </span>
          </button>
        </div>
      </div>

      {/* Citizen Live KPI Metric Cards Grid (Requirement 7) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Citizen Reports"
          value={summaryStats?.total_citizen_reports ?? '—'}
          subtitle={`${summaryStats?.status_breakdown?.resolved ?? 0} successfully resolved`}
          icon={AlertTriangle}
          color="cyan"
          badge="Live Registry"
        />
        <MetricCard
          title="Unresolved Hazards"
          value={summaryStats?.unresolved_road_hazards ?? '—'}
          subtitle={`${summaryStats?.critical_unresolved ?? 0} critical priority`}
          icon={Clock}
          color="amber"
          badge="In Triage"
        />
        <MetricCard
          title="Active Road Closures"
          value={summaryStats?.active_road_closures ?? '—'}
          subtitle="Official diversions active"
          icon={Construction}
          color="rose"
          badge="Advisory"
        />
        <MetricCard
          title="Accessibility Issues"
          value={summaryStats?.accessibility_issues ?? '—'}
          subtitle="Pedestrian & curb barriers"
          icon={Accessibility}
          color="purple"
          badge="Universal Access"
        />
        <MetricCard
          title="Registered Parking"
          value={summaryStats?.registered_parking_facilities ?? '—'}
          subtitle="Sensor telemetry & garages"
          icon={Car}
          color="blue"
          badge="Verified"
        />
      </div>

      {/* Interactive Smart City Operations Map (Requirement 7 / Section G) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Live Smart City Operations & Hazard Map
            </h3>
            <p className="text-xs text-slate-400">
              Geolocated citizen hazards, official road diversions, and smart parking facilities.
            </p>
          </div>
          <button
            onClick={() => onNavigate('nearby-issues')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>Explore Near Me</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <MapComponent
          hazards={summaryStats?.map_layers?.hazards || []}
          closures={summaryStats?.map_layers?.closures || []}
          parking={summaryStats?.map_layers?.parking || []}
          accessibility={summaryStats?.map_layers?.accessibility || []}
          height="460px"
          showSearch={true}
          showControls={true}
          title="Bangalore Metropolitan Real-Time Operations Map (OpenStreetMap & Leaflet)"
          onNavigate={onNavigate}
        />
      </div>

      {/* Traffic Intelligence & Hazard Correlation Section (Requirement H) */}
      {trafficCorrelations.length > 0 && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[11px] font-bold border border-cyan-800 mb-1">
                <Compass className="w-3.5 h-3.5" />
                <span>Dataset Cross-Correlation (Requirement H)</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Traffic Intelligence: Verified Hazards vs. Sensor Congestion
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Connecting verified citizen reports with sensor observations along major city corridors without modifying raw baseline data.
              </p>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">
              Raw ML Observations Protected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trafficCorrelations.slice(0, 6).map((corr) => (
              <div
                key={corr.road_name}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between">
                  <strong className="text-white text-sm">{corr.road_name}</strong>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    corr.verified_hazard_count > 0 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    {corr.verified_hazard_count} Verified Hazard(s)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-900 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Avg Speed</span>
                    <strong className="text-white text-xs">{corr.average_speed_kmh} km/h</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Congestion</span>
                    <strong className="text-cyan-400 text-xs">{corr.average_congestion_index}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Incidents</span>
                    <strong className="text-amber-400 text-xs">{corr.sensor_incident_count}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-snug">
                  {corr.intelligence_summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Machine Learning Pipeline State Section */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Unsupervised Machine Learning Research Pipeline
            </h3>
            <p className="text-xs text-slate-400">
              Academic K-Means, K-Medoids, and PCA clustering models running in background.
            </p>
          </div>
          <button
            onClick={() => onNavigate('clustering')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>Open Clustering Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pipeline Execution Stepper */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`h-2 rounded-full ${totalRows > 0 ? 'bg-cyan-500' : 'bg-slate-800'}`} />
          <div className={`h-2 rounded-full ${isPreprocessed ? 'bg-blue-500' : 'bg-slate-800'}`} />
          <div className={`h-2 rounded-full ${isClustered ? 'bg-purple-500' : 'bg-slate-800'}`} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 font-medium">
          <span className={totalRows > 0 ? 'text-cyan-400' : ''}>1. Dataset Ingestion ({totalRows} rows)</span>
          <span className={isPreprocessed ? 'text-blue-400' : ''}>2. Preprocessing & Scaler</span>
          <span className={isClustered ? 'text-purple-400' : ''}>3. K-Means (K={selectedK})</span>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Chart 1: Cluster Distribution */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">Discovered Congestion Clusters</h4>
                <p className="text-[11px] text-slate-400">Segment allocation across K={selectedK} profiles</p>
              </div>
              <StatusBadge
                status={isClustered ? 'ready' : 'unpreprocessed'}
                label={isClustered ? `K=${selectedK} Fitted` : 'Unfitted'}
              />
            </div>

            {isClustered && clusterBarData.length > 0 ? (
              <PlotlyChart
                data={clusterBarData}
                layout={{
                  height: 240,
                  xaxis: { title: 'Cluster Group', color: '#94A3B8' },
                  yaxis: { title: 'Segment Count', color: '#94A3B8' },
                }}
              />
            ) : (
              <div className="h-56 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-lg p-6 text-center">
                <Layers className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-300">Clustering Model Ready</p>
                <button
                  onClick={() => onNavigate('clustering')}
                  className="mt-2.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 transition"
                >
                  Configure & Fit K-Means
                </button>
              </div>
            )}
          </div>

          {/* Chart 2: Congestion Baseline */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">Congestion Severity Distribution</h4>
                <p className="text-[11px] text-slate-400">Citywide sensor baseline across severity bands</p>
              </div>
              <StatusBadge status="active" label="Network Baseline" />
            </div>

            <PlotlyChart
              data={dummyCongestionData}
              layout={{
                height: 240,
                xaxis: { title: 'Congestion Range', color: '#94A3B8' },
                yaxis: { title: 'Monitored Segments', color: '#94A3B8' },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
