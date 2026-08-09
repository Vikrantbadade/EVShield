import React from 'react';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

interface ApiConnectionBannerProps {
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ApiConnectionBanner: React.FC<ApiConnectionBannerProps> = ({
  message = 'Unable to connect to EVShield Security API (http://localhost:5000/api/v1)',
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div className="glass-cream rounded-[24px] p-5 border border-[#E85C68]/30 bg-[#E85C68]/05 shadow-glass space-y-3 my-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E85C68]/15 border border-[#E85C68]/30 text-[#a82d38] shrink-0">
            <WifiOff className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#3F3832] flex items-center gap-2">
              <span>Backend API Unavailable</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#E85C68]/20 text-[#a82d38] uppercase">
                OFFLINE
              </span>
            </h4>
            <p className="text-xs text-[#514940] mt-0.5">{message}</p>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="btn-secondary rounded-xl text-xs py-2 px-4 flex items-center gap-2 shrink-0 border-[#E85C68]/30 hover:bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#E85C68] ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying...' : 'Retry Connection'}</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 text-[11px] font-mono text-[#7A7067] bg-white/60 px-3 py-1.5 rounded-xl border border-white/80">
        <AlertTriangle className="w-3.5 h-3.5 text-[#a8731d]" />
        <span>Ensure the backend process is running: <code className="font-bold text-[#3F3832]">cd backend && npm run dev</code></span>
      </div>
    </div>
  );
};
