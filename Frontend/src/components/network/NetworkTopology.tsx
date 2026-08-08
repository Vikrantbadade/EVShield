import React from 'react';
import { ChargingRegion } from '../../types/station';
import { StatusChip } from '../ui/StatusChip';

interface NetworkTopologyProps {
  regions: ChargingRegion[];
  isAttackMode: boolean;
  onRegionClick: (region: ChargingRegion) => void;
}

/**
 * SVG-based EV charging network topology.
 *
 * Central node: EVShield Security Layer (SOC AI)
 * Surrounding nodes: 5 regional charging zones
 * Connection lines animate with travelling particles.
 * Under attack: Mumbai node pulses soft coral/red.
 */
export const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  regions,
  isAttackMode,
  onRegionClick,
}) => {
  const CENTER = { x: 250, y: 230 };
  const SVG_W = 500;
  const SVG_H = 460;

  const getNodeColor = (region: ChargingRegion) => {
    if (region.underAttack > 0) return '#E85C68';
    if (region.degraded > 0) return '#D99A32';
    return '#19BFA3';
  };

  const getNodeGlow = (region: ChargingRegion) => {
    if (region.underAttack > 0) return 'rgba(232,92,104,0.35)';
    if (region.degraded > 0) return 'rgba(217,154,50,0.30)';
    return 'rgba(25,191,163,0.25)';
  };

  return (
    <div className="glass-cream rounded-[32px] p-6 sm:p-8 shadow-glass border border-white/90 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#3F3832]">Network Topology</h3>
          <p className="text-xs text-[#514940] mt-1">EV charging authentication gateway connectivity — click a region to inspect</p>
        </div>
        <StatusChip label={isAttackMode ? 'ATTACK ACTIVE' : 'ALL SYSTEMS GO'} variant={isAttackMode ? 'critical' : 'protected'} dot pulse />
      </div>

      {/* SVG Topology */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full max-w-[600px] mx-auto"
          style={{ minHeight: 260 }}
          aria-label="EV charging network topology diagram"
        >
          <defs>
            {/* Animated particle for normal connections */}
            <marker id="arrowNormal" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <circle cx="3" cy="3" r="2" fill="#19BFA3" opacity="0.6" />
            </marker>
            <marker id="arrowAttack" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <circle cx="3" cy="3" r="2" fill="#E85C68" opacity="0.8" />
            </marker>
            {/* Drop shadows */}
            <filter id="nodeShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.12" />
            </filter>
            <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Connection lines from center to each region */}
          {regions.map((region) => {
            const isUnderAttack = region.underAttack > 0;
            const lineColor = isUnderAttack ? '#E85C68' : region.degraded > 0 ? '#D99A32' : '#19BFA3';
            return (
              <g key={`line-${region.id}`}>
                {/* Base line */}
                <line
                  x1={CENTER.x} y1={CENTER.y}
                  x2={region.svgX} y2={region.svgY}
                  stroke={lineColor}
                  strokeWidth={isUnderAttack ? 2 : 1.5}
                  strokeOpacity={isUnderAttack ? 0.6 : 0.30}
                  strokeDasharray={isUnderAttack ? '6 4' : 'none'}
                />

                {/* Travelling particle */}
                <circle r="3" fill={lineColor} opacity="0.8">
                  <animateMotion
                    dur={isUnderAttack ? '0.8s' : '3s'}
                    repeatCount="indefinite"
                    path={`M${CENTER.x},${CENTER.y} L${region.svgX},${region.svgY}`}
                  />
                </circle>
              </g>
            );
          })}

          {/* Central EVShield Security Layer node */}
          <g filter="url(#nodeShadow)">
            <circle cx={CENTER.x} cy={CENTER.y} r="42" fill="rgba(255,251,233,0.90)" stroke="rgba(173,139,115,0.50)" strokeWidth="2" />
            <circle cx={CENTER.x} cy={CENTER.y} r="32" fill="rgba(25,191,163,0.12)" stroke="rgba(25,191,163,0.35)" strokeWidth="1.5">
              <animate attributeName="r" values="32;35;32" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.7;1" dur="4s" repeatCount="indefinite" />
            </circle>
          </g>
          <text x={CENTER.x} y={CENTER.y - 6} textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#3F3832" fontFamily="JetBrains Mono, monospace">EVShield</text>
          <text x={CENTER.x} y={CENTER.y + 6} textAnchor="middle" fontSize="7" fill="#7A7067" fontFamily="JetBrains Mono, monospace">Security Layer</text>
          <text x={CENTER.x} y={CENTER.y + 16} textAnchor="middle" fontSize="6.5" fill="#19BFA3" fontFamily="JetBrains Mono, monospace">SOC AI</text>

          {/* Region nodes */}
          {regions.map((region) => {
            const nodeColor = getNodeColor(region);
            const glowColor = getNodeGlow(region);
            const isUnderAttack = region.underAttack > 0;

            return (
              <g
                key={region.id}
                onClick={() => onRegionClick(region)}
                style={{ cursor: 'pointer' }}
                role="button"
                aria-label={`${region.label} charging region`}
              >
                {/* Glow halo */}
                <circle
                  cx={region.svgX} cy={region.svgY} r="30"
                  fill={glowColor}
                  opacity="0.5"
                >
                  {isUnderAttack && (
                    <animate attributeName="r" values="28;35;28" dur="1.2s" repeatCount="indefinite" />
                  )}
                </circle>

                {/* Main node */}
                <circle
                  cx={region.svgX} cy={region.svgY} r="22"
                  fill="rgba(255,251,233,0.88)"
                  stroke={nodeColor}
                  strokeWidth="2"
                  filter="url(#nodeShadow)"
                >
                  {isUnderAttack && (
                    <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
                  )}
                </circle>

                {/* Region label */}
                <text x={region.svgX} y={region.svgY - 3} textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#3F3832" fontFamily="JetBrains Mono, monospace">{region.label}</text>
                <text x={region.svgX} y={region.svgY + 8} textAnchor="middle" fontSize="6.5" fill={nodeColor} fontFamily="JetBrains Mono, monospace">
                  {region.underAttack > 0 ? '⚠ ATTACK' : region.degraded > 0 ? 'DEGRADED' : 'PROTECTED'}
                </text>

                {/* Station count below node */}
                <text x={region.svgX} y={region.svgY + 38} textAnchor="middle" fontSize="6" fill="#7A7067" fontFamily="JetBrains Mono, monospace">{region.totalStations} stations</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 text-[11px] font-mono text-[#7A7067] pt-2 border-t border-[#AD8B73]/15">
        {[
          { color: '#19BFA3', label: 'Protected' },
          { color: '#D99A32', label: 'Degraded' },
          { color: '#E85C68', label: 'Under Attack' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
            {label}
          </div>
        ))}
        <div className="text-[#7A7067]">● Click a node to inspect region</div>
      </div>
    </div>
  );
};
