from flask import Blueprint, jsonify
from database.db_manager import get_connection

stats_bp = Blueprint('stats', __name__)

@stats_bp.route('/summary', methods=['GET'])
def get_dashboard_summary():
    """
    Live summary counters calculated directly from actual database records.
    Powers the citizen-focused Dashboard cards and interactive city map.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Total Citizen Hazard Reports
    cursor.execute("SELECT COUNT(*) FROM hazard_reports")
    total_citizen_reports = cursor.fetchone()[0]

    # 2. Unresolved Road Hazards (Active pipeline)
    cursor.execute("""
    SELECT COUNT(*) FROM hazard_reports
    WHERE status IN ('Submitted', 'Pending Verification', 'Verified', 'Assigned', 'In Progress')
    """)
    unresolved_road_hazards = cursor.fetchone()[0]

    # 3. Active Road Closures & Diversions
    cursor.execute("SELECT COUNT(*) FROM road_updates WHERE status = 'Active'")
    active_road_closures = cursor.fetchone()[0]

    # 4. Accessibility Barriers Reported
    cursor.execute("SELECT COUNT(*) FROM accessibility_reports")
    accessibility_issues = cursor.fetchone()[0]

    # 5. Registered Parking Facilities
    cursor.execute("SELECT COUNT(*) FROM parking_facilities")
    registered_parking_facilities = cursor.fetchone()[0]

    # Status breakdown
    cursor.execute("SELECT status, COUNT(*) FROM hazard_reports GROUP BY status")
    status_counts = dict(cursor.fetchall())

    # Critical reports requiring immediate review
    cursor.execute("""
    SELECT COUNT(*) FROM hazard_reports
    WHERE severity = 'Critical' AND status NOT IN ('Resolved', 'Rejected')
    """)
    critical_unresolved = cursor.fetchone()[0]

    # Category breakdown
    cursor.execute("SELECT category, COUNT(*) FROM hazard_reports GROUP BY category")
    category_counts = dict(cursor.fetchall())

    # Fetch all geo-located points for interactive map display (only where coordinates exist!)
    cursor.execute("""
    SELECT id, report_id, category, road_name, address, latitude, longitude,
           severity, status, photo_filename, is_verified, created_at
    FROM hazard_reports
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    ORDER BY id DESC
    """)
    hazard_map_points = []
    for r in cursor.fetchall():
        d = dict(r)
        if d.get('photo_filename'):
            d['photo_url'] = f"/api/hazards/image/{d['photo_filename']}"
        hazard_map_points.append(d)

    # Road closures on map
    cursor.execute("""
    SELECT id, update_id, title, road_name, update_type, status, latitude, longitude, diversion_route
    FROM road_updates
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    """)
    closure_map_points = [dict(r) for r in cursor.fetchall()]

    # Parking spots on map
    cursor.execute("""
    SELECT id, facility_id, name, area, parking_type, total_capacity, available_spaces,
           has_realtime_availability, charges_info, is_free, latitude, longitude
    FROM parking_facilities
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    """)
    parking_map_points = []
    for r in cursor.fetchall():
        d = dict(r)
        if not d.get('has_realtime_availability'):
            d['available_spaces'] = None
        parking_map_points.append(d)

    # Accessibility barriers on map
    cursor.execute("""
    SELECT id, report_id, road_or_footpath_name, address, category, severity,
           status, description, accessibility_impact, suggested_action, latitude, longitude
    FROM accessibility_reports
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    """)
    accessibility_map_points = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return jsonify({
        "total_citizen_reports": total_citizen_reports,
        "unresolved_road_hazards": unresolved_road_hazards,
        "active_road_closures": active_road_closures,
        "accessibility_issues": accessibility_issues,
        "registered_parking_facilities": registered_parking_facilities,
        "critical_unresolved": critical_unresolved,
        "status_breakdown": {
            "submitted": status_counts.get('Submitted', 0),
            "pending_verification": status_counts.get('Pending Verification', 0),
            "verified": status_counts.get('Verified', 0),
            "assigned": status_counts.get('Assigned', 0),
            "in_progress": status_counts.get('In Progress', 0),
            "resolved": status_counts.get('Resolved', 0),
            "rejected": status_counts.get('Rejected', 0),
        },
        "category_breakdown": category_counts,
        "map_layers": {
            "hazards": hazard_map_points,
            "closures": closure_map_points,
            "parking": parking_map_points,
            "accessibility": accessibility_map_points
        }
    })
