import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from database.db_manager import (
    get_connection,
    hash_password,
    UPLOAD_DIR
)
from services.auth_service import generate_token, require_authority
from routes.hazard_routes import allowed_file, validate_image_header, MAX_FILE_SIZE

authority_bp = Blueprint('authority', __name__)

@authority_bp.route('/login', methods=['POST'])
def authority_login():
    """Authenticate authority staff and issue secure session token."""
    data = request.get_json() or {}
    username = (data.get('username') or '').strip().lower()
    password = (data.get('password') or '').strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM authority_users WHERE LOWER(username) = ?", (username,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid authority username or password."}), 401

    hashed = hash_password(password)
    if hashed != user['password_hash']:
        return jsonify({"error": "Invalid authority username or password."}), 401

    token = generate_token(user['username'], user['role'])
    return jsonify({
        "success": True,
        "token": token,
        "user": {
            "username": user['username'],
            "full_name": user['full_name'],
            "role": user['role'],
            "department": user['department']
        }
    })

@authority_bp.route('/me', methods=['GET'])
@require_authority
def get_authority_profile():
    """Verify authority session and return profile info."""
    user = request.current_authority
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, full_name, role, department FROM authority_users WHERE username = ?", (user['username'],))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "User account no longer found."}), 404

    return jsonify({"user": dict(row)})

@authority_bp.route('/reports/all', methods=['GET'])
@require_authority
def get_all_reports_for_authority():
    """Authority view: returns all reports with complete internal details and reporter contact."""
    status = request.args.get('status', 'All')
    category = request.args.get('category', 'All')
    severity = request.args.get('severity', 'All')
    search = request.args.get('search', '').strip()

    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM hazard_reports WHERE 1=1"
    params = []

    if status != 'All':
        query += " AND status = ?"
        params.append(status)
    if category != 'All':
        query += " AND category = ?"
        params.append(category)
    if severity != 'All':
        query += " AND severity = ?"
        params.append(severity)
    if search:
        query += " AND (report_id LIKE ? OR road_name LIKE ? OR description LIKE ?)"
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
        if d.get('resolution_photo_filename'):
            d['resolution_photo_url'] = f"/api/hazards/image/{d['resolution_photo_filename']}"
        reports.append(d)

    conn.close()
    return jsonify({
        "count": len(reports),
        "reports": reports
    })

@authority_bp.route('/reports/<report_id>/verify', methods=['POST'])
@require_authority
def verify_report(report_id):
    """Authority marks report as verified."""
    data = request.get_json() or {}
    remarks = data.get('remarks', 'Verified by Municipal Traffic Authority.')
    officer = request.current_authority['username']
    now = datetime.now().isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM hazard_reports WHERE report_id = ?", (report_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": f"Report '{report_id}' not found."}), 404

    cursor.execute("""
    UPDATE hazard_reports
    SET status = 'Verified', is_verified = 1, authority_remarks = ?, updated_at = ?
    WHERE report_id = ?
    """, (remarks, now, report_id))

    cursor.execute("""
    INSERT INTO service_audit_log (entity_type, entity_id, action, details, performed_by, timestamp)
    VALUES ('hazard_report', ?, 'VERIFIED', ?, ?, ?)
    """, (report_id, f"Report officially verified. Remarks: {remarks}", officer, now))

    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": f"Report '{report_id}' marked as Verified."})

