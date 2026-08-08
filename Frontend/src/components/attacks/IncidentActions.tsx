import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AttackIncident } from '../../types/attack';
import { attackService } from '../../services/attackService';
import { ArrowLeft, Download, Server, Cpu } from 'lucide-react';

interface IncidentActionsProps {
  incident: AttackIncident;
}

export const IncidentActions: React.FC<IncidentActionsProps> = ({ incident }) => {
  const navigate = useNavigate();

  return (
    <div className="glass-cream rounded-[28px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-glass border border-white/90">
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <button
          onClick={() => navigate('/logs')}
          className="btn-secondary rounded-xl text-xs py-3 px-5 w-full sm:w-auto justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-[#AD8B73]" /> BACK TO ATTACK LOGS
        </button>

        <button
          onClick={() => attackService.exportToJSON([incident], `Incident-${incident.id}.json`)}
          className="btn-secondary rounded-xl text-xs py-3 px-5 w-full sm:w-auto justify-center"
        >
          <Download className="w-4 h-4 text-[#19BFA3]" /> EXPORT INCIDENT JSON
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <button
          onClick={() => navigate('/charging-network')}
          className="btn-secondary rounded-xl text-xs py-3 px-5 w-full sm:w-auto justify-center"
        >
          <Server className="w-4 h-4 text-[#52A8FF]" /> CHARGING NETWORK
        </button>
        <button
          onClick={() => navigate('/ml-detection')}
          className="btn-secondary rounded-xl text-xs py-3 px-5 w-full sm:w-auto justify-center"
        >
          <Cpu className="w-4 h-4 text-[#AD8B73]" /> ML DETECTION ENGINE
        </button>
      </div>
    </div>
  );
};
