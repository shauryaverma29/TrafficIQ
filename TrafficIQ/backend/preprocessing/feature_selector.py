import pandas as pd
from typing import Dict, Any, List

def recommend_features(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Intelligently inspect and recommend features suitable for unsupervised clustering.
    Excludes identifier columns and zero-variance columns by default.
    """
    total_rows = len(df)
    recommended_numeric = []
    recommended_categorical = []
    excluded_candidates = []
    
    for col in df.columns:
        series = df[col]
        n_unique = series.nunique(dropna=True)
        col_lower = col.lower()
        
        # 1. Zero variance column
        if n_unique <= 1:
            excluded_candidates.append({
                "column": col,
                "reason": "Zero variance (all values are identical)"
            })
            continue
            
        # 2. Strict ID or high cardinality key
        if (any(term in col_lower for term in ['id', 'uuid', 'key', 'index', 'hash']) and n_unique > 0.7 * total_rows) or (n_unique == total_rows and total_rows > 20):
            excluded_candidates.append({
                "column": col,
                "reason": f"High cardinality identifier ({n_unique} unique values in {total_rows} rows)"
            })
            continue
            
        # 3. Categorization
        if pd.api.types.is_numeric_dtype(series):
            recommended_numeric.append(col)
        elif pd.api.types.is_datetime64_any_dtype(series):
            excluded_candidates.append({
                "column": col,
                "reason": "Datetime timestamp - convert to hour/day components before clustering"
            })
        else:
            if n_unique <= 15:
                recommended_categorical.append(col)
            else:
                excluded_candidates.append({
                    "column": col,
                    "reason": f"High cardinality categorical text ({n_unique} unique categories)"
                })
                
    return {
        "recommended_numeric": recommended_numeric,
        "recommended_categorical": recommended_categorical,
        "excluded_candidates": excluded_candidates,
        "total_available_features": len(df.columns)
    }
