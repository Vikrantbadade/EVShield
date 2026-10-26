import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AttackIncident } from '../../types/attack';
import { attackService } from '../../services/attackService';
import { useSecurity } from '../../context/SecurityContext';
import { ArrowLeft, Download, Server, Cpu, ShieldCheck, ShieldAlert } from 'lucide-react';

interface IncidentActionsProps {
  incident: AttackIncident;
  onMitigated?: () => void;
}

export const IncidentActions: React.FC<IncidentActionsProps> = ({ incident, onMitigated }) => {
  const navigate = useNavigate();
  const { executeMitigation } = useSecurity();
  const [isMitigating, setIsMitigating] = useState(false);

  const isDetected = incident.status === 'DETECTED';
  const isMitigated = incident.status === 'MITIGATED' || incident.status === 'RESOLVED';

  const handleMitigate = async () => {
    setIsMitigating(true);
    try {
      await executeMitigation();
      if (onMitigated) onMitigated();
    } finally {
      setIsMitigating(false);
    }
  };

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

        {isDetected && (
          <button
            onClick={handleMitigate}
            disabled={isMitigating}
            className="btn-primary bg-[#E85C68] hover:bg-[#d44b57] text-white rounded-xl text-xs py-3 px-5 w-full sm:w-auto justify-center font-bold shadow-glass flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            {isMitigating ? 'ENFORCING MITIGATION...' : 'ENFORCE MITIGATION'}
          </button>
        )}

        {isMitigated && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#19BFA3]/15 border border-[#19BFA3]/30 text-[#0d7362] font-mono text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-[#19BFA3]" />
            MITIGATION ACTIVE
          </div>
        )}
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
