import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List, Optional

def inspect_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Exhaustively profile a pandas DataFrame.
    Categorizes column datatypes, detects missing values, duplicates,
    and identifies candidate IDs, numerics, and categoricals.
    """
    total_rows = len(df)
    total_cols = len(df.columns)
    
    numeric_cols = []
    categorical_cols = []
    datetime_cols = []
    id_like_cols = []
    
    col_details = []
    missing_total = int(df.isnull().sum().sum())
    duplicate_count = int(df.duplicated().sum())
    
    for col in df.columns:
        series = df[col]
        dtype_str = str(series.dtype)
        num_missing = int(series.isnull().sum())
        missing_pct = round((num_missing / total_rows * 100) if total_rows > 0 else 0, 2)
        n_unique = int(series.nunique(dropna=True))
        
        # Check if ID-like: high cardinality string or unique integer identifier
        is_id = False
        lower_name = col.lower()
        if any(term in lower_name for term in ['id', 'uuid', 'key', 'index', 'code']) and n_unique > 0.8 * total_rows:
            is_id = True
            id_like_cols.append(col)
        elif n_unique == total_rows and total_rows > 10:
            is_id = True
            id_like_cols.append(col)
        
        if pd.api.types.is_numeric_dtype(series):
            if not is_id:
                numeric_cols.append(col)
            col_type = "numeric"
        elif pd.api.types.is_datetime64_any_dtype(series):
            datetime_cols.append(col)
            col_type = "datetime"
        else:
            if not is_id:
                categorical_cols.append(col)
            col_type = "categorical"
            
        col_details.append({
            "name": col,
            "type": col_type,
            "dtype": dtype_str,
            "missing_count": num_missing,
            "missing_pct": missing_pct,
            "unique_values": n_unique,
            "is_id_candidate": is_id,
            "sample_values": series.dropna().astype(str).head(3).tolist()
        })
        
    return {
        "total_rows": total_rows,
        "total_columns": total_cols,
        "missing_total": missing_total,
        "duplicate_count": duplicate_count,
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "datetime_columns": datetime_cols,
        "id_like_columns": id_like_cols,
        "columns": col_details
    }

def detect_outliers_iqr(df: pd.DataFrame, columns: List[str], factor: float = 1.5) -> Dict[str, Any]:
    """
    Compute outlier statistics using the Interquartile Range (IQR) technique.
    Outliers are points lying outside [Q1 - factor * IQR, Q3 + factor * IQR].
    """
    outlier_stats = {}
    total_outlier_rows = set()
    
    for col in columns:
        if col not in df.columns or not pd.api.types.is_numeric_dtype(df[col]):
            continue
            
        series = df[col].dropna()
        if len(series) == 0:
            continue
            
        q1 = float(series.quantile(0.25))
        q3 = float(series.quantile(0.75))
        iqr = q3 - q1
        lower_bound = float(q1 - factor * iqr)
        upper_bound = float(q3 + factor * iqr)
        
        outliers_mask = (df[col] < lower_bound) | (df[col] > upper_bound)
        outlier_indices = df[outliers_mask].index.tolist()
        total_outlier_rows.update(outlier_indices)
        
        outlier_stats[col] = {
            "q1": round(q1, 3),
            "q3": round(q3, 3),
            "iqr": round(iqr, 3),
            "lower_bound": round(lower_bound, 3),
            "upper_bound": round(upper_bound, 3),
            "outlier_count": int(outliers_mask.sum()),
            "outlier_pct": round(float(outliers_mask.mean()) * 100, 2)
        }
        
    return {
        "column_outliers": outlier_stats,
        "total_rows_with_outliers": len(total_outlier_rows),
        "total_rows_with_outliers_pct": round((len(total_outlier_rows) / len(df) * 100) if len(df) > 0 else 0, 2)
    }

def clean_dataset(
    df: pd.DataFrame,
    handle_duplicates: bool = True,
    numeric_imputation: str = "median",
    categorical_imputation: str = "mode",
    numeric_cols: Optional[List[str]] = None,
    categorical_cols: Optional[List[str]] = None
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Apply missing value imputation and duplicate removal with complete decision tracking.
    """
    cleaned = df.copy()
    decision_log = []
    
    # 1. Duplicate Handling
    initial_rows = len(cleaned)
    initial_duplicates = int(cleaned.duplicated().sum())
    if handle_duplicates and initial_duplicates > 0:
        cleaned = cleaned.drop_duplicates().reset_index(drop=True)
        decision_log.append({
            "stage": "duplicate_removal",
            "action": f"Removed {initial_duplicates} exact duplicate record(s).",
            "records_removed": initial_duplicates
        })
    elif initial_duplicates > 0:
        decision_log.append({
            "stage": "duplicate_retention",
            "action": f"Retained {initial_duplicates} duplicate record(s) per configuration.",
            "records_removed": 0
        })

    # 2. Imputation for numeric features
    if numeric_cols is None:
        numeric_cols = [c for c in cleaned.columns if pd.api.types.is_numeric_dtype(cleaned[c])]
        
    for col in numeric_cols:
        if col in cleaned.columns and cleaned[col].isnull().sum() > 0:
            missing_count = int(cleaned[col].isnull().sum())
            if numeric_imputation == "mean":
                fill_val = float(cleaned[col].mean())
            else: # default median
                fill_val = float(cleaned[col].median())
                
            cleaned[col] = cleaned[col].fillna(fill_val)
            decision_log.append({
                "stage": "numeric_imputation",
                "column": col,
                "strategy": numeric_imputation,
                "fill_value": round(fill_val, 4),
                "imputed_count": missing_count
            })

    # 3. Imputation for categorical features
    if categorical_cols is None:
        categorical_cols = [c for c in cleaned.columns if not pd.api.types.is_numeric_dtype(cleaned[c])]
        
    for col in categorical_cols:
        if col in cleaned.columns and cleaned[col].isnull().sum() > 0:
            missing_count = int(cleaned[col].isnull().sum())
            if categorical_imputation == "mode":
                mode_vals = cleaned[col].mode()
                fill_val = mode_vals.iloc[0] if len(mode_vals) > 0 else "Unknown"
            else:
                fill_val = "Missing"
                
            cleaned[col] = cleaned[col].fillna(fill_val)
            decision_log.append({
                "stage": "categorical_imputation",
                "column": col,
                "strategy": categorical_imputation,
                "fill_value": str(fill_val),
                "imputed_count": missing_count
            })

    summary = {
        "initial_rows": initial_rows,
        "cleaned_rows": len(cleaned),
        "rows_removed": initial_rows - len(cleaned),
        "remaining_nulls": int(cleaned.isnull().sum().sum()),
        "decisions": decision_log
    }
    
    return cleaned, summary
