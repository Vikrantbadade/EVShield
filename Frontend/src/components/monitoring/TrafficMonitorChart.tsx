import React, { useState, useMemo, useEffect, useRef } from 'react';
import { curveMonotoneX } from '@visx/curve';
import { Activity, Clock, RotateCcw } from 'lucide-react';
import { TrafficDataPoint } from '../../types';
import { StatusChip } from '../ui/StatusChip';
import { formatTime } from '../../utils/dateTime';
import {
  AreaChart,
  Grid,
  Area,
  SegmentBackground,
  SegmentLineFrom,
  SegmentLineTo,
  XAxis,
  ChartTooltip,
} from '../ui/AreaChart';

interface TrafficMonitorChartProps {
  trafficData: TrafficDataPoint[];
  isAttackMode: boolean;
}

export const TrafficMonitorChart: React.FC<TrafficMonitorChartProps> = ({ trafficData, isAttackMode }) => {
  const baselineValue = 12;
  const thresholdValue = 50;

  // Transform incoming telemetry
  const chartData = useMemo(() => {
    if (!trafficData || trafficData.length === 0) {
      return [
        {
          timestamp: '14:00',
          requests: 12,
          baseline: baselineValue,
          threshold: thresholdValue,
          isAnomaly: false,
        },
      ];
    }

    return trafficData.map((d) => ({
      timestamp: formatTime(d.timestamp),
      requests: d.requests,
      baseline: baselineValue,
      threshold: thresholdValue,
      isAnomaly: d.isAnomaly ?? (d.requests >= thresholdValue || (isAttackMode && d.requests > 25)),
    }));
  }, [trafficData, isAttackMode]);

  // Window / Segment Selection State
  // Presets: 'all' | '15m' | '5m' | 'peak' | 'custom'
  const [selectedPreset, setSelectedPreset] = useState<'all' | '15m' | '5m' | 'peak' | 'custom'>('15m');
  const [segmentRange, setSegmentRange] = useState<[number, number] | null>(null);
  const prevDataLengthRef = useRef(chartData.length);

  // Sync segment range when data length changes without jittering
  useEffect(() => {
    const total = chartData.length;
    if (total <= 1) {
      setSegmentRange(null);
      return;
    }

    if (selectedPreset === 'all') {
      setSegmentRange(null);
    } else if (selectedPreset === '5m') {
      const windowSize = Math.min(total, 5);
      setSegmentRange([Math.max(0, total - windowSize), total - 1]);
    } else if (selectedPreset === '15m') {
      const windowSize = Math.min(total, 12);
      setSegmentRange([Math.max(0, total - windowSize), total - 1]);
    } else if (selectedPreset === 'peak') {
      let maxIdx = 0;
      let maxVal = -1;
      chartData.forEach((d, i) => {
        if (d.requests > maxVal) {
          maxVal = d.requests;
          maxIdx = i;
        }
      });
      const from = Math.max(0, maxIdx - 2);
      const to = Math.min(total - 1, maxIdx + 2);
      setSegmentRange([from, to]);
    } else if (selectedPreset === 'custom' && segmentRange) {
      // Keep segment relative if new telemetry arrives
      const diff = total - prevDataLengthRef.current;
      if (diff > 0) {
        setSegmentRange((prev) => {
          if (!prev) return null;
          const [from, to] = prev;
          return [
            Math.min(total - 2, from + diff),
            Math.min(total - 1, to + diff),
          ];
        });
      }
    }
    prevDataLengthRef.current = total;
  }, [chartData, selectedPreset, segmentRange]);

  const handleSelectPreset = (preset: 'all' | '15m' | '5m' | 'peak') => {
    setSelectedPreset(preset);
    const total = chartData.length;
    if (preset === 'all') {
      setSegmentRange(null);
    } else if (preset === '5m') {
      const windowSize = Math.min(total, 5);
      setSegmentRange([Math.max(0, total - windowSize), total - 1]);
    } else if (preset === '15m') {
      const windowSize = Math.min(total, 12);
      setSegmentRange([Math.max(0, total - windowSize), total - 1]);
    } else if (preset === 'peak') {
      let maxIdx = 0;
      let maxVal = -1;
      chartData.forEach((d, i) => {
        if (d.requests > maxVal) {
          maxVal = d.requests;
          maxIdx = i;
        }
      });
      const from = Math.max(0, maxIdx - 2);
      const to = Math.min(total - 1, maxIdx + 2);
      setSegmentRange([from, to]);
    }
  };

  const handleCustomSegmentChange = (range: [number, number] | null) => {
    setSegmentRange(range);
    if (range) {
      setSelectedPreset('custom');
    } else {
      setSelectedPreset('all');
    }
  };

  // Current values for KPI summary
  const currentVal = chartData.length > 0 ? chartData[chartData.length - 1].requests : 0;
  const isCurrentlyAnomalous = isAttackMode || currentVal >= thresholdValue;

  return (
    <div className="glass-card rounded-[32px] p-6 sm:p-8 space-y-6 border border-[#C4B5FD]/16 bg-[#111122]/90 shadow-2xl relative overflow-hidden">
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 text-[#4DD9F0]">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F3FF] tracking-tight">
              EV Charging Authentication Traffic
            </h3>
          </div>
          <p className="text-xs text-[#C4C2D6] mt-1">
            Live auth request throughput vs expected baseline and ML volumetric threshold
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusChip
            label={isCurrentlyAnomalous ? 'ATTACK DETECTED' : 'NORMAL TRAFFIC'}
            variant={isCurrentlyAnomalous ? 'attack' : 'live'}
            pulse={isCurrentlyAnomalous}
          />
        </div>
      </div>

      {/* 2. Interactive Time-Window Controls & Legends */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-1 border-t border-[#C4B5FD]/10">
        {/* Legends */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-2 rounded-sm inline-block ${
                isCurrentlyAnomalous ? 'bg-[#FB7185]' : 'bg-[#4DD9F0]'
              }`}
            />
            <span className="text-[#C4C2D6]">
              Observed Traffic <span className="text-[10px] text-[#9896B0]">(req/s)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 border-b-2 border-dashed border-[#9B7BFF] inline-block" />
            <span className="text-[#9B7BFF]">
              Baseline <span className="text-[10px] text-[#9896B0]">({baselineValue} req/s)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 border-b-2 border-dashed border-[#FBBF24] inline-block" />
            <span className="text-[#FBBF24]">
              Threshold <span className="text-[10px] text-[#9896B0]">({thresholdValue} req/s)</span>
            </span>
          </div>
        </div>

        {/* Time Window Segment Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#1C1C35] border border-[#C4B5FD]/16 text-xs font-mono">
          <span className="text-[10px] text-[#9896B0] px-2 flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#C4B5FD]" />
            Window:
          </span>

          <button
            type="button"
            onClick={() => handleSelectPreset('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
              selectedPreset === 'all'
                ? 'bg-[#9B7BFF] text-[#0F0F1E] font-bold shadow-sm'
                : 'text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252545]'
            }`}
          >
            Full
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('15m')}
            className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
              selectedPreset === '15m'
                ? 'bg-[#9B7BFF] text-[#0F0F1E] font-bold shadow-sm'
                : 'text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252545]'
            }`}
          >
            15m
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('5m')}
            className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
              selectedPreset === '5m'
                ? 'bg-[#9B7BFF] text-[#0F0F1E] font-bold shadow-sm'
                : 'text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252545]'
            }`}
          >
            5m
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('peak')}
            className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
              selectedPreset === 'peak'
                ? 'bg-[#FBBF24] text-[#0F0F1E] font-bold shadow-sm'
                : 'text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252545]'
            }`}
          >
            Peak
          </button>

          {segmentRange && (
            <button
              type="button"
              onClick={() => handleSelectPreset('all')}
              title="Reset Segment Selection"
              className="px-1.5 py-1 text-[#9896B0] hover:text-[#FB7185] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. BKlit UI Interactive Area Chart */}
      <div className="w-full relative group">
        <AreaChart
          aspectRatio="4 / 1"
          data={chartData}
          segmentRange={segmentRange}
          onSegmentChange={handleCustomSegmentChange}
          className="rounded-2xl bg-[#0F0F20]/70 border border-[#C4B5FD]/12 p-1"
        >
          {/* Subtle horizontal grid lines */}
          <Grid horizontal stroke="rgba(196, 181, 253, 0.08)" />

          {/* Observed Authentication Traffic Area */}
          <Area
            curve={curveMonotoneX}
            dataKey="requests"
            fill={isCurrentlyAnomalous ? '#FB7185' : '#4DD9F0'}
            stroke={isCurrentlyAnomalous ? '#FB7185' : '#4DD9F0'}
            fillOpacity={0.24}
            strokeWidth={2.5}
          />

          {/* Expected Baseline Reference Area */}
          <Area
            curve={curveMonotoneX}
            dataKey="baseline"
            fill="#9B7BFF"
            stroke="#9B7BFF"
            fillOpacity={0.06}
            strokeWidth={1.5}
            strokeDasharray="6 4"
            showPoints={false}
          />

          {/* Detection Threshold Boundary Area */}
          <Area
            curve={curveMonotoneX}
            dataKey="threshold"
            fill="none"
            stroke="#FBBF24"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            showPoints={false}
          />

          {/* Interactive Segment Selection */}
          <SegmentBackground fill="rgba(155, 123, 255, 0.14)" stroke="rgba(155, 123, 255, 0.45)" />
          <SegmentLineFrom color="#9B7BFF" label="From" />
          <SegmentLineTo color="#9B7BFF" label="To" />

          {/* Timestamp X-Axis */}
          <XAxis dataKey="timestamp" ticksCount={7} />

          {/* Interactive Floating Hover Tooltip */}
          <ChartTooltip
            fields={[
              {
                key: 'requests',
                label: 'Observed Auth',
                color: isCurrentlyAnomalous ? '#FB7185' : '#4DD9F0',
              },
              {
                key: 'baseline',
                label: 'Expected Baseline',
                color: '#9B7BFF',
              },
              {
                key: 'threshold',
                label: 'ML Threshold',
                color: '#FBBF24',
              },
            ]}
          />
        </AreaChart>

        {/* Drag Hint on Hover */}
        <div className="absolute right-4 bottom-2 text-[9px] font-mono text-[#9896B0]/60 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          Click and drag horizontally to select custom time range
        </div>
      </div>

      {/* 4. Telemetry Metrics Row (Preserved as required) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3.5 rounded-2xl bg-[#1C1C35]/90 border border-[#C4B5FD]/16 shadow-sm hover:border-[#4DD9F0]/30 transition-all">
          <div className="text-[10px] font-mono text-[#9896B0] uppercase tracking-wider">
            Observed Current
          </div>
          <div
            className={`text-xl font-bold font-mono mt-1 ${
              isCurrentlyAnomalous ? 'text-[#FB7185]' : 'text-[#4DD9F0]'
            }`}
          >
            {currentVal} <span className="text-xs font-normal text-[#9896B0]">req/s</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#1C1C35]/90 border border-[#C4B5FD]/16 shadow-sm hover:border-[#9B7BFF]/30 transition-all">
          <div className="text-[10px] font-mono text-[#9896B0] uppercase tracking-wider">
            Baseline Expected
          </div>
          <div className="text-xl font-bold font-mono text-[#9B7BFF] mt-1">
            {baselineValue} <span className="text-xs font-normal text-[#9896B0]">req/s</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#1C1C35]/90 border border-[#C4B5FD]/16 shadow-sm hover:border-[#FBBF24]/30 transition-all">
          <div className="text-[10px] font-mono text-[#9896B0] uppercase tracking-wider">
            Detection Threshold
          </div>
          <div className="text-xl font-bold font-mono text-[#FBBF24] mt-1">
            {thresholdValue} <span className="text-xs font-normal text-[#9896B0]">req/s</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#1C1C35]/90 border border-[#C4B5FD]/16 shadow-sm hover:border-[#34D399]/30 transition-all">
          <div className="text-[10px] font-mono text-[#9896B0] uppercase tracking-wider">
            Traffic State
          </div>
          <div
            className={`text-xl font-bold font-mono mt-1 ${
              isCurrentlyAnomalous ? 'text-[#FB7185]' : 'text-[#34D399]'
            }`}
          >
            {isCurrentlyAnomalous ? 'ANOMALOUS' : 'NOMINAL'}
          </div>
        </div>
      </div>
    </div>
  );
};