@authority_bp.route('/reports/<report_id>/assign', methods=['POST'])
@require_authority
def assign_report(report_id):
    """Assign report to field crew or department for investigation."""
    data = request.get_json() or {}
    assigned_to = (data.get('assigned_to') or '').strip()
    department = (data.get('department') or 'Municipal Road Maintenance').strip()
    remarks = (data.get('remarks') or f"Dispatched to {assigned_to} ({department})").strip()
    officer = request.current_authority['username']
    now = datetime.now().isoformat()

    if not assigned_to:
        return jsonify({"error": "Assigned crew/officer name is required"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE hazard_reports
    SET status = 'Assigned', assigned_to = ?, assigned_department = ?, authority_remarks = ?, updated_at = ?
    WHERE report_id = ?
    """, (assigned_to, department, remarks, now, report_id))

    cursor.execute("""
    INSERT INTO service_audit_log (entity_type, entity_id, action, details, performed_by, timestamp)
    VALUES ('hazard_report', ?, 'ASSIGNED', ?, ?, ?)
    """, (report_id, f"Assigned to {assigned_to} ({department})", officer, now))

    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": f"Report '{report_id}' assigned to {assigned_to}."})

@authority_bp.route('/reports/<report_id>/status', methods=['POST'])
@require_authority
def update_report_status(report_id):
    """Update status (e.g. In Progress, Resolved) with remarks and optional resolution photo."""
    # Check if multipart form data was submitted (for resolution photo)
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        uploaded_file = request.files.get('resolution_photo')
    else:
        data = request.get_json() or {}
        uploaded_file = None

    status = (data.get('status') or '').strip()
    remarks = (data.get('remarks') or '').strip()
    officer = request.current_authority['username']
    now = datetime.now().isoformat()

    if not status:
        return jsonify({"error": "Status is required"}), 400

    resolution_photo_filename = None
    if uploaded_file and uploaded_file.filename != '':
        if not allowed_file(uploaded_file.filename):
            return jsonify({"error": "Invalid photo format."}), 400
        uploaded_file.seek(0, os.SEEK_END)
        size = uploaded_file.tell()
        uploaded_file.seek(0)
        if size > MAX_FILE_SIZE or not validate_image_header(uploaded_file):
            return jsonify({"error": "Invalid resolution photo file."}), 400

        ext = uploaded_file.filename.rsplit('.', 1)[1].lower()
        resolution_photo_filename = f"resolved_{uuid.uuid4().hex}.{ext}"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        uploaded_file.save(os.path.join(UPLOAD_DIR, resolution_photo_filename))

    conn = get_connection()
    cursor = conn.cursor()

    if resolution_photo_filename:
        cursor.execute("""
        UPDATE hazard_reports
        SET status = ?, authority_remarks = ?, resolution_photo_filename = ?, updated_at = ?
        WHERE report_id = ?
        """, (status, remarks, resolution_photo_filename, now, report_id))
    else:
        cursor.execute("""
        UPDATE hazard_reports
        SET status = ?, authority_remarks = ?, updated_at = ?
        WHERE report_id = ?
        """, (status, remarks, now, report_id))

    cursor.execute("""
    INSERT INTO service_audit_log (entity_type, entity_id, action, details, performed_by, timestamp)
    VALUES ('hazard_report', ?, ?, ?, ?, ?)
    """, (report_id, f"Status updated to '{status}'. Remarks: {remarks}", officer, now))

    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": f"Report '{report_id}' status updated to {status}."})

@authority_bp.route('/reports/<report_id>/reject', methods=['POST'])
@require_authority
def reject_report(report_id):
    """Reject an invalid or duplicate report with required rejection reason."""
    data = request.get_json() or {}
    reason = (data.get('rejection_reason') or '').strip()
    officer = request.current_authority['username']
    now = datetime.now().isoformat()

    if not reason:
        return jsonify({"error": "A clear rejection reason is mandatory to reject a citizen report."}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE hazard_reports
    SET status = 'Rejected', rejection_reason = ?, authority_remarks = ?, updated_at = ?
    WHERE report_id = ?
    """, (reason, f"Rejected: {reason}", now, report_id))

    cursor.execute("""
    INSERT INTO service_audit_log (entity_type, entity_id, action, details, performed_by, timestamp)
    VALUES ('hazard_report', ?, 'REJECTED', ?, ?, ?)
    """, (report_id, f"Report rejected. Reason: {reason}", officer, now))

    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": f"Report '{report_id}' marked as Rejected."})

@authority_bp.route('/reports/<report_id>/override-severity', methods=['POST'])
@require_authority
def override_severity(report_id):
    """Authority review and override of priority severity."""
    data = request.get_json() or {}
    new_severity = (data.get('severity') or '').strip().capitalize()
    justification = (data.get('justification') or 'Assessed by Field Inspector').strip()
    officer = request.current_authority['username']
    now = datetime.now().isoformat()

    if new_severity not in ('Low', 'Medium', 'High', 'Critical'):
        return jsonify({"error": "Severity must be Low, Medium, High, or Critical"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE hazard_reports
    SET severity = ?, authority_remarks = ?, updated_at = ?
    WHERE report_id = ?
    """, (new_severity, f"Severity overridden to {new_severity}. Note: {justification}", now, report_id))

    cursor.execute("""
    INSERT INTO service_audit_log (entity_type, entity_id, action, details, performed_by, timestamp)
    VALUES ('hazard_report', ?, 'SEVERITY_OVERRIDE', ?, ?, ?)
    """, (report_id, f"Severity set to {new_severity}. Reason: {justification}", officer, now))

    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": f"Severity updated to {new_severity}."})

@authority_bp.route('/audit-log', methods=['GET'])
@require_authority
def get_audit_log():
    """Retrieve system actions audit log."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM service_audit_log ORDER BY id DESC LIMIT 50")
    logs = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"count": len(logs), "logs": logs})
