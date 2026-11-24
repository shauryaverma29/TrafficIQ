import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Camera,
  MapPin,
  Search,
  Filter,
  ArrowRight,
  Edit,
  Send,
  Building2,
  Car,
  Construction,
  Accessibility,
  Eye,
  RefreshCw,
  FileText,
  Map
} from 'lucide-react';
import RealLeafletMap from '../components/RealLeafletMap';
import api from '../services/api';

export default function AuthorityPortalPage({
  authorityToken,
  setAuthorityToken,
  authorityUser,
  setAuthorityUser
}) {
  // Login form state
  const [username, setUsername] = useState('officer@trafficiq.gov');
  const [password, setPassword] = useState('Authority@2026');
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab: 'hazards', 'parking', 'closures', 'accessibility', 'audit'
  const [activeTab, setActiveTab] = useState('hazards');

  // Hazards management state
  const [hazards, setHazards] = useState([]);
  const [hazardLoading, setHazardLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected hazard detail / action modal
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [actionType, setActionType] = useState(null); // 'verify', 'assign', 'status', 'reject', 'override'
  const [actionRemarks, setActionRemarks] = useState('');
  const [assignedCrew, setAssignedCrew] = useState('');
  const [assignedDept, setAssignedDept] = useState('Municipal Road Infrastructure Dept');
  const [newStatus, setNewStatus] = useState('In Progress');
  const [newSeverity, setNewSeverity] = useState('High');
  const [rejectionReason, setRejectionReason] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  // Parking inaccuracies
  const [parkingIssues, setParkingIssues] = useState([]);

  // Map layer states for Authority Geographic Monitoring
  const [allClosures, setAllClosures] = useState([]);
  const [allParking, setAllParking] = useState([]);
  const [allAccessibility, setAllAccessibility] = useState([]);

  // Audit trail
  const [auditLogs, setAuditLogs] = useState([]);

  // Fetch hazards for authority
  const fetchHazards = async () => {
    if (!authorityToken) return;
    setHazardLoading(true);
    try {
      const res = await api.getAuthorityReports({
        status: statusFilter,
        category: categoryFilter,
        severity: severityFilter,
        search: searchTerm
      }, authorityToken);
      setHazards(res.reports || []);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setHazardLoading(false);
    }
  };

  const fetchParkingIssues = async () => {
    if (!authorityToken) return;
    try {
      const res = await api.getParkingIssues(authorityToken);
      setParkingIssues(res.reports || []);
    } catch (err) {}
  };

  const fetchMapLayers = async () => {
    try {
      const [closuresRes, parkingRes, accRes] = await Promise.all([
        api.getRoadUpdates(),
        api.getParkingFacilities(),
        api.getAccessibilityReports()
      ]);
      setAllClosures(closuresRes.updates || []);
      setAllParking(parkingRes.facilities || []);
      setAllAccessibility(accRes.reports || []);
    } catch (err) {}
  };

  const fetchAuditLogs = async () => {
    if (!authorityToken) return;
    try {
      const res = await api.getAuditLog(authorityToken);
      setAuditLogs(res.logs || []);
    } catch (err) {}
  };

  useEffect(() => {
    if (authorityToken) {
      fetchHazards();
      fetchParkingIssues();
      fetchMapLayers();
      fetchAuditLogs();
    }
  }, [authorityToken, statusFilter, categoryFilter, severityFilter, searchTerm]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await api.authorityLogin({ username, password });
      setAuthorityToken(res.token);
      setAuthorityUser(res.user);
    } catch (err) {
      setLoginError(err.response?.data?.error || "Authentication failed. Please verify authority credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthorityToken(null);
    setAuthorityUser(null);
  };

  // Perform authority action on a report
  const executeAction = async (e) => {
    e.preventDefault();
    if (!selectedHazard) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      const id = selectedHazard.report_id;
      if (actionType === 'verify') {
        await api.verifyReport(id, actionRemarks || 'Report verified by field officer.', authorityToken);
      } else if (actionType === 'assign') {
        await api.assignReport(id, { assigned_to: assignedCrew, department: assignedDept, remarks: actionRemarks }, authorityToken);
      } else if (actionType === 'status') {
        const formData = new FormData();
        formData.append('status', newStatus);
        formData.append('remarks', actionRemarks);
        if (resolutionPhoto) {
          formData.append('resolution_photo', resolutionPhoto);
        }
        await api.updateReportStatus(id, formData, authorityToken);
      } else if (actionType === 'reject') {
        if (!rejectionReason.trim()) {
          alert("Rejection reason is required.");
          setActionLoading(false);
          return;
        }
        await api.rejectReport(id, rejectionReason, authorityToken);
      } else if (actionType === 'override') {
        await api.overrideSeverity(id, { severity: newSeverity, justification: actionRemarks }, authorityToken);
      }

      setActionMsg("Action saved successfully in backend database.");
      setTimeout(() => {
        setActionType(null);
        setSelectedHazard(null);
        setActionMsg(null);
        fetchHazards();
        fetchAuditLogs();
      }, 1200);
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // If not logged in, show authority login gate
  if (!authorityToken) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-600/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Authority Control Centre
            </h2>
            <p className="text-xs text-slate-400">
              Restricted area for verified traffic police officers and municipal road maintenance supervisors.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Authority Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Access Passcode</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition flex items-center justify-center space-x-2"
            >
              {loginLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Authority Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Preset */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-bold text-cyan-300 block">Demonstration Credentials:</span>
            <div className="flex justify-between">
              <span>Username:</span>
              <strong className="text-white font-mono">officer@trafficiq.gov</strong>
            </div>
            <div className="flex justify-between">
              <span>Passcode:</span>
              <strong className="text-white font-mono">Authority@2026</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Authority Portal Dashboard
  return (
    <div className="space-y-6 pb-12">
      {/* Authority Header Card */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Authority Control & Verification Centre
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {authorityUser?.role || 'traffic_authority'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Logged in as <strong>{authorityUser?.full_name || 'Traffic Inspector'}</strong> ({authorityUser?.department})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                fetchHazards();
                fetchParkingIssues();
                fetchAuditLogs();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setActiveTab('hazards')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'hazards'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Hazard Reports Queue ({hazards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'map'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Geographic Operations Map</span>
          </button>

          <button
            onClick={() => setActiveTab('parking')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'parking'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Parking Reports ({parkingIssues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'audit'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Lineage ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Hazards Queue */}
      {activeTab === 'hazards' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 flex flex-wrap items-center gap-3 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search report ID, road name, description..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted (Pending Review)</option>
              <option value="Verified">Verified</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 outline-none"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Report ID</th>
                    <th className="p-3.5">Category & Road</th>
                    <th className="p-3.5">Severity</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Photo</th>
                    <th className="p-3.5">Reporter Contact</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {hazards.map((hz) => (
                    <tr key={hz.report_id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono font-bold text-white whitespace-nowrap">
                        {hz.report_id}
                      </td>
                      <td className="p-3.5">
                        <strong className="text-white block">{hz.road_name}</strong>
                        <span className="text-slate-400 text-[11px]">{hz.category}</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          hz.severity === 'Critical' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                          hz.severity === 'High' ? 'bg-orange-950 text-orange-300 border-orange-800' :
                          'bg-amber-950 text-amber-300 border-amber-800'
                        }`}>
                          {hz.severity}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          hz.status === 'Verified' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                          hz.status === 'In Progress' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                          hz.status === 'Resolved' ? 'bg-cyan-950 text-cyan-300 border-cyan-800' :
                          hz.status === 'Rejected' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {hz.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {hz.photo_url ? (
                          <a
                            href={hz.photo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 font-semibold underline flex items-center space-x-1"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>View</span>
                          </a>
                        ) : (
                          <span className="text-slate-500">None</span>
                        )}
                      </td>
                      <td className="p-3.5 text-[11px]">
                        {hz.is_anonymous ? (
                          <span className="text-slate-500 italic">Anonymous</span>
                        ) : (
                          <div>
                            <span className="text-white">{hz.reporter_name || 'Not provided'}</span>
                            <span className="block text-slate-400">{hz.reporter_contact || ''}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedHazard(hz);
                            setActionType('verify');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[11px] font-semibold mr-1.5 transition"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Real Geographic Monitoring Map (Requirement 8) */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
            <div>
              <span className="font-bold text-white">Authority Geographic Operations Center</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time OpenStreetMap with marker clustering. Click on any road hazard or construction zone to inspect or update status.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                {hazards.filter(h => h.latitude && h.longitude).length} Hazards
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                {allClosures.filter(c => c.latitude && c.longitude).length} Closures
              </span>
              <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                {allParking.filter(p => p.latitude && p.longitude).length} Parking
              </span>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <RealLeafletMap
              hazards={hazards}
              closures={allClosures}
              parking={allParking}
              accessibility={allAccessibility}
              height="600px"
              showSearch={true}
              showControls={true}
              title="Official Municipal Traffic Command Map"
              onSelectMarker={(item) => {
                if (item.type === 'hazard') {
                  setSelectedHazard(item.data);
                  setActionType('verify');
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Parking Issues */}
      {activeTab === 'parking' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Citizen Reported Parking Inaccuracies ({parkingIssues.length})
          </h3>

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">Facility</th>
                  <th className="p-3.5">Issue Type</th>
                  <th className="p-3.5">Discrepancy Details</th>
                  <th className="p-3.5">Reporter Contact</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {parkingIssues.map((p) => (
                  <tr key={p.report_id} className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-mono font-bold text-white">{p.report_id}</td>
                    <td className="p-3.5">
                      <strong className="text-white block">{p.facility_name}</strong>
                      <span className="text-slate-500 font-mono text-[10px]">{p.facility_id}</span>
                    </td>
                    <td className="p-3.5 text-amber-300 font-semibold">{p.issue_type}</td>
                    <td className="p-3.5 max-w-xs">{p.details}</td>
                    <td className="p-3.5 text-slate-400">{p.reporter_contact || 'None'}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            System Security & Action Audit Trail ({auditLogs.length})
          </h3>

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden">
            <div className="divide-y divide-slate-800 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-slate-800/40 transition">
                  <div>
                    <span className="font-bold font-mono text-cyan-400 mr-2">[{log.action}]</span>
                    <span className="text-slate-200">{log.details}</span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      Entity: <strong className="text-slate-400">{log.entity_id}</strong> | Performed by: <strong className="text-white">{log.performed_by}</strong>
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px] shrink-0 ml-4">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal on Report */}
      {selectedHazard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-xl w-full rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">{selectedHazard.report_id}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedHazard.road_name}</h3>
                <p className="text-xs text-slate-400">{selectedHazard.category} - Current: <strong className="text-white">{selectedHazard.status}</strong></p>
              </div>
              <button onClick={() => setSelectedHazard(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {actionMsg && (
              <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs">
                {actionMsg}
              </div>
            )}

            {/* Action Selector */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                onClick={() => setActionType('verify')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                  actionType === 'verify' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                1. Verify
              </button>
              <button
                onClick={() => setActionType('assign')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                  actionType === 'assign' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                2. Assign Crew
              </button>
              <button
                onClick={() => setActionType('status')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                  actionType === 'status' ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                3. Update Progress / Resolve
              </button>
              <button
                onClick={() => setActionType('override')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                  actionType === 'override' ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                Override Severity
              </button>
              <button
                onClick={() => setActionType('reject')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                  actionType === 'reject' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                Reject Report
              </button>
            </div>

            <form onSubmit={executeAction} className="space-y-3.5 text-xs">
              {actionType === 'verify' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Official Verification Remarks</label>
                  <textarea
                    rows={2}
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    placeholder="e.g. Field inspection completed. Confirmed pothole defect."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  />
                </div>
              )}

              {actionType === 'assign' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Assigned Crew / Lead Officer</label>
                    <input
                      type="text"
                      required
                      value={assignedCrew}
                      onChange={(e) => setAssignedCrew(e.target.value)}
                      placeholder="e.g. Ward 14 Road Maintenance Squad"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Assigned Department</label>
                    <input
                      type="text"
                      required
                      value={assignedDept}
                      onChange={(e) => setAssignedDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                    />
                  </div>
                </div>
              )}

              {actionType === 'status' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">New Workflow Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                    >
                      <option value="In Progress">In Progress (Active Work)</option>
                      <option value="Resolved">Resolved (Cleared & Restored)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Official Status Remarks</label>
                    <textarea
                      rows={2}
                      value={actionRemarks}
                      onChange={(e) => setActionRemarks(e.target.value)}
                      placeholder="e.g. Asphalt patch complete; lane reopened to full traffic."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                    />
                  </div>
                  {newStatus === 'Resolved' && (
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Resolution Photograph (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setResolutionPhoto(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-cyan-950 file:text-cyan-300"
                      />
                    </div>
                  )}
                </div>
              )}

              {actionType === 'reject' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Mandatory Rejection Reason <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide detailed justification (e.g. Duplicate report of REP-..., or on private property)..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  />
                </div>
              )}

              {actionType === 'override' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Override Severity Level</label>
                    <select
                      value={newSeverity}
                      onChange={(e) => setNewSeverity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Justification for Override</label>
                    <input
                      type="text"
                      value={actionRemarks}
                      onChange={(e) => setActionRemarks(e.target.value)}
                      placeholder="e.g. Traffic volume is higher during peak school hours"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition"
                >
                  {actionLoading ? 'Saving...' : 'Apply Official Update'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedHazard(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
