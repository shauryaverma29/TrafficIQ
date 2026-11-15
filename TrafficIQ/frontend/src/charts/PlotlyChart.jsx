import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function PlotlyChart({ data = [], layout = {}, config = {}, style = {}, className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const defaultLayout = {
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: {
        family: 'Inter, system-ui, sans-serif',
        color: '#94A3B8', // slate-400
        size: 11,
      },
      margin: { t: 35, r: 25, b: 35, l: 45 },
      autosize: true,
      hoverlabel: {
        bgcolor: '#1E293B',
        bordercolor: '#38BDF8',
        font: { color: '#F8FAFC', family: 'Inter' }
      },
      ...layout,
    };

    const defaultConfig = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: 'trafficiq_plot',
        height: 600,
        width: 900,
        scale: 2
      },
      ...config,
    };

    Plotly.react(containerRef.current, data, defaultLayout, defaultConfig);

    const handleResize = () => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        Plotly.purge(containerRef.current);
      }
    };
  }, [data, layout, config]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: '320px', ...style }}
      className={className}
    />
  );
}
