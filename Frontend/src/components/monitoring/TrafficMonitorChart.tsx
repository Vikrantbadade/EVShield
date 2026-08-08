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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface TrafficMonitorChartProps {
  trafficData: TrafficDataPoint[];
  isAttackMode: boolean;
}

const THRESHOLD = 5000; // detection threshold line

export const TrafficMonitorChart: React.FC<TrafficMonitorChartProps> = ({ trafficData, isAttackMode }) => {
  const labels = trafficData.map((d) => d.timestamp);
  const values = trafficData.map((d) => d.requests);

  const lineColor = isAttackMode ? '#E85C68' : '#19BFA3';
  const fillStart = isAttackMode ? 'rgba(232,92,104,0.22)' : 'rgba(25,191,163,0.18)';
  const fillEnd = 'rgba(255,251,233,0)';

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Observed Auth Traffic (req/s)',
        data: values,
        borderColor: lineColor,
        borderWidth: 2.5,
        pointBackgroundColor: lineColor,
        pointBorderColor: '#fff',
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
        label: 'Expected Baseline (1,200 req/s)',
        data: Array(labels.length).fill(1200),
        borderColor: '#52A8FF',
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'Detection Threshold (5,000 req/s)',
        data: Array(labels.length).fill(THRESHOLD),
        borderColor: '#D99A32',
        borderWidth: 1.5,
        borderDash: [3, 3],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const maxValue = Math.max(...values, THRESHOLD, 1200);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: '#514940',
          font: { family: 'JetBrains Mono', size: 10 },
          boxWidth: 12,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255,251,233,0.95)',
        titleColor: '#3F3832',
        bodyColor: '#514940',
        borderColor: 'rgba(173,139,115,0.30)',
        borderWidth: 1,
        padding: 12,
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont: { family: 'JetBrains Mono', size: 12, weight: 'bold' as const },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(173,139,115,0.07)' },
        ticks: { color: '#7A7067', font: { family: 'JetBrains Mono', size: 10 } },
        border: { display: false },
      },
      y: {
        min: 0,
        max: Math.ceil(maxValue * 1.15),
        grid: { color: 'rgba(173,139,115,0.07)' },
        ticks: {
          color: '#7A7067',
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (v: number | string) => `${Number(v).toLocaleString()} r/s`,
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="glass-cream rounded-[32px] p-6 sm:p-8 space-y-6 shadow-glass border border-white/90">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/70 border border-white/90 text-[#AD8B73] shadow-glass-sm">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-[#3F3832]">EV Charging Authentication Traffic</h3>
          </div>
          <p className="text-xs text-[#514940] mt-1">
            Live auth request throughput vs expected baseline
          </p>
        </div>
        <StatusChip label={isAttackMode ? 'ATTACK IN PROGRESS' : 'TRAFFIC NORMAL'} variant={isAttackMode ? 'critical' : 'live'} dot pulse={isAttackMode} />
      </div>

      <div className="w-full h-72 sm:h-80">
        <Line data={chartData} options={options} />
      </div>

      <div className="pt-3 border-t border-[#AD8B73]/15 flex flex-wrap items-center justify-between text-[10px] font-mono text-[#7A7067] gap-2">
        <span>Authentication Gateway Throughput Monitor</span>
        <span className={`font-semibold ${isAttackMode ? 'text-[#a82d38]' : 'text-[#0d7a67]'}`}>
          {isAttackMode ? '⚠ ABOVE DETECTION THRESHOLD' : '✓ WITHIN NORMAL RANGE'}
        </span>
      </div>
    </div>
  );
};
