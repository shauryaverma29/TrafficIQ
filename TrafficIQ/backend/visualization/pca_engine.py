import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from typing import Dict, Any, List, Optional

def compute_pca_projection(
    X: np.ndarray,
    feature_names: List[str],
    cluster_labels: Optional[List[int]] = None,
    original_df: Optional[pd.DataFrame] = None,
    max_scatter_points: int = 1500
) -> Dict[str, Any]:
    """
    Perform Principal Component Analysis (PCA) on the preprocessed feature matrix.
    Computes 2D and 3D projections, explained variance ratios, and feature loadings.
    """
    n_samples, n_features = X.shape
    n_components = min(3, n_features, n_samples)
    
    if n_components < 2:
        raise ValueError("At least 2 features are required to compute 2D PCA.")
        
    pca = PCA(n_components=n_components, random_state=42)
    coords = pca.fit_transform(X)
    
    explained_var = [round(float(v), 4) for v in pca.explained_variance_ratio_]
    cum_var = [round(float(v), 4) for v in np.cumsum(pca.explained_variance_ratio_)]
    
    # Feature loadings: shape (n_components, n_features)
    loadings = []
    for comp_idx in range(n_components):
        comp_loadings = {
            feature_names[f_idx]: round(float(pca.components_[comp_idx, f_idx]), 4)
            for f_idx in range(n_features)
        }
        # Sort by absolute loading magnitude
        sorted_loadings = dict(sorted(comp_loadings.items(), key=lambda item: abs(item[1]), reverse=True))
        loadings.append({
            "component": f"PC{comp_idx + 1}",
            "explained_variance": explained_var[comp_idx],
            "top_features": sorted_loadings
        })
        
    # Prepare scatter data points
    points_2d = []
    points_3d = []
    
    # Subsample if dataset is extraordinarily large for responsive browser rendering
    step = max(1, n_samples // max_scatter_points) if n_samples > max_scatter_points else 1
    sample_indices = list(range(0, n_samples, step))
    
    for idx in sample_indices:
        label = int(cluster_labels[idx]) if cluster_labels is not None else 0
        
        # Build tooltip attributes from original dataset if available
        meta = {}
        if original_df is not None and idx < len(original_df):
            row = original_df.iloc[idx]
            for candidate in ['segment_id', 'road_name', 'road_type', 'traffic_volume', 'average_speed_kmh', 'congestion_index', 'hour_of_day']:
                if candidate in original_df.columns:
                    val = row[candidate]
                    meta[candidate] = int(val) if isinstance(val, (np.integer, int)) else (round(float(val), 2) if isinstance(val, (np.floating, float)) else str(val))
                    
        points_2d.append({
            "x": round(float(coords[idx, 0]), 3),
            "y": round(float(coords[idx, 1]), 3),
            "cluster": label,
            "id": idx,
            "meta": meta
        })
        
        if n_components >= 3:
            points_3d.append({
                "x": round(float(coords[idx, 0]), 3),
                "y": round(float(coords[idx, 1]), 3),
                "z": round(float(coords[idx, 2]), 3),
                "cluster": label,
                "id": idx,
                "meta": meta
            })
            
    return {
        "n_components": n_components,
        "explained_variance_ratio": explained_var,
        "cumulative_variance_ratio": cum_var,
        "loadings": loadings,
        "points_2d": points_2d,
        "points_3d": points_3d,
        "total_points_rendered": len(points_2d),
        "total_dataset_rows": n_samples
    }
