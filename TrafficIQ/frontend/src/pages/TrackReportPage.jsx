import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Camera,
  MapPin,
  Calendar,
  Building2,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Phone,
  Mail,
  FileSearch,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../services/api';

const DEMO_REPORTS = [
  { id: 'REP-2026-00101', label: 'Pothole on Uptown Commercial Ave (Verified)' },
  { id: 'REP-2026-00102', label: 'Fallen Tree on Central Metro Arterial (In Progress)' },
  { id: 'REP-2026-00103', label: 'Signal Failure on Tech Innovation Blvd (Assigned)' },
];

// ─── Shared status badge ───────────────────────────────────────────────────────
function StatusBadge({ status }) {
  switch (status) {
    case 'Verified':
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">Verified</span>;
    case 'In Progress':
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-950 text-purple-300 border border-purple-800">In Progress</span>;
    case 'Assigned':
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800">Assigned</span>;
    case 'Resolved':
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">Resolved</span>;
    case 'Rejected':
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800">Rejected</span>;
    default:
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">Submitted</span>;
  }
}

// ─── Severity color ────────────────────────────────────────────────────────────
function SevBadge({ severity }) {
  const cls = {
    critical: 'bg-rose-950 text-rose-300 border-rose-800',
    high:     'bg-orange-950 text-orange-300 border-orange-800',
    medium:   'bg-amber-950 text-amber-300 border-amber-800',
  }[(severity || '').toLowerCase()] || 'bg-slate-900 text-slate-400 border-slate-800';
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>{severity}</span>;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TrackReportPage({ initialReportId = '', onNavigate }) {
  // ── Track-by-ID state ────────────────────────────────────────────────────
  const [reportIdInput, setReportIdInput]   = useState(initialReportId || '');
  const [reportData, setReportData]         = useState(null);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);

  // ── Find-My-Report state ─────────────────────────────────────────────────
  const [showFinder, setShowFinder]         = useState(false);
  const [findContact, setFindContact]       = useState('');
  const [findRoad, setFindRoad]             = useState('');
  const [findCategory, setFindCategory]     = useState('All');
  const [findDateFrom, setFindDateFrom]     = useState('');
  const [findDateTo, setFindDateTo]         = useState('');
  const [findResults, setFindResults]       = useState(null);
  const [findLoading, setFindLoading]       = useState(false);
  const [findError, setFindError]           = useState(null);

  // ── Track by ID ───────────────────────────────────────────────────────────
  const fetchReport = async (idToSearch) => {
    const cleanId = (idToSearch || reportIdInput).trim().toUpperCase();
    if (!cleanId) return;
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      const res = await api.trackReport(cleanId);
      setReportData(res);
    } catch (err) {
      setError(err.response?.data?.error || `Report ID '${cleanId}' was not found in the official registry.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialReportId) {
      setReportIdInput(initialReportId);
      fetchReport(initialReportId);
    }
  }, [initialReportId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReport();
  };

  // ── Find My Report ────────────────────────────────────────────────────────
  const handleFind = async (e) => {
    e.preventDefault();
    if (!findContact.trim() && !findRoad.trim()) {
      setFindError('Enter your phone number, email address, or the road name you reported.');
      return;
    }
    setFindLoading(true);
    setFindError(null);
    setFindResults(null);
    try {
      const params = {};
      if (findContact.trim()) params.contact = findContact.trim();
      if (findRoad.trim())    params.road    = findRoad.trim();
      if (findCategory !== 'All') params.category = findCategory;
      if (findDateFrom)  params.date_from = findDateFrom;
      if (findDateTo)    params.date_to   = findDateTo;
      const res = await api.findMyReports(params);
      setFindResults(res);
    } catch (err) {
      setFindError(err.response?.data?.error || 'Search failed. Please try again.');
    } finally {
      setFindLoading(false);
    }
  };

  const useFoundId = (id) => {
    setReportIdInput(id);
    setShowFinder(false);
    setFindResults(null);
    fetchReport(id);
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* ── Track by ID Header ────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="max-w-xl">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 text-xs font-semibold mb-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Citizen Tracking &amp; Accountability</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Track My Road Hazard Report
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter your unique Report ID (e.g. <strong className="text-slate-200 font-mono">REP-2026-00101</strong>) to
            view verified municipal inspection remarks, assigned repair squads, and real-time resolution status.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              value={reportIdInput}
              onChange={(e) => setReportIdInput(e.target.value.toUpperCase())}
              placeholder="Enter Report ID  (e.g. REP-2026-00101)…"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !reportIdInput.trim()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><span>Track Report</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        {/* Quick Demo Pre-fills */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 text-[11px]">Quick Samples:</span>
          {DEMO_REPORTS.map((rep) => (
            <button
              key={rep.id}
              onClick={() => { setReportIdInput(rep.id); fetchReport(rep.id); }}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-[11px] font-mono text-cyan-300 border border-slate-800 hover:border-cyan-700 transition"
            >
              {rep.id}
            </button>
          ))}
        </div>

        {/* ── "Don't have your ID?" collapsible ──────────────────────────── */}
        <div className="mt-5 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => { setShowFinder(!showFinder); setFindResults(null); setFindError(null); }}
            className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
          >
            <FileSearch className="w-4 h-4" />
            <span>Don't have your Report ID? Find it here</span>
            {showFinder
              ? <ChevronDown className="w-3.5 h-3.5" />
              : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {showFinder && (
            <div className="mt-4 p-5 rounded-xl bg-slate-950 border border-cyan-900/50 space-y-5 animate-in fade-in slide-in-from-top-2">
              <div>
                <h3 className="text-sm font-bold text-white mb-0.5">Find My Report</h3>
                <p className="text-xs text-slate-400">
                  Enter the contact details you used when submitting, or the road name, to locate your Report ID.
                  Your personal information is <strong className="text-slate-300">never displayed</strong> — only matching Report IDs are returned.
                </p>
              </div>

              <form onSubmit={handleFind} className="space-y-4">
                {/* Row 1 — contact + road */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Phone / Email used when reporting
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        value={findContact}
                        onChange={(e) => setFindContact(e.target.value)}
                        placeholder="e.g. 9876543210 or name@email.com"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Road or area name you reported
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        value={findRoad}
                        onChange={(e) => setFindRoad(e.target.value)}
                        placeholder="e.g. MG Road, Indiranagar…"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2 — category + date range */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Issue Category (optional)
                    </label>
                    <select
                      value={findCategory}
                      onChange={(e) => setFindCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan-600"
                    >
                      <option value="All">Any Category</option>
                      <option value="Pothole / Broken Road">Pothole / Broken Road</option>
                      <option value="Fallen Tree / Branch">Fallen Tree / Branch</option>
                      <option value="Road Blockage">Road Blockage</option>
                      <option value="Waterlogging / Flooding">Waterlogging / Flooding</option>
                      <option value="Traffic Signal Failure">Traffic Signal Failure</option>
                      <option value="Accident Debris">Accident Debris</option>
                      <option value="Exposed Wires">Exposed Wires</option>
                      <option value="Damaged Street Infrastructure">Damaged Infrastructure</option>
                      <option value="Damaged Footpath">Damaged Footpath</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Submitted from (optional)
                    </label>
                    <input
                      type="date"
                      value={findDateFrom}
                      onChange={(e) => setFindDateFrom(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Submitted until (optional)
                    </label>
                    <input
                      type="date"
                      value={findDateTo}
                      onChange={(e) => setFindDateTo(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan-600"
                    />
                  </div>
                </div>

                {findError && (
                  <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{findError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={findLoading}
                  className="px-5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white font-bold text-xs shadow transition flex items-center space-x-2"
                >
                  {findLoading
                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    : <FileSearch className="w-3.5 h-3.5" />}
                  <span>{findLoading ? 'Searching registry…' : 'Search My Reports'}</span>
                </button>
              </form>

              {/* ── Find Results ─────────────────────────────────────────── */}
              {findResults && (
                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  {findResults.count === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 space-y-1">
                      <p className="font-bold text-slate-300">No matching reports found.</p>
                      <p>Try using the contact details you entered at submission, or a broader road name.</p>
                      <p className="text-[11px] italic text-slate-500 mt-1">
                        Note: Reports submitted anonymously cannot be found by contact details.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-cyan-400">
                        Found <strong>{findResults.count}</strong> matching report{findResults.count !== 1 ? 's' : ''}.
                        Click a Report ID to load its full status.
                      </p>
                      <div className="space-y-2">
                        {findResults.reports.map((rep) => (
                          <div
                            key={rep.report_id}
                            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-800/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="font-bold text-sm text-white font-mono">{rep.report_id}</span>
                                <StatusBadge status={rep.status} />
                                <SevBadge severity={rep.severity} />
                              </div>
                              <p className="text-xs text-slate-300 font-semibold">{rep.category}</p>
                              <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span>{rep.road_name}{rep.address ? ` — ${rep.address}` : ''}</span>
                              </p>
                              <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>Submitted: {new Date(rep.created_at).toLocaleString()}</span>
                              </p>
                            </div>
                            <button
                              onClick={() => useFoundId(rep.report_id)}
                              className="shrink-0 px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow"
                            >
                              <span>View Full Status</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Error State ───────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Full Report Detail ────────────────────────────────────────────── */}
      {reportData && reportData.report && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Status Header */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div>
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-xl font-extrabold text-white font-mono tracking-tight">
                    {reportData.report.report_id}
                  </span>
                  <StatusBadge status={reportData.report.status} />
                </div>
                <h3 className="text-base font-bold text-cyan-300 mt-1">{reportData.report.category}</h3>
              </div>
              <div className="text-right text-xs text-slate-400">
                <span>Submitted:</span>
                <strong className="text-slate-200 block font-mono">
                  {new Date(reportData.report.created_at).toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Progress Timeline */}
            {!reportData.is_rejected ? (
              <div className="py-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-4">
                  Visual Progress Timeline
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {reportData.timeline.map((step, idx) => (
                    <div
                      key={step.stage}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                        step.is_current
                          ? 'bg-cyan-950/60 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                          : step.completed
                          ? 'bg-slate-950/80 border-emerald-800/60 text-slate-300'
                          : 'bg-slate-950/40 border-slate-800/60 opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold font-mono text-slate-500">0{idx + 1}</span>
                        {step.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : step.is_current ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-700" />
                        )}
                      </div>
                      <span className={`text-xs font-bold block ${step.is_current ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {step.label}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 leading-snug">{step.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs">
                <div className="flex items-center space-x-2 font-bold text-rose-300 mb-1">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Report Rejected by Municipal Authority</span>
                </div>
                <p className="leading-relaxed">
                  <strong>Official Reason:</strong>{' '}
                  {reportData.rejection_reason || 'Does not qualify as actionable road hazard under municipal civil code.'}
                </p>
              </div>
            )}

            {/* Core Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Location</span>
                  <p className="text-white font-semibold mt-0.5">{reportData.report.road_name}</p>
                  <p className="text-slate-400 text-[11px]">{reportData.report.address || 'Address not registered'}</p>
                  {reportData.report.latitude && reportData.report.longitude && (
                    <p className="text-cyan-400 font-mono text-[11px] mt-1 flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{reportData.report.latitude}, {reportData.report.longitude}</span>
                    </p>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-900">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Description</span>
                  <p className="text-slate-300 leading-relaxed mt-0.5">{reportData.report.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-900 flex justify-between">
                  <span className="text-slate-400">Assessed Severity:</span>
                  <SevBadge severity={reportData.report.severity} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1 block">
                    <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />Official Authority Remarks
                  </span>
                  <p className="text-slate-200 mt-1 leading-relaxed italic bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    {reportData.report.authority_remarks || 'Awaiting initial on-site municipal engineer verification.'}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-900">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Workgroup</span>
                  <p className="text-white mt-0.5">
                    {reportData.report.assigned_to
                      ? `${reportData.report.assigned_to} (${reportData.report.assigned_department || 'Municipal Public Works'})`
                      : 'Pending crew assignment'}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-900 flex justify-between text-slate-400">
                  <span>Last Registry Update:</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {new Date(reportData.report.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {reportData.report.photo_url && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 mb-2">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Citizen Uploaded Photograph</span>
                  </span>
                  <img
                    src={reportData.report.photo_url}
                    alt="Citizen evidence"
                    className="w-full h-48 object-cover rounded-lg border border-slate-800"
                  />
                </div>
              )}
              {reportData.report.resolution_photo_url && (
                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-800/60">
                  <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Official Municipal Resolution Photograph</span>
                  </span>
                  <img
                    src={reportData.report.resolution_photo_url}
                    alt="Resolution evidence"
                    className="w-full h-48 object-cover rounded-lg border border-emerald-800/40"
                  />
                </div>
              )}
            </div>

            {/* Audit Trail */}
            {reportData.audit_trail && reportData.audit_trail.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  System Audit Trail
                </span>
                <div className="space-y-1.5 text-xs">
                  {reportData.audit_trail.map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 text-slate-400 text-[11px]">
                      <div>
                        <strong className="text-white mr-2">[{a.action}]</strong>
                        <span>{a.details}</span>
                      </div>
                      <div className="shrink-0 text-slate-500 font-mono ml-2">
                        {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
