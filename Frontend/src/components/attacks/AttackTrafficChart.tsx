import React from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler, ScriptableContext,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { AttackIncident } from '../../types/attack';
import { Activity } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';
import { formatTime } from '../../utils/dateTime';
import { useSecurity } from '../../context/SecurityContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface AttackTrafficChartProps {
  incident: AttackIncident;
}

export const AttackTrafficChart: React.FC<AttackTrafficChartProps> = ({ incident }) => {
  const { trafficData } = useSecurity();
  const peak = incident.peakRequestsPerSecond || 0;
  const base = incident.baselineRequestsPerSecond || 12;

  let labels: string[] = [];
  let dataValues: number[] = [];

  if (incident.telemetryGraphPoints && incident.telemetryGraphPoints.length > 0) {
    labels = incident.telemetryGraphPoints.map((p) => formatTime(p.timestamp));
    dataValues = incident.telemetryGraphPoints.map((p) => p.requestsPerSec);
  } else if (trafficData && trafficData.length > 0) {
    labels = trafficData.map((p) => formatTime(p.timestamp));
    dataValues = trafficData.map((p) => p.requests);
  } else {
    labels = ['T-2m', 'T-1m', 'T (Peak)', 'T+1m', 'T+2m'];
    dataValues = [base, base, peak, Math.round(peak * 0.4), base];
  }

  const maxVal = Math.max(...dataValues, peak, base, 20);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Observed Auth Traffic (req/s)',
        data: dataValues,
        borderColor: '#FB7185',
        borderWidth: 2.5,
        pointBackgroundColor: '#FB7185',
        pointBorderColor: '#11111F',
        pointRadius: 4,
        tension: 0.35,
        fill: true,
        backgroundColor: (ctx: ScriptableContext<'line'>) => {
          const c = ctx.chart.ctx;
          const g = c.createLinearGradient(0, 0, 0, 300);
          g.addColorStop(0, 'rgba(251, 113, 133, 0.28)');
          g.addColorStop(1, 'rgba(17, 17, 31, 0)');
          return g;
        },
      },
      {
        label: `Expected Baseline (${base.toLocaleString()} req/s)`,
        data: Array(labels.length).fill(base),
        borderColor: '#4DD9F0',
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
          color: '#C4C2D6',
          font: { family: 'JetBrains Mono', size: 11 },
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(29, 29, 53, 0.95)',
        titleColor: '#F5F3FF',
        bodyColor: '#FB7185',
        borderColor: 'rgba(251, 113, 133, 0.45)',
        borderWidth: 1,
        padding: 12,
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont:  { family: 'JetBrains Mono', size: 13, weight: 'bold' as const },
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
        max: Math.ceil(maxVal * 1.2),
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
    <div className="glass-card rounded-[32px] p-6 sm:p-8 space-y-6 border border-[#C4B5FD]/16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#252542] border border-[#FB7185]/30 text-[#FB7185]">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F3FF]">Attack Incident Telemetry Spike</h3>
          </div>
          <p className="text-xs text-[#C4C2D6] mt-1">
            Volumetric comparison during the incident window (Peak: {peak.toLocaleString()} req/s vs Baseline: {base.toLocaleString()} req/s)
          </p>
        </div>
        <StatusChip
          label={incident.status === 'DETECTED' ? 'INCIDENT DETECTED' : 'INCIDENT RECORDED'}
          variant={incident.status === 'DETECTED' ? 'critical' : 'demo'}
        />
      </div>

      <div className="h-[280px] w-full">
        <Line data={chartData} options={options} />
      </div>

      <div className="mt-4 pt-4 border-t border-[#C4B5FD]/16 flex items-center justify-between text-[11px] font-mono text-[#9896B0]">
        <span>Attack Signature: {incident.attackType}</span>
        <span>Telemetry Ingestion: Live Gateway</span>
      </div>
    </div>
  );
};
