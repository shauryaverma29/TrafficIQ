import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Upload,
  MapPin,
  CheckCircle2,
  X,
  Navigation,
  ShieldAlert,
  Sparkles,
  Camera,
  Copy,
  ExternalLink,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Compass
} from 'lucide-react';
import RealLeafletMap from '../components/RealLeafletMap';
import api from '../services/api';

const CATEGORIES = [
  { id: 'Pothole / Broken Road', label: 'Pothole / Broken Road', desc: 'Cratered pavement, asphalt cracks, sunken manholes' },
  { id: 'Fallen Tree / Branch', label: 'Fallen Tree / Branch', desc: 'Overhanging bough, collapsed trunk blocking lane' },
  { id: 'Road Blockage', label: 'Road Blockage', desc: 'Barricades, construction debris, stuck vehicle' },
  { id: 'Waterlogging / Flooding', label: 'Waterlogging / Flooding', desc: 'Submerged underpass, stormwater overflow' },
  { id: 'Traffic Signal Failure', label: 'Traffic Signal Failure', desc: 'Flashing yellow, dead light heads, misaligned timer' },
  { id: 'Accident Debris', label: 'Accident Debris', desc: 'Shattered glass, vehicle parts, fluid spill' },
  { id: 'Exposed Wires', label: 'Exposed Wires', desc: 'Dangling electrical cables, open junction boxes' },
  { id: 'Damaged Street Infrastructure', label: 'Damaged Infrastructure', desc: 'Broken streetlights, missing median guardrails' },
  { id: 'Damaged Footpath', label: 'Damaged Footpath', desc: 'Caved sidewalk slabs, missing pedestrian ramps' },
  { id: 'Other', label: 'Other Road Hazard', desc: 'Any other dangerous traffic or civil condition' },
];

const SUGGESTED_ROADS = [
  "Central Metro Arterial",
  "Uptown Commercial Ave",
  "Highway 101 Bay Corridor",
  "Tech Innovation Blvd",
  "Airport Transit Link",
  "Harbor Industrial Parkway"
];

