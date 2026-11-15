import numpy as np
from scipy.spatial.distance import cdist
from sklearn.metrics import silhouette_score, davies_bouldin_score
from typing import Dict, Any

class FastManhattanKMedoids:
    """
    K-Medoids clustering using L1 Manhattan (cityblock) distance.
    Uses the Partitioning Around Medoids (PAM) heuristic.
    Unlike standard K-Means which requires Euclidean arithmetic means,
    K-Medoids chooses actual exemplar records as cluster centers (medoids),
    minimizing the sum of pairwise Manhattan distances.
    """
    def __init__(self, n_clusters: int = 3, max_iter: int = 100, random_state: int = 42):
        self.n_clusters = n_clusters
        self.max_iter = max_iter
        self.random_state = random_state
        self.medoid_indices_ = None
        self.labels_ = None
        self.inertia_ = None

    def fit(self, X: np.ndarray):
        np.random.seed(self.random_state)
        n_samples = X.shape[0]
        
        # 1. Initialize medoids randomly without replacement
        initial_medoids = np.random.choice(n_samples, self.n_clusters, replace=False)
        medoids = initial_medoids.copy()
        
        # Precompute or dynamic compute cityblock distances
        # For memory efficiency with large N, compute against medoids directly
        for iteration in range(self.max_iter):
            # Compute distance matrix between all samples and current medoids using Manhattan distance
            medoid_points = X[medoids]
            distances = cdist(X, medoid_points, metric='cityblock')
            labels = np.argmin(distances, axis=1)
            
            new_medoids = medoids.copy()
            changed = False
            
            # Update step: for each cluster, select the point that minimizes sum of L1 distances
            for c in range(self.n_clusters):
                cluster_member_indices = np.where(labels == c)[0]
                if len(cluster_member_indices) == 0:
                    continue
                    
                cluster_points = X[cluster_member_indices]
                # Intra-cluster pairwise Manhattan distance matrix
                intra_dists = cdist(cluster_points, cluster_points, metric='cityblock')
                cost_per_candidate = np.sum(intra_dists, axis=1)
                best_candidate_idx = cluster_member_indices[np.argmin(cost_per_candidate)]
                
                if best_candidate_idx != medoids[c]:
                    new_medoids[c] = best_candidate_idx
                    changed = True
                    
            if not changed:
                break
            medoids = new_medoids
            
        # Final assignment
        medoid_points = X[medoids]
        distances = cdist(X, medoid_points, metric='cityblock')
        labels = np.argmin(distances, axis=1)
        min_dists = np.min(distances, axis=1)
        
        self.medoid_indices_ = medoids
        self.labels_ = labels
        self.inertia_ = float(np.sum(min_dists)) # Sum of L1 Manhattan deviations
        return self

def compare_euclidean_vs_manhattan(
    X: np.ndarray,
    n_clusters: int = 3,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Provide an academically rigorous comparison between:
    1. Standard K-Means (Euclidean distance, Voronoi centroid partitions)
    2. K-Medoids (L1 Manhattan distance, exemplar medoids)
    """
    from sklearn.cluster import KMeans
    
    # 1. K-Means (Euclidean)
    km = KMeans(n_clusters=n_clusters, init='k-means++', n_init=10, random_state=random_state)
    km_labels = km.fit_predict(X)
    km_sil_euc = float(silhouette_score(X, km_labels, metric='euclidean'))
    km_sil_man = float(silhouette_score(X, km_labels, metric='manhattan'))
    km_db = float(davies_bouldin_score(X, km_labels))
    km_unique, km_counts = np.unique(km_labels, return_counts=True)
    
    # 2. K-Medoids (Manhattan L1)
    kmed = FastManhattanKMedoids(n_clusters=n_clusters, random_state=random_state)
    kmed.fit(X)
    kmed_labels = kmed.labels_
    kmed_sil_man = float(silhouette_score(X, kmed_labels, metric='manhattan'))
    kmed_sil_euc = float(silhouette_score(X, kmed_labels, metric='euclidean'))
    kmed_db = float(davies_bouldin_score(X, kmed_labels))
    kmed_unique, kmed_counts = np.unique(kmed_labels, return_counts=True)
    
    # Mathematical explanation
    math_notes = [
        "Standard Scikit-learn KMeans minimizes within-cluster variance using squared Euclidean distance (L2 norm). Its centroid updates are arithmetic means, which mathematically correspond to L2 loss.",
        "Manhattan distance (L1 norm) minimizes absolute deviations and represents grid-like travel distance, which is particularly relevant in urban road networks.",
        "To rigorously test Manhattan distance without distorting the centroid calculation, K-Medoids (Partitioning Around Medoids) is utilized. Medoids are constrained to actual observed road segments rather than synthetic spatial centroids.",
        "Manhattan K-Medoids exhibits superior robustness against sensor noise and extreme congestion outliers compared to Euclidean K-Means, which squares outlier deviations."
    ]
    
    return {
        "n_clusters": n_clusters,
        "kmeans_euclidean": {
            "algorithm": "K-Means (Scikit-Learn)",
            "distance_metric": "Euclidean (L2 norm)",
            "inertia_wcss": round(float(km.inertia_), 2),
            "silhouette_euclidean": round(km_sil_euc, 4),
            "silhouette_manhattan": round(km_sil_man, 4),
            "davies_bouldin_index": round(km_db, 4),
            "cluster_distribution": {int(u): int(c) for u, c in zip(km_unique, km_counts)}
        },
        "kmedoids_manhattan": {
            "algorithm": "K-Medoids (Partitioning Around Medoids - PAM)",
            "distance_metric": "Manhattan / Cityblock (L1 norm)",
            "l1_total_cost": round(kmed.inertia_, 2),
            "silhouette_manhattan": round(kmed_sil_man, 4),
            "silhouette_euclidean": round(kmed_sil_euc, 4),
            "davies_bouldin_index": round(kmed_db, 4),
            "cluster_distribution": {int(u): int(c) for u, c in zip(kmed_unique, kmed_counts)},
            "medoid_sample_indices": [int(idx) for idx in kmed.medoid_indices_]
        },
        "mathematical_notes": math_notes
    }
