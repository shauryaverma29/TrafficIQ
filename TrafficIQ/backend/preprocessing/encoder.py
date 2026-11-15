import pandas as pd
from typing import List, Tuple, Dict, Any

def encode_categorical_features(
    df: pd.DataFrame,
    categorical_cols: List[str],
    drop_first: bool = False
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Apply One-Hot Encoding to categorical columns.
    Maintains a mapping of original categorical columns to generated dummy features.
    """
    valid_cat_cols = [c for c in categorical_cols if c in df.columns]
    
    if not valid_cat_cols:
        return df.copy(), {"encoded_columns": {}, "new_feature_names": [], "total_encoded_features": 0}
        
    encoded_map = {}
    
    # Use pandas get_dummies for clear, interpretable column names
    encoded_df = pd.get_dummies(df, columns=valid_cat_cols, drop_first=drop_first, dtype=float)
    
    for col in valid_cat_cols:
        generated = [c for c in encoded_df.columns if c.startswith(f"{col}_")]
        encoded_map[col] = generated
        
    all_generated = [feat for sublist in encoded_map.values() for feat in sublist]
    
    metadata = {
        "encoded_columns": encoded_map,
        "new_feature_names": all_generated,
        "total_encoded_features": len(all_generated),
        "drop_first": drop_first
    }
    
    return encoded_df, metadata
