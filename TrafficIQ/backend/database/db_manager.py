import os
import sqlite3
import hashlib
import json
from datetime import datetime

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
DB_PATH = os.path.join(DB_DIR, "trafficiq_services.db")
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads", "hazards"))

def ensure_directories():
    os.makedirs(DB_DIR, exist_ok=True)
    os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_connection():
    ensure_directories()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

def hash_password(password: str) -> str:
    salt = "trafficiq_authority_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def init_db():
    ensure_directories()
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Citizen Hazard Reports
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hazard_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        road_name TEXT NOT NULL,
        address TEXT,
        latitude REAL,
        longitude REAL,
        gps_accuracy REAL,
        description TEXT NOT NULL,
        severity TEXT NOT NULL,
        suggested_priority TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Submitted',
        photo_filename TEXT,
        resolution_photo_filename TEXT,
        reporter_name TEXT,
        reporter_contact TEXT,
        is_anonymous INTEGER DEFAULT 0,
        assigned_to TEXT,
        assigned_department TEXT,
        authority_remarks TEXT,
        rejection_reason TEXT,
        is_verified INTEGER DEFAULT 0,
        is_accessibility_issue INTEGER DEFAULT 0,
        accessibility_details TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # 2. Parking Facilities
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS parking_facilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        facility_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        area TEXT NOT NULL,
        address TEXT NOT NULL,
        parking_type TEXT NOT NULL,
        total_capacity INTEGER,
        available_spaces INTEGER,
        has_realtime_availability INTEGER DEFAULT 0,
        charges_info TEXT NOT NULL,
        is_free INTEGER DEFAULT 0,
        latitude REAL,
        longitude REAL,
        operating_hours TEXT DEFAULT '24/7',
        ev_charging INTEGER DEFAULT 0,
        accessible_spots INTEGER DEFAULT 0,
        verified INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # 3. Parking Inaccuracy Reports
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS parking_issue_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT UNIQUE NOT NULL,
        facility_id TEXT NOT NULL,
        facility_name TEXT NOT NULL,
        issue_type TEXT NOT NULL,
        details TEXT NOT NULL,
        reporter_contact TEXT,
        status TEXT DEFAULT 'Pending Review',
        created_at TEXT NOT NULL
    )
    """)

    # 4. Road Construction & Diversion Updates
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS road_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        update_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        road_name TEXT NOT NULL,
        affected_segments TEXT NOT NULL,
        update_type TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        start_date TEXT NOT NULL,
        expected_end_date TEXT,
        official_instructions TEXT NOT NULL,
        diversion_route TEXT,
        has_alternative_route INTEGER DEFAULT 0,
        latitude REAL,
        longitude REAL,
        photo_filename TEXT,
        published_by TEXT NOT NULL DEFAULT 'Municipal Traffic Control',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # 5. Accessibility-Friendly Road Reports
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS accessibility_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT UNIQUE NOT NULL,
        road_or_footpath_name TEXT NOT NULL,
        address TEXT,
        latitude REAL,
        longitude REAL,
        category TEXT NOT NULL,
        severity TEXT NOT NULL,
        photo_filename TEXT,
        description TEXT NOT NULL,
        accessibility_impact TEXT NOT NULL,
        suggested_action TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Submitted',
        authority_remarks TEXT,
        is_verified INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # 6. Authority Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS authority_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # 7. Audit Log
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS service_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        performed_by TEXT NOT NULL,
        timestamp TEXT NOT NULL
    )
    """)

    conn.commit()

    # Seed default authority users if none exist
    cursor.execute("SELECT COUNT(*) FROM authority_users")
    if cursor.fetchone()[0] == 0:
        now = datetime.now().isoformat()
        admin_pass = hash_password("Authority@2026")
        cursor.execute("""
        INSERT INTO authority_users (username, password_hash, full_name, role, department, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            "officer@trafficiq.gov",
            admin_pass,
            "Inspector Arvind Kumar",
            "traffic_authority",
            "City Traffic Police & Municipal Road Operations",
            now
        ))
        conn.commit()

    # Seed initial demonstration data if tables are empty
    seed_demo_data(cursor)
    conn.commit()
    conn.close()

def seed_demo_data(cursor):
    """Seed initial realistic smart city demonstration data, clearly labeled."""
    # Check hazard reports
    cursor.execute("SELECT COUNT(*) FROM hazard_reports")
    if cursor.fetchone()[0] == 0:
        now = datetime.now().isoformat()
        initial_hazards = [
            (
                "REP-2026-00101",
                "Pothole / Broken Road",
                "Uptown Commercial Ave",
                "Near City Mall East Gate, Uptown",
                12.9716, 77.5946, 12.0,
                "Deep pothole across the right lane causing two-wheelers to swerve dangerously into ongoing traffic.",
                "High",
                "High: Significant risk to two-wheelers and localized speed reduction on commercial corridor.",
                "Verified",
                None,
                None,
                "Rahul Sharma",
                "rahul.s@example.com",
                0,
                "Ward 14 Road Maintenance Squad",
                "Municipal Road Infrastructure Dept",
                "Verified by Traffic Inspector. Repair team dispatched for asphalt patch work.",
                None,
                1,
                0,
                None,
                now,
                now
            ),
            (
                "REP-2026-00102",
                "Fallen Tree / Branch",
                "Central Metro Arterial",
                "Between Metro Pillar 142 and 144",
                12.9780, 77.6020, 8.0,
                "Large banyan tree branch snapped during morning thunderstorms, blocking the bus rapid transit lane.",
                "Critical",
                "Critical: Immediate arterial roadway obstruction blocking mass transit corridor.",
                "In Progress",
                None,
                None,
                "Citizen Watchdog",
                None,
                1,
                "Emergency Forestry Unit 03",
                "Parks & Horticulture Emergency Division",
                "Chainsaw tree cutter crew on site. Clearance underway.",
                None,
                1,
                0,
                None,
                now,
                now
            ),
            (
                "REP-2026-00103",
                "Traffic Signal Failure",
                "Tech Innovation Blvd",
                "Junction with Silicon Expressway",
                12.9650, 77.6100, 15.0,
                "Traffic light stuck on flashing yellow in all directions. Severe vehicular gridlock during peak hours.",
                "Critical",
                "Critical: High-volume intersection without active automated signal coordination.",
                "Assigned",
                None,
                None,
                "Priya Nair",
                "priya.tech@example.com",
                0,
                "Signal Tech Team Alpha",
                "City Traffic Management Operations",
                "Assigned to electrical signal contractor for relay replacement.",
                None,
                1,
                0,
                None,
                now,
                now
            ),
            (
                "REP-2026-00104",
                "Waterlogging / Flooding",
                "Highway 101 Bay Corridor",
                "Underpass beneath Railway Bridge",
                12.9820, 77.5890, 10.0,
                "Severe water pooling up to 1.5 feet deep after monsoon shower. Small passenger cars unable to cross.",
                "High",
                "High: Submerged roadway creating hydroplaning risk and total underpass stalling.",
                "Pending Verification",
                None,
                None,
                "Sunil Menon",
                "sunil.m@example.com",
                0,
                None,
                "Stormwater Drainage Division",
                "Awaiting municipal engineer site confirmation.",
                None,
                0,
                0,
                None,
                now,
                now
            ),
            (
                "REP-2026-00105",
                "Damaged Footpath",
                "Harbor Industrial Parkway",
                "Opposite Central Cargo Terminal",
                12.9590, 77.6050, 20.0,
                "Footpath paving slabs caved in. Pedestrians forced to walk on the busy heavy-vehicle truck carriageway.",
                "Medium",
                "Medium: Pedestrian safety hazard forcing vulnerable road users into mixed traffic.",
                "Submitted",
                None,
                None,
                "Local Resident",
                None,
                1,
                None,
                None,
                None,
                None,
                0,
                1,
                "Requires concrete slab relay and pedestrian guardrails.",
                now,
                now
            )
        ]
        cursor.executemany("""
        INSERT INTO hazard_reports (
            report_id, category, road_name, address, latitude, longitude, gps_accuracy,
            description, severity, suggested_priority, status, photo_filename,
            resolution_photo_filename, reporter_name, reporter_contact, is_anonymous,
            assigned_to, assigned_department, authority_remarks, rejection_reason,
            is_verified, is_accessibility_issue, accessibility_details, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_hazards)

    # Check parking facilities
    cursor.execute("SELECT COUNT(*) FROM parking_facilities")
    if cursor.fetchone()[0] == 0:
        now = datetime.now().isoformat()
        initial_parking = [
            (
                "PRK-101",
                "Central Metro Multi-Level Smart Parking",
                "Central Business District",
                "MG Road Metro Station Complex, North Wing",
                "Multi-Level Structured",
                450,
                128,  # Verified real-time availability exists!
                1,
                "₹30 for first 2 hours, ₹15/hr thereafter",
                0,
                12.9750, 77.6050,
                "24/7", 1, 12, 1,
                now, now
            ),
            (
                "PRK-102",
                "Tech Park Underground Hub",
                "Electronic City / Tech Corridor",
                "Silicon Expressway Junction, Gate 3",
                "Underground Facility",
                600,
                210,  # Verified real-time availability exists!
                1,
                "₹40 flat daily for employees, ₹20/hr visitors",
                0,
                12.9660, 77.6120,
                "06:00 AM - 11:30 PM", 1, 16, 1,
                now, now
            ),
            (
                "PRK-103",
                "Uptown Municipal Surface Parking Lot",
                "Uptown Commercial District",
                "Opposite Civic Plaza, 4th Cross",
                "Surface Lot",
                120,
                None,  # Real-time unavailable! MUST display 'Availability not currently available'
                0,
                "₹20 per hour",
                0,
                12.9725, 77.5930,
                "08:00 AM - 10:00 PM", 0, 4, 1,
                now, now
            ),
            (
                "PRK-104",
                "Harbor Industrial Truck & Car Bay",
                "Harbor Logistics Zone",
                "Port Ring Road, Gate 7",
                "Surface Lot",
                300,
                None,  # Real-time unavailable!
                0,
                "Free for light passenger vehicles",
                1,
                12.9580, 77.6070,
                "24/7", 0, 8, 1,
                now, now
            ),
            (
                "PRK-105",
                "Civic Center On-Street Smart Meter Bays",
                "Government Administrative Quarter",
                "Legislative Walk & High Court Avenue",
                "On-Street Smart Bay",
                80,
                32,  # Real-time sensor telemetry enabled
                1,
                "₹40 per hour (Max 3 hours stay)",
                0,
                12.9785, 77.5910,
                "08:00 AM - 08:00 PM", 0, 6, 1,
                now, now
            )
        ]
        cursor.executemany("""
        INSERT INTO parking_facilities (
            facility_id, name, area, address, parking_type, total_capacity,
            available_spaces, has_realtime_availability, charges_info, is_free,
            latitude, longitude, operating_hours, ev_charging, accessible_spots,
            verified, created_at, updated_at
        )    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_parking)

    # Check road updates (Construction & Diversions)
    cursor.execute("SELECT COUNT(*) FROM road_updates")
    if cursor.fetchone()[0] == 0:
        now = datetime.now().isoformat()
        initial_updates = [
            (
                "RUD-2026-001",
                "Metro Elevated Viaduct Pier Construction",
                "Central Metro Arterial",
                "Between Silk Board and Metro Interchange (Pillars 180-220)",
                "Road Construction Work",
                "Heavy girder erection and pier cap installation for Line 3 expansion.",
                "Active",
                "2026-11-01",
                "2026-12-15",
                "Left two lanes cordoned off for heavy crane machinery. Heavy transport vehicles diverted during 07:00-11:00 and 17:00-21:00.",
                "Diverted via Outer Ring Road Outer Loop and 100ft Road.",
                1,
                12.9765, 77.6010,
                None,
                "Bangalore Metro Rail & City Traffic Authority",
                now, now
            ),
            (
                "RUD-2026-002",
                "Stormwater Culvert Rehabilitation & Drainage Work",
                "Highway 101 Bay Corridor",
                "Railway Underpass Sector 4",
                "Emergency Maintenance",
                "Replacement of collapsed RCC box culvert to eliminate monsoon waterlogging.",
                "Active",
                "2026-11-15",
                "2026-11-30",
                "Underpass completely closed to non-emergency traffic. Follow illuminated municipal LED diversion arrows.",
                "Alternative Route: Divert via Bayview Flyover Link Road (toll waived for duration of work).",
                1,
                12.9825, 77.5885,
                None,
                "Public Works Department (PWD)",
                now, now
            ),
            (
                "RUD-2026-003",
                "Asphalt Resurfacing & White-Topping",
                "Tech Innovation Blvd",
                "From Tech Park Gate 1 to Innovation Roundabout",
                "Maintenance Work",
                "High-durability white-topping to withstand heavy bus traffic.",
                "Scheduled",
                "2026-12-01",
                "2026-12-20",
                "Single lane alternating traffic controlled by automated flaggers and smart signal cycles.",
                None,  # No alternative route needed, single lane flow maintained
                0,
                12.9645, 77.6115,
                None,
                "Smart City Urban Infrastructure Corp",
                now, now
            )
        ]
        cursor.executemany("""
        INSERT INTO road_updates (
            update_id, title, road_name, affected_segments, update_type,
            reason, status, start_date, expected_end_date, official_instructions,
            diversion_route, has_alternative_route, latitude, longitude,
            photo_filename, published_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_updates)

    # Check accessibility reports
    cursor.execute("SELECT COUNT(*) FROM accessibility_reports")
    if cursor.fetchone()[0] == 0:
        now = datetime.now().isoformat()
        initial_acc = [
            (
                "ACC-2026-001",
                "Uptown Commercial Ave",
                "Opposite Metro Gate 2, Pedestrian Plaza",
                12.9720, 77.5950,
                "Missing Wheelchair Ramp",
                "High",
                None,
                "High curb (10 inches) with no ramp or dropped kerb. Wheelchair users and parents with strollers cannot access the sidewalk from the crossing.",
                "Prevents independent mobility for manual and electric wheelchair users.",
                "Install standard 1:12 slope concrete dropped curb with yellow tactile warning pavers.",
                "Verified",
                "Approved for Municipal Barrier-Free Access Grant. Work scheduled for next week.",
                1,
                now, now
            ),
            (
                "ACC-2026-002",
                "Central Metro Arterial",
                "Sidewalk adjoining General Hospital Entry",
                12.9775, 77.6030,
                "Obstacle on Walking Path",
                "Critical",
                None,
                "Electricity utility junction box installed directly in the center of the narrow 1.2m sidewalk, completely blocking wheelchairs and blind pedestrians.",
                "Complete physical barrier forcing pedestrians with assistive devices into fast highway traffic.",
                "Relocate electrical junction cabinet to boundary offset wall; restore tactile guiding path.",
                "In Progress",
                "Coordination notice served to Electricity Supply Board; contractor onsite.",
                1,
                now, now
            ),
            (
                "ACC-2026-003",
                "Tech Innovation Blvd",
                "Pedestrian Crosswalk at Cyber Square",
                12.9655, 77.6095,
                "Broken Pedestrian Crossing",
                "Medium",
                None,
                "Acoustic pedestrian chirp signal for visually impaired citizens has stopped working. Crossing countdown timer broken.",
                "Visually impaired pedestrians unable to safely know when pedestrian phase is active.",
                "Replace acoustic push-button controller and LED pedestrian head.",
                "Submitted",
                None,
                0,
                now, now
            )
        ]
        cursor.executemany("""
        INSERT INTO accessibility_reports (
            report_id, road_or_footpath_name, address, latitude, longitude,
            category, severity, photo_filename, description, accessibility_impact,
            suggested_action, status, authority_remarks, is_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_acc)

# Priority suggestion engine
def calculate_suggested_priority(category: str, road_name: str, description: str, severity: str) -> dict:
    """
    Explainable priority classification matching requirement E.
    Categorizes based on immediate hazard, road importance, and safety implications.
    """
    category_lower = (category or "").lower()
    road_lower = (road_name or "").lower()
    desc_lower = (description or "").lower()
    sev_lower = (severity or "").lower()

    is_arterial_or_highway = any(term in road_lower for term in ['highway', 'arterial', 'expressway', 'corridor', 'bypass', 'ring road'])
    is_obstruction = any(term in category_lower for term in ['fallen tree', 'blockage', 'debris'])
    is_wire_or_danger = 'wire' in category_lower or 'electr' in desc_lower
    is_signal = 'signal' in category_lower or 'traffic light' in desc_lower

    if is_wire_or_danger:
        return {
            "suggested": "Critical",
            "reason": "Exposed electrical or infrastructure risk poses immediate life-safety hazard to all citizens."
        }
    if is_obstruction and (is_arterial_or_highway or 'complete' in desc_lower or 'both lanes' in desc_lower):
        return {
            "suggested": "Critical",
            "reason": f"Physical obstruction blocking movement on a major high-speed/arterial route ({road_name})."
        }
    if is_signal and is_arterial_or_highway:
        return {
            "suggested": "Critical",
            "reason": "Traffic signal failure at a busy arterial intersection introduces extreme collision danger."
        }
    if is_obstruction or 'large' in desc_lower or sev_lower == 'critical':
        return {
            "suggested": "High",
            "reason": "Significant road hazard or blockage requiring rapid municipal response."
        }
    if 'waterlog' in category_lower or 'flooding' in category_lower:
        return {
            "suggested": "High" if 'deep' in desc_lower or is_arterial_or_highway else "Medium",
            "reason": "Water pooling impairs vehicle braking and causes hydroplaning."
        }
    if 'pothole' in category_lower or 'broken road' in category_lower:
        return {
            "suggested": "High" if (is_arterial_or_highway or 'deep' in desc_lower or 'large' in desc_lower) else "Medium",
            "reason": "Pavement failure causing structural vehicle damage and skidding risk for two-wheelers."
        }
    if 'footpath' in category_lower or 'infrastructure' in category_lower:
        return {
            "suggested": "Medium" if 'cave' in desc_lower or 'blocking' in desc_lower else "Low",
            "reason": "Pedestrian pathway or street asset damage requiring scheduled civil works."
        }
    return {
        "suggested": severity.capitalize() if severity in ['Low', 'Medium', 'High', 'Critical'] else "Medium",
        "reason": "Standard hazard report assessment pending field verification."
    }

def find_potential_duplicates(category: str, road_name: str, latitude: float = None, longitude: float = None) -> list:
    """
    Check whether an existing report describes a similar issue at approximately the same location.
    Requirement F: Check existing reports on same road or within ~300m with active status.
    """
    conn = get_connection()
    cursor = conn.cursor()

    active_statuses = ('Submitted', 'Pending Verification', 'Verified', 'Assigned', 'In Progress')
    placeholders = ','.join(['?'] * len(active_statuses))

    road_clean = (road_name or "").strip()
    query = f"""
    SELECT report_id, category, road_name, address, severity, status, created_at, latitude, longitude
    FROM hazard_reports
    WHERE status IN ({placeholders})
    AND (
        LOWER(road_name) = LOWER(?)
        OR LOWER(road_name) LIKE LOWER(?)
    )
    ORDER BY id DESC LIMIT 5
    """
    params = list(active_statuses) + [road_clean, f"%{road_clean}%"]
    cursor.execute(query, params)
    rows = cursor.fetchall()

    duplicates = []
    for r in rows:
        dup = dict(r)
        # Compute distance if coordinates are present
        if latitude is not None and longitude is not None and dup['latitude'] is not None and dup['longitude'] is not None:
            import math
            lat1, lon1 = math.radians(latitude), math.radians(longitude)
            lat2, lon2 = math.radians(dup['latitude']), math.radians(dup['longitude'])
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            dist_km = 6371.0 * c
            dup['distance_meters'] = round(dist_km * 1000, 1)
        duplicates.append(dup)

    conn.close()
    return duplicates
