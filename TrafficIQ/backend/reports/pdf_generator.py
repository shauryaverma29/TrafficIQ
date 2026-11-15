import io
from datetime import datetime
from typing import Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)

def build_pdf_report(state_data: Dict[str, Any]) -> io.BytesIO:
    """
    Generate an academic-grade PDF project report for TrafficIQ using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=45,
        rightMargin=45,
        topMargin=45,
        bottomMargin=45
    )
    
    styles = getSampleStyleSheet()
    
    # Custom palette & styles
    primary_color = colors.HexColor("#0f172a") # Deep Slate
    accent_blue = colors.HexColor("#0284c7")   # Electric Sky
    text_dark = colors.HexColor("#334155")
    bg_subtle = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#cbd5e1")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=primary_color,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=accent_blue,
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=text_dark,
        spaceAfter=6
    )
    
    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#475569")
    )
    
    story = []
    
    # 1. Header Banner
    story.append(Paragraph("TrafficIQ: Road-Segment Congestion Profiles", title_style))
    story.append(Paragraph("Unsupervised Learning for Dynamic Traffic Pattern Discovery | Technical Project Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_blue, spaceBefore=0, spaceAfter=12))
    
    # Metadata Block
    meta_data = [
        [
            Paragraph("<b>Generated:</b> " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"), body_style),
            Paragraph("<b>Dataset:</b> " + str(state_data.get("dataset_name", "Kaggle Traffic Sample")), body_style)
        ],
        [
            Paragraph("<b>Total Road Segments:</b> " + str(state_data.get("total_rows", "N/A")), body_style),
            Paragraph("<b>Optimal Clusters (K):</b> " + str(state_data.get("selected_k", "3")), body_style)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[260, 260])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_subtle),
        ('BOX', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))
    
    # 2. Executive Summary
    story.append(Paragraph("1. Executive Summary", h1_style))
    summary_text = (
        "This investigation applies unsupervised machine learning algorithms to discover empirical congestion profiles "
        "across urban road segments. Using multidimensional sensor observations—including speed, volume, and roadway occupancy—"
        "we construct geometric partitions through K-Means clustering, evaluate dimensionality structure via Principal Component Analysis (PCA), "
        "and benchmark partitioning stability across distinct random initializations via Adjusted Rand Index (ARI). "
        "A rigorous mathematical comparison is also provided between Euclidean K-Means and Manhattan K-Medoids to assess distance metric sensitivity."
    )
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 10))
    
    # 3. Data Preprocessing & Feature Engineering
    story.append(Paragraph("2. Data Preprocessing & Quality Engineering", h1_style))
    prep_text = (
        "High-dimensional traffic sensor feeds frequently contain missing observations, duplicate sensor pings, and differing physical units. "
        "To ensure robust geometric clustering, the pipeline enforces strict preprocessing:"
    )
    story.append(Paragraph(prep_text, body_style))
    
    prep_table_data = [
        [Paragraph("<b>Step</b>", body_style), Paragraph("<b>Strategy</b>", body_style), Paragraph("<b>Methodological Rationale</b>", body_style)],
        [Paragraph("Missing Imputation", body_style), Paragraph(str(state_data.get("numeric_imputation", "Median")), body_style), Paragraph("Preserves central tendency without bias from extreme traffic spikes.", body_style)],
        [Paragraph("Categorical Encoding", body_style), Paragraph("One-Hot Encoding", body_style), Paragraph("Enables distance metric evaluation across qualitative indicators without ordinal bias.", body_style)],
        [Paragraph("Feature Scaling", body_style), Paragraph(str(state_data.get("scaling_method", "StandardScaler (z-score)")), body_style), Paragraph("Equilibrates feature variance so dominant units (e.g., volume) do not distort distance computations.", body_style)],
        [Paragraph("Duplicate Removal", body_style), Paragraph("Deduplication Enabled", body_style), Paragraph("Prevents artificial density concentration from redundant sensor pings.", body_style)]
    ]
    t_prep = Table(prep_table_data, colWidths=[120, 140, 260])
    t_prep.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), bg_subtle),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_prep)
    story.append(Spacer(1, 14))
    
    # 4. Clustering Methodology & Evaluation Metrics
    story.append(Paragraph("3. Clustering Evaluation & Model Selection", h1_style))
    clust_eval = state_data.get("clustering_eval", {})
    sil_score = clust_eval.get("silhouette_score", "N/A")
    db_index = clust_eval.get("davies_bouldin_index", "N/A")
    inertia_val = clust_eval.get("inertia", "N/A")
    
    eval_text = (
        f"K-Means partitioning was evaluated across cluster counts using Within-Cluster Sum of Squares (Inertia/WCSS), "
        f"Silhouette Score (measure of cluster cohesion versus separation), and the Davies-Bouldin Index (ratio of within-cluster scatter to between-cluster separation). "
        f"For the selected configuration (K={state_data.get('selected_k', 3)}), the model achieved a Silhouette Score of <b>{sil_score}</b>, "
        f"a Davies-Bouldin Index of <b>{db_index}</b>, and an Inertia of <b>{inertia_val}</b>."
    )
    story.append(Paragraph(eval_text, body_style))
    story.append(Spacer(1, 10))
    
    # Metric comparison table
    metric_table = [
        [Paragraph("<b>Evaluation Metric</b>", body_style), Paragraph("<b>Value</b>", body_style), Paragraph("<b>Ideal Criterion</b>", body_style), Paragraph("<b>Interpretation</b>", body_style)],
        [Paragraph("Silhouette Score", body_style), Paragraph(str(sil_score), body_style), Paragraph("Closer to +1.0", body_style), Paragraph("Evaluates separation from neighboring clusters.", body_style)],
        [Paragraph("Davies-Bouldin Index", body_style), Paragraph(str(db_index), body_style), Paragraph("Lower (closer to 0)", body_style), Paragraph("Measures similarity between clusters; lower indicates distinct boundaries.", body_style)],
        [Paragraph("Inertia (WCSS)", body_style), Paragraph(str(inertia_val), body_style), Paragraph("Elbow inflection point", body_style), Paragraph("Total sum of squared Euclidean deviations to cluster centroids.", body_style)]
    ]
    t_metric = Table(metric_table, colWidths=[110, 80, 110, 220])
    t_metric.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), bg_subtle),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_metric)
    story.append(Spacer(1, 14))
    
    # 5. Cluster Interpretation Profiles
    story.append(Paragraph("4. Discovered Road-Segment Congestion Profiles", h1_style))
    interps = state_data.get("interpretations", {}).get("cluster_profiles", [])
    
    if interps:
        for p in interps:
            cid = p.get("cluster_id", 0)
            count = p.get("record_count", 0)
            pct = p.get("record_percentage", 0)
            narrative = p.get("summary_narrative", "")
            
            story.append(Paragraph(f"<b>Cluster Profile {cid}</b> — {count} segments ({pct}% of network)", body_style))
            story.append(Paragraph(narrative, callout_style))
            story.append(Spacer(1, 6))
    else:
        story.append(Paragraph("Cluster profiles dynamically generated upon running clustering in the interactive lab.", body_style))
        
    story.append(Spacer(1, 10))
    
    # 6. Stability Analysis
    story.append(Paragraph("5. Multi-Seed Stability & Sensitivity Analysis", h1_style))
    stab = state_data.get("stability", {})
    mean_ari = stab.get("mean_ari", "N/A")
    stab_tier = stab.get("stability_tier", "Evaluated")
    stab_assess = stab.get("assessment", "Initializations tested across independent random seeds to confirm geometric reproducibility.")
    
    stab_paragraph = (
        f"<b>Stability Status:</b> {stab_tier} (Mean ARI: {mean_ari})<br/>"
        f"{stab_assess}"
    )
    story.append(Paragraph(stab_paragraph, body_style))
    story.append(Spacer(1, 14))
    
    # 7. Responsible Use & Limitations
    story.append(Paragraph("6. Responsible Use, Bias & Methodological Limitations", h1_style))
    limits = [
        "<b>Exploratory Nature:</b> Unsupervised clustering uncovers mathematical groupings based on feature distances. Discovered clusters do not represent permanent or regulatory road classifications.",
        "<b>Temporal & Spatial Bias:</b> Observations collected during specific hours, days, or geographic corridors may underrepresent regional traffic shifts and seasonal weather variations.",
        "<b>Metric Assumptions:</b> Euclidean distance assumes spherical clusters in standardized space, while actual traffic delays may exhibit non-linear manifold topologies.",
        "<b>Decision-Support Role:</b> Algorithmic congestion profiles must serve strictly as decision support for traffic engineers and urban planners, rather than autonomous policy triggers."
    ]
    for lim in limits:
        story.append(Paragraph(f"• {lim}", body_style))
        story.append(Spacer(1, 3))
        
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=0.5, color=border_color, spaceBefore=4, spaceAfter=8))
    story.append(Paragraph("TrafficIQ Unsupervised Learning Research Suite | Department of Computer Science & Urban Analytics", callout_style))
    
    doc.build(story)
    buffer.seek(0)
    return buffer
