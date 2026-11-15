import io
import pandas as pd
from flask import Blueprint, send_file, jsonify, make_response
from models.state_manager import state
from reports.pdf_generator import build_pdf_report

report_bp = Blueprint('report', __name__)

@report_bp.route('/pdf', methods=['GET'])
def download_pdf():
    """Generate and download academic project report PDF."""
    if state.raw_df is None:
        return jsonify({"error": "No dataset loaded to generate report."}), 400
        
    state_payload = {
        "dataset_name": state.dataset_name,
        "total_rows": len(state.raw_df),
        "selected_k": state.k_selected,
        "numeric_imputation": state.preprocessing_config.get("numeric_imputation", "Median"),
        "scaling_method": state.preprocessing_config.get("scaling_method", "StandardScaler"),
        "clustering_eval": state.clustering_results or {},
        "interpretations": state.interpretations or {},
        "stability": state.stability_results or {}
    }
    
    try:
        pdf_buffer = build_pdf_report(state_payload)
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name="TrafficIQ_Congestion_Profiles_Report.pdf",
            mimetype="application/pdf"
        )
    except Exception as e:
        return jsonify({"error": f"Failed to generate PDF: {str(e)}"}), 500

@report_bp.route('/export/processed-csv', methods=['GET'])
def export_processed_csv():
    """Download standardized preprocessed feature matrix as CSV."""
    if state.scaled_df is None:
        return jsonify({"error": "No preprocessed dataset available."}), 400
        
    output = io.StringIO()
    state.scaled_df.to_csv(output, index=False)
    csv_bytes = io.BytesIO(output.getvalue().encode('utf-8'))
    
    return send_file(
        csv_bytes,
        as_attachment=True,
        download_name="trafficiq_processed_features.csv",
        mimetype="text/csv"
    )

@report_bp.route('/export/clustered-csv', methods=['GET'])
def export_clustered_csv():
    """Download dataset with assigned cluster labels as CSV."""
    if state.clustered_df is None:
        return jsonify({"error": "No clustered dataset available. Run clustering first."}), 400
        
    output = io.StringIO()
    state.clustered_df.to_csv(output, index=False)
    csv_bytes = io.BytesIO(output.getvalue().encode('utf-8'))
    
    return send_file(
        csv_bytes,
        as_attachment=True,
        download_name="trafficiq_clustered_road_segments.csv",
        mimetype="text/csv"
    )

@report_bp.route('/export/metrics-csv', methods=['GET'])
def export_metrics_csv():
    """Download clustering evaluation metric comparisons (WCSS, Silhouette, DB Index) as CSV."""
    if state.elbow_results is None:
        return jsonify({"error": "No clustering evaluation results available. Run elbow evaluation first."}), 400
        
    res = state.elbow_results
    metrics_df = pd.DataFrame({
        "K_Clusters": res["k_range"],
        "Inertia_WCSS": res["wcss"],
        "Silhouette_Score": res["silhouette_scores"],
        "Davies_Bouldin_Index": res["davies_bouldin_scores"],
        "Calinski_Harabasz_Score": res["calinski_harabasz_scores"]
    })
    
    output = io.StringIO()
    metrics_df.to_csv(output, index=False)
    csv_bytes = io.BytesIO(output.getvalue().encode('utf-8'))
    
    return send_file(
        csv_bytes,
        as_attachment=True,
        download_name="trafficiq_clustering_metrics.csv",
        mimetype="text/csv"
    )
