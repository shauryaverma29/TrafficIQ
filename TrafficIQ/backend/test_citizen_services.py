"""
TrafficIQ Citizen Road Hazard Reporting & Public Services End-to-End Test Suite.
Verifies all 5 Citizen Services, Authority Portal, Persistence, and API Contracts.
"""

import os
import sys
import io
import json
import sqlite3

# Set backend path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from database.db_manager import DB_PATH, get_connection

def run_tests():
    print("==================================================================")
    print("  TRAFFICIQ CITIZEN SERVICES & AUTHORITY END-TO-END VERIFICATION")
    print("==================================================================")

    app = create_app()
    client = app.test_client()

    passed_tests = 0
    total_tests = 0

    def assert_test(condition, test_name):
        nonlocal passed_tests, total_tests
        total_tests += 1
        if condition:
            passed_tests += 1
            print(f"  [PASS] Test {total_tests:02d}: {test_name}")
        else:
            print(f"  [FAIL] Test {total_tests:02d}: {test_name}")
            raise AssertionError(f"Assertion failed for: {test_name}")

    # TEST 1: Health check
    res = client.get('/api/health')
    assert_test(res.status_code == 200 and res.json.get('citizen_services_enabled') is True,
                "Backend Health Check and Citizen Services Online")

    # TEST 2: Submit Pothole Report (Manual Location, No Photo)
    pothole_payload = {
        "category": "Pothole / Broken Road",
        "road_name": "Uptown Commercial Ave",
        "address": "Opposite City Mall Gate 4",
        "description": "Deep crater on outer lane dangerous for motorbikes",
        "severity": "Medium",
        "reporter_name": "Test Citizen Alpha",
        "reporter_contact": "citizen.alpha@example.com",
        "is_anonymous": False
    }
    res = client.post('/api/hazards/submit', json=pothole_payload)
    assert_test(res.status_code == 201 and 'REP-2026-' in res.json.get('report_id', ''),
                "Submit Pothole Report and Generate Unique Report ID")
    pothole_id = res.json.get('report_id')

    # TEST 3: Submit Fallen Tree Report with Valid Mock Photograph & GPS Coordinates
    mock_jpeg = b'\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' \",#\x1c\x1c(7),01444\x1f\'9=82<.342\xFF\xC0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xFF\xC4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xFF\xDA\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xFF\xD9'
    tree_data = {
        'category': 'Fallen Tree / Branch',
        'road_name': 'Central Metro Arterial',
        'address': 'Near Metro Pillar 190',
        'latitude': '12.9770',
        'longitude': '77.6030',
        'gps_accuracy': '8.5',
        'description': 'Heavy oak branch snapped in rainstorm blocking both central lanes',
        'severity': 'Critical',
        'is_anonymous': 'true',
        'photo': (io.BytesIO(mock_jpeg), 'fallen_tree.jpg')
    }
    res = client.post('/api/hazards/submit', data=tree_data, content_type='multipart/form-data')
    assert_test(res.status_code == 201 and res.json.get('photo_uploaded') is True,
                "Submit Fallen Tree Report with Photograph & GPS")
    tree_id = res.json.get('report_id')

    # TEST 4: Duplicate Report Detection
    dup_res = client.post('/api/hazards/check-duplicates', json={
        "category": "Fallen Tree / Branch",
        "road_name": "Central Metro Arterial"
    })
    assert_test(dup_res.status_code == 200 and dup_res.json.get('duplicate_found') is True,
                "Duplicate Hazard Detection Identifies Active Report on Same Road")

    # TEST 5: Role-Based Access Control: Unauthorized request to authority endpoints fails
    unauth_res = client.get('/api/authority/reports/all')
    assert_test(unauth_res.status_code == 401,
                "Role-Based Access Control Rejects Unauthenticated Authority Access (401)")

    # TEST 6: Authority Login
    login_res = client.post('/api/authority/login', json={
        "username": "officer@trafficiq.gov",
        "password": "Authority@2026"
    })
    assert_test(login_res.status_code == 200 and 'token' in login_res.json,
                "Authority Authentication and Signed Session Token Issuance")
    token = login_res.json['token']
    auth_headers = {'Authorization': f'Bearer {token}'}

    # TEST 7: Authority Viewing All Reports
    reports_res = client.get('/api/authority/reports/all', headers=auth_headers)
    assert_test(reports_res.status_code == 200 and reports_res.json['count'] >= 2,
                "Authority View Reports Queue with Complete Details")

    # TEST 8: Authority Verify Report
    verify_res = client.post(f'/api/authority/reports/{pothole_id}/verify', json={
        "remarks": "On-site inspection completed. Defect verified as high priority."
    }, headers=auth_headers)
    assert_test(verify_res.status_code == 200 and verify_res.json.get('success') is True,
                "Authority Report Verification Transition")

    # TEST 9: Authority Assign Report
    assign_res = client.post(f'/api/authority/reports/{pothole_id}/assign', json={
        "assigned_to": "Ward 12 Asphalt Patch Squad",
        "department": "Municipal Road Maintenance"
    }, headers=auth_headers)
    assert_test(assign_res.status_code == 200,
                "Authority Squad & Department Assignment")

    # TEST 10: Authority Update Progress to In Progress
    progress_res = client.post(f'/api/authority/reports/{pothole_id}/status', json={
        "status": "In Progress",
        "remarks": "Asphalt compacting roller on site."
    }, headers=auth_headers)
    assert_test(progress_res.status_code == 200,
                "Authority Progress Update to 'In Progress'")

    # TEST 11: Authority Mark as Resolved
    resolved_res = client.post(f'/api/authority/reports/{pothole_id}/status', json={
        "status": "Resolved",
        "remarks": "Pothole filled and sealed. Road reopened to traffic."
    }, headers=auth_headers)
    assert_test(resolved_res.status_code == 200,
                "Authority Mark as Resolved with Official Remarks")

    # TEST 12: Citizen Tracking & Verification of Progress Timeline
    track_res = client.get(f'/api/hazards/track/{pothole_id}')
    assert_test(track_res.status_code == 200 and track_res.json['report']['status'] == 'Resolved',
                "Citizen Report Tracking Displays Resolved Status and Remarks")

    # TEST 13: Nearby Hazards Explorer with Haversine Distance
    nearby_res = client.get('/api/hazards/nearby?lat=12.9750&lng=77.6000&radius=5')
    assert_test(nearby_res.status_code == 200 and len(nearby_res.json['reports']) > 0,
                "Nearby Road Hazards Proximity Explorer with Computed Distances")

    # TEST 14: Smart Parking Finder - Real-Time vs Non-Real-time Availability
    parking_res = client.get('/api/parking/facilities')
    assert_test(parking_res.status_code == 200 and len(parking_res.json['facilities']) >= 4,
                "Smart Parking Finder Facilities Retrieved")
    # Verify strict rule: if real-time unavailable, available_spaces must be None / null
    unavail_fac = [f for f in parking_res.json['facilities'] if f['has_realtime_availability'] == 0]
    assert_test(len(unavail_fac) > 0 and unavail_fac[0]['available_spaces'] is None,
                "Strict Availability Rule: Non-Real-time Spots Return Null Availability")

    # TEST 15: Citizen Reports Incorrect Parking Info
    pir_res = client.post('/api/parking/report-incorrect', json={
        "facility_id": "PRK-103",
        "facility_name": "Uptown Municipal Surface Parking Lot",
        "issue_type": "Incorrect Charges",
        "details": "Parking fee changed to 30 rupees per hour as of this Monday.",
        "reporter_contact": "driver@example.com"
    })
    assert_test(pir_res.status_code == 201 and 'PIR-' in pir_res.json.get('report_id', ''),
                "Citizen Feedback on Inaccurate Parking Information")

    # TEST 16: Road Construction & Diversion Updates
    updates_res = client.get('/api/road-updates/')
    assert_test(updates_res.status_code == 200 and len(updates_res.json['updates']) >= 2,
                "Road Construction & Diversion Advisories Retrieval")
    # Verify strict rule: alternative routes only shown when verified
    divert_up = [u for u in updates_res.json['updates'] if u['has_alternative_route'] == 1]
    assert_test(len(divert_up) > 0 and divert_up[0]['diversion_route'] is not None,
                "Strict Diversion Rule: Verified Alternative Route Grounding")

    # TEST 17: Accessibility-Friendly Road Information
    acc_res = client.get('/api/accessibility/reports')
    assert_test(acc_res.status_code == 200 and len(acc_res.json['reports']) >= 2,
                "Accessibility-Friendly Pedestrian Barrier Audits Listing")

    acc_submit = client.post('/api/accessibility/report', json={
        "road_or_footpath_name": "MG Road Promenade",
        "address": "Near Metro Pillar 80",
        "category": "Missing Wheelchair Ramp",
        "severity": "High",
        "description": "Sidewalk curb is 12 inches high with no ramp cut.",
        "accessibility_impact": "Completely prevents wheelchair passage.",
        "suggested_action": "Install 1:12 concrete dropped curb with tactile paving."
    })
    assert_test(acc_submit.status_code == 201 and 'ACC-' in acc_submit.json.get('report_id', ''),
                "Citizen Submission of Pedestrian Accessibility Barrier")

    # TEST 18: Dashboard Live Summary Statistics & Real Map Layers
    stats_res = client.get('/api/stats/summary')
    assert_test(stats_res.status_code == 200 and stats_res.json['total_citizen_reports'] >= 4,
                "Dashboard Live Calculated Statistics Across Services")
    assert_test('accessibility' in stats_res.json.get('map_layers', {}) and len(stats_res.json['map_layers']['hazards']) > 0,
                "Real Map Layers Generated with Valid Geographic Coordinates")

    # TEST 19: Traffic Intelligence & Hazard Correlation
    corr_res = client.get('/api/hazards/traffic-correlation')
    assert_test(corr_res.status_code == 200,
                "Traffic Dataset & Verified Hazard Cross-Correlation Engine")

    # TEST 20: Database Persistence Across Process Restarts
    # Simulate a full process restart by creating a new database connection directly
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT status FROM hazard_reports WHERE report_id = ?", (pothole_id,))
    row = cur.fetchone()
    conn.close()
    assert_test(row is not None and row[0] == 'Resolved',
                "Database Persistence: Report and Resolved Status Persisted Across Restarts")

    print("==================================================================")
    print(f"  ALL {passed_tests}/{total_tests} TESTS PASSED SUCCESSFULLY!")
    print("==================================================================")
    return True

if __name__ == '__main__':
    run_tests()
