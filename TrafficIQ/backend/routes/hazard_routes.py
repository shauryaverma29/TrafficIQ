import os
import uuid
import math
from datetime import datetime
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from database.db_manager import (
    get_connection,
    calculate_suggested_priority,
    find_potential_duplicates,
    UPLOAD_DIR
)
from models.state_manager import state

hazard_bp = Blueprint('hazards', __name__)

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 Megabytes

VALID_CATEGORIES = [
    "Pothole / Broken Road",
    "Fallen Tree / Branch",
    "Road Blockage",
    "Waterlogging / Flooding",
    "Traffic Signal Failure",
    "Accident Debris",
    "Exposed Wires",
    "Damaged Street Infrastructure",
    "Damaged Footpath",
    "Other"
]

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_image_header(file_stream):
    """Inspect magic bytes to protect against disguised malicious executables."""
    pos = file_stream.tell()
    header = file_stream.read(16)
    file_stream.seek(pos)
    if not header:
        return False
    # JPEG: starts with \xFF\xD8\xFF
    if header.startswith(b'\xFF\xD8\xFF'):
        return True
    # PNG: starts with \x89PNG\r\n\x1a\n
    if header.startswith(b'\x89PNG\r\n\x1a\n'):
        return True
    # WEBP: RIFF....WEBP
    if header.startswith(b'RIFF') and b'WEBP' in header:
        return True
    return False

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points in km."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@hazard_bp.route('/check-duplicates', methods=['POST'])
def check_duplicates_endpoint():
    """Real-time duplicate detection endpoint for reporting form."""
    data = request.get_json() or {}
    category = data.get('category', '')
    road_name = data.get('road_name', '')
    lat = data.get('latitude')
    lng = data.get('longitude')
    
    if lat is not None:
        try: lat = float(lat)
        except ValueError: lat = None
    if lng is not None:
        try: lng = float(lng)
        except ValueError: lng = None

    duplicates = find_potential_duplicates(category, road_name, lat, lng)
    return jsonify({
        "duplicate_found": len(duplicates) > 0,
        "count": len(duplicates),
        "potential_duplicates": duplicates
    })

