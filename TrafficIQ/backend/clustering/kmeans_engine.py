import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
from typing import Dict, Any, List

def run_elbow_evaluation(
    X: np.ndarray,
    k_min: int = 2,
    k_max: int = 10,
    n_init: int = 10,
    max_iter: int = 300,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Evaluate multiple cluster counts (k=k_min through k=k_max) using Scikit-Learn KMeans (Euclidean distance).
    Calculates WCSS (Inertia), Silhouette Score, Davies-Bouldin Index, and Calinski-Harabasz Index.
    """
    n_samples = X.shape[0]
    effective_k_max = min(k_max, n_samples - 1)
    
    k_values = []
    wcss = []
    silhouette_scores = []
    davies_bouldin_scores = []
    calinski_scores = []
    
    best_k_silhouette = k_min
    best_silhouette_val = -1.0
    
    best_k_db = k_min
    best_db_val = float('inf')
    
    # Store cluster sizes for each k
    cluster_distributions = {}

    for k in range(k_min, effective_k_max + 1):
        km = KMeans(
            n_clusters=k,
            init='k-means++',
            n_init=n_init,
            max_iter=max_iter,
            random_state=random_state
        )
        labels = km.fit_predict(X)
        inertia = float(km.inertia_)
        
        # Calculate silhouette score (requires at least 2 clusters and samples > k)
        try:
            sil = float(silhouette_score(X, labels, metric='euclidean'))
        except Exception:
            sil = 0.0
            
        try:
            db = float(davies_bouldin_score(X, labels))
        except Exception:
            db = 0.0
            
        try:
            ch = float(calinski_harabasz_score(X, labels))
        except Exception:
            ch = 0.0

        k_values.append(k)
        wcss.append(round(inertia, 2))
        silhouette_scores.append(round(sil, 4))
        davies_bouldin_scores.append(round(db, 4))
        calinski_scores.append(round(ch, 2))
        
        unique, counts = np.unique(labels, return_counts=True)
        cluster_distributions[k] = {int(u): int(c) for u, c in zip(unique, counts)}
        
        if sil > best_silhouette_val:
            best_silhouette_val = sil
            best_k_silhouette = k
            
        if db < best_db_val and db > 0:
            best_db_val = db
            best_k_db = k

    # Recommended K combines silhouette and elbow
    recommended_k = best_k_silhouette
    
    return {
        "k_range": k_values,
        "wcss": wcss,
        "silhouette_scores": silhouette_scores,
        "davies_bouldin_scores": davies_bouldin_scores,
        "calinski_harabasz_scores": calinski_scores,
        "cluster_distributions": cluster_distributions,
        "best_k_silhouette": best_k_silhouette,
        "best_silhouette_value": round(best_silhouette_val, 4),
        "best_k_davies_bouldin": best_k_db,
        "best_davies_bouldin_value": round(best_db_val, 4),
        "recommended_k": recommended_k,
        "metric_used": "Euclidean (standard Scikit-learn KMeans)",
        "sample_count": n_samples,
        "feature_dim": X.shape[1]
    }

def fit_kmeans_model(
    X: np.ndarray,
    n_clusters: int,
    n_init: int = 10,
    max_iter: int = 300,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Fit the definitive KMeans model for a chosen cluster count.
    """
    km = KMeans(
        n_clusters=n_clusters,
        init='k-means++',
        n_init=n_init,
        max_iter=max_iter,
        random_state=random_state
    )
    labels = km.fit_predict(X)
    
    sil = float(silhouette_score(X, labels, metric='euclidean'))
    db = float(davies_bouldin_score(X, labels))
    ch = float(calinski_harabasz_score(X, labels))
    
    unique, counts = np.unique(labels, return_counts=True)
    size_map = {int(u): int(c) for u, c in zip(unique, counts)}
    pct_map = {int(u): round(float(c / len(labels) * 100), 2) for u, c in zip(unique, counts)}
    
    return {
        "model": km,
        "labels": labels.tolist(),
        "n_clusters": n_clusters,
        "inertia": round(float(km.inertia_), 2),
        "silhouette_score": round(sil, 4),
        "davies_bouldin_index": round(db, 4),
        "calinski_harabasz_score": round(ch, 2),
        "cluster_centers": km.cluster_centers_.tolist(),
        "cluster_sizes": size_map,
        "cluster_percentages": pct_map,
        "n_iter": int(km.n_iter_),
        "random_state": random_state
    }
