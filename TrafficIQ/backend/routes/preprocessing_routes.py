import pandas as pd
import numpy as np
from flask import Blueprint, request, jsonify
from models.state_manager import state
from preprocessing.cleaner import clean_dataset, inspect_dataset, detect_outliers_iqr
from preprocessing.encoder import encode_categorical_features
from preprocessing.scaler import scale_feature_matrix

preprocessing_bp = Blueprint('preprocessing', __name__)

@preprocessing_bp.route('/preprocess', methods=['POST'])
def run_preprocessing():
    """
    Execute end-to-end data preprocessing with full reproducibility and decision logging.
    """
    if state.raw_df is None:
        return jsonify({"error": "No dataset uploaded to preprocess"}), 400
        
    data = request.get_json() or {}
    
    selected_features = data.get('selected_features', [])
    numeric_imputation = data.get('numeric_imputation', 'median')
    categorical_imputation = data.get('categorical_imputation', 'mode')
    handle_duplicates = data.get('handle_duplicates', True)
    scaling_method = data.get('scaling_method', 'standard')
    
    # If no features selected, fallback to all valid columns (excluding apparent IDs)
    if not selected_features:
        profile = inspect_dataset(state.raw_df)
        selected_features = profile['numeric_columns'] + profile['categorical_columns']
        
    state.reset_pipeline()
    state.selected_features = selected_features
    state.preprocessing_config = {
        "selected_features": selected_features,
        "numeric_imputation": numeric_imputation,
        "categorical_imputation": categorical_imputation,
        "handle_duplicates": handle_duplicates,
        "scaling_method": scaling_method
    }
    
    before_stats = {
        "rows": len(state.raw_df),
        "columns": len(state.raw_df.columns),
        "missing_values": int(state.raw_df.isnull().sum().sum()),
        "duplicates": int(state.raw_df.duplicated().sum())
    }
    
    # 1. Clean dataset (missing values & duplicates)
    num_cols_in_sel = [c for c in selected_features if c in state.raw_df.columns and pd.api.types.is_numeric_dtype(state.raw_df[c])]
    cat_cols_in_sel = [c for c in selected_features if c in state.raw_df.columns and not pd.api.types.is_numeric_dtype(state.raw_df[c])]
    
    cleaned_df, clean_summary = clean_dataset(
        state.raw_df,
        handle_duplicates=handle_duplicates,
        numeric_imputation=numeric_imputation,
        categorical_imputation=categorical_imputation,
        numeric_cols=num_cols_in_sel,
        categorical_cols=cat_cols_in_sel
    )
    state.cleaned_df = cleaned_df
    state.numeric_features = num_cols_in_sel
    state.categorical_features = cat_cols_in_sel
    
    # 2. Extract selected features subset
    subset_df = cleaned_df[selected_features].copy()
    
    # 3. Categorical encoding
    if cat_cols_in_sel:
        encoded_subset_df, encode_meta = encode_categorical_features(subset_df, cat_cols_in_sel)
    else:
        encoded_subset_df = subset_df.copy()
        encode_meta = {"new_feature_names": [], "total_encoded_features": 0}
        
    # Ensure all columns in encoded_subset_df are numeric for scaling
    final_features_to_scale = list(encoded_subset_df.select_dtypes(include=[np.number]).columns)
    
    # 4. Numerical scaling
    scaled_df, scale_meta, scaler_obj = scale_feature_matrix(
        encoded_subset_df,
        final_features_to_scale,
        method=scaling_method
    )
    state.scaled_df = scaled_df
    
    # Outlier statistics on cleaned features
    outlier_info = detect_outliers_iqr(cleaned_df, num_cols_in_sel)
    
    after_stats = {
        "rows": len(scaled_df),
        "final_feature_dimension": len(scaled_df.columns),
        "missing_values": int(scaled_df.isnull().sum().sum()),
        "duplicates": int(scaled_df.duplicated().sum()),
        "scaling_applied": scaling_method
    }
    
    history_log = clean_summary["decisions"]
    if encode_meta["total_encoded_features"] > 0:
        history_log.append({
            "stage": "categorical_encoding",
            "action": f"One-hot encoded {len(cat_cols_in_sel)} categorical column(s) into {encode_meta['total_encoded_features']} dummy indicator(s)."
        })
    history_log.append({
        "stage": "feature_scaling",
        "action": f"Scaled {len(final_features_to_scale)} numerical feature(s) using {scaling_method} standardisation."
    })
    
    state.preprocessing_history = history_log
    
    # Sample preview of scaled data (head 5 rows)
    scaled_preview = scaled_df.head(5).round(3).to_dict(orient='records')
    
    return jsonify({
        "message": "Data preprocessing completed successfully",
        "before_stats": before_stats,
        "after_stats": after_stats,
        "decision_log": history_log,
        "scaled_columns": list(scaled_df.columns),
        "scaled_preview": scaled_preview,
        "outlier_analysis": outlier_info
    })

@preprocessing_bp.route('/preprocessing-summary', methods=['GET'])
def get_summary():
    """Retrieve details on current preprocessing lineage."""
    if state.scaled_df is None:
        return jsonify({"is_preprocessed": False}), 200
        
    return jsonify({
        "is_preprocessed": True,
        "config": state.preprocessing_config,
        "history": state.preprocessing_history,
        "total_rows": len(state.scaled_df),
        "total_dimensions": len(state.scaled_df.columns),
        "feature_names": list(state.scaled_df.columns)
    })

@preprocessing_bp.route('/reset-preprocessing', methods=['POST'])
def reset_preprocessing():
    """Reset preprocessing to start fresh."""
    state.reset_pipeline()
    return jsonify({"message": "Preprocessing reset successfully. Raw dataset retained."})
