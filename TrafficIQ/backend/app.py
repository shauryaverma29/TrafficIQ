import os
import sys
import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from routes.dataset_routes import dataset_bp, DEMO_DATA_PATH
from routes.preprocessing_routes import preprocessing_bp
from routes.clustering_routes import clustering_bp
from routes.pca_routes import pca_bp
from routes.interpretation_routes import interpretation_bp
from routes.stability_routes import stability_bp
from routes.report_routes import report_bp
from models.state_manager import state

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register blueprints
    app.register_blueprint(dataset_bp, url_prefix='/api/dataset')
    app.register_blueprint(preprocessing_bp, url_prefix='/api/preprocessing')
    app.register_blueprint(clustering_bp, url_prefix='/api/clustering')
    app.register_blueprint(pca_bp, url_prefix='/api/pca')
    app.register_blueprint(interpretation_bp, url_prefix='/api/interpretation')
    app.register_blueprint(stability_bp, url_prefix='/api/stability')
    app.register_blueprint(report_bp, url_prefix='/api/report')
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "online",
            "service": "TrafficIQ Analytics Engine",
            "has_dataset": state.raw_df is not None,
            "dataset_name": state.dataset_name,
            "is_preprocessed": state.scaled_df is not None,
            "is_clustered": state.cluster_model is not None
        })
        
    # Auto-load demo dataset on server startup for seamless out-of-the-box demonstration
    if os.path.exists(DEMO_DATA_PATH) and state.raw_df is None:
        try:
            df = pd.read_csv(DEMO_DATA_PATH)
            state.raw_df = df
            state.dataset_name = "Kaggle Traffic Sample (traffic_kaggle_demo.csv)"
            state.dataset_source = "Preloaded Demonstration"
            print(f"[TrafficIQ] Successfully preloaded demonstration dataset with {len(df)} records.")
        except Exception as e:
            print(f"[TrafficIQ] Note: Could not auto-load demo dataset: {e}")
            
    return app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app = create_app()
    print(f"==================================================")
    print(f"  TrafficIQ Machine Learning Backend Running")
    print(f"  REST API Endpoint: http://localhost:{port}/api")
    print(f"==================================================")
    app.run(host='0.0.0.0', port=port, debug=True)
