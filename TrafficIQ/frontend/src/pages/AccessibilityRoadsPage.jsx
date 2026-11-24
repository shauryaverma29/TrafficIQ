import React, { useState, useEffect } from 'react';
import {
  Accessibility,
  Eye,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
  Camera,
  X,
  Volume2,
  Navigation,
  ExternalLink,
  Map,
  List
} from 'lucide-react';
import RealLeafletMap from '../components/RealLeafletMap';
import api from '../services/api';

const BARRIER_CATEGORIES = [
  { id: 'Damaged Footpath', label: 'Damaged Footpath', desc: 'Broken paving slabs, deep craters, jagged edges' },
  { id: 'Blocked Footpath', label: 'Blocked Footpath', desc: 'Parked motorbikes, street vendor encroachment, foliage' },
  { id: 'Missing Wheelchair Ramp', label: 'Missing Wheelchair Ramp', desc: 'High curb (>15cm) without dropped curb or ramp' },
  { id: 'Broken Pedestrian Crossing', label: 'Broken Pedestrian Crossing', desc: 'Inaudible acoustic chirper, non-working push button' },
  { id: 'Obstacle on Walking Path', label: 'Obstacle on Walking Path', desc: 'Utility electric box, pole in center of sidewalk' },
  { id: 'Unsafe Pedestrian Infrastructure', label: 'Unsafe Infrastructure', desc: 'Missing pedestrian refuge island, dark underpass' },
  { id: 'Other Accessibility Barrier', label: 'Other Barrier', desc: 'Any other mobility or visual accessibility obstacle' },
];

