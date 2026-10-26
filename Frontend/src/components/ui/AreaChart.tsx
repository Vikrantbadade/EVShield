import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { curveMonotoneX } from '@visx/curve';
import { area as d3Area, line as d3Line, CurveFactory } from 'd3-shape';

export interface ChartDataPoint {
  [key: string]: any;
}

interface AreaChartContextValue {
  data: ChartDataPoint[];
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  xScale: (index: number) => number;
  yScale: (val: number) => number;
  yMin: number;
  yMax: number;
  yTicks: number[];
  hoverIndex: number | null;
  setHoverIndex: (i: number | null) => void;
  segmentRange: [number, number] | null;
  setSegmentRange: (range: [number, number] | null | ((prev: [number, number] | null) => [number, number] | null)) => void;
  isDragging: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

const AreaChartContext = createContext<AreaChartContextValue | null>(null);

export const useAreaChart = () => {
  const ctx = useContext(AreaChartContext);
  if (!ctx) {
    throw new Error('useAreaChart must be used within an <AreaChart />');
  }
  return ctx;
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Root <AreaChart /> Component
// ─────────────────────────────────────────────────────────────────────────────
export interface AreaChartProps {
  data: ChartDataPoint[];
  aspectRatio?: string;
  className?: string;
  children: ReactNode;
  segmentRange?: [number, number] | null;
  onSegmentChange?: (range: [number, number] | null) => void;
  yDomain?: [number, number];
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  aspectRatio = '4 / 1',
  className = '',
  children,
  segmentRange: controlledSegment,
  onSegmentChange,
  yDomain,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 260 });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const [internalSegment, setInternalSegment] = useState<[number, number] | null>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const activeIndex =
    hoverIndex !== null
      ? Math.min(data.length - 1, Math.max(0, hoverIndex))
      : pinnedIndex !== null
      ? Math.min(data.length - 1, Math.max(0, pinnedIndex))
      : data.length > 0
      ? data.length - 1
      : null;
  const activeSegment = controlledSegment !== undefined ? controlledSegment : internalSegment;

  const handleSetSegment = (
    updater: [number, number] | null | ((prev: [number, number] | null) => [number, number] | null)
  ) => {
    const next = typeof updater === 'function' ? updater(activeSegment) : updater;
    if (onSegmentChange) {
      onSegmentChange(next);
    }
    setInternalSegment(next);
  };

