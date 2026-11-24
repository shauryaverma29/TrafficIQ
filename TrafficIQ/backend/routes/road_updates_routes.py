import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from database.db_manager import get_connection
from services.auth_service import require_authority

road_updates_bp = Blueprint('road_updates', __name__)

@road_updates_bp.route('/', methods=['GET'])
def get_road_updates():
    """
    Retrieve official road construction, closure, and diversion updates.
    Only shows alternative routes when verified route information is available.
    """
    status_filter = request.args.get('status', 'All') # All, Active, Scheduled, Completed
    search = request.args.get('search', '').strip()
    update_type = request.args.get('type', 'All')

    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM road_updates WHERE 1=1"
    params = []

    if status_filter != 'All':
        query += " AND status = ?"
        params.append(status_filter)
    if update_type != 'All':
        query += " AND update_type = ?"
        params.append(update_type)
    if search:
        query += " AND (road_name LIKE ? OR title LIKE ? OR reason LIKE ? OR affected_segments LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term])

    query += " ORDER BY CASE status WHEN 'Active' THEN 1 WHEN 'Scheduled' THEN 2 ELSE 3 END, id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()

    updates = []
    for r in rows:
        d = dict(r)
        if d.get('photo_filename'):
            d['photo_url'] = f"/api/hazards/image/{d['photo_filename']}"
        updates.append(d)

    conn.close()
    return jsonify({
        "count": len(updates),
        "updates": updates
    })

@road_updates_bp.route('/<update_id>', methods=['GET'])
def get_single_update(update_id):
    """Retrieve details for a specific road update."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM road_updates WHERE update_id = ?", (update_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": f"Road update '{update_id}' not found."}), 404

    d = dict(row)
    if d.get('photo_filename'):
        d['photo_url'] = f"/api/hazards/image/{d['photo_filename']}"
    return jsonify(d)

@road_updates_bp.route('/publish', methods=['POST'])
@require_authority
def publish_road_update():
    """Authority endpoint to publish an official road construction or diversion advisory."""
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    road_name = (data.get('road_name') or '').strip()
    affected_segments = (data.get('affected_segments') or '').strip()
    update_type = (data.get('update_type') or 'Road Construction Work').strip()
    reason = (data.get('reason') or '').strip()
    status = (data.get('status') or 'Active').strip()
    start_date = (data.get('start_date') or datetime.now().strftime('%Y-%m-%d')).strip()
    expected_end_date = data.get('expected_end_date')
    official_instructions = (data.get('official_instructions') or '').strip()
    diversion_route = data.get('diversion_route')
    has_alternative = 1 if diversion_route and str(diversion_route).strip() else 0
    lat = data.get('latitude')
    lng = data.get('longitude')
    published_by = data.get('published_by', 'Municipal Traffic Control')

    if not title or not road_name or not reason or not official_instructions:
        return jsonify({"error": "Title, Road Name, Reason, and Official Instructions are required."}), 400

    update_id = f"RUD-2026-{uuid.uuid4().int % 900 + 100}"
    now = datetime.now().isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO road_updates (
        update_id, title, road_name, affected_segments, update_type,
        reason, status, start_date, expected_end_date, official_instructions,
        diversion_route, has_alternative_route, latitude, longitude,
        published_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        update_id, title, road_name, affected_segments, update_type,
        reason, status, start_date, expected_end_date, official_instructions,
        diversion_route if has_alternative else None, has_alternative,
        lat, lng, published_by, now, now
    ))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Road advisory '{title}' published successfully.",
        "update_id": update_id
    }), 201

@road_updates_bp.route('/update/<update_id>', methods=['PUT'])
@require_authority
def edit_road_update(update_id):
    """Authority endpoint to update dates, instructions, or status."""
    data = request.get_json() or {}
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM road_updates WHERE update_id = ?", (update_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": f"Update '{update_id}' not found."}), 404

    now = datetime.now().isoformat()
    fields = ['title', 'road_name', 'affected_segments', 'update_type', 'reason',
              'status', 'start_date', 'expected_end_date', 'official_instructions',
              'diversion_route', 'latitude', 'longitude']
    
    updates = []
    values = []
    for f in fields:
        if f in data:
            updates.append(f"{f} = ?")
            values.append(data[f])
            if f == 'diversion_route':
                updates.append("has_alternative_route = ?")
                values.append(1 if data[f] and str(data[f]).strip() else 0)

    if not updates:
        conn.close()
        return jsonify({"message": "No fields to update."})

    updates.append("updated_at = ?")
    values.append(now)
    values.append(update_id)

    cursor.execute(f"UPDATE road_updates SET {', '.join(updates)} WHERE update_id = ?", values)
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": f"Update '{update_id}' revised successfully."})
