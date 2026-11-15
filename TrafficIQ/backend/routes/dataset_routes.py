import os
import io
import pandas as pd
import numpy as np
from flask import Blueprint, request, jsonify
from models.state_manager import state
from preprocessing.cleaner import inspect_dataset, detect_outliers_iqr
from preprocessing.feature_selector import recommend_features

dataset_bp = Blueprint('dataset', __name__)

DEMO_DATA_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "data", "traffic_kaggle_demo.csv")
)

@dataset_bp.route('/upload', methods=['POST'])
def upload_csv():
    """Upload CSV dataset and inspect column structures."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part in upload request"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    try:
        df = pd.read_csv(file)
        if len(df) == 0:
            return jsonify({"error": "Uploaded CSV file contains zero rows"}), 400
            
        state.reset_all()
        state.raw_df = df
        state.dataset_name = file.filename
        state.dataset_source = "User Upload"
        
        profile = inspect_dataset(df)
        recommendations = recommend_features(df)
        
        return jsonify({
            "message": "Dataset uploaded and analyzed successfully",
            "dataset_name": state.dataset_name,
            "source": state.dataset_source,
            "profile": profile,
            "recommendations": recommendations
        })
    except Exception as e:
        return jsonify({"error": f"Failed to parse CSV: {str(e)}"}), 500

@dataset_bp.route('/load-demo', methods=['POST'])
def load_demo():
    """Load the bundled realistic Kaggle traffic demonstration dataset."""
    try:
        if not os.path.exists(DEMO_DATA_PATH):
            return jsonify({"error": f"Demo dataset not found at {DEMO_DATA_PATH}"}), 404
            
        df = pd.read_csv(DEMO_DATA_PATH)
        state.reset_all()
        state.raw_df = df
        state.dataset_name = "Kaggle Traffic Prediction Sample (traffic_kaggle_demo.csv)"
        state.dataset_source = "Demonstration"
        
        profile = inspect_dataset(df)
        recommendations = recommend_features(df)
        
        return jsonify({
            "message": "Demonstration traffic dataset loaded successfully",
            "dataset_name": state.dataset_name,
            "source": state.dataset_source,
            "profile": profile,
            "recommendations": recommendations
        })
    except Exception as e:
        return jsonify({"error": f"Error loading demo dataset: {str(e)}"}), 500

@dataset_bp.route('/overview', methods=['GET'])
def get_overview():
    """Retrieve profile and metadata for currently loaded dataset."""
    if state.raw_df is None:
        return jsonify({"has_data": False, "message": "No dataset currently loaded"}), 200
        
    profile = inspect_dataset(state.raw_df)
    recommendations = recommend_features(state.raw_df)
    
    return jsonify({
        "has_data": True,
        "dataset_name": state.dataset_name,
        "source": state.dataset_source,
        "profile": profile,
        "recommendations": recommendations,
        "is_preprocessed": state.scaled_df is not None,
        "is_clustered": state.cluster_model is not None,
        "selected_k": state.k_selected
    })

@dataset_bp.route('/preview', methods=['GET'])
def get_preview():
    """Get sample records and head rows."""
    if state.raw_df is None:
        return jsonify({"error": "No dataset loaded"}), 400
        
    limit = int(request.args.get('limit', 10))
    # Fill NAs for JSON serialization
    preview_df = state.raw_df.head(limit).replace({np.nan: None})
    records = preview_df.to_dict(orient='records')
    
    return jsonify({
        "total_records": len(state.raw_df),
        "columns": list(state.raw_df.columns),
        "records": records
    })

@dataset_bp.route('/correlations', methods=['GET'])
def get_correlations():
    """Calculate Pearson correlation matrix for numerical features."""
    if state.raw_df is None:
        return jsonify({"error": "No dataset loaded"}), 400
        
    numeric_df = state.raw_df.select_dtypes(include=[np.number])
    if numeric_df.empty or len(numeric_df.columns) < 2:
        return jsonify({"correlations": [], "features": []})
        
    corr = numeric_df.corr().round(3).replace({np.nan: 0.0})
    
    return jsonify({
        "features": list(corr.columns),
        "matrix": corr.values.tolist()
    })

@dataset_bp.route('/distributions', methods=['GET'])
def get_distributions():
    """Calculate distribution histograms for numeric features."""
    if state.raw_df is None:
        return jsonify({"error": "No dataset loaded"}), 400
        
    target_col = request.args.get('column')
    numeric_cols = [c for c in state.raw_df.columns if pd.api.types.is_numeric_dtype(state.raw_df[c])]
    
    if target_col and target_col in numeric_cols:
        cols_to_plot = [target_col]
    else:
        cols_to_plot = numeric_cols[:6] # Top 6 numeric cols
        
    result = {}
    for col in cols_to_plot:
        series = state.raw_df[col].dropna()
        if len(series) == 0:
            continue
        counts, bin_edges = np.histogram(series, bins=15)
        result[col] = {
            "counts": [int(c) for c in counts],
            "bin_edges": [round(float(b), 2) for b in bin_edges],
            "mean": round(float(series.mean()), 2),
            "median": round(float(series.median()), 2),
            "std": round(float(series.std()), 2)
        }
        
    return jsonify({"distributions": result})

@dataset_bp.route('/outliers', methods=['GET'])
def get_outliers():
    """Run IQR outlier analysis on numeric features."""
    if state.raw_df is None:
        return jsonify({"error": "No dataset loaded"}), 400
        
    numeric_cols = [c for c in state.raw_df.columns if pd.api.types.is_numeric_dtype(state.raw_df[c])]
    outlier_info = detect_outliers_iqr(state.raw_df, numeric_cols)
    return jsonify(outlier_info)
