from flask import Blueprint, jsonify
from models.state_manager import state
from visualization.interpretation_engine import generate_cluster_interpretations

interpretation_bp = Blueprint('interpretation', __name__)

@interpretation_bp.route('/', methods=['GET'])
def get_interpretation():
    """
    Retrieve dynamically generated cluster profiles and comparisons.
    """
    if state.clustering_results is None or state.cleaned_df is None:
        return jsonify({"error": "No clustering model currently fitted. Run clustering first."}), 400
        
    if state.interpretations is not None:
        return jsonify(state.interpretations)
        
    labels = state.clustering_results["labels"]
    interps = generate_cluster_interpretations(
        state.cleaned_df,
        labels,
        state.numeric_features,
        state.categorical_features
    )
    state.interpretations = interps
    return jsonify(interps)