  // Responsive container observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        // Parse aspect ratio or default to 260px height
        let h = 260;
        if (aspectRatio.includes('/')) {
          const [wRatio, hRatio] = aspectRatio.split('/').map((s) => parseFloat(s.trim()));
          if (wRatio > 0 && hRatio > 0) {
            h = Math.max(220, Math.min(360, (rect.width * hRatio) / wRatio));
          }
        }
        setDimensions({ width: rect.width, height: h });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [aspectRatio]);

  const padding = { top: 24, right: 24, bottom: 32, left: 52 };
  const innerWidth = Math.max(10, dimensions.width - padding.left - padding.right);
  const innerHeight = Math.max(10, dimensions.height - padding.top - padding.bottom);

  // Compute Scales
  const { yMin, yMax, yTicks } = useMemo(() => {
    if (yDomain) {
      const [min, max] = yDomain;
      const step = (max - min) / 4;
      return {
        yMin: min,
        yMax: max,
        yTicks: [min, min + step, min + step * 2, min + step * 3, max],
      };
    }

    if (data.length === 0) {
      return { yMin: 0, yMax: 60, yTicks: [0, 15, 30, 45, 60] };
    }

    let min = 0;
    let max = 60;
    data.forEach((d) => {
      Object.keys(d).forEach((k) => {
        if (typeof d[k] === 'number') {
          if (d[k] > max) max = d[k];
        }
      });
    });
    // Add 15% headroom
    max = Math.ceil(max * 1.15 / 10) * 10;
    const step = max / 4;
    return {
      yMin: min,
      yMax: max,
      yTicks: [0, Math.round(step), Math.round(step * 2), Math.round(step * 3), max],
    };
  }, [data, yDomain]);

  const xScale = (idx: number) => {
    if (data.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (idx / (data.length - 1)) * innerWidth;
  };

  const yScale = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    const ratio = (clamped - yMin) / (yMax - yMin || 1);
    return padding.top + innerHeight - ratio * innerHeight;
  };

  // Convert client coordinate to nearest data index
  const getIndexFromX = (clientX: number): number => {
    if (!containerRef.current || data.length === 0) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left - padding.left;
    const ratio = Math.max(0, Math.min(1, relX / innerWidth));
    return Math.round(ratio * (data.length - 1));
  };

  const handlePointerDown = (e: React.MouseEvent<Element> | React.PointerEvent<Element>) => {
    if (data.length < 2) return;
    const idx = getIndexFromX(e.clientX);
    setHoverIndex(idx);
    setDragStart(idx);
    setIsDragging(true);
  };

  const handleClick = (e: React.MouseEvent<Element>) => {
    if (data.length < 1) return;
    const idx = getIndexFromX(e.clientX);
    setPinnedIndex((prev) => (prev === idx ? null : idx));
    setHoverIndex(idx);
  };

  const handlePointerMove = (e: React.MouseEvent<Element> | React.PointerEvent<Element>) => {
    const idx = getIndexFromX(e.clientX);
    setHoverIndex(idx);

    if (isDragging && dragStart !== null) {
      const from = Math.min(dragStart, idx);
      const to = Math.max(dragStart, idx);
      if (to > from) {
        handleSetSegment([from, to]);
      }
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
    }
  };

  return (
    <AreaChartContext.Provider
      value={{
        data,
        width: dimensions.width,
        height: dimensions.height,
        padding,
        xScale,
        yScale,
        yMin,
        yMax,
        yTicks,
        hoverIndex: activeIndex,
        setHoverIndex,
        segmentRange: activeSegment,
        setSegmentRange: handleSetSegment,
        isDragging,
        containerRef,
      }}
    >
      <div
        ref={containerRef}
        className={`relative select-none overflow-hidden ${className}`}
        style={{ width: '100%', height: `${dimensions.height}px` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerLeave}
        onClick={handleClick}
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0 block w-full h-full"
        >
          {children}

          {/* Interactive Overlay to capture mouse scrubbing */}
          <rect
            x={padding.left}
            y={padding.top}
            width={innerWidth}
            height={dimensions.height - padding.top}
            fill="transparent"
            className="cursor-crosshair"
            style={{ pointerEvents: 'all' }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onClick={handleClick}
          />
        </svg>
      </div>
    </AreaChartContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. <Grid /> Component
// ─────────────────────────────────────────────────────────────────────────────
export interface GridProps {
  horizontal?: boolean;
  vertical?: boolean;
  stroke?: string;
  strokeDasharray?: string;
}

export const Grid: React.FC<GridProps> = ({
  horizontal = true,
  stroke = 'rgba(196, 181, 253, 0.08)',
  strokeDasharray = '4 4',
}) => {
  const { width, padding, yTicks, yScale } = useAreaChart();

  return (
    <g className="chart-grid">
      {horizontal &&
        yTicks.map((val) => {
          const y = yScale(val);
          return (
            <g key={`grid-y-${val}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke={stroke}
                strokeWidth={1}
                strokeDasharray={strokeDasharray}
              />
              <text
                x={padding.left - 10}
                y={y + 3.5}
                textAnchor="end"
                className="fill-[#9896B0] text-[10px] font-mono tracking-tight"
              >
                {val} r/s
              </text>
            </g>
          );
        })}
    </g>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. <Area /> Component
// ─────────────────────────────────────────────────────────────────────────────
export interface AreaProps {
  dataKey: string;
  curve?: CurveFactory;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  showPoints?: boolean;
}

export const Area: React.FC<AreaProps> = ({
  dataKey,
  curve = curveMonotoneX,
  fill = 'rgba(77, 217, 240, 0.22)',
  fillOpacity = 0.25,
  stroke,
  strokeWidth = 2,
  strokeDasharray,
  showPoints = true,
}) => {
  const { data, height, padding, xScale, yScale, hoverIndex } = useAreaChart();

  if (data.length === 0) return null;

  // Extract points
  const points = data.map((d, i) => ({
    x: xScale(i),
    y: yScale(typeof d[dataKey] === 'number' ? d[dataKey] : 0),
    val: d[dataKey],
  }));

  const bottomY = height - padding.bottom;

  // Build SVG path using d3Area and d3Line with curveMonotoneX
  const areaGenerator = d3Area<{ x: number; y: number }>()
    .x((p) => p.x)
    .y0(bottomY)
    .y1((p) => p.y)
    .curve(curve);

  const lineGenerator = d3Line<{ x: number; y: number }>()
    .x((p) => p.x)
    .y((p) => p.y)
    .curve(curve);

  const areaPath = areaGenerator(points) || '';
  const linePath = lineGenerator(points) || '';

  const actualStroke = stroke || fill;
  const gradientId = `area-grad-${dataKey}-${Math.random().toString(36).substr(2, 6)}`;

  return (
    <g className={`chart-area-${dataKey}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={actualStroke} stopOpacity={fillOpacity} />
          <stop offset="90%" stopColor={actualStroke} stopOpacity={0.02} />
          <stop offset="100%" stopColor={actualStroke} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Area Fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Top Stroke Line */}
      <path
        d={linePath}
        fill="none"
        stroke={actualStroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Hover Point Highlight */}
      {showPoints && hoverIndex !== null && hoverIndex >= 0 && hoverIndex < points.length && (
        <g>
          <circle
            cx={points[hoverIndex].x}
            cy={points[hoverIndex].y}
            r={5.5}
            fill={actualStroke}
            stroke="#11111F"
            strokeWidth={2}
            className="filter drop-shadow-[0_0_8px_rgba(77,217,240,0.6)]"
          />
        </g>
      )}
    </g>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. <SegmentBackground /> Component
// ─────────────────────────────────────────────────────────────────────────────
export interface SegmentBackgroundProps {
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
}

export const SegmentBackground: React.FC<SegmentBackgroundProps> = ({
  fill = 'rgba(155, 123, 255, 0.12)',
  stroke = 'rgba(155, 123, 255, 0.35)',
}) => {
  const { segmentRange, xScale, padding, height } = useAreaChart();

  if (!segmentRange) return null;
  const [fromIdx, toIdx] = segmentRange;
  const x1 = xScale(fromIdx);
  const x2 = xScale(toIdx);
  const segX = Math.min(x1, x2);
  const segW = Math.max(4, Math.abs(x2 - x1));
  const segY = padding.top;
  const segH = height - padding.top - padding.bottom;

  return (
    <g className="chart-segment-bg">
      <rect
        x={segX}
        y={segY}
        width={segW}
        height={segH}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
        strokeDasharray="4 2"
        rx={4}
        className="transition-all duration-150"
      />
    </g>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. <SegmentLineFrom /> Component
// ─────────────────────────────────────────────────────────────────────────────
export interface SegmentLineProps {
  color?: string;
  label?: string;
}

export const SegmentLineFrom: React.FC<SegmentLineProps> = ({
  color = '#9B7BFF',
  label = 'Start',
}) => {
  const { segmentRange, xScale, padding, height } = useAreaChart();
  if (!segmentRange) return null;

  const [fromIdx] = segmentRange;
  const x = xScale(fromIdx);
  const top = padding.top;
  const bottom = height - padding.bottom;

  return (
    <g className="chart-segment-line-from">
      <line
        x1={x}
        y1={top - 4}
        x2={x}
        y2={bottom}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
      {/* Top Grab Indicator */}
      <circle cx={x} cy={top - 4} r={4} fill={color} stroke="#11111F" strokeWidth={1.5} />
      <text
        x={x}
        y={top - 8}
        textAnchor="middle"
        className="fill-[#C4B5FD] text-[8px] font-mono font-semibold uppercase tracking-wider"
      >
        {label}
      </text>
    </g>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. <SegmentLineTo /> Component
// ─────────────────────────────────────────────────────────────────────────────
export const SegmentLineTo: React.FC<SegmentLineProps> = ({
  color = '#9B7BFF',
  label = 'End',
}) => {
  const { segmentRange, xScale, padding, height } = useAreaChart();
  if (!segmentRange) return null;

  const [, toIdx] = segmentRange;
  const x = xScale(toIdx);
  const top = padding.top;
  const bottom = height - padding.bottom;

  return (
    <g className="chart-segment-line-to">
      <line
        x1={x}
        y1={top - 4}
        x2={x}
        y2={bottom}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
      {/* Top Grab Indicator */}
      <circle cx={x} cy={top - 4} r={4} fill={color} stroke="#11111F" strokeWidth={1.5} />
      <text
        x={x}
        y={top - 8}
        textAnchor="middle"
        className="fill-[#C4B5FD] text-[8px] font-mono font-semibold uppercase tracking-wider"
      >
        {label}
      </text>
    </g>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. <XAxis /> Component
// ─────────────────────────────────────────────────────────────────────────────
export interface XAxisProps {
  dataKey?: string;
  format?: (val: any) => string;
  ticksCount?: number;
}

export const XAxis: React.FC<XAxisProps> = ({
  dataKey = 'timestamp',
  format = (val) => String(val),
  ticksCount = 6,
}) => {
  const { data, height, padding, xScale } = useAreaChart();
  if (data.length === 0) return null;

  // Pick evenly spaced indices
  const indices: number[] = [];
  const count = Math.min(ticksCount, data.length);
  if (count <= 1) {
    indices.push(0);
  } else {
    for (let i = 0; i < count; i++) {
      const idx = Math.round((i / (count - 1)) * (data.length - 1));
      if (!indices.includes(idx)) indices.push(idx);
    }
  }

  const y = height - padding.bottom + 18;

  return (
    <g className="chart-xaxis">
      {/* Baseline axis line */}
      <line
        x1={padding.left}
        y1={height - padding.bottom}
        x2={xScale(data.length - 1)}
        y2={height - padding.bottom}
        stroke="rgba(196, 181, 253, 0.12)"
        strokeWidth={1}
      />
      {indices.map((idx) => {
        const item = data[idx];
        const val = item ? item[dataKey] : '';
        const x = xScale(idx);
        return (
          <text
            key={`xaxis-${idx}`}
            x={x}
            y={y}
            textAnchor="middle"
            className="fill-[#9896B0] text-[10px] font-mono"
          >
            {format(val)}
          </text>
        );
      })}
    </g>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. <ChartTooltip /> Component
// ─────────────────────────────────────────────────────────────────────────────
export interface TooltipField {
  key: string;
  label: string;
  color?: string;
  format?: (val: any) => string;
}

export interface ChartTooltipProps {
  fields?: TooltipField[];
  titleKey?: string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  fields = [
    { key: 'requests', label: 'Observed Auth', color: '#4DD9F0' },
    { key: 'baseline', label: 'Expected Baseline', color: '#9B7BFF' },
    { key: 'threshold', label: 'Detection Threshold', color: '#FBBF24' },
  ],
  titleKey = 'timestamp',
}) => {
  const { data, hoverIndex, xScale, padding, height, width } = useAreaChart();

  if (hoverIndex === null || !data[hoverIndex]) return null;

  const currentItem = data[hoverIndex];
  const x = xScale(hoverIndex);
  const top = padding.top;
  const bottom = height - padding.bottom;

  // Tooltip positioning
  const isRightSide = x > width * 0.65;
  const tooltipLeft = Math.max(padding.left, isRightSide ? x - 195 : x + 16);
  const tooltipTop = Math.max(padding.top + 5, Math.min(height - padding.bottom - 130, 30));

  const cardHeight = fields.length * 20 + 52;

  return (
    <g className="chart-tooltip-container pointer-events-none">
      {/* Vertical crosshair line in SVG */}
      <line
        x1={x}
        y1={top}
        x2={x}
        y2={bottom}
        stroke="rgba(196, 181, 253, 0.45)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />

      {/* SVG Native Floating Glass Tooltip Card */}
      <g transform={`translate(${tooltipLeft}, ${tooltipTop})`}>
        {/* Backdrop Card */}
        <rect
          width={185}
          height={cardHeight}
          rx={12}
          fill="#14142B"
          fillOpacity={0.96}
          stroke="rgba(196, 181, 253, 0.3)"
          strokeWidth={1}
          className="filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
        />

        {/* Header: Time */}
        <text x={12} y={20} className="fill-[#9896B0] text-[10px] font-mono">
          Time:
        </text>
        <text
          x={173}
          y={20}
          textAnchor="end"
          className="fill-[#F5F3FF] text-[11px] font-mono font-bold"
        >
          {currentItem[titleKey]}
        </text>

        {/* Divider */}
        <line
          x1={12}
          y1={27}
          x2={173}
          y2={27}
          stroke="rgba(196, 181, 253, 0.15)"
          strokeWidth={1}
        />

        {/* Fields */}
        {fields.map((f, i) => {
          const val = currentItem[f.key];
          const formatted = f.format ? f.format(val) : `${val} req/s`;
          const rowY = 44 + i * 19;
          return (
            <g key={f.key}>
              <circle cx={16} cy={rowY - 3.5} r={3} fill={f.color || '#C4C2D6'} />
              <text x={24} y={rowY} className="fill-[#C4C2D6] text-[10px] font-mono">
                {f.label}:
              </text>
              <text
                x={173}
                y={rowY}
                textAnchor="end"
                fill={f.color || '#F5F3FF'}
                className="text-[11px] font-mono font-semibold"
              >
                {formatted}
              </text>
            </g>
          );
        })}

        {/* Status Row */}
        {currentItem.isAnomaly !== undefined && (
          <g transform={`translate(0, ${cardHeight - 16})`}>
            <line
              x1={12}
              y1={-8}
              x2={173}
              y2={-8}
              stroke="rgba(196, 181, 253, 0.12)"
              strokeWidth={1}
            />
            <text x={12} y={4} className="fill-[#9896B0] text-[9px] font-mono">
              Status:
            </text>
            <text
              x={173}
              y={4}
              textAnchor="end"
              className={`text-[9px] font-mono font-bold ${
                currentItem.isAnomaly ? 'fill-[#FB7185]' : 'fill-[#34D399]'
              }`}
            >
              {currentItem.isAnomaly ? 'ANOMALOUS' : 'NORMAL'}
            </text>
          </g>
        )}
      </g>
    </g>
  );
};
