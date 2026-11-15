import numpy as np
from flask import Blueprint, jsonify, request
from models.state_manager import state
from visualization.pca_engine import compute_pca_projection

pca_bp = Blueprint('pca', __name__)

@pca_bp.route('/', methods=['GET'])
def get_pca():
    """
    Execute PCA on the standardized feature matrix and return 2D/3D projections with variance metrics.
    """
    if state.scaled_df is None:
        return jsonify({"error": "Data must be preprocessed prior to running PCA."}), 400
        
    X = state.scaled_df.values
    feature_names = list(state.scaled_df.columns)
    
    cluster_labels = None
    if state.clustering_results is not None:
        cluster_labels = state.clustering_results.get("labels")
        
    try:
        pca_data = compute_pca_projection(
            X,
            feature_names=feature_names,
            cluster_labels=cluster_labels,
            original_df=state.cleaned_df
        )
        state.pca_results = pca_data
        return jsonify(pca_data)
    except Exception as e:
        return jsonify({"error": f"Failed to compute PCA: {str(e)}"}), 500
