import React from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler, ScriptableContext,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { AttackIncident } from '../../types/attack';
import { Activity } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface AttackTrafficChartProps {
  incident: AttackIncident;
}

export const AttackTrafficChart: React.FC<AttackTrafficChartProps> = ({ incident }) => {
  const peak = incident.peakRequestsPerSecond;
  const base = incident.baselineRequestsPerSecond;

  const labels = ['12:00', '12:01', '12:02', '12:03', '12:04 (Spike)', '12:05 (Mitigation)', '12:06', '12:07 (Nominal)', '12:08'];
  const dataValues = [base, base + 20, base - 10, base + 50, peak, Math.round(peak * 0.45), Math.round(peak * 0.2), base + 150, base + 10];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Observed Auth Traffic (req/s)',
        data: dataValues,
        borderColor: '#E85C68',
        borderWidth: 2.5,
        pointBackgroundColor: '#E85C68',
        pointBorderColor: '#fff',
        pointRadius: 4,
        tension: 0.35,
        fill: true,
        backgroundColor: (ctx: ScriptableContext<'line'>) => {
          const c = ctx.chart.ctx;
          const g = c.createLinearGradient(0, 0, 0, 300);
          g.addColorStop(0, 'rgba(232,92,104,0.25)');
          g.addColorStop(1, 'rgba(255,251,233,0)');
          return g;
        },
      },
      {
        label: 'Expected Baseline (1,200 req/s)',
        data: Array(labels.length).fill(base),
        borderColor: '#19BFA3',
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

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
          font: { family: 'JetBrains Mono', size: 11 },
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255,251,233,0.95)',
        titleColor: '#3F3832',
        bodyColor: '#a82d38',
        borderColor: 'rgba(232,92,104,0.35)',
        borderWidth: 1,
        padding: 12,
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont:  { family: 'JetBrains Mono', size: 13, weight: 'bold' as const },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(173,139,115,0.08)' },
        ticks: { color: '#7A7067', font: { family: 'JetBrains Mono', size: 11 } },
        border: { display: false },
      },
      y: {
        min: 0,
        max: Math.ceil(peak * 1.15),
        grid: { color: 'rgba(173,139,115,0.08)' },
        ticks: {
          color: '#7A7067',
          font: { family: 'JetBrains Mono', size: 11 },
          callback: (v: number | string) => `${Number(v).toLocaleString()} r/s`,
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="glass-cream rounded-[32px] p-6 sm:p-8 flex flex-col space-y-6 shadow-glass border border-white/90">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/70 border border-white/90 text-[#AD8B73] shadow-glass-sm">
              <Activity className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xl font-bold text-[#3F3832]">Forensic Traffic Analysis</h3>
          </div>
          <p className="text-xs text-[#514940] mt-1">Observed authentication request throughput vs nominal baseline</p>
        </div>

        <StatusChip label="SYNTHETIC TELEMETRY" variant="demo" />
      </div>

      <div className="w-full h-72 sm:h-80">
        <Line data={chartData} options={options} />
      </div>

      <div className="pt-4 border-t border-[#AD8B73]/15 flex items-center justify-between text-[11px] font-mono text-[#7A7067]">
        <span>Attack Signature: DDoS Authentication Flood</span>
        <span>Resolution: Rate Limiting & Token Quarantine</span>
      </div>
    </div>
  );
};
