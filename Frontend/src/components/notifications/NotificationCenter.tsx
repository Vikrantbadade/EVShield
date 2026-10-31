import React, { useState, useEffect, useRef } from 'react';
import { Bell, ShieldAlert, Check, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { incidentService } from '../../services/incidentService';
import { IncidentNotificationItem } from '../../types/incident';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<IncidentNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const items = await incidentService.getNotifications(15);
      setNotifications(items || []);
      setUnreadCount(items.filter((n) => !n.read).length);
    } catch {
      // Backend may be starting or offline
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (evt: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(evt.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await incidentService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleNavigateToIncident = (link: string, id: string) => {
    handleMarkAsRead(id, { stopPropagation: () => {} } as any);
    setIsOpen(false);
    navigate(link);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 rounded-xl flex items-center justify-center bg-[#17172B]/50 hover:bg-[#17172B]/80 border border-[#C4B5FD]/16 hover:border-[#C4B5FD]/30 text-[#C4C2D6] hover:text-[#F5F3FF] transition-all backdrop-blur-md relative"
        aria-label="Notifications"
        title="Security Notifications"
      >
        <Bell className="w-4 h-4 text-[#C4B5FD]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FB7185] text-white text-[10px] font-mono font-bold flex items-center justify-center border border-[#131326]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#17172A] border border-[#C4B5FD]/20 shadow-2xl backdrop-blur-xl z-50 overflow-hidden text-xs font-mono">
          {/* Header */}
          <div className="p-3.5 border-b border-[#C4B5FD]/16 flex items-center justify-between bg-[#131326]/80">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#8055F6]" />
              <span className="font-bold text-[#F5F3FF]">SOC Security Alerts</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-[#FB7185]/20 text-[#FB7185] text-[10px] font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#9896B0] hover:text-[#F5F3FF] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#C4B5FD]/10">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[#9896B0]">
                No security notifications recorded.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNavigateToIncident(item.link, item.id)}
                  className={`p-3 cursor-pointer transition-colors hover:bg-[#1D1D35]/80 ${
                    !item.read ? 'bg-[#8055F6]/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-bold text-[#F5F3FF] line-clamp-1">{item.title}</span>
                    <span className="text-[10px] text-[#9896B0] shrink-0">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-[#C4C2D6] line-clamp-2 mb-1.5">{item.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8055F6] font-semibold">{item.incidentId}</span>
                    {!item.read && (
                      <button
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                        className="text-[10px] text-[#34D399] hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-[#C4B5FD]/16 bg-[#131326]/80 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/incidents');
              }}
              className="text-xs text-[#C4B5FD] hover:text-[#F5F3FF] font-semibold flex items-center justify-center gap-1 mx-auto"
            >
              <span>View All Incidents in SOC</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