@hazard_bp.route('/submit', methods=['POST'])
def submit_hazard():
    """Citizen report submission endpoint supporting multipart photo upload."""
    try:
        # Form fields can arrive via multipart form-data or JSON
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
            uploaded_file = request.files.get('photo')
        else:
            data = request.get_json() or {}
            uploaded_file = None

        category = (data.get('category') or '').strip()
        road_name = (data.get('road_name') or '').strip()
        address = (data.get('address') or '').strip()
        description = (data.get('description') or '').strip()
        severity = (data.get('severity') or 'Medium').strip().capitalize()
        reporter_name = (data.get('reporter_name') or '').strip()
        reporter_contact = (data.get('reporter_contact') or '').strip()
        is_anonymous = 1 if str(data.get('is_anonymous', 'false')).lower() in ('true', '1') else 0
        is_acc = 1 if str(data.get('is_accessibility_issue', 'false')).lower() in ('true', '1') else 0
        acc_details = (data.get('accessibility_details') or '').strip()

        # GPS validation: NEVER invent coordinates. If absent, set None.
        lat_raw = data.get('latitude')
        lng_raw = data.get('longitude')
        gps_accuracy_raw = data.get('gps_accuracy')

        latitude = None
        longitude = None
        gps_accuracy = None

        if lat_raw is not None and str(lat_raw).strip() not in ('', 'null', 'undefined'):
            try:
                lat_val = float(lat_raw)
                if -90 <= lat_val <= 90:
                    latitude = round(lat_val, 6)
            except (ValueError, TypeError):
                pass

        if lng_raw is not None and str(lng_raw).strip() not in ('', 'null', 'undefined'):
            try:
                lng_val = float(lng_raw)
                if -180 <= lng_val <= 180:
                    longitude = round(lng_val, 6)
            except (ValueError, TypeError):
                pass

        if gps_accuracy_raw is not None and str(gps_accuracy_raw).strip() not in ('', 'null', 'undefined'):
            try:
                gps_accuracy = round(float(gps_accuracy_raw), 1)
            except (ValueError, TypeError):
                pass

        # Validation
        if not category:
            return jsonify({"error": "Issue category is required"}), 400
        if not road_name:
            return jsonify({"error": "Road name is required"}), 400
        if not description:
            return jsonify({"error": "A short description of the issue is required"}), 400
        if len(description) < 10:
            return jsonify({"error": "Description must be at least 10 characters long"}), 400
        if severity not in ('Low', 'Medium', 'High', 'Critical'):
            severity = 'Medium'

        # Process Photo Upload
        photo_filename = None
        if uploaded_file and uploaded_file.filename != '':
            if not allowed_file(uploaded_file.filename):
                return jsonify({"error": "Invalid photo file format. Only JPG, JPEG, PNG, and WEBP are supported."}), 400
            
            # Check length of file stream
            uploaded_file.seek(0, os.SEEK_END)
            file_length = uploaded_file.tell()
            uploaded_file.seek(0)
            if file_length > MAX_FILE_SIZE:
                return jsonify({"error": "Uploaded photograph exceeds the 5MB maximum file size limit."}), 400

            # Validate binary magic bytes
            if not validate_image_header(uploaded_file):
                return jsonify({"error": "Corrupt or invalid image content detected."}), 400

            ext = uploaded_file.filename.rsplit('.', 1)[1].lower()
            safe_id = uuid.uuid4().hex
            photo_filename = f"hazard_{safe_id}.{ext}"
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            save_path = os.path.join(UPLOAD_DIR, photo_filename)
            uploaded_file.save(save_path)

        # Generate Unique Report ID (e.g. REP-2026-84920)
        report_number = uuid.uuid4().int % 90000 + 10000
        report_id = f"REP-2026-{report_number}"

        # Explainable Priority calculation
        priority_info = calculate_suggested_priority(category, road_name, description, severity)
        suggested_priority = f"{priority_info['suggested']}: {priority_info['reason']}"

        now = datetime.now().isoformat()
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
        INSERT INTO hazard_reports (
            report_id, category, road_name, address, latitude, longitude, gps_accuracy,
            description, severity, suggested_priority, status, photo_filename,
            reporter_name, reporter_contact, is_anonymous, is_accessibility_issue,
            accessibility_details, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            report_id, category, road_name, address, latitude, longitude, gps_accuracy,
            description, severity, suggested_priority, photo_filename,
            None if is_anonymous else reporter_name,
            None if is_anonymous else reporter_contact,
            is_anonymous, is_acc, acc_details, now, now
        ))
        conn.commit()

        # Also log to service audit log
        cursor.execute("""
        INSERT INTO service_audit_log (entity_type, entity_id, action, details, performed_by, timestamp)
        VALUES ('hazard_report', ?, 'CREATED', 'Report submitted by citizen', ?, ?)
        """, (report_id, "Anonymous Citizen" if is_anonymous else (reporter_name or "Citizen"), now))
        conn.commit()
        conn.close()

        # Check for potential duplicates to advise user
        duplicates = find_potential_duplicates(category, road_name, latitude, longitude)

        return jsonify({
            "success": True,
            "message": "Report submitted successfully to TrafficIQ Road Hazard Registry.",
            "report_id": report_id,
            "category": category,
            "road_name": road_name,
            "status": "Submitted",
            "has_coordinates": latitude is not None and longitude is not None,
            "suggested_priority": suggested_priority,
            "photo_uploaded": photo_filename is not None,
            "photo_url": f"/api/hazards/image/{photo_filename}" if photo_filename else None,
            "submission_date": now,
            "potential_duplicates_found": len(duplicates) > 0,
            "duplicates": duplicates
        }), 201

    except Exception as e:
        return jsonify({"error": f"Failed to submit hazard report: {str(e)}"}), 500

