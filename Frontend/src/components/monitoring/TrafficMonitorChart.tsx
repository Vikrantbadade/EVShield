import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScriptableContext,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrafficDataPoint } from '../../types';
import { Activity } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';
import { formatTime } from '../../utils/dateTime';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface TrafficMonitorChartProps {
  trafficData: TrafficDataPoint[];
  isAttackMode: boolean;
}

export const TrafficMonitorChart: React.FC<TrafficMonitorChartProps> = ({ trafficData, isAttackMode }) => {
  const labels = trafficData.map((d) => formatTime(d.timestamp));
  const values = trafficData.map((d) => d.requests);

  const baselineValue = 12;
  const thresholdValue = 50;

  const lineColor = isAttackMode ? '#FB7185' : '#4DD9F0';
  const fillStart = isAttackMode ? 'rgba(251, 113, 133, 0.28)' : 'rgba(77, 217, 240, 0.22)';
  const fillEnd = 'rgba(17, 17, 31, 0)';

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Observed Auth Traffic (req/s)',
        data: values,
        borderColor: lineColor,
        borderWidth: 2.5,
        pointBackgroundColor: lineColor,
        pointBorderColor: '#11111F',
        pointRadius: values.map((_v, i) => (i === values.length - 1 ? 5 : 3)),
        tension: 0.4,
        fill: true,
        backgroundColor: (ctx: ScriptableContext<'line'>) => {
          const c = ctx.chart.ctx;
          const g = c.createLinearGradient(0, 0, 0, 300);
          g.addColorStop(0, fillStart);
          g.addColorStop(1, fillEnd);
          return g;
        },
      },
      {
        label: `Expected Baseline (${baselineValue} req/s)`,
        data: Array(labels.length).fill(baselineValue),
        borderColor: '#9B7BFF',
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
      },
      {
        label: `Detection Threshold (${thresholdValue} req/s)`,
        data: Array(labels.length).fill(thresholdValue),
        borderColor: '#FBBF24',
        borderWidth: 1.5,
        borderDash: [3, 3],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const maxValue = Math.max(...values, thresholdValue, 25);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: '#C4C2D6',
          font: { family: 'JetBrains Mono', size: 10 },
          boxWidth: 12,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(29, 29, 53, 0.95)',
        titleColor: '#F5F3FF',
        bodyColor: '#C4C2D6',
        borderColor: 'rgba(196, 181, 253, 0.25)',
        borderWidth: 1,
        padding: 12,
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont: { family: 'JetBrains Mono', size: 12, weight: 'bold' as const },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(196, 181, 253, 0.08)' },
        ticks: { color: '#9896B0', font: { family: 'JetBrains Mono', size: 10 } },
        border: { display: false },
      },
      y: {
        min: 0,
        max: Math.ceil(maxValue * 1.15),
        grid: { color: 'rgba(196, 181, 253, 0.08)' },
        ticks: {
          color: '#9896B0',
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (v: number | string) => `${Number(v).toLocaleString()} r/s`,
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="glass-card rounded-[32px] p-6 sm:p-8 space-y-6 border border-[#C4B5FD]/16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 text-[#4DD9F0]">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F3FF]">EV Charging Authentication Traffic</h3>
          </div>
          <p className="text-xs text-[#C4C2D6] mt-1">
            Live auth request throughput vs expected baseline and ML volumetric threshold
          </p>
        </div>
        <StatusChip
          label={isAttackMode ? 'ATTACK DETECTED' : 'NORMAL TRAFFIC'}
          variant={isAttackMode ? 'attack' : 'live'}
          pulse={isAttackMode}
        />
      </div>

      <div className="h-[280px] w-full">
        <Line data={chartData} options={options} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 rounded-2xl bg-[#252542] border border-[#C4B5FD]/16 shadow-sm">
          <div className="text-[10px] font-mono text-[#9896B0] uppercase">Observed Current</div>
          <div className="text-lg font-bold font-mono text-[#4DD9F0] mt-0.5">
            {values[values.length - 1] ?? 0} <span className="text-xs font-normal text-[#9896B0]">req/s</span>
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-[#252542] border border-[#C4B5FD]/16 shadow-sm">
          <div className="text-[10px] font-mono text-[#9896B0] uppercase">Baseline Expected</div>
          <div className="text-lg font-bold font-mono text-[#9B7BFF] mt-0.5">
            {baselineValue} <span className="text-xs font-normal text-[#9896B0]">req/s</span>
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-[#252542] border border-[#C4B5FD]/16 shadow-sm">
          <div className="text-[10px] font-mono text-[#9896B0] uppercase">Detection Threshold</div>
          <div className="text-lg font-bold font-mono text-[#FBBF24] mt-0.5">
            {thresholdValue} <span className="text-xs font-normal text-[#9896B0]">req/s</span>
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-[#252542] border border-[#C4B5FD]/16 shadow-sm">
          <div className="text-[10px] font-mono text-[#9896B0] uppercase">Traffic State</div>
          <div className={`text-lg font-bold font-mono mt-0.5 ${isAttackMode ? 'text-[#FB7185]' : 'text-[#34D399]'}`}>
            {isAttackMode ? 'ANOMALOUS' : 'NOMINAL'}
          </div>
        </div>
      </div>
    </div>
  );
};
