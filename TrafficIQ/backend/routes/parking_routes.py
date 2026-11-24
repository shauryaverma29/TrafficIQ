import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from database.db_manager import get_connection
from services.auth_service import require_authority

parking_bp = Blueprint('parking', __name__)

@parking_bp.route('/facilities', methods=['GET'])
def get_parking_facilities():
    """
    Search and filter smart parking locations.
    Shows real-time available spaces ONLY when verified data exists;
    otherwise available_spaces is null so frontend displays 'Availability not currently available'.
    """
    search = request.args.get('search', '').strip()
    area = request.args.get('area', '').strip()
    parking_type = request.args.get('type', 'All')
    free_only = request.args.get('free_only', 'false').lower() == 'true'
    ev_only = request.args.get('ev_only', 'false').lower() == 'true'
    accessible_only = request.args.get('accessible_only', 'false').lower() == 'true'

    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM parking_facilities WHERE 1=1"
    params = []

    if search:
        query += " AND (name LIKE ? OR address LIKE ? OR area LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])
    if area and area != 'All':
        query += " AND area = ?"
        params.append(area)
    if parking_type and parking_type != 'All':
        query += " AND parking_type = ?"
        params.append(parking_type)
    if free_only:
        query += " AND is_free = 1"
    if ev_only:
        query += " AND ev_charging = 1"
    if accessible_only:
        query += " AND accessible_spots > 0"

    query += " ORDER BY name ASC"
    cursor.execute(query, params)
    rows = cursor.fetchall()

    facilities = []
    for r in rows:
        d = dict(r)
        # Ensure available_spaces is strictly None if has_realtime_availability is 0
        if not d.get('has_realtime_availability'):
            d['available_spaces'] = None
            d['availability_status_text'] = "Availability unknown"
        else:
            d['availability_status_text'] = f"{d['available_spaces']} of {d['total_capacity']} spaces open"

        facilities.append(d)

    # Distinct areas for filter dropdown
    cursor.execute("SELECT DISTINCT area FROM parking_facilities ORDER BY area ASC")
    areas = [r[0] for r in cursor.fetchall() if r[0]]

    conn.close()
    return jsonify({
        "count": len(facilities),
        "areas": areas,
        "facilities": facilities
    })

@parking_bp.route('/report-incorrect', methods=['POST'])
def report_incorrect_parking():
    """Citizens report inaccurate parking rates, capacity, or closed facility."""
    data = request.get_json() or {}
    facility_id = data.get('facility_id', '').strip()
    facility_name = data.get('facility_name', '').strip()
    issue_type = data.get('issue_type', 'Incorrect Charges').strip()
    details = data.get('details', '').strip()
    contact = data.get('reporter_contact', '').strip()

    if not facility_id or not details:
        return jsonify({"error": "Facility ID and issue details are required"}), 400

    report_id = f"PIR-2026-{uuid.uuid4().int % 90000 + 10000}"
    now = datetime.now().isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO parking_issue_reports (
        report_id, facility_id, facility_name, issue_type, details, reporter_contact, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'Pending Review', ?)
    """, (report_id, facility_id, facility_name, issue_type, details, contact, now))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Thank you. Your feedback on parking information has been submitted for municipal review.",
        "report_id": report_id
    }), 201

@parking_bp.route('/manage/add', methods=['POST'])
@require_authority
def add_parking_facility():
    """Authority endpoint to add a new parking facility."""
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    area = (data.get('area') or '').strip()
    address = (data.get('address') or '').strip()
    parking_type = (data.get('parking_type') or 'Surface Lot').strip()
    total_capacity = data.get('total_capacity')
    has_realtime = 1 if data.get('has_realtime_availability') else 0
    available_spaces = data.get('available_spaces') if has_realtime else None
    charges_info = (data.get('charges_info') or 'Standard Parking Rates Apply').strip()
    is_free = 1 if data.get('is_free') else 0
    lat = data.get('latitude')
    lng = data.get('longitude')
    operating_hours = (data.get('operating_hours') or '24/7').strip()
    ev_charging = 1 if data.get('ev_charging') else 0
    accessible_spots = int(data.get('accessible_spots') or 0)

    if not name or not address or not area:
        return jsonify({"error": "Name, Area, and Address are required."}), 400

    facility_id = f"PRK-{uuid.uuid4().int % 900 + 100}"
    now = datetime.now().isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO parking_facilities (
        facility_id, name, area, address, parking_type, total_capacity,
        available_spaces, has_realtime_availability, charges_info, is_free,
        latitude, longitude, operating_hours, ev_charging, accessible_spots,
        verified, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    """, (
        facility_id, name, area, address, parking_type, total_capacity,
        available_spaces, has_realtime, charges_info, is_free,
        lat, lng, operating_hours, ev_charging, accessible_spots,
        now, now
    ))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Parking facility '{name}' registered successfully.",
        "facility_id": facility_id
    }), 201

@parking_bp.route('/manage/update/<facility_id>', methods=['PUT'])
@require_authority
def update_parking_facility(facility_id):
    """Authority endpoint to update parking facility details or live occupancy."""
    data = request.get_json() or {}
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM parking_facilities WHERE facility_id = ?", (facility_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": f"Facility '{facility_id}' not found."}), 404

    now = datetime.now().isoformat()
    fields = ['name', 'area', 'address', 'parking_type', 'total_capacity',
              'available_spaces', 'has_realtime_availability', 'charges_info',
              'is_free', 'latitude', 'longitude', 'operating_hours',
              'ev_charging', 'accessible_spots']
    
    updates = []
    values = []
    for f in fields:
        if f in data:
            updates.append(f"{f} = ?")
            values.append(data[f])

    if not updates:
        conn.close()
        return jsonify({"message": "No changes submitted."})

    updates.append("updated_at = ?")
    values.append(now)
    values.append(facility_id)

    cursor.execute(f"UPDATE parking_facilities SET {', '.join(updates)} WHERE facility_id = ?", values)
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": f"Facility '{facility_id}' updated successfully."})

@parking_bp.route('/manage/issues', methods=['GET'])
@require_authority
def get_parking_issues():
    """Authority endpoint to review citizen reports regarding incorrect parking data."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM parking_issue_reports ORDER BY id DESC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"count": len(rows), "reports": rows})
