import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Terminal, Construction } from 'lucide-react';
import { StatusChip } from '../components/ui/StatusChip';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <AppLayout pageTitle={title}>
      <div className="glass-cream rounded-[32px] p-12 text-center space-y-6 max-w-3xl mx-auto my-12 relative overflow-hidden shadow-glass border border-white/90">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#CEAB93]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#AD8B73]/15 border border-[#AD8B73]/30 flex items-center justify-center text-[#AD8B73] shadow-glow-peach">
          <Construction className="w-8 h-8 text-[#AD8B73]" />
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2">
            <StatusChip label="MODULE PREPARED FOR NEXT PHASE" variant="live" icon={<Terminal className="w-3.5 h-3.5" />} />
          </div>

          <h2 className="text-3xl font-extrabold text-[#3F3832] tracking-tight">{title}</h2>
          <p className="text-sm text-[#514940] max-w-md mx-auto leading-relaxed">{description}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-4 rounded-2xl border border-white/90 text-xs font-mono text-[#7A7067] inline-block shadow-glass-sm">
          <code>EVShield SOC Router &bull; Status: Scaffold Ready</code>
        </div>
      </div>
    </AppLayout>
  );
};