export default function AccessibilityRoadsPage({ onNavigate }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Report Modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const [newReport, setNewReport] = useState({
    road_or_footpath_name: '',
    address: '',
    category: 'Damaged Footpath',
    severity: 'High',
    description: '',
    accessibility_impact: '',
    suggested_action: 'Install standard 1:12 slope dropped curb with yellow tactile warning tiles',
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.getAccessibilityReports({
        category: selectedCategory,
        status: selectedStatus
      });
      setReports(res.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedCategory, selectedStatus]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('road_or_footpath_name', newReport.road_or_footpath_name);
      formData.append('address', newReport.address);
      formData.append('category', newReport.category);
      formData.append('severity', newReport.severity);
      formData.append('description', newReport.description);
      formData.append('accessibility_impact', newReport.accessibility_impact);
      formData.append('suggested_action', newReport.suggested_action);
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      await api.submitAccessibilityReport(formData);
      setSubmissionSuccess(true);
      setTimeout(() => {
        setSubmissionSuccess(false);
        setShowModal(false);
        setPhotoFile(null);
        setPhotoPreview(null);
        fetchReports();
      }, 2000);
    } catch (err) {
      alert("Submission failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-950 border border-purple-800/40 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-800/60 text-purple-300 text-xs font-semibold mb-2">
              <Accessibility className="w-3.5 h-3.5 text-purple-400" />
              <span>Pedestrian & Barrier-Free Urban Mobility</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Accessibility-Friendly Road Information
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Empowering citizens with disabilities, wheelchair users, elderly pedestrians, and parents with strollers.
              Identify sidewalk obstructions, unramped curbs, and defective audio crosswalks to demand municipal remediation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Report Accessibility Barrier</span>
            </button>
          </div>
        </div>

        {/* Responsible Verification Notice (Requirement 5) */}
        <div className="mt-5 p-3 rounded-xl bg-slate-950/80 border border-purple-900/50 flex items-start space-x-2.5 text-xs text-purple-200">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Barrier-Free Verification Policy:</strong> TrafficIQ never labels an urban route as "Wheelchair Accessible"
            unless formally audited and certified by municipal engineers and universal-design disability advocates.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-semibold">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-purple-500"
            >
              <option value="All">All Accessibility Barriers</option>
              {BARRIER_CATEGORIES.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-semibold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-purple-500"
            >
              <option value="All">All Statuses</option>
              <option value="Verified">Verified for Remediation</option>
              <option value="In Progress">Civil Works In Progress</option>
              <option value="Submitted">Pending Municipal Audit</option>
              <option value="Resolved">Barrier Cleared</option>
            </select>
          </div>
        </div>

        <div className="text-slate-400">
          Showing <strong>{reports.length}</strong> pedestrian barrier audit(s)
        </div>
      </div>

      {/* Real Interactive Leaflet Accessibility Map (Requirement 7) */}
      <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <RealLeafletMap
          accessibility={reports}
          height="380px"
          title={`Accessibility Barriers & Universal Design Map (${reports.filter(r => r.latitude && r.longitude).length} Geolocated)`}
        />
      </div>

      {/* Barrier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((rep) => (
          <div
            key={rep.report_id}
            className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-5 shadow-lg flex flex-col justify-between transition-all space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800">
                    {rep.report_id}
                  </span>
                  <h4 className="text-base font-bold text-white tracking-tight mt-1.5">
                    {rep.road_or_footpath_name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {rep.address || 'Address not registered'}
                  </p>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                  rep.status === 'Verified' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                  rep.status === 'In Progress' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {rep.status}
                </span>
              </div>

              {/* Barrier Category Badge */}
              <div className="mt-2.5">
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/60 inline-flex items-center space-x-1.5">
                  <Accessibility className="w-3.5 h-3.5 text-purple-400" />
                  <span>{rep.category}</span>
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                {rep.description}
              </p>

              {/* Accessibility Impact Box */}
              <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div>
                  <span className="font-bold text-rose-400 block text-[11px]">Impact on Mobility:</span>
                  <p className="text-slate-300 text-[11px] leading-snug mt-0.5">
                    {rep.accessibility_impact}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-900">
                  <span className="font-bold text-cyan-400 block text-[11px]">Suggested Municipal Remedy:</span>
                  <p className="text-slate-200 text-[11px] leading-snug mt-0.5 font-medium">
                    {rep.suggested_action}
                  </p>
                </div>
              </div>

              {rep.authority_remarks && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/40 text-[11px] text-emerald-300">
                  <strong>Municipal Remark:</strong> {rep.authority_remarks}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Severity: <strong className="text-white">{rep.severity}</strong></span>
              <button
                onClick={() => onNavigate && onNavigate('track-report')}
                className="text-purple-400 hover:text-purple-300 font-semibold flex items-center space-x-1"
              >
                <span>Track Status</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Accessibility Barrier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <Accessibility className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Report Pedestrian Accessibility Barrier</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {submissionSuccess ? (
              <div className="p-6 rounded-xl bg-emerald-950/80 border border-emerald-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Accessibility Report Filed</h4>
                <p className="text-xs text-slate-300">
                  Your report has been submitted to the municipal universal design & pedestrian infrastructure desk.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Sidewalk / Pedestrian Crossing Location <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newReport.road_or_footpath_name}
                    onChange={(e) => setNewReport({ ...newReport, road_or_footpath_name: e.target.value })}
                    placeholder="e.g. Uptown Commercial Ave Sidewalk"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Landmark / Exact Spot</label>
                  <input
                    type="text"
                    value={newReport.address}
                    onChange={(e) => setNewReport({ ...newReport, address: e.target.value })}
                    placeholder="e.g. Opposite Metro Gate 2 Pedestrian Plaza"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Barrier Category</label>
                    <select
                      value={newReport.category}
                      onChange={(e) => setNewReport({ ...newReport, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                    >
                      {BARRIER_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Mobility Severity</label>
                    <select
                      value={newReport.severity}
                      onChange={(e) => setNewReport({ ...newReport, severity: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                    >
                      <option value="Critical">Critical (Zero Passage)</option>
                      <option value="High">High (Forces onto Road)</option>
                      <option value="Medium">Medium (Severe Jolt/Obstacle)</option>
                      <option value="Low">Low (Minor Unevenness)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Description of Physical Barrier <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={newReport.description}
                    onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                    placeholder="Describe how high the curb is, how the sidewalk is cracked or obstructed..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Accessibility Impact on Pedestrians <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newReport.accessibility_impact}
                    onChange={(e) => setNewReport({ ...newReport, accessibility_impact: e.target.value })}
                    placeholder="e.g. Wheelchairs cannot climb 8-inch curb; forced into oncoming car lane"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Suggested Municipal Action <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newReport.suggested_action}
                    onChange={(e) => setNewReport({ ...newReport, suggested_action: e.target.value })}
                    placeholder="e.g. Install 1:12 concrete dropped curb with tactile yellow pavers"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                  />
                </div>

                {/* Optional Photo */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Photo Evidence</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-purple-950 file:text-purple-300 file:font-semibold"
                  />
                  {photoPreview && (
                    <img src={photoPreview} alt="Preview" className="w-full h-24 object-cover rounded-lg mt-2 border border-slate-800" />
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition"
                  >
                    {submitting ? 'Submitting...' : 'Submit Barrier Report'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
