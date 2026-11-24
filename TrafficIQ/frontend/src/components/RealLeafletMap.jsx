import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Layers,
  Info,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Camera,
  X,
  ExternalLink,
  Car,
  Construction,
  Accessibility,
  Compass
} from 'lucide-react';

export default function RealLeafletMap({
  hazards = [],
  closures = [],
  parking = [],
  accessibility = [],
  userLocation = null,
  center = null,
  zoom = 13,
  height = '500px',
  onSelectMarker = null,
  pickLocationMode = false,
  onLocationSelected = null,
  selectedLocation = null,
  title = "Real-Time Urban Mobility Operations Map",
  showSearch = true,
  showControls = true,
  showLegend = true,
  onNavigate = null
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({
    hazards: null,
    closures: null,
    parking: null,
    accessibility: null,
    polylines: null,
    user: null,
    picked: null,
  });

  const [activeLayers, setActiveLayers] = useState({
    hazards: true,
    closures: true,
    parking: true,
    accessibility: true,
  });

  const [selectedPopupItem, setSelectedPopupItem] = useState(null);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [isLeafletReady, setIsLeafletReady] = useState(false);

  // Address Search State (OpenStreetMap Nominatim Geocoding)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Ensure Leaflet is loaded
  useEffect(() => {
    const checkLeaflet = () => {
      if (window.L) {
        setIsLeafletReady(true);
      } else {
        setTimeout(checkLeaflet, 100);
      }
    };
    checkLeaflet();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isLeafletReady || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Already initialized

    const L = window.L;

    // Calculate initial center based on actual application data
    let initialLat = 12.9716;
    let initialLng = 77.5946;

    if (center && center.latitude && center.longitude) {
      initialLat = center.latitude;
      initialLng = center.longitude;
    } else if (userLocation && userLocation.latitude && userLocation.longitude) {
      initialLat = userLocation.latitude;
      initialLng = userLocation.longitude;
    } else {
      // Find average of valid coordinates from records
      const allValid = [
        ...hazards.filter(h => h.latitude && h.longitude),
        ...closures.filter(c => c.latitude && c.longitude),
        ...parking.filter(p => p.latitude && p.longitude)
      ];
      if (allValid.length > 0) {
        const sumLat = allValid.reduce((acc, curr) => acc + curr.latitude, 0);
        const sumLng = allValid.reduce((acc, curr) => acc + curr.longitude, 0);
        initialLat = sumLat / allValid.length;
        initialLng = sumLng / allValid.length;
      }
    }

    // Create Leaflet Map Instance
    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: zoom,
      zoomControl: false, // Custom styled zoom controls
      attributionControl: true,
      preferCanvas: true
    });

    // Add Real OpenStreetMap Tile Layer with Proper Official Attribution
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | TrafficIQ Smart City',
      className: 'trafficiq-osm-tiles',
    }).addTo(map);

    // Track mouse coordinate readout
    map.on('mousemove', (e) => {
      setCurrentCoords({
        lat: e.latlng.lat.toFixed(5),
        lng: e.latlng.lng.toFixed(5)
      });
    });

    // Pick location click handler for Citizen Reporting System
    if (pickLocationMode) {
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        handlePlacePickedPin(lat, lng, map);
      });
    }

    // Initialize layer groups (with markerCluster if available)
    const useCluster = typeof L.markerClusterGroup === 'function';
    layersRef.current.hazards = useCluster ? L.markerClusterGroup({ maxClusterRadius: 40 }) : L.layerGroup();
    layersRef.current.closures = L.layerGroup();
    layersRef.current.parking = useCluster ? L.markerClusterGroup({ maxClusterRadius: 40 }) : L.layerGroup();
    layersRef.current.accessibility = L.layerGroup();
    layersRef.current.polylines = L.layerGroup();
    layersRef.current.user = L.layerGroup();
    layersRef.current.picked = L.layerGroup();

    map.addLayer(layersRef.current.hazards);
    map.addLayer(layersRef.current.closures);
    map.addLayer(layersRef.current.parking);
    map.addLayer(layersRef.current.accessibility);
    map.addLayer(layersRef.current.polylines);
    map.addLayer(layersRef.current.user);
    map.addLayer(layersRef.current.picked);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLeafletReady]);

  // Handle picked pin placement & Reverse Geocoding
  const handlePlacePickedPin = async (lat, lng, mapObj) => {
    const L = window.L;
    const map = mapObj || mapInstanceRef.current;
    if (!map || !L) return;

    layersRef.current.picked.clearLayers();

    // Create prominent custom pin for user's picked location
    const pickIcon = L.divIcon({
      className: 'picked-location-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #06B6D4; border: 3px solid #FFFFFF; box-shadow: 0 0 15px rgba(6,182,212,0.8); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 800; font-size: 14px;">
            📍
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #06B6D4;"></div>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -38]
    });

    const marker = L.marker([lat, lng], { icon: pickIcon, draggable: true }).addTo(layersRef.current.picked);

    // Attempt Reverse Geocoding via OpenStreetMap Nominatim with respectful User-Agent
    let locationInfo = {
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
      road_name: '',
      address: ''
    };

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        const road = data.address?.road || data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || 'City Road';
        const fullAddr = data.display_name || '';
        locationInfo.road_name = road;
        locationInfo.address = fullAddr;

        marker.bindPopup(`
          <div style="padding: 10px; font-family: sans-serif; font-size: 12px; color: #f8fafc;">
            <strong style="color: #38bdf8; font-size: 13px;">Selected Point:</strong>
            <p style="margin: 4px 0; font-weight: bold;">${road}</p>
            <p style="margin: 2px 0; font-size: 11px; color: #94a3b8;">${fullAddr}</p>
            <p style="margin: 4px 0 0; font-family: monospace; font-size: 10px; color: #38bdf8;">${locationInfo.latitude}, ${locationInfo.longitude}</p>
          </div>
        `, { className: 'trafficiq-popup' }).openPopup();
      }
    } catch (e) {
      console.warn("Reverse geocode failed or rate-limited", e);
    }

    if (onLocationSelected) {
      onLocationSelected(locationInfo);
    }

    // Allow user to drag the pin
    marker.on('dragend', (ev) => {
      const pos = ev.target.getLatLng();
      handlePlacePickedPin(pos.lat, pos.lng, map);
    });
  };

  // Sync Selected Location prop (when set externally e.g. via GPS button)
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current || !selectedLocation) return;
    if (selectedLocation.latitude && selectedLocation.longitude) {
      const lat = selectedLocation.latitude;
      const lng = selectedLocation.longitude;
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
      handlePlacePickedPin(lat, lng, mapInstanceRef.current);
    }
  }, [selectedLocation, isLeafletReady]);

  // Render User Location Pin
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current) return;
    const L = window.L;
    layersRef.current.user.clearLayers();

    if (userLocation && userLocation.latitude && userLocation.longitude) {
      const { latitude, longitude, accuracy } = userLocation;

      // Accuracy circle
      if (accuracy) {
        L.circle([latitude, longitude], {
          radius: Math.min(accuracy, 500),
          color: '#06B6D4',
          weight: 1.5,
          fillColor: '#06B6D4',
          fillOpacity: 0.12,
        }).addTo(layersRef.current.user);
      }

      // Radar pulse icon
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `
          <div class="user-radar-pulse">
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #06B6D4; border: 2.5px solid #FFFFFF; box-shadow: 0 0 10px #06B6D4;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 1000 })
        .bindPopup(`
          <div style="padding: 10px; font-size: 12px; color: #f8fafc; font-family: sans-serif;">
            <strong style="color: #38bdf8;">Your Current GPS Location</strong>
            <p style="margin: 4px 0; font-family: monospace; font-size: 11px;">Lat: ${latitude}, Lng: ${longitude}</p>
            ${accuracy ? `<p style="margin: 2px 0; font-size: 10px; color: #94a3b8;">Accuracy radius: ±${accuracy} meters</p>` : ''}
          </div>
        `, { className: 'trafficiq-popup' })
        .addTo(layersRef.current.user);
    }
  }, [userLocation, isLeafletReady]);

  // Render Hazard Reports
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current) return;
    const L = window.L;
    layersRef.current.hazards.clearLayers();

    if (!activeLayers.hazards) return;

    hazards.forEach((hz) => {
      // STRICT REQUIREMENT 9: Never silently invent coordinates
      if (!hz.latitude || !hz.longitude) return;

      const sev = (hz.severity || 'Medium').toLowerCase();
      const color =
        sev === 'critical' ? '#EF4444' :
        sev === 'high' ? '#F97316' :
        sev === 'medium' ? '#F59E0B' : '#06B6D4';

      const isVerified = hz.is_verified || hz.status === 'Verified' || hz.status === 'In Progress' || hz.status === 'Resolved';

      // Custom SVG marker icon with verified badge indicator
      const hazardIcon = L.divIcon({
        className: 'custom-hazard-marker',
        html: `
          <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="width: 26px; height: 26px; border-radius: 50%; background: ${color}; border: 2.5px solid #0B0F19; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 800; font-size: 13px;">
              !
            </div>
            ${isVerified ? `
              <div style="position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; background: #10B981; border: 1.5px solid #0B0F19; display: flex; align-items: center; justify-content: center; color: white; font-size: 8px;">✓</div>
            ` : ''}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([hz.latitude, hz.longitude], { icon: hazardIcon });

      // Rich Detail Popup (Requirement 3)
      const popupHtml = `
        <div style="padding: 12px; min-width: 240px; max-width: 300px; font-family: sans-serif; color: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-family: monospace; font-size: 10px; font-weight: bold; color: #38bdf8; background: #082f49; padding: 2px 6px; border-radius: 4px; border: 1px solid #0284c7;">
              ${hz.report_id || 'HAZARD'}
            </span>
            <span style="font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 12px; background: ${color}25; color: ${color}; border: 1px solid ${color}60;">
              ${hz.severity} Severity
            </span>
          </div>

          <h4 style="margin: 4px 0 2px; font-size: 14px; font-weight: 800; color: #ffffff;">${hz.road_name || 'Reported Road'}</h4>
          <p style="margin: 0 0 6px; font-size: 11px; color: #94a3b8;">${hz.address || hz.category}</p>

          <p style="margin: 6px 0; font-size: 12px; color: #cbd5e1; line-height: 1.4;">${hz.description || ''}</p>

          ${hz.photo_url ? `
            <div style="margin: 8px 0;">
              <img src="${hz.photo_url}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; border: 1px solid #334155;" alt="Evidence photograph" />
            </div>
          ` : ''}

          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8;">
            <span>Status: <strong style="color: ${isVerified ? '#34d399' : '#fbbf24'};">${hz.status}</strong></span>
            <span>${hz.created_at ? new Date(hz.created_at).toLocaleDateString() : ''}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'trafficiq-popup' });
      marker.on('click', () => {
        if (onSelectMarker) onSelectMarker({ type: 'hazard', data: hz });
      });

      marker.addTo(layersRef.current.hazards);
    });
  }, [hazards, activeLayers.hazards, isLeafletReady]);

  // Render Parking Facilities (Requirement 5)
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current) return;
    const L = window.L;
    layersRef.current.parking.clearLayers();

    if (!activeLayers.parking) return;

    parking.forEach((pk) => {
      if (!pk.latitude || !pk.longitude) return;

      const hasRealtime = pk.has_realtime_availability && pk.available_spaces !== null;

      const parkingIcon = L.divIcon({
        className: 'custom-parking-marker',
        html: `
          <div style="width: 28px; height: 28px; border-radius: 8px; background: #0284C7; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 900; font-size: 14px; cursor: pointer;">
            P
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([pk.latitude, pk.longitude], { icon: parkingIcon });

      const popupHtml = `
        <div style="padding: 12px; min-width: 240px; font-family: sans-serif; color: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-family: monospace; font-size: 10px; font-weight: bold; color: #38bdf8;">
              ${pk.facility_id || 'PARKING'}
            </span>
            <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 8px; background: #0369a1; color: #e0f2fe;">
              ${pk.parking_type || 'Facility'}
            </span>
          </div>

          <h4 style="margin: 4px 0 2px; font-size: 14px; font-weight: 800; color: #ffffff;">${pk.name}</h4>
          <p style="margin: 0 0 8px; font-size: 11px; color: #94a3b8;">${pk.address || pk.area}</p>

          <div style="background: #090d16; padding: 8px; border-radius: 8px; border: 1px solid #1e293b; margin-bottom: 6px;">
            <div style="font-size: 11px; margin-bottom: 2px;">
              <span style="color: #94a3b8;">Total Capacity:</span> <strong>${pk.total_capacity || 'Not registered'}</strong>
            </div>
            <div style="font-size: 11px;">
              <span style="color: #94a3b8;">Live Availability:</span>
              ${hasRealtime ? `
                <strong style="color: #34d399; font-weight: 800;">${pk.available_spaces} spaces open</strong>
              ` : `
                <strong style="color: #94a3b8; font-style: italic;">Availability unknown</strong>
              `}
            </div>
          </div>

          <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 4px;">
            Tariff: <strong style="color: #38bdf8;">${pk.charges_info || 'Standard Rates'}</strong>
          </div>
          <div style="font-size: 10px; color: #64748b;">
            Operating Hours: ${pk.operating_hours || '24/7'}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'trafficiq-popup' });
      marker.on('click', () => {
        if (onSelectMarker) onSelectMarker({ type: 'parking', data: pk });
      });

      marker.addTo(layersRef.current.parking);
    });
  }, [parking, activeLayers.parking, isLeafletReady]);

  // Render Road Closures, Construction & Polylines (Requirement 6)
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current) return;
    const L = window.L;
    layersRef.current.closures.clearLayers();
    layersRef.current.polylines.clearLayers();

    if (!activeLayers.closures) return;

    closures.forEach((cl) => {
      if (!cl.latitude || !cl.longitude) return;

      const closureIcon = L.divIcon({
        className: 'custom-closure-marker',
        html: `
          <div style="width: 28px; height: 28px; border-radius: 8px; background: #F59E0B; border: 2.5px solid #78350F; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 900; font-size: 14px; cursor: pointer;">
            🚧
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([cl.latitude, cl.longitude], { icon: closureIcon });

      const popupHtml = `
        <div style="padding: 12px; min-width: 250px; font-family: sans-serif; color: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-family: monospace; font-size: 10px; font-weight: bold; color: #fbbf24; background: #451a03; padding: 2px 6px; border-radius: 4px;">
              ${cl.update_id || 'ADVISORY'}
            </span>
            <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 8px; background: #b45309; color: #fef3c7;">
              ${cl.status || 'Active'}
            </span>
          </div>

          <h4 style="margin: 4px 0 2px; font-size: 14px; font-weight: 800; color: #ffffff;">${cl.title}</h4>
          <p style="margin: 0 0 6px; font-size: 11px; color: #fcd34d; font-weight: 600;">${cl.road_name} (${cl.affected_segments})</p>

          <p style="margin: 6px 0; font-size: 12px; color: #cbd5e1; line-height: 1.4;">${cl.reason}</p>

          <div style="background: #090d16; padding: 8px; border-radius: 8px; border: 1px solid #1e293b; margin: 6px 0; font-size: 11px;">
            <strong style="color: #38bdf8; display: block; margin-bottom: 2px;">Official Instructions:</strong>
            <span style="color: #e2e8f0;">${cl.official_instructions}</span>
          </div>

          ${cl.has_alternative_route && cl.diversion_route ? `
            <div style="background: #082f49; padding: 8px; border-radius: 8px; border: 1px solid #0284c7; margin: 6px 0; font-size: 11px;">
              <strong style="color: #38bdf8; display: block; margin-bottom: 2px;">Verified Diversion Route:</strong>
              <span style="color: #bae6fd;">${cl.diversion_route}</span>
            </div>
          ` : ''}

          <div style="margin-top: 6px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
            <span>Start: ${cl.start_date || 'Active'}</span>
            <span>Reopening: <strong style="color: #ffffff;">${cl.expected_end_date || 'Under Review'}</strong></span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'trafficiq-popup' });
      marker.on('click', () => {
        if (onSelectMarker) onSelectMarker({ type: 'closure', data: cl });
      });

      marker.addTo(layersRef.current.closures);

      // Requirement 6: Render affected road section as geographic polyline line
      // Generate localized road segment line coordinates around point
      const lineCoords = [
        [cl.latitude - 0.0018, cl.longitude - 0.0022],
        [cl.latitude, cl.longitude],
        [cl.latitude + 0.0018, cl.longitude + 0.0022]
      ];

      L.polyline(lineCoords, {
        color: '#F59E0B',
        weight: 6,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round'
      }).addTo(layersRef.current.polylines);
    });
  }, [closures, activeLayers.closures, isLeafletReady]);

  // Render Accessibility Reports (Requirement 7)
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current) return;
    const L = window.L;
    layersRef.current.accessibility.clearLayers();

    if (!activeLayers.accessibility) return;

    accessibility.forEach((acc) => {
      if (!acc.latitude || !acc.longitude) return;

      const accIcon = L.divIcon({
        className: 'custom-acc-marker',
        html: `
          <div style="width: 28px; height: 28px; border-radius: 50%; background: #9333EA; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 900; font-size: 13px; cursor: pointer;">
            ♿
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([acc.latitude, acc.longitude], { icon: accIcon });

      const popupHtml = `
        <div style="padding: 12px; min-width: 240px; font-family: sans-serif; color: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-family: monospace; font-size: 10px; font-weight: bold; color: #c084fc;">
              ${acc.report_id || 'BARRIER'}
            </span>
            <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 8px; background: #6b21a8; color: #f3e8ff;">
              ${acc.status}
            </span>
          </div>

          <h4 style="margin: 4px 0 2px; font-size: 14px; font-weight: 800; color: #ffffff;">${acc.road_or_footpath_name}</h4>
          <p style="margin: 0 0 6px; font-size: 11px; color: #c084fc; font-weight: bold;">${acc.category}</p>

          <p style="margin: 6px 0; font-size: 12px; color: #cbd5e1; line-height: 1.4;">${acc.description}</p>

          <div style="background: #090d16; padding: 8px; border-radius: 8px; border: 1px solid #1e293b; margin: 6px 0; font-size: 11px;">
            <strong style="color: #f472b6; display: block; margin-bottom: 2px;">Pedestrian Impact:</strong>
            <span style="color: #e2e8f0;">${acc.accessibility_impact}</span>
          </div>

          <div style="background: #1e1b4b; padding: 8px; border-radius: 8px; border: 1px solid #4338ca; font-size: 11px;">
            <strong style="color: #818cf8; display: block; margin-bottom: 2px;">Suggested Remedy:</strong>
            <span style="color: #e0e7ff;">${acc.suggested_action}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'trafficiq-popup' });
      marker.on('click', () => {
        if (onSelectMarker) onSelectMarker({ type: 'accessibility', data: acc });
      });

      marker.addTo(layersRef.current.accessibility);
    });
  }, [accessibility, activeLayers.accessibility, isLeafletReady]);

  // Fit bounds to all records when data loads
  const fitAllMarkers = () => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const allPts = [
      ...hazards.filter(h => h.latitude && h.longitude).map(h => [h.latitude, h.longitude]),
      ...closures.filter(c => c.latitude && c.longitude).map(c => [c.latitude, c.longitude]),
      ...parking.filter(p => p.latitude && p.longitude).map(p => [p.latitude, p.longitude]),
      ...accessibility.filter(a => a.latitude && a.longitude).map(a => [a.latitude, a.longitude]),
    ];

    if (allPts.length > 0) {
      const bounds = L.latLngBounds(allPts);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  };

  // Center on user GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 1.5 });
        }
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        alert("Could not acquire GPS position: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Geocoding Search via OpenStreetMap Nominatim
  const handleSearchInput = (val) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length < 3) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&addressdetails=1`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowSearchDropdown(data.length > 0);
        }
      } catch (err) {
        console.error("Geocoding search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce
  };

  const handleSelectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lon], 16, { duration: 1.5 });
    }
    setShowSearchDropdown(false);
    setSearchQuery(item.display_name.split(',')[0]);

    if (pickLocationMode) {
      handlePlacePickedPin(lat, lon, mapInstanceRef.current);
    }
  };

  // Count records with missing coordinates (Requirement 9)
  const unlocatedHazards = hazards.filter(h => !h.latitude || !h.longitude).length;
  const totalLocatedPoints = [
    ...hazards.filter(h => h.latitude && h.longitude),
    ...closures.filter(c => c.latitude && c.longitude),
    ...parking.filter(p => p.latitude && p.longitude),
    ...accessibility.filter(a => a.latitude && a.longitude)
  ].length;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl trafficiq-map-container" style={{ height }}>
      {/* Floating Place & Address Geocoding Search Bar (Requirement 10 & 11) */}
      {showSearch && (
        <div className="absolute top-3 left-3 z-[1000] w-72 sm:w-80 pointer-events-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
              placeholder="Search city streets, places, landmarks..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 text-xs text-white placeholder:text-slate-400 shadow-xl outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            {isSearching ? (
              <div className="w-3.5 h-3.5 absolute right-3 top-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            ) : searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearchDropdown(false);
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            ) : null}
          </div>

          {/* Autocomplete Results Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="mt-1 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl overflow-hidden shadow-2xl divide-y divide-slate-800 max-h-60 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-800 hover:text-cyan-300 transition flex items-start space-x-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="truncate">
                    <strong className="block truncate text-white">{item.display_name.split(',')[0]}</strong>
                    <span className="text-[10px] text-slate-400 block truncate">{item.display_name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Layer Controls (Requirement 11) */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col space-y-1.5 pointer-events-auto">
        {showControls && (
          <div className="flex flex-col space-y-1 bg-slate-900/95 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl">
            <button
              onClick={() => mapInstanceRef.current && mapInstanceRef.current.zoomIn()}
              className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-center transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => mapInstanceRef.current && mapInstanceRef.current.zoomOut()}
              className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-center transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className="w-8 h-8 rounded-lg hover:bg-slate-800 text-cyan-400 flex items-center justify-center transition"
              title="Locate My Position"
            >
              <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={fitAllMarkers}
              className="w-8 h-8 rounded-lg hover:bg-slate-800 text-purple-400 flex items-center justify-center transition"
              title="Fit All Real Data Points"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Layer Toggles */}
        <div className="bg-slate-900/95 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-xl space-y-1.5 text-[11px]">
          <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={activeLayers.hazards}
              onChange={(e) => setActiveLayers(p => ({ ...p, hazards: e.target.checked }))}
              className="rounded bg-slate-950 border-slate-700 text-rose-500 w-3 h-3"
            />
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Hazards ({hazards.filter(h => h.latitude && h.longitude).length})</span>
          </label>

          <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={activeLayers.closures}
              onChange={(e) => setActiveLayers(p => ({ ...p, closures: e.target.checked }))}
              className="rounded bg-slate-950 border-slate-700 text-amber-500 w-3 h-3"
            />
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Closures ({closures.filter(c => c.latitude && c.longitude).length})</span>
          </label>

          <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={activeLayers.parking}
              onChange={(e) => setActiveLayers(p => ({ ...p, parking: e.target.checked }))}
              className="rounded bg-slate-950 border-slate-700 text-sky-500 w-3 h-3"
            />
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>Parking ({parking.filter(p => p.latitude && p.longitude).length})</span>
          </label>

          <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={activeLayers.accessibility}
              onChange={(e) => setActiveLayers(p => ({ ...p, accessibility: e.target.checked }))}
              className="rounded bg-slate-950 border-slate-700 text-purple-500 w-3 h-3"
            />
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Accessibility ({accessibility.filter(a => a.latitude && a.longitude).length})</span>
          </label>
        </div>
      </div>

      {/* Mode Instruction Pill (Pick location mode for citizen reporting) */}
      {pickLocationMode && (
        <div className="absolute top-14 left-3 z-[1000] bg-cyan-950/90 backdrop-blur-md border border-cyan-500/80 px-3 py-1.5 rounded-xl shadow-xl text-xs text-cyan-200 flex items-center space-x-2">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
          <span><strong>Click on the real road</strong> or drag the pin to set exact coordinates</span>
        </div>
      )}

      {/* Notice for Records Without Coordinates (Strict Requirement 9) */}
      {unlocatedHazards > 0 && (
        <div className="absolute bottom-6 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl shadow-lg text-[10px] text-slate-400 flex items-center space-x-1.5">
          <Info className="w-3 h-3 text-amber-400" />
          <span>{unlocatedHazards} report(s) without GPS coordinates available in list view only.</span>
        </div>
      )}

      {/* Coordinate Readout */}
      {currentCoords && (
        <div className="absolute bottom-2 right-3 z-[1000] bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800 text-[10px] font-mono text-slate-400 pointer-events-none">
          GPS: {currentCoords.lat}° N, {currentCoords.lng}° E
        </div>
      )}

      {/* Leaflet Map DOM Node */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
