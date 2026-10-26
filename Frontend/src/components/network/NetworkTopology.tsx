import React, { useState } from 'react';
import { ChargingRegion } from '../../types/station';
import { StatusChip } from '../ui/StatusChip';

interface NetworkTopologyProps {
  regions: ChargingRegion[];
  isAttackMode: boolean;
  onRegionClick: (region: ChargingRegion) => void;
}

/**
 * Premium SVG-based EV Charging Network Topology.
 *
 * Central node: EVShield Security Layer (SOC AI)
 * Surrounding nodes: 5 regional charging hubs with smooth interactive hover,
 * connector brightening, slow ambient pulses, and direct Kokonut Flick Card launch.
 */
export const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  regions,
  isAttackMode,
  onRegionClick,
}) => {
  const CENTER = { x: 300, y: 265 };
  const SVG_W = 600;
  const SVG_H = 500;
  const NODE_R = 28;

  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const getNodeColor = (region: ChargingRegion) => {
    if (region.underAttack > 0) return '#FB7185';
    if (region.degraded > 0) return '#FBBF24';
    return '#34D399';
  };

  const getNodeGlow = (region: ChargingRegion) => {
    if (region.underAttack > 0) return 'rgba(251, 113, 133, 0.40)';
    if (region.degraded > 0) return 'rgba(251, 191, 36, 0.35)';
    return 'rgba(52, 211, 153, 0.30)';
  };

  return (
    <div className="glass-card rounded-[32px] p-6 sm:p-8 shadow-glass border border-[#C4B5FD]/16 space-y-5 bg-[#0F0F1E]/80 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-bold text-[#F5F3FF]">Network Topology</h3>
            <span className="px-2 py-0.5 rounded-full bg-[#8055F6]/20 border border-[#8055F6]/35 text-[10px] font-mono text-[#C4B5FD]">
              LIVE MESH
            </span>
          </div>
          <p className="text-xs text-[#C4C2D6] mt-1">
            EV charging authentication gateway connectivity — click any circular node to inspect via Kokonut Flick Card
          </p>
        </div>
        <StatusChip
          label={isAttackMode ? 'ATTACK ACTIVE' : 'ALL SYSTEMS GO'}
          variant={isAttackMode ? 'attack' : 'protected'}
          dot
          pulse={isAttackMode}
        />
      </div>

      {/* SVG Topology */}
      <div className="w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full max-w-[720px] mx-auto overflow-visible"
          style={{ minHeight: 340 }}
          aria-label="EV charging network topology diagram"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="centerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1A1A36" />
              <stop offset="100%" stopColor="#101024" />
            </linearGradient>

            <linearGradient id="lineGradHealthy" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8055F6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="lineGradAttack" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8055F6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FB7185" stopOpacity="0.95" />
            </linearGradient>

            {/* Drop Shadows */}
            <filter id="topoNodeShadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.55" />
            </filter>
            <filter id="topoGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Connection lines from center to each region */}
          {regions.map((region) => {
            const isUnderAttack = region.underAttack > 0;
            const isHovered = hoveredRegion === region.id;
            const lineColor = isUnderAttack ? '#FB7185' : isHovered ? '#38BDF8' : '#34D399';

            return (
              <g key={`line-${region.id}`}>
                {/* Background glow line on hover */}
                {isHovered && (
                  <line
                    x1={CENTER.x}
                    y1={CENTER.y}
                    x2={region.svgX}
                    y2={region.svgY}
                    stroke={lineColor}
                    strokeWidth={5}
                    strokeOpacity={0.25}
                    strokeLinecap="round"
                  />
                )}

                <line
                  x1={CENTER.x}
                  y1={CENTER.y}
                  x2={region.svgX}
                  y2={region.svgY}
                  stroke={isUnderAttack ? 'url(#lineGradAttack)' : isHovered ? '#38BDF8' : 'url(#lineGradHealthy)'}
                  strokeWidth={isHovered ? 2.5 : isUnderAttack ? 2 : 1.5}
                  strokeOpacity={isHovered ? 0.95 : isUnderAttack ? 0.75 : 0.40}
                  strokeDasharray={isUnderAttack ? '6 4' : isHovered ? 'none' : '4 4'}
                  style={{ transition: 'stroke-opacity 0.25s, stroke-width 0.25s' }}
                />

                {/* Animated signal particle */}
                <circle r={isHovered ? 4.5 : 3.5} fill={lineColor} opacity={isHovered ? 1 : 0.8}>
                  <animateMotion
                    dur={isUnderAttack ? '0.9s' : isHovered ? '1.8s' : '3.0s'}
                    repeatCount="indefinite"
                    path={`M${CENTER.x},${CENTER.y} L${region.svgX},${region.svgY}`}
                  />
                </circle>
              </g>
            );
          })}

          {/* Central EVShield Security Layer Node */}
          <g filter="url(#topoNodeShadow)">
            {/* Ambient slow pulse ring */}
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="58"
              fill="none"
              stroke="#8055F6"
              strokeWidth="1"
              strokeOpacity="0.4"
            >
              <animate attributeName="r" values="52;62;52" dur="5s" repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" values="0.4;0.1;0.4" dur="5s" repeatCount="indefinite" />
            </circle>

            {/* Outer central card */}
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="48"
              fill="url(#centerGrad)"
              stroke="#9B7BFF"
              strokeWidth="2"
            />
            {/* Inner glowing core */}
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="36"
              fill="rgba(155, 123, 255, 0.12)"
              stroke="rgba(155, 123, 255, 0.35)"
              strokeWidth="1.5"
            >
              <animate attributeName="r" values="36;39;36" dur="3.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.7;1" dur="3.5s" repeatCount="indefinite" />
            </circle>
          </g>

          <text
            x={CENTER.x}
            y={CENTER.y - 8}
            textAnchor="middle"
            fontSize="10"
            fontWeight="800"
            fill="#F5F3FF"
            fontFamily="JetBrains Mono, monospace"
          >
            EVShield
          </text>
          <text
            x={CENTER.x}
            y={CENTER.y + 6}
            textAnchor="middle"
            fontSize="8"
            fill="#C4C2D6"
            fontFamily="JetBrains Mono, monospace"
          >
            Core Mesh
          </text>
          <text
            x={CENTER.x}
            y={CENTER.y + 19}
            textAnchor="middle"
            fontSize="7.5"
            fontWeight="700"
            fill="#4DD9F0"
            fontFamily="JetBrains Mono, monospace"
          >
            ACTIVE
          </text>

          {/* Region circular nodes */}
          {regions.map((region) => {
            const nodeColor = getNodeColor(region);
            const glowColor = getNodeGlow(region);
            const isUnderAttack = region.underAttack > 0;
            const isHovered = hoveredRegion === region.id;

            return (
              <g
                key={region.id}
                onClick={() => onRegionClick(region)}
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                onFocus={() => setHoveredRegion(region.id)}
                onBlur={() => setHoveredRegion(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRegionClick(region);
                  }
                }}
                tabIndex={0}
                style={{ cursor: 'pointer', outline: 'none' }}
                role="button"
                aria-label={`${region.label} charging region: ${region.totalStations} stations. Click to view 3D Flick Card.`}
                className="group"
              >
                {/* Glow halo */}
                <circle
                  cx={region.svgX}
                  cy={region.svgY}
                  r={isHovered ? NODE_R + 18 : NODE_R + 10}
                  fill={glowColor}
                  opacity={isHovered ? 0.9 : 0.55}
                  style={{ transition: 'all 0.25s ease' }}
                >
                  {isUnderAttack && (
                    <animate
                      attributeName="r"
                      values={`${NODE_R + 10};${NODE_R + 18};${NODE_R + 10}`}
                      dur="1.4s"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>

                {/* Main circular node */}
                <circle
                  cx={region.svgX}
                  cy={region.svgY}
                  r={isHovered ? NODE_R + 2 : NODE_R}
                  fill="#14142B"
                  stroke={nodeColor}
                  strokeWidth={isHovered ? 3 : 2}
                  filter="url(#topoNodeShadow)"
                  style={{ transition: 'all 0.25s ease' }}
                >
                  {isUnderAttack && (
                    <animate
                      attributeName="stroke-opacity"
                      values="1;0.4;1"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>

                {/* City label inside circular node */}
                <text
                  x={region.svgX}
                  y={region.svgY - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="800"
                  fill="#F5F3FF"
                  fontFamily="JetBrains Mono, monospace"
                  style={{ pointerEvents: 'none' }}
                >
                  {region.label}
                </text>
                <text
                  x={region.svgX}
                  y={region.svgY + 9}
                  textAnchor="middle"
                  fontSize="7"
                  fill={nodeColor}
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                  style={{ pointerEvents: 'none' }}
                >
                  {region.underAttack > 0 ? '⚠ ATTACK' : region.degraded > 0 ? 'DEGRADED' : 'OK'}
                </text>

                {/* Station count pill below circle */}
                <text
                  x={region.svgX}
                  y={region.svgY + NODE_R + 20}
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="600"
                  fill={isHovered ? '#F5F3FF' : '#C4C2D6'}
                  fontFamily="JetBrains Mono, monospace"
                  style={{ pointerEvents: 'none', transition: 'fill 0.2s' }}
                >
                  {region.totalStations} stations
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Hint */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-[#C4C2D6] pt-3 border-t border-[#C4B5FD]/16">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#34D399]" />
            <span>Protected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#FBBF24]" />
            <span>Degraded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#FB7185] animate-pulse" />
            <span>Under Attack</span>
          </div>
        </div>

        <div className="text-[10px] text-[#9896B0] flex items-center gap-1">
          <span>● Click circular node to open</span>
          <span className="text-[#C4B5FD] font-semibold">Kokonut 3D Flick Card</span>
        </div>
      </div>
    </div>
  );
};
