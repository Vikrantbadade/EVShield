import React from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler, ScriptableContext,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useSecurity } from '../../context/SecurityContext';
import { Activity, AlertTriangle, Radio } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export const TrafficChart: React.FC = () => {
  const { trafficData, isAttackMode, requestsPerSec } = useSecurity();

  const labels = trafficData.map(d => d.timestamp);
  const values = trafficData.map(d => d.requests);

  const lineColor = isAttackMode ? '#E85C68' : '#19BFA3';
  const fillStart = isAttackMode ? 'rgba(232,92,104,0.22)' : 'rgba(25,191,163,0.18)';

  const chartData = {
    labels,
    datasets: [{
      label: 'Auth Requests / sec',
      data: values,
      borderColor: lineColor,
      borderWidth: 2.5,
      pointBackgroundColor: lineColor,
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.38,
      fill: true,
      backgroundColor: (ctx: ScriptableContext<'line'>) => {
        const c = ctx.chart.ctx;
        const g = c.createLinearGradient(0, 0, 0, 300);
        g.addColorStop(0, fillStart);
        g.addColorStop(1, 'rgba(255,251,233,0)');
        return g;
      },
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255,251,233,0.95)',
        titleColor: '#3F3832',
        bodyColor: isAttackMode ? '#a82d38' : '#0d7a67',
        borderColor: isAttackMode ? 'rgba(232,92,104,0.35)' : 'rgba(25,191,163,0.35)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont:  { family: 'JetBrains Mono', size: 13, weight: 'bold' as const },
        callbacks: { label: (c: { raw: unknown }) => `${c.raw} req/sec` },
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
        max: isAttackMode ? 22000 : 2000,
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
    <div className={`glass-cream rounded-[32px] p-8 flex flex-col transition-all duration-500 ${
      isAttackMode ? '!border-[#E85C68]/30' : ''
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`p-2 rounded-xl border ${
              isAttackMode
                ? 'bg-[#E85C68]/12 border-[#E85C68]/30 text-[#E85C68]'
                : 'bg-white/70 border-white/90 text-[#AD8B73]'
            }`}>
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-[#3F3832]">Authentication Traffic</h3>
            <StatusChip label="DEMO DATA" variant="demo" />
          </div>
          <p className="text-xs text-[#514940]">Real-time EV charging authentication throughput baseline</p>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-xs font-bold transition-all duration-300 shadow-glass-sm ${
          isAttackMode
            ? 'bg-[#E85C68]/14 border-[#E85C68]/30 text-[#a82d38]'
            : 'bg-white/75 border-white/90 text-[#514940]'
        }`}>
          {isAttackMode
            ? <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
            : <Radio className="w-3.5 h-3.5 animate-pulse text-[#19BFA3]" />
          }
          {requestsPerSec.toLocaleString()} req/s
        </div>
      </div>

      {/* Chart canvas */}
      <div className="w-full h-72 sm:h-80">
        <Line data={chartData} options={options} />
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-[#AD8B73]/15 flex items-center justify-between text-[11px] font-mono text-[#7A7067]">
        <span>Target: EV Charging Authentication Gateways</span>
        <span>Polling: 5s Real-time Feed</span>
      </div>
    </div>
  );
};
