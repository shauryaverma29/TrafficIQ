import pandas as pd
import numpy as np
from typing import Dict, Any, Optional

class SessionState:
    """
    Central in-memory state manager for TrafficIQ machine learning pipeline.
    Maintains uploaded dataset, preprocessing lineage, clustering models,
    PCA projections, stability analyses, and report metadata.
    """
    def __init__(self):
        self.raw_df: Optional[pd.DataFrame] = None
        self.cleaned_df: Optional[pd.DataFrame] = None
        self.scaled_df: Optional[pd.DataFrame] = None
        self.clustered_df: Optional[pd.DataFrame] = None
        
        self.dataset_name: str = "Unassigned"
        self.dataset_source: str = "None"
        
        # Preprocessing state
        self.selected_features: list[str] = []
        self.numeric_features: list[str] = []
        self.categorical_features: list[str] = []
        self.preprocessing_history: list[Dict[str, Any]] = []
        self.preprocessing_config: Dict[str, Any] = {}
        
        # Clustering state
        self.elbow_results: Optional[Dict[str, Any]] = None
        self.manhattan_results: Optional[Dict[str, Any]] = None
        self.clustering_results: Optional[Dict[str, Any]] = None
        self.cluster_model: Any = None
        self.k_selected: int = 3
        
        # PCA state
        self.pca_results: Optional[Dict[str, Any]] = None
        
        # Interpretation and stability state
        self.interpretations: Optional[Dict[str, Any]] = None
        self.stability_results: Optional[Dict[str, Any]] = None

    def reset_pipeline(self):
        """Reset preprocessing and all subsequent modeling states while retaining raw_df."""
        self.cleaned_df = None
        self.scaled_df = None
        self.clustered_df = None
        self.selected_features = []
        self.preprocessing_history = []
        self.preprocessing_config = {}
        self.elbow_results = None
        self.manhattan_results = None
        self.clustering_results = None
        self.cluster_model = None
        self.pca_results = None
        self.interpretations = None
        self.stability_results = None

    def reset_all(self):
        """Completely reset all session data."""
        self.raw_df = None
        self.dataset_name = "Unassigned"
        self.dataset_source = "None"
        self.reset_pipeline()

# Singleton state instance for the application
state = SessionState()