@hazard_bp.route('/public', methods=['GET'])
def get_public_hazards():
    """Public listing of hazard reports (privacy-protected: personal citizen data stripped)."""
    conn = get_connection()
    cursor = conn.cursor()

    status = request.args.get('status')
    category = request.args.get('category')
    severity = request.args.get('severity')
    search = request.args.get('search', '').strip()

    query = "SELECT * FROM hazard_reports WHERE 1=1"
    params = []

    if status and status != 'All':
        query += " AND status = ?"
        params.append(status)
    if category and category != 'All':
        query += " AND category = ?"
        params.append(category)
    if severity and severity != 'All':
        query += " AND severity = ?"
        params.append(severity)
    if search:
        query += " AND (road_name LIKE ? OR report_id LIKE ? OR description LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    query += " ORDER BY id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()

    results = []
    for r in rows:
        d = dict(r)
        # Protect privacy: strip sensitive personal reporter details for public view
        d.pop('reporter_name', None)
        d.pop('reporter_contact', None)
        if d.get('photo_filename'):
            d['photo_url'] = f"/api/hazards/image/{d['photo_filename']}"
        if d.get('resolution_photo_filename'):
            d['resolution_photo_url'] = f"/api/hazards/image/{d['resolution_photo_filename']}"
        results.append(d)

    conn.close()
    return jsonify({
        "count": len(results),
        "reports": results
    })

@hazard_bp.route('/nearby', methods=['GET'])
def get_nearby_hazards():
    """
    Explore road issues near user coordinates using Haversine formula.
    Never invents coordinates. Displays verified and unverified reports distinctly.
    Gracefully handles large distances and 'all' radius filters.
    """
    lat_str = request.args.get('lat')
    lng_str = request.args.get('lng')
    radius_raw = request.args.get('radius', '5.0')
    category_filter = request.args.get('category', 'All')
    status_filter = request.args.get('status', 'All')

    if not lat_str or not lng_str:
        return jsonify({
            "error": "Latitude ('lat') and Longitude ('lng') are required to compute nearby road issues."
        }), 400

    try:
        user_lat = float(lat_str)
        user_lng = float(lng_str)
    except ValueError:
        return jsonify({"error": "Invalid coordinates provided"}), 400

    # Parse radius safely
    try:
        if str(radius_raw).lower() in ('all', 'any', '-1', 'none', 'max'):
            radius_km = 40000.0  # Entire earth radius
        else:
            radius_km = float(radius_raw)
    except (ValueError, TypeError):
        radius_km = 5.0

    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM hazard_reports WHERE latitude IS NOT NULL AND longitude IS NOT NULL"
    params = []
    if category_filter != 'All':
        query += " AND category = ?"
        params.append(category_filter)
    if status_filter != 'All':
        query += " AND status = ?"
        params.append(status_filter)

    cursor.execute(query, params)
    rows = cursor.fetchall()

    all_matched = []
    nearby = []
    min_dist = None

    for r in rows:
        d = dict(r)
        # Compute exact spherical distance
        dist = haversine_distance(user_lat, user_lng, d['latitude'], d['longitude'])
        d['distance_km'] = round(dist, 2)
        d['distance_meters'] = int(dist * 1000)
        d.pop('reporter_name', None)
        d.pop('reporter_contact', None)
        if d.get('photo_filename'):
            d['photo_url'] = f"/api/hazards/image/{d['photo_filename']}"
        if d.get('resolution_photo_filename'):
            d['resolution_photo_url'] = f"/api/hazards/image/{d['resolution_photo_filename']}"

        if min_dist is None or dist < min_dist:
            min_dist = dist

        all_matched.append(d)
        if dist <= radius_km:
            nearby.append(d)

    # Sort by nearest first
    nearby.sort(key=lambda x: x['distance_km'])
    all_matched.sort(key=lambda x: x['distance_km'])
    conn.close()

    closest_dist = round(min_dist, 1) if min_dist is not None else None
    user_is_far = bool(closest_dist and closest_dist > 50.0)

    return jsonify({
        "user_coordinates": {"latitude": user_lat, "longitude": user_lng},
        "search_radius_km": radius_km,
        "count": len(nearby),
        "total_in_registry": len(all_matched),
        "closest_report_km": closest_dist,
        "user_is_far_from_data": user_is_far,
        "recommended_city_center": {
            "latitude": 12.9716,
            "longitude": 77.5946,
            "name": "Central Metro Hub"
        },
        "reports": nearby,
        "all_reports": all_matched if user_is_far and len(nearby) == 0 else []
    })

