import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Filter,
  List,
  Map,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Camera,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Globe,
  Info,
  X
} from 'lucide-react';
import MapComponent from '../components/MapComponent';
import { api } from '../services/api';

// ─── City centre seed (Bangalore MG Road / Central Metro) ───────────────────
const CITY_CENTER = { latitude: 12.9716, longitude: 77.5946, name: 'City Center Metro Hub' };

// ─── Radius options (km).  "all" maps to globe‐wide on the backend ───────────
const RADIUS_OPTIONS = [
  { label: '1 km',   value: 1 },
  { label: '3 km',   value: 3 },
  { label: '5 km',   value: 5 },
  { label: '10 km',  value: 10 },
  { label: 'All City', value: 'all' },
];

export default function NearbyIssuesPage({ onNavigate }) {
  // ── Location state ────────────────────────────────────────────────────────
  const [userLocation, setUserLocation]       = useState(null);  // real GPS or null
  const [activeCenter, setActiveCenter]       = useState(CITY_CENTER); // coords used for search
  const [locationMode, setLocationMode]       = useState('city'); // 'city' | 'gps'
  const [gpsLoading, setGpsLoading]           = useState(false);
  const [gpsError, setGpsError]               = useState(null);

  // ── Data state ────────────────────────────────────────────────────────────
  const [reports, setReports]                 = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [userIsFar, setUserIsFar]             = useState(false);
  const [closestKm, setClosestKm]             = useState(null);
  const [totalInRegistry, setTotalInRegistry] = useState(0);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [viewMode, setViewMode]               = useState('both');
  const [radius, setRadius]                   = useState(5);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus]   = useState('All');
  const [selectedPhoto, setSelectedPhoto]     = useState(null);

  const fetchedOnce = useRef(false);

  // ── Core fetch function ───────────────────────────────────────────────────
  const fetchNearby = async (lat, lng, r, cat, stat) => {
    setLoading(true);
    try {
      const res = await api.getNearbyHazards(lat, lng, r, cat, stat);
      let data = res.reports || [];

      // If user is far from seed data and radius was limited, backend sends
      // all_reports as a helpful fallback – use them to avoid a blank page.
      const isFar = !!res.user_is_far_from_data;
      setUserIsFar(isFar);
      setClosestKm(res.closest_report_km ?? null);
      setTotalInRegistry(res.total_in_registry ?? 0);

      if (data.length === 0 && isFar && res.all_reports?.length > 0) {
        data = res.all_reports;
      }
      setReports(data);
    } catch (err) {
      console.error('NearbyIssues fetch error:', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // ── On mount: immediately fetch city-centre data, then silently try GPS ───
  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    // Instant data with city centre so the page is never blank
    fetchNearby(CITY_CENTER.latitude, CITY_CENTER.longitude, radius, selectedCategory, selectedStatus);

    // Silently attempt GPS in the background
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude:  parseFloat(pos.coords.latitude.toFixed(6)),
            longitude: parseFloat(pos.coords.longitude.toFixed(6)),
            accuracy:  Math.round(pos.coords.accuracy),
          };
          setUserLocation(coords);
          // Don't auto-switch — let the user decide with the toggle button
        },
        () => { /* GPS unavailable — city centre remains active */ },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, []); // runs once

  // ── Re-fetch when filters change (after mount) ────────────────────────────
  useEffect(() => {
    if (!fetchedOnce.current) return;
    fetchNearby(activeCenter.latitude, activeCenter.longitude, radius, selectedCategory, selectedStatus);
  }, [radius, selectedCategory, selectedStatus, activeCenter]);

  // ── GPS location request (triggered by button) ────────────────────────────
  const requestGPS = () => {
    setGpsLoading(true);
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Your browser does not support geolocation.');
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude:  parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
          accuracy:  Math.round(pos.coords.accuracy),
        };
        setUserLocation(coords);
        setActiveCenter(coords);
        setLocationMode('gps');
        setGpsLoading(false);
        fetchNearby(coords.latitude, coords.longitude, radius, selectedCategory, selectedStatus);
      },
      (err) => {
        setGpsError('GPS permission denied or unavailable. Showing city-wide reports below.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const switchToCityCenter = () => {
    setLocationMode('city');
    setActiveCenter(CITY_CENTER);
    // useEffect will fire fetchNearby automatically
  };

  // ── Badge helpers ─────────────────────────────────────────────────────────
  const getSeverityClass = (sev) => {
    switch ((sev || '').toLowerCase()) {
      case 'critical': return 'bg-rose-950/80 text-rose-300 border-rose-800/80';
      case 'high':     return 'bg-orange-950/80 text-orange-300 border-orange-800/80';
      case 'medium':   return 'bg-amber-950/80 text-amber-300 border-amber-800/80';
      default:         return 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80';
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Verified')
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
          <ShieldCheck className="w-3 h-3 mr-1" />Verified
        </span>
      );
    if (status === 'In Progress' || status === 'Assigned')
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
          <Clock className="w-3 h-3 mr-1" />In Progress
        </span>
      );
    if (status === 'Resolved')
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
          Resolved
        </span>
      );
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
        Pending Verification
      </span>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header Card ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 text-xs font-semibold mb-2">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real-Time Proximity Awareness</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Reported Road Issues Near Me
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Inspect road hazards, fallen branches, signal defects, and potholes reported nearby.
              Verified authority reports are marked distinctly from citizen submissions.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={requestGPS}
              disabled={gpsLoading}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white font-semibold text-xs shadow-lg shadow-cyan-600/20 transition flex items-center space-x-1.5"
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span>{gpsLoading ? 'Detecting GPS…' : 'Use My GPS'}</span>
            </button>

            {userLocation && locationMode === 'gps' && (
              <button
                onClick={switchToCityCenter}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 transition flex items-center space-x-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>City Center Hub</span>
              </button>
            )}

            <button
              onClick={() => onNavigate && onNavigate('report-hazard')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
            >
              + Report New Issue
            </button>
          </div>
        </div>

        {/* ── Location Status Bar ─────────────────────────────────────────── */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className={`w-2 h-2 rounded-full animate-pulse ${locationMode === 'gps' ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
            <span>Search center:</span>
            <strong className="text-white font-mono">
              {activeCenter.latitude.toFixed(5)}, {activeCenter.longitude.toFixed(5)}
            </strong>
            <span className="text-slate-500 italic">
              ({locationMode === 'gps' ? '📡 Your GPS' : `🏙️ ${CITY_CENTER.name}`})
            </span>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {[['both', 'Split'], ['map', 'Map'], ['list', 'List']].map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  viewMode === mode
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── GPS Error Banner ────────────────────────────────────────────── */}
        {gpsError && (
          <div className="mt-3 flex items-start space-x-2 p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{gpsError}</span>
            <button onClick={() => setGpsError(null)} className="ml-auto text-amber-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Far-from-data warning ───────────────────────────────────────── */}
        {userIsFar && locationMode === 'gps' && (
          <div className="mt-3 flex items-start space-x-2 p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-indigo-200 text-xs">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
            <span>
              Your GPS is <strong className="text-white">{closestKm} km</strong> from the nearest municipal
              monitoring zone. Showing citywide reports from the active network below.{' '}
              <button
                onClick={switchToCityCenter}
                className="underline text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Switch to City Center Hub
              </button>{' '}
              to explore local reports on the map.
            </span>
          </div>
        )}
      </div>

      {/* ── Filter Toolbar ────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">

          {/* Radius */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-semibold">Radius:</span>
            {RADIUS_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setRadius(value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                  radius === value
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-600/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Category */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-semibold">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="All">All Categories</option>
              <option value="Pothole / Broken Road">Potholes &amp; Road Damage</option>
              <option value="Fallen Tree / Branch">Fallen Trees</option>
              <option value="Road Blockage">Road Blockages</option>
              <option value="Waterlogging / Flooding">Waterlogging</option>
              <option value="Traffic Signal Failure">Traffic Signal Failure</option>
              <option value="Accident Debris">Accident Debris</option>
              <option value="Damaged Footpath">Damaged Footpaths</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-semibold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="All">All Statuses</option>
              <option value="Verified">Verified Only</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted">Pending Verification</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-slate-400 font-medium">
          {loading ? (
            <span className="flex items-center space-x-1.5 text-cyan-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Loading…</span>
            </span>
          ) : (
            <span>
              Found <strong className="text-white">{reports.length}</strong> hazard
              {reports.length !== 1 ? 's' : ''}{' '}
              {radius === 'all' ? '(citywide)' : `within ${radius} km`}
              {totalInRegistry > 0 && ` · ${totalInRegistry} total in registry`}
            </span>
          )}
        </div>
      </div>

      {/* ── Map + List ───────────────────────────────────────────────────── */}
      <div className={`grid gap-6 ${viewMode === 'both' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>

        {/* Map Panel */}
        {(viewMode === 'both' || viewMode === 'map') && (
          <div className={viewMode === 'both' ? 'lg:col-span-6' : 'w-full'}>
            <MapComponent
              hazards={reports}
              userLocation={activeCenter}
              height="540px"
              title={`Nearby Hazards (${reports.length})`}
            />
          </div>
        )}

        {/* List Panel */}
        {(viewMode === 'both' || viewMode === 'list') && (
          <div className={`${viewMode === 'both' ? 'lg:col-span-6' : 'w-full'} space-y-3 max-h-[540px] overflow-y-auto pr-1`}>
            {loading ? (
              <div className="p-10 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <span className="text-sm text-slate-400">Fetching nearby hazards…</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col items-center justify-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">No Hazards Found</h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  No road issues reported within {radius === 'all' ? 'the city' : `${radius} km`} matching your filters.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => setRadius('all')}
                    className="px-3 py-1.5 rounded-lg bg-cyan-900/60 hover:bg-cyan-900 text-cyan-300 text-xs font-semibold border border-cyan-800"
                  >
                    Show All City Reports
                  </button>
                  <button
                    onClick={switchToCityCenter}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
                  >
                    Use City Center Hub
                  </button>
                </div>
              </div>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep.report_id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-extrabold text-sm text-white tracking-tight">
                          {rep.road_name || 'Unknown Road'}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                          {rep.report_id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {rep.address || 'Address not specified'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {rep.latitude && rep.longitude ? (
                        <>
                          <span className="text-xs font-bold text-cyan-400 block font-mono">
                            {rep.distance_km !== undefined ? `${rep.distance_km} km` : 'Geolocated'}
                          </span>
                          <span className="text-[10px] text-slate-500">from pin</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[11px] font-bold text-amber-400 block">No coords</span>
                          <span className="text-[10px] text-slate-500">manual entry</span>
                        </>
                      )}
                    </div>
                  </div>

                  {rep.description && (
                    <p className="text-xs text-slate-300 leading-snug line-clamp-2">{rep.description}</p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {getStatusBadge(rep.status)}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSeverityClass(rep.severity)}`}>
                        {rep.severity} Severity
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-950 text-slate-400 border border-slate-800">
                        {rep.category}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {rep.photo_url && (
                        <button
                          onClick={() => setSelectedPhoto(rep.photo_url)}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Photo</span>
                        </button>
                      )}
                      <button
                        onClick={() => onNavigate && onNavigate('track-report')}
                        className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
                      >
                        <span>Track</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Photo Modal ───────────────────────────────────────────────────── */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-3 py-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200">Citizen Uploaded Evidence</span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-slate-400 hover:text-white text-xs flex items-center space-x-1"
              >
                <X className="w-3.5 h-3.5" /><span>Close</span>
              </button>
            </div>
            <img
              src={selectedPhoto}
              alt="Hazard full view"
              className="w-full max-h-[70vh] object-contain rounded-lg mt-2"
            />
          </div>
        </div>
      )}
    </div>
  );
}
