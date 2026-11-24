import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Construction,
  Navigation,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building2,
  Compass,
  Plus
} from 'lucide-react';
import MapComponent from '../components/MapComponent';
import api from '../services/api';

export default function RoadUpdatesPage({ authorityToken, onNavigate }) {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All'); // All, Active, Scheduled, Completed
  const [selectedType, setSelectedType] = useState('All');
  const [showPublishModal, setShowPublishModal] = useState(false);

  const [newUpdate, setNewUpdate] = useState({
    title: '',
    road_name: '',
    affected_segments: '',
    update_type: 'Road Construction Work',
    reason: '',
    status: 'Active',
    start_date: new Date().toISOString().split('T')[0],
    expected_end_date: '',
    official_instructions: '',
    diversion_route: '',
    latitude: 12.9760,
    longitude: 77.6010,
    published_by: 'City Traffic Police & Municipal Corporation'
  });

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const res = await api.getRoadUpdates({
        search: searchTerm,
        status: selectedStatus,
        type: selectedType
      });
      setUpdates(res.updates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [searchTerm, selectedStatus, selectedType]);

  const handlePublish = async (e) => {
    e.preventDefault();
    try {
      await api.publishRoadUpdate(newUpdate, authorityToken);
      setShowPublishModal(false);
      fetchUpdates();
    } catch (err) {
      alert("Failed to publish road advisory: " + (err.response?.data?.error || err.message));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-950 text-rose-300 border border-rose-800 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>Active Disruption</span>
          </span>
        );
      case 'Scheduled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">
            Scheduled Upcoming
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            Completed & Reopened
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800/50 text-amber-300 text-xs font-semibold mb-2">
              <Construction className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Municipal Road Advisories</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Road Construction, Closures & Diversions
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Stay ahead of planned civil engineering, flyover maintenance, water pipeline repairs, and temporary arterial detours.
              Official alternative routes are displayed only when formally designated by traffic police.
            </p>
          </div>

          {authorityToken && (
            <button
              onClick={() => setShowPublishModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs shadow-lg shadow-amber-600/20 transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Road Advisory</span>
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by road name, project title, or diversion corridor..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-amber-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Disruption</option>
              <option value="Scheduled">Scheduled Upcoming</option>
              <option value="Completed">Completed Work</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-amber-500"
            >
              <option value="All">All Advisory Types</option>
              <option value="Road Construction Work">Road Construction</option>
              <option value="Temporary Road Closure">Temporary Closure</option>
              <option value="Emergency Maintenance">Emergency Maintenance</option>
              <option value="Traffic Diversion">Traffic Diversion</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map View */}
      <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <MapComponent
          closures={updates}
          height="360px"
          title={`Active Road Advisories & Construction Zones (${updates.length} Updates)`}
        />
      </div>

      {/* Updates Cards List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Published Advisories ({updates.length})
        </h3>

        <div className="space-y-4">
          {updates.map((up) => (
            <div
              key={up.update_id}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-6 shadow-xl space-y-4 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950 border border-amber-800">
                      {up.update_id}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {up.update_type}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white tracking-tight mt-1">
                    {up.title}
                  </h4>
                  <p className="text-xs text-amber-300 font-medium mt-0.5 flex items-center space-x-1.5">
                    <Navigation className="w-3.5 h-3.5 shrink-0" />
                    <span>Road: <strong>{up.road_name}</strong> | Segments: {up.affected_segments}</span>
                  </p>
                </div>

                <div className="shrink-0">
                  {getStatusBadge(up.status)}
                </div>
              </div>

              {/* Reason / Context */}
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-slate-400 block mb-0.5">Civil Works Reason:</span>
                {up.reason}
              </div>

              {/* Official Instructions */}
              <div className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-0.5 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Official Municipal Instructions for Motorists:</span>
                </span>
                {up.official_instructions}
              </div>

              {/* Alternative Route / Diversion (Only if verified, Requirement 4) */}
              {up.has_alternative_route && up.diversion_route ? (
                <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200">
                  <div className="flex items-center space-x-1.5 font-bold text-cyan-300 mb-1">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span>Verified Alternative Diversion Route:</span>
                  </div>
                  <p className="leading-relaxed text-cyan-100 font-medium">
                    {up.diversion_route}
                  </p>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic">
                  * No alternate bypass designated. Alternate lane sharing or localized single-lane passage enforced.
                </div>
              )}

              {/* Timeline & Metadata Footer */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80 gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Commenced: <strong>{up.start_date}</strong></span>
                  </span>

                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Expected Reopening: <strong className={up.expected_end_date ? 'text-white' : 'text-slate-500 italic'}>
                      {up.expected_end_date || 'Under continuous review'}
                    </strong></span>
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  Issuing Agency: <span className="text-white font-medium">{up.published_by}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Authority Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">Publish Road Advisory</h3>
              <button onClick={() => setShowPublishModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handlePublish} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Advisory Title</label>
                <input
                  type="text"
                  required
                  value={newUpdate.title}
                  onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                  placeholder="e.g. Flyover Joint Replacement & Resurfacing"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Road Name</label>
                  <input
                    type="text"
                    required
                    value={newUpdate.road_name}
                    onChange={(e) => setNewUpdate({ ...newUpdate, road_name: e.target.value })}
                    placeholder="e.g. Highway 101 Bay Corridor"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Advisory Type</label>
                  <select
                    value={newUpdate.update_type}
                    onChange={(e) => setNewUpdate({ ...newUpdate, update_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                  >
                    <option value="Road Construction Work">Road Construction Work</option>
                    <option value="Temporary Road Closure">Temporary Road Closure</option>
                    <option value="Emergency Maintenance">Emergency Maintenance</option>
                    <option value="Traffic Diversion">Traffic Diversion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Affected Road Segments / Stretch</label>
                <input
                  type="text"
                  required
                  value={newUpdate.affected_segments}
                  onChange={(e) => setNewUpdate({ ...newUpdate, affected_segments: e.target.value })}
                  placeholder="e.g. Between Interchange 4 and Sector 9 Underpass"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Civil Works Reason</label>
                <textarea
                  rows={2}
                  required
                  value={newUpdate.reason}
                  onChange={(e) => setNewUpdate({ ...newUpdate, reason: e.target.value })}
                  placeholder="Explain why the closure or maintenance is taking place..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newUpdate.start_date}
                    onChange={(e) => setNewUpdate({ ...newUpdate, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Expected End Date</label>
                  <input
                    type="date"
                    value={newUpdate.expected_end_date}
                    onChange={(e) => setNewUpdate({ ...newUpdate, expected_end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Official Instructions for Motorists</label>
                <textarea
                  rows={2}
                  required
                  value={newUpdate.official_instructions}
                  onChange={(e) => setNewUpdate({ ...newUpdate, official_instructions: e.target.value })}
                  placeholder="e.g. Speeds restricted to 20 km/h. Follow illuminated LED arrow signs..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Verified Alternative Diversion Route (Leave blank if none)
                </label>
                <input
                  type="text"
                  value={newUpdate.diversion_route}
                  onChange={(e) => setNewUpdate({ ...newUpdate, diversion_route: e.target.value })}
                  placeholder="e.g. Divert via Outer Ring Loop and 100ft Road"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Publish Advisory
                </button>
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
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
