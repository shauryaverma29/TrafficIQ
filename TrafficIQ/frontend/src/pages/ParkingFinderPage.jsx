import React, { useState, useEffect } from 'react';
import {
  Car,
  Search,
  MapPin,
  Clock,
  Zap,
  Accessibility,
  AlertCircle,
  Plus,
  CheckCircle2,
  DollarSign,
  Filter,
  ExternalLink,
  Edit,
  ShieldCheck,
  Send,
  X
} from 'lucide-react';
import MapComponent from '../components/MapComponent';
import api from '../services/api';

export default function ParkingFinderPage({ authorityToken, onNavigate }) {
  const [facilities, setFacilities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [freeOnly, setFreeOnly] = useState(false);
  const [evOnly, setEvOnly] = useState(false);
  const [accessibleOnly, setAccessibleOnly] = useState(false);

  // Inaccuracy reporting modal state
  const [reportingFacility, setReportingFacility] = useState(null);
  const [issueType, setIssueType] = useState('Incorrect Charges');
  const [issueDetails, setIssueDetails] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Authority quick-add/edit modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFacility, setNewFacility] = useState({
    name: '',
    area: '',
    address: '',
    parking_type: 'Multi-Level Structured',
    total_capacity: 100,
    has_realtime_availability: false,
    available_spaces: 50,
    charges_info: '₹20/hr',
    is_free: false,
    latitude: 12.9730,
    longitude: 77.6000,
    operating_hours: '24/7',
    ev_charging: true,
    accessible_spots: 4
  });

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const res = await api.getParkingFacilities({
        search: searchTerm,
        area: selectedArea,
        type: selectedType,
        free_only: freeOnly,
        ev_only: evOnly,
        accessible_only: accessibleOnly
      });
      setFacilities(res.facilities || []);
      setAreas(res.areas || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [searchTerm, selectedArea, selectedType, freeOnly, evOnly, accessibleOnly]);

  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!issueDetails.trim()) return;
    setSubmittingIssue(true);
    try {
      await api.reportIncorrectParking({
        facility_id: reportingFacility.facility_id,
        facility_name: reportingFacility.name,
        issue_type: issueType,
        details: issueDetails.trim(),
        reporter_contact: reporterContact.trim()
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setReportingFacility(null);
        setIssueDetails('');
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleAddFacility = async (e) => {
    e.preventDefault();
    try {
      await api.addParkingFacility(newFacility, authorityToken);
      setShowAddModal(false);
      fetchFacilities();
    } catch (err) {
      alert("Failed to save facility: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 text-xs font-semibold mb-2">
              <Car className="w-3.5 h-3.5 text-cyan-400" />
              <span>Smart Mobility & Urban Parking Network</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Smart Parking Finder
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Locate verified municipal and commercial parking garages, surface lots, and on-street smart bays.
              Real-time occupancy figures are displayed only when backed by active sensor telemetry.
            </p>
          </div>

          {authorityToken && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/20 transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Facility</span>
            </button>
          )}
        </div>

        {/* Search and Quick Filter Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by facility name, commercial district, or road..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Area Filter */}
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="All">All Urban Areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="All">All Types</option>
              <option value="Multi-Level Structured">Multi-Level Structured</option>
              <option value="Surface Lot">Surface Lot</option>
              <option value="Underground Facility">Underground Facility</option>
              <option value="On-Street Smart Bay">On-Street Smart Bay</option>
            </select>

            {/* Feature Pills */}
            <button
              onClick={() => setFreeOnly(!freeOnly)}
              className={`px-3 py-2 rounded-xl border font-semibold transition ${
                freeOnly ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              Free Only
            </button>
            <button
              onClick={() => setEvOnly(!evOnly)}
              className={`px-3 py-2 rounded-xl border font-semibold transition flex items-center space-x-1 ${
                evOnly ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>EV Fast Charging</span>
            </button>
            <button
              onClick={() => setAccessibleOnly(!accessibleOnly)}
              className={`px-3 py-2 rounded-xl border font-semibold transition flex items-center space-x-1 ${
                accessibleOnly ? 'bg-purple-950 text-purple-300 border-purple-700' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Accessibility className="w-3.5 h-3.5" />
              <span>Accessible Spots</span>
            </button>
          </div>
        </div>
      </div>

      {/* Map View */}
      <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <MapComponent
          parking={facilities}
          height="380px"
          title={`Verified Smart Parking Facilities (${facilities.length} Locations)`}
        />
      </div>

      {/* Facilities Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Registered Municipal & Commercial Garages ({facilities.length})
          </h3>
          <span className="text-xs text-slate-500">
            Click 'Report Error' to flag inaccurate tariffs or closed gates
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map((fac) => {
            const hasRealtime = fac.has_realtime_availability && fac.available_spaces !== null;
            const openPercent = hasRealtime && fac.total_capacity
              ? Math.round((fac.available_spaces / fac.total_capacity) * 100)
              : null;

            return (
              <div
                key={fac.facility_id}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-5 shadow-lg flex flex-col justify-between transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                        {fac.area}
                      </span>
                      <h4 className="text-base font-bold text-white tracking-tight mt-0.5">
                        {fac.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {fac.address}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 shrink-0">
                      {fac.facility_id}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {fac.parking_type}
                    </span>
                    {fac.is_free ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Free Parking
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        Paid Parking
                      </span>
                    )}
                    {fac.ev_charging ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center space-x-1">
                        <Zap className="w-2.5 h-2.5" />
                        <span>EV</span>
                      </span>
                    ) : null}
                    {fac.accessible_spots > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-950 text-purple-300 border border-purple-800 flex items-center space-x-1">
                        <Accessibility className="w-2.5 h-2.5" />
                        <span>{fac.accessible_spots} Accessible</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Real-Time Availability Display (Crucial Requirement 3) */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-medium">Real-Time Capacity:</span>
                      {hasRealtime ? (
                        <span className="font-bold text-emerald-400">
                          {fac.available_spaces} / {fac.total_capacity} Available
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-400 italic">
                          Availability unknown
                        </span>
                      )}
                    </div>

                    {hasRealtime && openPercent !== null ? (
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            openPercent > 40 ? 'bg-emerald-500' : openPercent > 15 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${openPercent}%` }}
                        />
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 mt-1">
                        Total bays: {fac.total_capacity || 'Not registered'} (Sensor telemetry pending)
                      </p>
                    )}
                  </div>

                  {/* Charges & Operating Hours */}
                  <div className="mt-3 text-xs text-slate-300 space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <DollarSign className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Tariff: <strong>{fac.charges_info}</strong></span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Hours: {fac.operating_hours || '24/7'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action: Report Incorrect Information */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-emerald-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Spot</span>
                  </span>

                  <button
                    onClick={() => setReportingFacility(fac)}
                    className="text-slate-400 hover:text-amber-400 text-[11px] font-medium flex items-center space-x-1 transition"
                  >
                    <AlertCircle className="w-3 h-3" />
                    <span>Report Incorrect Info</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Incorrect Info Modal */}
      {reportingFacility && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-md w-full rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-base font-bold text-white">Report Inaccurate Parking Data</h3>
                <p className="text-xs text-cyan-400 font-semibold">{reportingFacility.name}</p>
              </div>
              <button onClick={() => setReportingFacility(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs text-center">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
                <p className="font-bold">Thank you for helping keep TrafficIQ accurate!</p>
                <p className="text-[11px] mt-0.5">Municipal parking supervisors have been notified.</p>
              </div>
            ) : (
              <form onSubmit={handleReportIssue} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Issue Type</label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                  >
                    <option value="Incorrect Charges">Incorrect Parking Tariffs / Charges</option>
                    <option value="Incorrect Capacity/Availability">Inaccurate Free Space Count</option>
                    <option value="Facility Closed">Facility Temporarily / Permanently Closed</option>
                    <option value="Incorrect Location">Wrong Address / Coordinates</option>
                    <option value="Other">Other Discrepancy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Details of Discrepancy</label>
                  <textarea
                    rows={3}
                    value={issueDetails}
                    onChange={(e) => setIssueDetails(e.target.value)}
                    placeholder="e.g. Rate has increased to ₹40/hr, or gates are currently locked for maintenance..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Contact (Optional)</label>
                  <input
                    type="text"
                    value={reporterContact}
                    onChange={(e) => setReporterContact(e.target.value)}
                    placeholder="Phone or email in case we need clarification"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submittingIssue}
                    className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition flex items-center justify-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Correction Report</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportingFacility(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Authority Add Facility Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">Register Smart Parking Facility</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddFacility} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={newFacility.name}
                  onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                  placeholder="e.g. Civic Center Multi-Level Parking"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Area / Ward</label>
                  <input
                    type="text"
                    required
                    value={newFacility.area}
                    onChange={(e) => setNewFacility({ ...newFacility, area: e.target.value })}
                    placeholder="e.g. Central Business District"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Parking Type</label>
                  <select
                    value={newFacility.parking_type}
                    onChange={(e) => setNewFacility({ ...newFacility, parking_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                  >
                    <option value="Multi-Level Structured">Multi-Level Structured</option>
                    <option value="Surface Lot">Surface Lot</option>
                    <option value="Underground Facility">Underground Facility</option>
                    <option value="On-Street Smart Bay">On-Street Smart Bay</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Physical Address</label>
                <input
                  type="text"
                  required
                  value={newFacility.address}
                  onChange={(e) => setNewFacility({ ...newFacility, address: e.target.value })}
                  placeholder="Street and landmark"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Total Capacity</label>
                  <input
                    type="number"
                    value={newFacility.total_capacity}
                    onChange={(e) => setNewFacility({ ...newFacility, total_capacity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tariff Details</label>
                  <input
                    type="text"
                    value={newFacility.charges_info}
                    onChange={(e) => setNewFacility({ ...newFacility, charges_info: e.target.value })}
                    placeholder="e.g. ₹20/hr, Free"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newFacility.has_realtime_availability}
                    onChange={(e) => setNewFacility({ ...newFacility, has_realtime_availability: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500"
                  />
                  <span className="font-semibold text-slate-200">Active Sensor Telemetry (Live Availability)</span>
                </label>
                {newFacility.has_realtime_availability && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Currently Available Spaces</label>
                    <input
                      type="number"
                      value={newFacility.available_spaces}
                      onChange={(e) => setNewFacility({ ...newFacility, available_spaces: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Save Facility
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
