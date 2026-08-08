import React from 'react';
import { CheckCircle2, X, AlertTriangle, Info } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

type NotificationType = 'critical' | 'success' | 'info' | 'warning';

interface NotificationToastProps {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  title,
  message,
  type,
  timestamp,
  onDismiss,
}) => {
  const isCritical = type === 'critical';
  const isSuccess = type === 'success';
  const isWarning = type === 'warning';

  const Icon = isCritical
    ? AlertTriangle
    : isSuccess
      ? CheckCircle2
      : isWarning
        ? AlertTriangle
        : Info;

  const containerClass = isCritical
    ? 'bg-white/90 backdrop-blur-2xl border-[#EF5B67]/30 shadow-glow-red'
    : isSuccess
      ? 'bg-white/90 backdrop-blur-2xl border-[#62C073]/28'
      : isWarning
        ? 'bg-white/90 backdrop-blur-2xl border-[#E8A93A]/30'
        : 'bg-white/90 backdrop-blur-2xl border-black/[0.10]';

  const iconClass = isCritical
    ? 'bg-[#EF5B67]/10 border-[#EF5B67]/25 text-[#EF5B67]'
    : isSuccess
      ? 'bg-[#62C073]/10 border-[#62C073]/25 text-[#62C073]'
      : isWarning
        ? 'bg-[#E8A93A]/10 border-[#E8A93A]/25 text-[#C17D16]'
        : 'bg-[#52A8FF]/10 border-[#52A8FF]/22 text-[#52A8FF]';

  return (
    <div
      className={`w-80 max-w-[calc(100vw-2rem)] rounded-2xl p-4 flex items-start gap-4 shadow-glass-hover animate-slide-in-right transition-all duration-300 border ${containerClass}`}
    >
      {/* Icon */}
      <div
        className={`shrink-0 mt-0.5 p-1.5 rounded-lg border ${iconClass}`}
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-[#0F172A] truncate">
          {title}
        </div>

        <div className="text-xs text-[#64748B] mt-1 leading-relaxed">
          {message}
        </div>

        <div className="text-[10px] font-mono text-[#94A3B8] mt-2">
          {timestamp}
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="shrink-0 p-1 rounded-lg text-[#94A3B8] hover:bg-black/[0.06] hover:text-[#475569] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const NotificationToastContainer: React.FC = () => {
  const { notifications, dismissNotification } = useSecurity();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-24 right-6 z-50 flex flex-col gap-3">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          id={notification.id}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          timestamp={notification.timestamp}
          onDismiss={dismissNotification}
        />
      ))}
    </div>
  );
};

// Backward compatible default
export default NotificationToast;