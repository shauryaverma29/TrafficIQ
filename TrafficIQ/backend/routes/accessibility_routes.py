import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from database.db_manager import get_connection, UPLOAD_DIR
from routes.hazard_routes import allowed_file, validate_image_header, MAX_FILE_SIZE

accessibility_bp = Blueprint('accessibility', __name__)

ACCESSIBILITY_CATEGORIES = [
    "Damaged Footpath",
    "Blocked Footpath",
    "Missing Wheelchair Ramp",
    "Broken Pedestrian Crossing",
    "Obstacle on Walking Path",
    "Unsafe Pedestrian Infrastructure",
    "Other Accessibility Barrier"
]

@accessibility_bp.route('/reports', methods=['GET'])
def get_accessibility_reports():
    """List pedestrian accessibility barrier reports."""
    status = request.args.get('status', 'All')
    category = request.args.get('category', 'All')
    search = request.args.get('search', '').strip()

    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM accessibility_reports WHERE 1=1"
    params = []

    if status != 'All':
        query += " AND status = ?"
        params.append(status)
    if category != 'All':
        query += " AND category = ?"
        params.append(category)
    if search:
        query += " AND (road_or_footpath_name LIKE ? OR description LIKE ? OR suggested_action LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    query += " ORDER BY id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()

    reports = []
    for r in rows:
        d = dict(r)
        if d.get('photo_filename'):
            d['photo_url'] = f"/api/hazards/image/{d['photo_filename']}"
        reports.append(d)

    conn.close()
    return jsonify({
        "count": len(reports),
        "reports": reports
    })

@accessibility_bp.route('/report', methods=['POST'])
def submit_accessibility_report():
    """Submit a report identifying pedestrian and mobility accessibility barriers."""
    try:
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
            uploaded_file = request.files.get('photo')
        else:
            data = request.get_json() or {}
            uploaded_file = None

        road_name = (data.get('road_or_footpath_name') or '').strip()
        address = (data.get('address') or '').strip()
        category = (data.get('category') or 'Damaged Footpath').strip()
        severity = (data.get('severity') or 'Medium').strip().capitalize()
        description = (data.get('description') or '').strip()
        impact = (data.get('accessibility_impact') or '').strip()
        suggested_action = (data.get('suggested_action') or '').strip()

        lat_raw = data.get('latitude')
        lng_raw = data.get('longitude')
        lat = None
        lng = None
        if lat_raw is not None and str(lat_raw).strip() not in ('', 'null', 'undefined'):
            try: lat = float(lat_raw)
            except ValueError: pass
        if lng_raw is not None and str(lng_raw).strip() not in ('', 'null', 'undefined'):
            try: lng = float(lng_raw)
            except ValueError: pass

        if not road_name or not description or not impact or not suggested_action:
            return jsonify({
                "error": "Road/footpath name, description, accessibility impact, and suggested authority action are required."
            }), 400

        # Handle photo upload
        photo_filename = None
        if uploaded_file and uploaded_file.filename != '':
            if not allowed_file(uploaded_file.filename):
                return jsonify({"error": "Only JPG, PNG, and WEBP formats supported."}), 400
            
            uploaded_file.seek(0, os.SEEK_END)
            size = uploaded_file.tell()
            uploaded_file.seek(0)
            if size > MAX_FILE_SIZE:
                return jsonify({"error": "Photo exceeds 5MB limit."}), 400

            if not validate_image_header(uploaded_file):
                return jsonify({"error": "Invalid image file content."}), 400

            ext = uploaded_file.filename.rsplit('.', 1)[1].lower()
            photo_filename = f"acc_{uuid.uuid4().hex}.{ext}"
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            uploaded_file.save(os.path.join(UPLOAD_DIR, photo_filename))

        report_id = f"ACC-2026-{uuid.uuid4().int % 90000 + 10000}"
        now = datetime.now().isoformat()

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO accessibility_reports (
            report_id, road_or_footpath_name, address, latitude, longitude,
            category, severity, photo_filename, description, accessibility_impact,
            suggested_action, status, authority_remarks, is_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', NULL, 0, ?, ?)
        """, (
            report_id, road_name, address, lat, lng,
            category, severity, photo_filename, description, impact,
            suggested_action, now, now
        ))
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Accessibility barrier report submitted successfully.",
            "report_id": report_id
        }), 201

    except Exception as e:
        return jsonify({"error": f"Failed to submit accessibility report: {str(e)}"}), 500
