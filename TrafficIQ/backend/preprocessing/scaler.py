import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from typing import Tuple, Dict, Any, List

def scale_feature_matrix(
    df: pd.DataFrame,
    feature_columns: List[str],
    method: str = "standard"
) -> Tuple[pd.DataFrame, Dict[str, Any], Any]:
    """
    Standardize or normalize numerical features prior to clustering.
    Distance-based algorithms (Euclidean / Manhattan) are sensitive to feature scales.
    
    Methods:
    - 'standard': StandardScaler (z = (x - mu) / sigma), zero mean and unit variance.
    - 'minmax': MinMaxScaler (x_scaled = (x - min) / (max - min)), scaled into [0, 1].
    """
    valid_cols = [c for c in feature_columns if c in df.columns and pd.api.types.is_numeric_dtype(df[c])]
    
    if not valid_cols:
        raise ValueError("No valid numeric features found for scaling.")
        
    X_sub = df[valid_cols].copy()
    
    if method == "minmax":
        scaler = MinMaxScaler()
        scaled_array = scaler.fit_transform(X_sub)
        params = {
            col: {
                "min": float(scaler.data_min_[idx]),
                "max": float(scaler.data_max_[idx]),
                "range": float(scaler.data_range_[idx])
            }
            for idx, col in enumerate(valid_cols)
        }
    else: # default StandardScaler
        scaler = StandardScaler()
        scaled_array = scaler.fit_transform(X_sub)
        params = {
            col: {
                "mean": float(scaler.mean_[idx]),
                "std": float(np.sqrt(scaler.var_[idx]))
            }
            for idx, col in enumerate(valid_cols)
        }
        
    scaled_df = pd.DataFrame(scaled_array, columns=valid_cols, index=df.index)
    
    metadata = {
        "method": method,
        "scaled_columns": valid_cols,
        "parameters": params,
        "sample_count": len(scaled_df),
        "dimension_count": len(valid_cols)
    }
    
    return scaled_df, metadata, scaler