@hazard_bp.route('/track/<report_id>', methods=['GET'])
def track_report(report_id):
    """Citizen Report Tracking endpoint returning progress timeline, remarks, and photo."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM hazard_reports WHERE report_id = ?", (report_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({"error": f"Report ID '{report_id}' was not found in the registry."}), 404

    d = dict(row)
    # Strip reporter personal contact details for public tracking privacy
    d.pop('reporter_name', None)
    d.pop('reporter_contact', None)

    if d.get('photo_filename'):
        d['photo_url'] = f"/api/hazards/image/{d['photo_filename']}"
    if d.get('resolution_photo_filename'):
        d['resolution_photo_url'] = f"/api/hazards/image/{d['resolution_photo_filename']}"

    # Visual timeline construction
    timeline_stages = [
        {"stage": "Submitted", "label": "Report Submitted", "desc": "Citizen hazard recorded in database."},
        {"stage": "Pending Verification", "label": "Under Review", "desc": "Traffic engineer reviewing report details."},
        {"stage": "Verified", "label": "Officially Verified", "desc": "Hazard confirmed by municipal field officer."},
        {"stage": "Assigned", "label": "Workforce Assigned", "desc": "Dispatched to repair crew / department."},
        {"stage": "In Progress", "label": "Rectification Underway", "desc": "Active on-site civil or electrical work."},
        {"stage": "Resolved", "label": "Hazard Cleared", "desc": "Road surface or signal fully restored."}
    ]

    current_status = d.get('status', 'Submitted')
    stage_names = [s['stage'] for s in timeline_stages]
    current_index = stage_names.index(current_status) if current_status in stage_names else 0

    timeline = []
    for idx, s in enumerate(timeline_stages):
        timeline.append({
            "stage": s['stage'],
            "label": s['label'],
            "description": s['desc'],
            "completed": idx <= current_index and current_status != 'Rejected',
            "is_current": s['stage'] == current_status
        })

    # Fetch audit events for this report
    cursor.execute("""
    SELECT action, details, performed_by, timestamp
    FROM service_audit_log
    WHERE entity_id = ?
    ORDER BY id ASC
    """, (report_id,))
    audit_events = [dict(a) for a in cursor.fetchall()]

    conn.close()
    return jsonify({
        "report": d,
        "is_rejected": current_status == 'Rejected',
        "rejection_reason": d.get('rejection_reason'),
        "timeline": timeline,
        "audit_trail": audit_events
    })

@hazard_bp.route('/image/<filename>', methods=['GET'])
def get_hazard_image(filename):
    """Secure image server preventing path traversal."""
    if '..' in filename or '/' in filename or '\\' in filename:
        return jsonify({"error": "Illegal filename"}), 400
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    return send_from_directory(UPLOAD_DIR, filename)

@hazard_bp.route('/find', methods=['GET'])
def find_my_reports():
    """
    Citizen self-service lookup: find all reports linked to a phone/email,
    or by road name + optional date range.
    Privacy: reporter personal details are only matched, never returned in full.
    """
    contact  = (request.args.get('contact') or '').strip()
    road     = (request.args.get('road') or '').strip()
    category = (request.args.get('category') or '').strip()
    date_from = request.args.get('date_from', '').strip()   # ISO date YYYY-MM-DD
    date_to   = request.args.get('date_to', '').strip()

    if not contact and not road:
        return jsonify({"error": "Provide at least a contact (phone/email) or a road name to search."}), 400

    conn = get_connection()
    cursor = conn.cursor()

    conditions = []
    params = []

    if contact:
        # Partial case-insensitive match against phone or email
        conditions.append("(LOWER(reporter_contact) LIKE ? OR LOWER(reporter_name) LIKE ?)")
        term = f"%{contact.lower()}%"
        params.extend([term, term])

    if road:
        conditions.append("LOWER(road_name) LIKE ?")
        params.append(f"%{road.lower()}%")

    if category and category != 'All':
        conditions.append("category = ?")
        params.append(category)

    if date_from:
        conditions.append("DATE(created_at) >= ?")
        params.append(date_from)

    if date_to:
        conditions.append("DATE(created_at) <= ?")
        params.append(date_to)

    where = " AND ".join(conditions) if conditions else "1=1"
    query = f"""
        SELECT report_id, category, road_name, address, severity,
               status, created_at, updated_at, latitude, longitude,
               photo_filename, authority_remarks, is_anonymous
        FROM hazard_reports
        WHERE {where}
        ORDER BY created_at DESC
        LIMIT 50
    """
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        d = dict(r)
        if d.get('photo_filename'):
            d['photo_url'] = f"/api/hazards/image/{d['photo_filename']}"
        d.pop('photo_filename', None)
        results.append(d)

    return jsonify({
        "count": len(results),
        "reports": results,
        "search_used": {
            "contact_provided": bool(contact),
            "road_provided": bool(road),
            "category": category or None,
            "date_from": date_from or None,
            "date_to": date_to or None,
        }
    })

@hazard_bp.route('/traffic-correlation', methods=['GET'])
def correlate_with_traffic():
    """
    Requirement H: Connect verified citizen reports with existing traffic sensor dataset.
    Correlates verified hazards by road_name with sensor speeds, congestion index, and incident flags.
    Never modifies raw ML sensor observations.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT report_id, category, road_name, severity, status, created_at, authority_remarks
    FROM hazard_reports
    WHERE status IN ('Verified', 'Assigned', 'In Progress')
    """)
    verified_hazards = [dict(r) for r in cursor.fetchall()]
    conn.close()

    correlations = []
    has_dataset = state.raw_df is not None
    
    if has_dataset:
        df = state.raw_df
        if 'road_name' in df.columns:
            # Group sensors by road name
            road_groups = df.groupby('road_name')
            for road, group in road_groups:
                matched_hazards = [h for h in verified_hazards if h['road_name'].lower() == road.lower()]
                avg_speed = float(group['average_speed_kmh'].mean()) if 'average_speed_kmh' in group.columns else None
                avg_congestion = float(group['congestion_index'].mean()) if 'congestion_index' in group.columns else None
                total_incidents = int(group['incident_flag'].sum()) if 'incident_flag' in group.columns else 0
                sample_count = len(group)

                correlations.append({
                    "road_name": road,
                    "sensor_segment_count": sample_count,
                    "average_speed_kmh": round(avg_speed, 1) if avg_speed is not None else None,
                    "average_congestion_index": round(avg_congestion, 1) if avg_congestion is not None else None,
                    "sensor_incident_count": total_incidents,
                    "verified_hazard_count": len(matched_hazards),
                    "active_hazards": matched_hazards,
                    "intelligence_summary": generate_correlation_insight(road, len(matched_hazards), avg_speed, avg_congestion, total_incidents)
                })

    return jsonify({
        "has_traffic_dataset": has_dataset,
        "dataset_name": state.dataset_name if has_dataset else None,
        "verified_hazards_total": len(verified_hazards),
        "road_correlations": correlations
    })

def generate_correlation_insight(road, hazard_count, avg_speed, avg_congestion, incidents):
    if hazard_count > 0 and avg_congestion and avg_congestion > 60:
        return f"High congestion ({avg_congestion:.1f} index) strongly aligns with {hazard_count} verified citizen road hazard(s). Field crews actively mobilized."
    elif hazard_count > 0:
        return f"{hazard_count} verified hazard(s) monitored on {road}. Sensor flow baseline currently remains stable at {avg_speed:.1f} km/h."
    elif incidents > 0:
        return f"Sensors registered {incidents} recurring bottleneck incident(s) without citizen hazard reports yet filed."
    else:
        return f"Optimal free-flow conditions detected. No active physical hazards registered."
