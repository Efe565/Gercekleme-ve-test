import React from 'react';

export default function RadarChart({ domains, overallBpi }) {
  // 5 axes: speed, memory, attention, flexibility, problemSolving
  const axes = [
    { key: 'speed', label: 'Hız', color: '#FF9A00' },
    { key: 'memory', label: 'Hafıza', color: '#7B4CE6' },
    { key: 'attention', label: 'Dikkat', color: '#0091FF' },
    { key: 'flexibility', label: 'Esneklik', color: '#E83D84' },
    { key: 'problemSolving', label: 'Problem Çözme', color: '#00B894' }
  ];

  const size = 300;
  const center = size / 2;
  const radius = 105;
  const totalAxes = axes.length;

  // Normalized score calculation (scale 900 -> 1200 BPI into 0.2 -> 1.0 radius)
  const normalize = (bpi) => {
    const min = 950;
    const max = 1200;
    const clamped = Math.max(min, Math.min(max, bpi));
    return 0.3 + 0.7 * ((clamped - min) / (max - min));
  };

  // Convert polar coordinates to cartesian x,y
  const getCoordinates = (axisIndex, factor) => {
    // Start from top (-PI/2)
    const angle = (Math.PI * 2 / totalAxes) * axisIndex - Math.PI / 2;
    const r = radius * factor;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Generate web concentric polygon rings (25%, 50%, 75%, 100%)
  const rings = [0.25, 0.5, 0.75, 1.0];

  // User polygon points
  const userPoints = axes.map((axis, i) => {
    const domainData = domains[axis.key] || { bpi: 1000 };
    const factor = normalize(domainData.bpi);
    const coords = getCoordinates(i, factor);
    return `${coords.x},${coords.y}`;
  }).join(' ');

  // Peer baseline points (1000 BPI average)
  const peerPoints = axes.map((_, i) => {
    const factor = normalize(1000);
    const coords = getCoordinates(i, factor);
    return `${coords.x},${coords.y}`;
  }).join(' ');

  return (
    <div className="radar-chart-container">
      <svg viewBox={`0 0 ${size} ${size}`} className="radar-svg">
        <defs>
          <linearGradient id="userRadarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FA6432" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#7B4CE6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0091FF" stopOpacity="0.25" />
          </linearGradient>
          <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#FA6432" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Concentric Grid Webs */}
        {rings.map((ringFactor, rIdx) => {
          const ringPoints = axes.map((_, i) => {
            const coords = getCoordinates(i, ringFactor);
            return `${coords.x},${coords.y}`;
          }).join(' ');
          return (
            <polygon
              key={rIdx}
              points={ringPoints}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1.2"
              strokeDasharray={rIdx < 3 ? '3 3' : 'none'}
            />
          );
        })}

        {/* Radial Axis Spokes */}
        {axes.map((axis, i) => {
          const edgeCoords = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={edgeCoords.x}
              y2={edgeCoords.y}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1"
            />
          );
        })}

        {/* Peer Baseline Polygon (Dashed Slate) */}
        <polygon
          points={peerPoints}
          fill="rgba(148, 163, 184, 0.06)"
          stroke="rgba(148, 163, 184, 0.4)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* User BPI Polygon */}
        <polygon
          points={userPoints}
          fill="url(#userRadarGrad)"
          stroke="#FA6432"
          strokeWidth="2.5"
          filter="url(#radarGlow)"
        />

        {/* Node Points on User Polygon */}
        {axes.map((axis, i) => {
          const domainData = domains[axis.key] || { bpi: 1000 };
          const coords = getCoordinates(i, normalize(domainData.bpi));
          return (
            <g key={i}>
              <circle
                cx={coords.x}
                cy={coords.y}
                r="5"
                fill="#0F172A"
                stroke={axis.color}
                strokeWidth="2.5"
              />
              <circle
                cx={coords.x}
                cy={coords.y}
                r="2"
                fill="#FFFFFF"
              />
            </g>
          );
        })}

        {/* Axis Labels Around Radar */}
        {axes.map((axis, i) => {
          const labelCoords = getCoordinates(i, 1.25);
          const domainData = domains[axis.key] || { bpi: 1000 };
          return (
            <text
              key={i}
              x={labelCoords.x}
              y={labelCoords.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="radar-label"
              fill={axis.color}
              fontSize="11"
              fontWeight="700"
            >
              {axis.label} ({domainData.bpi})
            </text>
          );
        })}
      </svg>

      <div className="radar-legend">
        <div className="legend-item">
          <span className="legend-dot user-dot" />
          <span>Sizin Bilişsel Profiliniz</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot peer-dot" />
          <span>Akran Ortalaması (1000)</span>
        </div>
      </div>
    </div>
  );
}
