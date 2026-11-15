from flask import Blueprint, request, jsonify
from models.state_manager import state
from clustering.stability_engine import analyze_cluster_stability

stability_bp = Blueprint('stability', __name__)

@stability_bp.route('/', methods=['POST', 'GET'])
def run_stability():
    """
    Run multi-seed stability analysis using Adjusted Rand Index (ARI).
    """
    if state.scaled_df is None:
        return jsonify({"error": "Preprocessed data required for stability analysis."}), 400
        
    data = request.get_json() if request.method == 'POST' else {}
    if not data:
        data = {}
        
    n_clusters = int(data.get('n_clusters', state.k_selected or 3))
    seeds = data.get('seeds', [10, 42, 101, 777, 2024])
    
    X = state.scaled_df.values
    
    results = analyze_cluster_stability(
        X,
        n_clusters=n_clusters,
        seeds=seeds
    )
    
    state.stability_results = results
    return jsonify(results)
