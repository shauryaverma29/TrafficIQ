import io
import json
from app import create_app

app = create_app()
client = app.test_client()

print("=== 1. Health & Auto-load Test ===")
res = client.get('/api/health')
assert res.status_code == 200, f"Health failed: {res.status_code}"
data = res.get_json()
assert data['has_dataset'] == True
print("Health OK:", data['service'])

print("=== 2. Dataset Overview & Preview ===")
res = client.get('/api/dataset/overview')
assert res.status_code == 200
ov = res.get_json()
assert ov['profile']['total_rows'] > 1000
print(f"Rows: {ov['profile']['total_rows']}, Cols: {ov['profile']['total_columns']}")

res_prev = client.get('/api/dataset/preview?limit=5')
assert res_prev.status_code == 200
print("Preview count:", len(res_prev.get_json()['records']))

print("=== 3. Exploration: Correlations, Outliers, Distributions ===")
res_corr = client.get('/api/dataset/correlations')
assert res_corr.status_code == 200
print("Correlations computed for features:", len(res_corr.get_json()['features']))

res_out = client.get('/api/dataset/outliers')
assert res_out.status_code == 200
print("Outliers detected:", res_out.get_json()['total_rows_with_outliers'])

res_dist = client.get('/api/dataset/distributions')
assert res_dist.status_code == 200
print("Distributions calculated:", list(res_dist.get_json()['distributions'].keys())[:3])

print("=== 4. Preprocessing Test ===")
prep_payload = {
    'selected_features': ['traffic_volume', 'average_speed_kmh', 'congestion_index', 'occupancy_percent', 'incident_flag', 'road_type', 'weather_condition'],
    'numeric_imputation': 'median',
    'categorical_imputation': 'mode',
    'handle_duplicates': True,
    'scaling_method': 'standard'
}
res_prep = client.post('/api/preprocessing/preprocess', json=prep_payload)
assert res_prep.status_code == 200
prep_data = res_prep.get_json()
print("After Preprocessing:", prep_data['after_stats'])

print("=== 5. Clustering Parameter Sweep (Elbow) ===")
res_elbow = client.post('/api/clustering/elbow-evaluation', json={'k_min': 2, 'k_max': 5, 'n_init': 10})
assert res_elbow.status_code == 200
elbow_res = res_elbow.get_json()['results']
print(f"Evaluated K range {elbow_res['k_range']}, Best Silhouette K={elbow_res['best_k_silhouette']}")

print("=== 6. Fit Final KMeans Model ===")
res_run = client.post('/api/clustering/run', json={'n_clusters': 3, 'n_init': 10, 'random_state': 42})
assert res_run.status_code == 200
clust_eval = res_run.get_json()['clustering_evaluation']
print(f"KMeans fitted: Silhouette={clust_eval['silhouette_score']}, Inertia={clust_eval['inertia']}")

print("=== 7. Manhattan K-Medoids Comparison ===")
res_man = client.post('/api/clustering/compare-manhattan', json={'n_clusters': 3})
assert res_man.status_code == 200
man_data = res_man.get_json()
print(f"Manhattan Silhouette: {man_data['kmedoids_manhattan']['silhouette_manhattan']}")

print("=== 8. PCA Projection (2D & 3D) ===")
res_pca = client.get('/api/pca/')
assert res_pca.status_code == 200
pca_res = res_pca.get_json()
print("PCA Variance Explained:", pca_res['explained_variance_ratio'])
print("PCA 2D points rendered:", len(pca_res['points_2d']))

print("=== 9. Stability Analysis (Multi-Seed ARI) ===")
res_stab = client.post('/api/stability/', json={'n_clusters': 3})
assert res_stab.status_code == 200
stab_data = res_stab.get_json()
print(f"Mean ARI: {stab_data['mean_ari']}, Tier: {stab_data['stability_tier']}")

print("=== 10. Report & CSV Exports ===")
pdf_res = client.get('/api/report/pdf')
assert pdf_res.status_code == 200
print(f"PDF Report generated: {len(pdf_res.data)} bytes")

pcsv_res = client.get('/api/report/export/processed-csv')
assert pcsv_res.status_code == 200
print(f"Processed CSV: {len(pcsv_res.data)} bytes")

ccsv_res = client.get('/api/report/export/clustered-csv')
assert ccsv_res.status_code == 200
print(f"Clustered CSV: {len(ccsv_res.data)} bytes")

mcsv_res = client.get('/api/report/export/metrics-csv')
assert mcsv_res.status_code == 200
print(f"Metrics CSV: {len(mcsv_res.data)} bytes")

print("\n>>> ALL 10 TEST SUITES PASSED WITH 100% SUCCESS! <<<")