export default function ReportHazardPage({ onNavigate, onReportSubmitted }) {
  const [category, setCategory] = useState('Pothole / Broken Road');
  const [roadName, setRoadName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isAccessibility, setIsAccessibility] = useState(false);
  const [accessibilityDetails, setAccessibilityDetails] = useState('');

  // GPS state
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Photo state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState(null);

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  // Priority suggestion explanation
  const getSmartPriorityAdvice = () => {
    const isHighway = roadName.toLowerCase().includes('highway') || roadName.toLowerCase().includes('arterial');
    if (category === 'Exposed Wires') {
      return { level: 'Critical', text: 'Exposed electrical lines pose immediate life-safety risk to vehicles and pedestrians.' };
    }
    if ((category === 'Fallen Tree / Branch' || category === 'Road Blockage') && isHighway) {
      return { level: 'Critical', text: 'Total or partial lane blockage on high-speed arterial corridor creates massive collision hazard.' };
    }
    if (category === 'Fallen Tree / Branch' || category === 'Road Blockage') {
      return { level: 'High', text: 'Physical obstruction impedes transit flow and emergency response access.' };
    }
    if (category === 'Waterlogging / Flooding') {
      return { level: 'High', text: 'Water depth creates risk of hydroplaning and engine stalling.' };
    }
    if (category === 'Traffic Signal Failure') {
      return { level: isHighway ? 'Critical' : 'High', text: 'Intersection signal failure requires urgent traffic officer dispatch.' };
    }
    if (category === 'Pothole / Broken Road') {
      return { level: isHighway ? 'High' : 'Medium', text: 'Severe pothole causes structural vehicle damage and two-wheeler instability.' };
    }
    return { level: 'Medium', text: 'Standard priority road hazard awaiting field engineering review.' };
  };

  const priorityAdvice = getSmartPriorityAdvice();

  // Check duplicate hazards when roadName or category changes
  useEffect(() => {
    if (roadName.trim().length >= 4) {
      const timer = setTimeout(async () => {
        try {
          const res = await api.checkDuplicates({
            category,
            road_name: roadName.trim(),
            latitude: gpsLocation?.latitude,
            longitude: gpsLocation?.longitude,
          });
          if (res.duplicate_found && res.potential_duplicates.length > 0) {
            setDuplicateWarning(res.potential_duplicates);
          } else {
            setDuplicateWarning(null);
          }
        } catch (e) {
          // ignore background check errors
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDuplicateWarning(null);
    }
  }, [roadName, category, gpsLocation]);

  // Handle GPS location request
  const handleGetLocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser. Please enter the road name manually.");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
        };
        setGpsLocation(coords);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        let msg = "Could not obtain GPS coordinates.";
        if (err.code === 1) msg = "Location permission denied. Please enter the road name and address manually.";
        else if (err.code === 2) msg = "GPS position unavailable. Please type your location manually.";
        else if (err.code === 3) msg = "Location request timed out. Please enter manual location.";
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Handle photo file selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    setPhotoError(null);
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setPhotoError("Invalid file type. Please upload a JPG, JPEG, PNG, or WEBP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Photograph exceeds 5MB size limit. Please upload a smaller image.");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
  };

  // Handle submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!roadName.trim()) {
      setErrorMessage("Road name or street location is required.");
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage("Please enter a short description of the issue (at least 10 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('road_name', roadName.trim());
      formData.append('address', address.trim());
      formData.append('description', description.trim());
      formData.append('severity', severity);
      formData.append('reporter_name', isAnonymous ? '' : reporterName.trim());
      formData.append('reporter_contact', isAnonymous ? '' : reporterContact.trim());
      formData.append('is_anonymous', isAnonymous ? 'true' : 'false');
      formData.append('is_accessibility_issue', isAccessibility ? 'true' : 'false');
      formData.append('accessibility_details', accessibilityDetails.trim());

      if (gpsLocation) {
        formData.append('latitude', gpsLocation.latitude);
        formData.append('longitude', gpsLocation.longitude);
        formData.append('gps_accuracy', gpsLocation.accuracy);
      }

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await api.submitHazard(formData);
      setSubmissionSuccess(res);
      if (onReportSubmitted) onReportSubmitted(res);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.error || "Failed to submit report. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (submissionSuccess?.report_id) {
      navigator.clipboard.writeText(submissionSuccess.report_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Emergency Disclaimer Banner */}
      <div className="rounded-2xl bg-rose-950/40 border border-rose-800/60 p-4 shadow-lg backdrop-blur-md">
        <div className="flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-rose-300 uppercase tracking-wider block mb-0.5">
              Emergency Response Notice
            </span>
            <p className="text-rose-200/90 leading-relaxed">
              <strong>TrafficIQ is not an emergency response service.</strong> If you are reporting a life-threatening
              emergency, active vehicular collision, physical injury, or live sparking high-voltage cables, please call
              your local emergency services (e.g. <strong>112 / 911 / 100</strong>) immediately. Reports filed here are
              routed to municipal maintenance desks and require field authority verification.
            </p>
          </div>
        </div>
      </div>

      {/* Main Submission Form Container */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="border-b border-slate-800/80 pb-5 mb-6">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 text-xs font-semibold mb-2">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Citizen Road Safety Portal</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Report a Road Hazard or Infrastructure Issue
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Help municipal traffic management and road maintenance authorities identify and repair roadway defects quickly.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Issue Category */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              1. Issue Category <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start space-x-3 ${
                    category === cat.id
                      ? 'bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border-cyan-500 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 border ${
                    category === cat.id ? 'bg-cyan-400 border-white ring-2 ring-cyan-500/30' : 'border-slate-600'
                  }`} />
                  <div>
                    <span className={`text-xs font-bold block ${category === cat.id ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {cat.label}
                    </span>
                    <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">
                      {cat.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              2. Upload Photograph (Optional but Recommended)
            </label>
            <p className="text-[11px] text-slate-400 mb-3">
              Accepts JPG, JPEG, PNG, or WEBP up to 5MB. Photographic evidence accelerates municipal field triage.
            </p>

            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-w-md">
                <img src={photoPreview} alt="Hazard preview" className="w-full h-48 object-cover" />
                <div className="absolute top-2 right-2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-white text-xs backdrop-blur-md transition shadow-lg"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-2 text-[11px] text-slate-400 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
                  <span className="truncate max-w-[250px]">{photoFile?.name}</span>
                  <span className="text-cyan-400 font-semibold">{(photoFile?.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-800 hover:border-cyan-500/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-950/40 hover:bg-slate-900/40">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <Camera className="w-8 h-8 text-cyan-400 mb-2" />
                <span className="text-xs font-semibold text-slate-200">
                  Click to browse or take photo
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  JPG, JPEG, PNG, WEBP (Max 5MB)
                </span>
              </label>
            )}

            {photoError && (
              <p className="text-xs text-rose-400 mt-2">{photoError}</p>
            )}
          </div>

          {/* 3. Location Information */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  3. Location & Road Coordinates <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Click directly on the map or use GPS to set exact coordinates.
                </span>
              </div>

              {/* Get Current Location button */}
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gpsLoading}
                className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm shrink-0"
              >
                <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>{gpsLoading ? 'Acquiring GPS...' : gpsLocation ? 'Update Current Location' : 'Use My GPS Location'}</span>
              </button>
            </div>

            {/* Real Interactive Leaflet Location Picker Map */}
            <div className="rounded-xl overflow-hidden border border-slate-800 shadow-md">
              <RealLeafletMap
                height="320px"
                pickLocationMode={true}
                selectedLocation={gpsLocation}
                userLocation={gpsLocation}
                onLocationSelected={(loc) => {
                  setGpsLocation({
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    accuracy: 5
                  });
                  if (loc.road_name && !roadName) {
                    setRoadName(loc.road_name);
                  }
                  if (loc.address && !address) {
                    setAddress(loc.address);
                  }
                }}
                showSearch={true}
                showControls={true}
                title="Select Defect Location on Real Street Map"
              />
            </div>

            {/* GPS Feedback Banner */}
            {gpsLocation && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Pinned Coordinates: <strong>{gpsLocation.latitude}° N, {gpsLocation.longitude}° E</strong>
                    {gpsLocation.accuracy ? ` (±${gpsLocation.accuracy}m)` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setGpsLocation(null)}
                  className="text-emerald-400 hover:text-white text-[11px] underline"
                >
                  Clear Coordinates
                </button>
              </div>
            )}

            {gpsError && (
              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800/60 text-amber-300 text-xs flex items-center space-x-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{gpsError}</span>
              </div>
            )}

            {/* Manual Road Name Entry */}
            <div>
              <input
                type="text"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="Road or Avenue Name (e.g., Central Metro Arterial, Uptown Commercial Ave)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition"
                required
              />

              {/* Quick Road Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-500 font-medium mr-1">City Corridors:</span>
                {SUGGESTED_ROADS.map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRoadName(r)}
                    className="px-2 py-0.5 rounded-md bg-slate-950 hover:bg-slate-800 text-[10px] text-slate-400 hover:text-cyan-300 border border-slate-800 transition"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Address / Landmark */}
            <div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Specific Landmark / Address (e.g. Near Metro Pillar 142, Opposite City Mall East Gate)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition"
              />
            </div>

            {/* Duplicate Report Warning Banner (Requirement F) */}
            {duplicateWarning && duplicateWarning.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Potential Existing Report Detected on This Road</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-200/90">
                  Our system found <strong>{duplicateWarning.length}</strong> active report(s) on <em>{roadName}</em>.
                  You can still proceed with submitting your report to provide supplementary photographic evidence.
                </p>
                <div className="space-y-1.5 pt-1">
                  {duplicateWarning.map((dup) => (
                    <div key={dup.report_id} className="p-2 rounded-lg bg-amber-900/30 border border-amber-700/40 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-white mr-2">{dup.report_id}</span>
                        <span className="text-amber-300">{dup.category}</span>
                        <span className="text-slate-400 ml-2">({dup.status})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate && onNavigate('track-report')}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold underline flex items-center space-x-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Description & Severity */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                4. Description of Hazard <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe the severity, lane obstruction, depth of pothole, or danger to vehicles/pedestrians..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition"
                required
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Minimum 10 characters</span>
                <span>{description.length} characters</span>
              </div>
            </div>

            {/* Severity Selection + Smart Priority Advisor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Citizen-Assessed Severity
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['Low', 'Medium', 'High', 'Critical'].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSeverity(s)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        severity === s
                          ? s === 'Critical' ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-lg shadow-rose-950' :
                            s === 'High' ? 'bg-orange-950 text-orange-300 border-orange-500' :
                            s === 'Medium' ? 'bg-amber-950 text-amber-300 border-amber-500' :
                            'bg-cyan-950 text-cyan-300 border-cyan-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Explainable Priority Recommendation Box (Requirement E) */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-cyan-400 font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Explainable Priority Advisor</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {priorityAdvice.text}
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Suggested Level: <strong className="text-white">{priorityAdvice.level}</strong></span>
                  <span className="italic">Authority may review and override</span>
                </div>
              </div>
            </div>

            {/* Accessibility Checkbox (Requirement 5) */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAccessibility}
                  onChange={(e) => setIsAccessibility(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-200">
                  This hazard directly impairs pedestrians with disabilities, wheelchairs, or strollers
                </span>
              </label>

              {isAccessibility && (
                <div className="mt-2.5 pl-6">
                  <input
                    type="text"
                    value={accessibilityDetails}
                    onChange={(e) => setAccessibilityDetails(e.target.value)}
                    placeholder="Specific accessibility barrier (e.g. wheelchair cannot bypass without entering traffic)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 5. Reporter Contact (Optional / Anonymous) */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                5. Reporter Information (Optional)
              </label>
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                {isAnonymous ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{isAnonymous ? 'Reporting Anonymously' : 'Submit Anonymously'}</span>
              </button>
            </div>

            {!isAnonymous ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Your Name (Optional)"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                />
                <input
                  type="text"
                  value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  placeholder="Phone or Email for update notifications (Optional)"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                />
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Anonymous Mode Enabled: Your identity and IP will not be saved or published.</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting to Municipal Registry...</span>
                </>
              ) : (
                <>
                  <span>Submit Road Hazard Report</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Confirmation Modal (Requirement B) */}
      {submissionSuccess && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-extrabold text-white text-center tracking-tight">
              Road Hazard Successfully Registered
            </h3>
            <p className="text-xs text-slate-300 text-center mt-1">
              Your report has been securely saved in the persistent backend database and queued for municipal triage.
            </p>

            {/* Report ID display box */}
            <div className="my-5 p-4 rounded-xl bg-slate-950 border border-cyan-800/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                  Official Tracking ID
                </span>
                <span className="text-xl font-extrabold text-white tracking-wider font-mono">
                  {submissionSuccess.report_id}
                </span>
              </div>
              <button
                onClick={handleCopyId}
                className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy ID'}</span>
              </button>
            </div>

            <div className="text-xs text-slate-400 space-y-1.5 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between">
                <span>Category:</span>
                <strong className="text-white">{submissionSuccess.category}</strong>
              </div>
              <div className="flex justify-between">
                <span>Road:</span>
                <strong className="text-white">{submissionSuccess.road_name}</strong>
              </div>
              <div className="flex justify-between">
                <span>Initial Status:</span>
                <span className="text-amber-400 font-semibold">{submissionSuccess.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Photo:</span>
                <span className={submissionSuccess.photo_uploaded ? 'text-emerald-400' : 'text-slate-500'}>
                  {submissionSuccess.photo_uploaded ? 'Uploaded & Verified' : 'No photo attached'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => {
                  setSubmissionSuccess(null);
                  if (onNavigate) onNavigate('track-report');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5"
              >
                <span>Track Report Status</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSubmissionSuccess(null);
                  setDescription('');
                  setRoadName('');
                  setAddress('');
                  handleRemovePhoto();
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
              >
                File Another Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
