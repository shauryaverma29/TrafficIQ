import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import adjusted_rand_score
from typing import Dict, Any, List

def analyze_cluster_stability(
    X: np.ndarray,
    n_clusters: int,
    seeds: List[int] = None,
    n_init: int = 10,
    max_iter: int = 300
) -> Dict[str, Any]:
    """
    Cluster Stability Analysis via Multi-Seed Initializations and Adjusted Rand Index (ARI).
    
    Adjusted Rand Index (ARI) measures the agreement between two cluster assignments:
    - ARI = 1.0 indicates perfect identical cluster partitioning.
    - ARI = 0.0 corresponds to random chance partitioning.
    - Negative values represent worse than random agreement.
    """
    if seeds is None:
        seeds = [10, 42, 101, 777, 2024]
    fitted_assignments = []
    
    for seed in seeds:
        km = KMeans(
            n_clusters=n_clusters,
            init='k-means++',
            n_init=n_init,
            max_iter=max_iter,
            random_state=seed
        )
        labels = km.fit_predict(X)
        fitted_assignments.append({
            "seed": seed,
            "labels": labels,
            "inertia": round(float(km.inertia_), 2)
        })
        
    n_runs = len(seeds)
    ari_matrix = np.zeros((n_runs, n_runs))
    pairwise_scores = []
    
    for i in range(n_runs):
        for j in range(n_runs):
            if i == j:
                ari_matrix[i, j] = 1.0
            else:
                score = adjusted_rand_score(fitted_assignments[i]["labels"], fitted_assignments[j]["labels"])
                ari_matrix[i, j] = round(float(score), 4)
                if i < j:
                    pairwise_scores.append({
                        "seed_a": seeds[i],
                        "seed_b": seeds[j],
                        "ari": round(float(score), 4)
                    })
                    
    scores_only = [p["ari"] for p in pairwise_scores]
    mean_ari = float(np.mean(scores_only)) if scores_only else 1.0
    min_ari = float(np.min(scores_only)) if scores_only else 1.0
    max_ari = float(np.max(scores_only)) if scores_only else 1.0
    std_ari = float(np.std(scores_only)) if scores_only else 0.0
    
    # Assess stability status
    if mean_ari >= 0.85:
        stability_tier = "High Stability"
        assessment = (
            f"Mean ARI of {round(mean_ari, 3)} demonstrates strong convergence across independent random seed initializations. "
            f"The discovered road-segment congestion clusters correspond to well-separated geometric manifolds rather than artifacts of initialization."
        )
    elif mean_ari >= 0.70:
        stability_tier = "Moderate Stability"
        assessment = (
            f"Mean ARI of {round(mean_ari, 3)} indicates moderate stability. Core congestion centers are consistently resolved, "
            f"though borderline road segments near transitional boundaries occasionally shift cluster assignment between initializations."
        )
    else:
        stability_tier = "Low / Sensitive Stability"
        assessment = (
            f"Mean ARI of {round(mean_ari, 3)} reveals sensitivity to random initialization. "
            f"This suggests continuous or overlapping traffic density gradients rather than discrete clusters, or an over-specified cluster count k={n_clusters}."
        )
        
    return {
        "n_clusters": n_clusters,
        "seeds_tested": seeds,
        "mean_ari": round(mean_ari, 4),
        "min_ari": round(min_ari, 4),
        "max_ari": round(max_ari, 4),
        "std_ari": round(std_ari, 4),
        "stability_tier": stability_tier,
        "assessment": assessment,
        "ari_matrix": ari_matrix.tolist(),
        "pairwise_comparisons": pairwise_scores,
        "run_inertias": [{ "seed": f["seed"], "inertia": f["inertia"] } for f in fitted_assignments]
    }
