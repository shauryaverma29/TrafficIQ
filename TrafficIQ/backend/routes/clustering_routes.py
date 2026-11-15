import numpy as np
import pandas as pd
from flask import Blueprint, request, jsonify
from models.state_manager import state
from clustering.kmeans_engine import run_elbow_evaluation, fit_kmeans_model
from clustering.kmedoids_engine import compare_euclidean_vs_manhattan
from visualization.interpretation_engine import generate_cluster_interpretations

clustering_bp = Blueprint('clustering', __name__)

@clustering_bp.route('/elbow-evaluation', methods=['POST'])
def elbow_evaluation():
    """
    Run multi-K parameter sweep (k=2 through 10) calculating WCSS/Inertia,
    Silhouette Score, and Davies-Bouldin Index.
    """
    if state.scaled_df is None:
        return jsonify({"error": "Data must be preprocessed prior to running clustering evaluation."}), 400
        
    data = request.get_json() or {}
    k_min = int(data.get('k_min', 2))
    k_max = int(data.get('k_max', 10))
    n_init = int(data.get('n_init', 10))
    max_iter = int(data.get('max_iter', 300))
    random_state = int(data.get('random_state', 42))
    
    X = state.scaled_df.values
    
    results = run_elbow_evaluation(
        X,
        k_min=k_min,
        k_max=k_max,
        n_init=n_init,
        max_iter=max_iter,
        random_state=random_state
    )
    
    state.elbow_results = results
    
    return jsonify({
        "message": "Clustering evaluation completed",
        "results": results
    })

@clustering_bp.route('/run', methods=['POST'])
def run_final_clustering():
    """
    Fit final KMeans clustering model on chosen K.
    Attaches cluster labels to the dataset and generates interpretation profiles.
    """
    if state.scaled_df is None or state.cleaned_df is None:
        return jsonify({"error": "Dataset must be preprocessed first."}), 400
        
    data = request.get_json() or {}
    n_clusters = int(data.get('n_clusters', 3))
    n_init = int(data.get('n_init', 10))
    max_iter = int(data.get('max_iter', 300))
    random_state = int(data.get('random_state', 42))
    
    X = state.scaled_df.values
    fit_result = fit_kmeans_model(
        X,
        n_clusters=n_clusters,
        n_init=n_init,
        max_iter=max_iter,
        random_state=random_state
    )
    
    state.k_selected = n_clusters
    state.cluster_model = fit_result["model"]
    state.clustering_results = fit_result
    
    # Attach cluster labels to cleaned_df
    clustered_df = state.cleaned_df.copy()
    clustered_df['cluster_label'] = fit_result["labels"]
    state.clustered_df = clustered_df
    
    # Generate interpretations dynamically based on existing numeric/categorical features
    interps = generate_cluster_interpretations(
        state.cleaned_df,
        fit_result["labels"],
        state.numeric_features,
        state.categorical_features
    )
    state.interpretations = interps
    
    # Prepare serializable response
    clean_fit_info = {
        "n_clusters": fit_result["n_clusters"],
        "inertia": fit_result["inertia"],
        "silhouette_score": fit_result["silhouette_score"],
        "davies_bouldin_index": fit_result["davies_bouldin_index"],
        "calinski_harabasz_score": fit_result["calinski_harabasz_score"],
        "cluster_sizes": fit_result["cluster_sizes"],
        "cluster_percentages": fit_result["cluster_percentages"],
        "cluster_centers": fit_result["cluster_centers"],
        "random_state": fit_result["random_state"]
    }
    
    return jsonify({
        "message": f"KMeans fitted with K={n_clusters}",
        "clustering_evaluation": clean_fit_info,
        "interpretations": interps
    })

@clustering_bp.route('/compare-manhattan', methods=['POST'])
def compare_manhattan():
    """
    Mathematically valid Manhattan distance comparison using K-Medoids (PAM)
    versus Scikit-Learn Euclidean K-Means.
    """
    if state.scaled_df is None:
        return jsonify({"error": "Preprocessed data required for distance comparison."}), 400
        
    data = request.get_json() or {}
    n_clusters = int(data.get('n_clusters', state.k_selected or 3))
    random_state = int(data.get('random_state', 42))
    
    X = state.scaled_df.values
    comparison = compare_euclidean_vs_manhattan(
        X,
        n_clusters=n_clusters,
        random_state=random_state
    )
    
    state.manhattan_results = comparison
    return jsonify(comparison)
