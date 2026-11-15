import numpy as np
import pandas as pd
from typing import Dict, Any, List

def generate_cluster_interpretations(
    original_df: pd.DataFrame,
    cluster_labels: List[int],
    numeric_features: List[str],
    categorical_features: List[str]
) -> Dict[str, Any]:
    """
    Generate rigorous, evidence-grounded cluster interpretations and comparisons.
    Adapts dynamically to whatever columns exist in the dataset without hardcoding column assumptions.
    """
    df_eval = original_df.copy()
    df_eval['cluster_label'] = cluster_labels
    
    total_records = len(df_eval)
    clusters = sorted(list(set(cluster_labels)))
    n_clusters = len(clusters)
    
    # 1. Global statistics for comparison
    global_means = {}
    global_stds = {}
    for col in numeric_features:
        if col in df_eval.columns and pd.api.types.is_numeric_dtype(df_eval[col]):
            global_means[col] = float(df_eval[col].mean())
            global_stds[col] = float(df_eval[col].std()) if df_eval[col].std() > 0 else 1.0

    cluster_profiles = []
    cluster_means_table = {}
    standardized_heatmap_data = [] # { feature: str, cluster_z_scores: { "0": z, "1": z } }

    # Initialize feature table
    for col in numeric_features:
        if col in global_means:
            cluster_means_table[col] = {}

    for c in clusters:
        cluster_subset = df_eval[df_eval['cluster_label'] == c]
        c_count = len(cluster_subset)
        c_pct = round((c_count / total_records * 100) if total_records > 0 else 0, 2)
        
        # Numeric stats for cluster
        col_stats = {}
        divergences = [] # stores key deviations from global mean
        
        for col in numeric_features:
            if col in global_means and col in cluster_subset.columns:
                c_mean = float(cluster_subset[col].mean())
                c_median = float(cluster_subset[col].median())
                c_std = float(cluster_subset[col].std()) if len(cluster_subset) > 1 else 0.0
                g_mean = global_means[col]
                g_std = global_stds[col]
                
                # Z-score of cluster mean relative to global distribution
                z_score = (c_mean - g_mean) / g_std if g_std > 0 else 0.0
                pct_diff = ((c_mean - g_mean) / g_mean * 100) if abs(g_mean) > 1e-6 else 0.0
                
                col_stats[col] = {
                    "mean": round(c_mean, 2),
                    "median": round(c_median, 2),
                    "std": round(c_std, 2),
                    "global_mean": round(g_mean, 2),
                    "z_score": round(z_score, 2),
                    "pct_diff_from_global": round(pct_diff, 1)
                }
                
                cluster_means_table[col][str(c)] = round(c_mean, 2)
                
                divergences.append({
                    "column": col,
                    "z_score": z_score,
                    "pct_diff": pct_diff,
                    "mean": c_mean,
                    "global_mean": g_mean
                })
                
        # Categorical modes for cluster
        cat_stats = {}
        for col in categorical_features:
            if col in cluster_subset.columns:
                top_values = cluster_subset[col].value_counts(normalize=True).head(2)
                cat_stats[col] = {
                    str(k): round(float(v) * 100, 1) for k, v in top_values.items()
                }

        # Build evidence-grounded natural language profile
        # Sort divergences by absolute z-score
        divergences.sort(key=lambda d: abs(d["z_score"]), reverse=True)
        top_deviations = divergences[:3]
        
        narrative_parts = []
        for dev in top_deviations:
            col_name = dev["column"].replace('_', ' ').title()
            direction = "higher" if dev["pct_diff"] > 0 else "lower"
            pct_val = abs(dev["pct_diff"])
            narrative_parts.append(
                f"{col_name} averages {round(dev['mean'], 2)} ({pct_val:.1f}% {direction} than the global baseline of {round(dev['global_mean'], 2)})"
            )
            
        if narrative_parts:
            statistical_summary = (
                f"Cluster {c} accounts for {c_count} road segments ({c_pct}% of dataset). "
                f"Statistically, it is characterized by {'; '.join(narrative_parts)}."
            )
        else:
            statistical_summary = f"Cluster {c} contains {c_count} road segments ({c_pct}% of dataset) with feature averages closely aligned with the global dataset mean."

        # Detect presence of speed/volume/congestion measurements dynamically
        speed_col = next((col for col in numeric_features if 'speed' in col.lower()), None)
        vol_col = next((col for col in numeric_features if 'vol' in col.lower() or 'traffic' in col.lower() or 'flow' in col.lower()), None)
        cong_col = next((col for col in numeric_features if 'cong' in col.lower() or 'occupancy' in col.lower() or 'delay' in col.lower()), None)
        
        traffic_diagnostics = {}
        if speed_col and speed_col in col_stats:
            traffic_diagnostics["speed_metric"] = { "name": speed_col, "value": col_stats[speed_col]["mean"] }
        if vol_col and vol_col in col_stats:
            traffic_diagnostics["volume_metric"] = { "name": vol_col, "value": col_stats[vol_col]["mean"] }
        if cong_col and cong_col in col_stats:
            traffic_diagnostics["congestion_metric"] = { "name": cong_col, "value": col_stats[cong_col]["mean"] }

        cluster_profiles.append({
            "cluster_id": c,
            "record_count": c_count,
            "record_percentage": c_pct,
            "statistics": col_stats,
            "categorical_breakdown": cat_stats,
            "summary_narrative": statistical_summary,
            "traffic_diagnostics": traffic_diagnostics,
            "top_deviations": top_deviations
        })

    # Build standardized heatmap data for features
    for col in numeric_features:
        if col in global_means:
            z_dict = {}
            for c_profile in cluster_profiles:
                cid = str(c_profile["cluster_id"])
                if col in c_profile["statistics"]:
                    z_dict[cid] = c_profile["statistics"][col]["z_score"]
                else:
                    z_dict[cid] = 0.0
            standardized_heatmap_data.append({
                "feature": col,
                "cluster_z_scores": z_dict
            })

    methodological_disclaimer = (
        "Academic Note: Unsupervised clustering identifies mathematical partitions based on geometric proximity in feature space. "
        "These clusters reflect exploratory empirical patterns in the uploaded sample and should not be treated as deterministic or permanent road classifications."
    )

    return {
        "n_clusters": n_clusters,
        "total_records": total_records,
        "cluster_profiles": cluster_profiles,
        "cluster_means_table": cluster_means_table,
        "standardized_heatmap": standardized_heatmap_data,
        "methodological_disclaimer": methodological_disclaimer
    }
