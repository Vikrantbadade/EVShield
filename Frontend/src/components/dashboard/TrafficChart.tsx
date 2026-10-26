import React from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler, ScriptableContext,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useSecurity } from '../../context/SecurityContext';
import { Activity, AlertTriangle, Radio } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';
import { formatTime } from '../../utils/dateTime';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export const TrafficChart: React.FC = () => {
  const { trafficData, isAttackMode, requestsPerSec } = useSecurity();

  const labels = trafficData.map(d => formatTime(d.timestamp));
  const values = trafficData.map(d => d.requests);
  const maxVal = Math.max(...values, requestsPerSec, 25);

  const lineColor = isAttackMode ? '#FB7185' : '#4DD9F0';
  const fillStart = isAttackMode ? 'rgba(251, 113, 133, 0.28)' : 'rgba(77, 217, 240, 0.22)';

  const chartData = {
    labels,
    datasets: [{
      label: 'Auth Requests / sec',
      data: values,
      borderColor: lineColor,
      borderWidth: 2.5,
      pointBackgroundColor: lineColor,
      pointBorderColor: '#11111F',
      pointBorderWidth: 1.5,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.38,
      fill: true,
      backgroundColor: (ctx: ScriptableContext<'line'>) => {
        const c = ctx.chart.ctx;
        const g = c.createLinearGradient(0, 0, 0, 300);
        g.addColorStop(0, fillStart);
        g.addColorStop(1, 'rgba(17, 17, 31, 0)');
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
        backgroundColor: 'rgba(29, 29, 53, 0.95)',
        titleColor: '#F5F3FF',
        bodyColor: isAttackMode ? '#FB7185' : '#4DD9F0',
        borderColor: isAttackMode ? 'rgba(251, 113, 133, 0.45)' : 'rgba(77, 217, 240, 0.45)',
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
        grid: { color: 'rgba(196, 181, 253, 0.08)' },
        ticks: { color: '#9896B0', font: { family: 'JetBrains Mono', size: 11 } },
        border: { display: false },
      },
      y: {
        min: 0,
        max: Math.ceil(maxVal * 1.25),
        grid: { color: 'rgba(196, 181, 253, 0.08)' },
        ticks: {
          color: '#9896B0',
          font: { family: 'JetBrains Mono', size: 11 },
          callback: (v: number | string) => `${Number(v).toLocaleString()} r/s`,
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className={`glass-card rounded-[32px] p-8 flex flex-col transition-all duration-500 ${
      isAttackMode ? '!border-[#FB7185]/40' : ''
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`p-2 rounded-xl border ${
              isAttackMode
                ? 'bg-[#FB7185]/15 border-[#FB7185]/30 text-[#FB7185]'
                : 'bg-[#252542] border-[#C4B5FD]/20 text-[#4DD9F0]'
            }`}>
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-[#F5F3FF]">Authentication Traffic</h3>
            <StatusChip label={isAttackMode ? "THREAT DETECTED" : "LIVE TELEMETRY"} variant={isAttackMode ? "critical" : "live"} />
          </div>
          <p className="text-xs text-[#C4C2D6]">Real-time EV charging authentication throughput baseline</p>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-xs font-bold transition-all duration-300 shadow-sm ${
          isAttackMode
            ? 'bg-[#FB7185]/15 border-[#FB7185]/35 text-[#FB7185]'
            : 'bg-[#252542] border-[#C4B5FD]/20 text-[#F5F3FF]'
        }`}>
          {isAttackMode
            ? <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
            : <Radio className="w-3.5 h-3.5 animate-pulse text-[#4DD9F0]" />
          }
          {requestsPerSec.toLocaleString()} req/s
        </div>
      </div>

      {/* Chart canvas */}
      <div className="w-full h-72 sm:h-80">
        <Line data={chartData} options={options} />
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-[#C4B5FD]/16 flex items-center justify-between text-[11px] font-mono text-[#9896B0]">
        <span>Target: EV Charging Authentication Gateways</span>
        <span>Polling: 5s Real-time Feed</span>
      </div>
    </div>
  );
};
