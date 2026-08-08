import React, { createContext, useContext, useState } from 'react';
import {
  SecurityContextType,
  TrafficDataPoint,
  NotificationItem,
  ChargingStationNode,
  AttackLogRecord,
  TimelineEvent,
  AttackFeedItem,
} from '../types';
import {
  initialTrafficData,
  initialChargingStations,
  initialTimelineEvents,
  initialAttackFeed,
} from '../data/mockData';

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAttackMode, setIsAttackMode] = useState<boolean>(false);
  const [securityStatus, setSecurityStatus] = useState<'PROTECTED' | 'THREAT DETECTED'>('PROTECTED');
  const [activeThreats, setActiveThreats] = useState<number>(0);
  const [requestsPerSec, setRequestsPerSec] = useState<number>(1200);
  const [affectedNodes, setAffectedNodes] = useState<number>(0);
  const [mlConfidence, setMlConfidence] = useState<number>(98.2);
  const [trafficData, setTrafficData] = useState<TrafficDataPoint[]>(initialTrafficData);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [chargingStations, setChargingStations] = useState<ChargingStationNode[]>(initialChargingStations);
  const [attackLog, setAttackLog] = useState<AttackLogRecord | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(initialTimelineEvents);
  const [liveFeed, setLiveFeed] = useState<AttackFeedItem[]>(initialAttackFeed);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const toggleDDoSAttack = () => {
    if (!isAttackMode) {
      // ENTER ATTACK MODE
      setIsAttackMode(true);
      setSecurityStatus('THREAT DETECTED');
      setActiveThreats(1);
      setAffectedNodes(24);
      setMlConfidence(97.4);

      // Create Toast Notification
      const newToast: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: '⚠ DDoS ATTACK DETECTED',
        message: 'EV charging authentication traffic has exceeded expected patterns. ML engine activated.',
        type: 'critical',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      };
      setNotifications((prev) => [newToast, ...prev]);

      // Create Attack Log Entry
      const newAttackLog: AttackLogRecord = {
        attackId: 'EVS-DEMO-001',
        attackType: 'DDoS Authentication Burst',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        mlConfidence: '97.4% DEMO',
        requestsPerSec: 18450,
        affectedNodes: 24,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        targetScope: 'Gateway Zone 1 (CS-0421 Mumbai Central)',
      };
      setAttackLog(newAttackLog);

      // Update Charging Station Status
      setChargingStations((prev) =>
        prev.map((station) =>
          station.id === 'CS-0421'
            ? { ...station, status: 'UNDER ATTACK', requestsPerSec: 18450, threatLevel: 'CRITICAL' }
            : station
        )
      );

      // Dynamic Timeline Addition
      const newTimelineEvent: TimelineEvent = {
        id: `t-attack-${Date.now()}`,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        title: 'DDoS Authentication Spike Triggered',
        description: 'ML model flagged rate anomaly exceeding 18,000 req/s across Gateway Zone 1.',
        type: 'escalated',
        severity: 'critical',
        isHistoricalDemo: false,
      };
      setTimelineEvents((prev) => [newTimelineEvent, ...prev]);

      // Dynamic Live Feed Addition
      const newFeedItem: AttackFeedItem = {
        id: `f-attack-${Date.now()}`,
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        title: 'DDoS Attack Signature Identified',
        nodeId: 'CS-0421 (Mumbai Central)',
        severity: 'critical',
        type: 'DDoS Attack',
      };
      setLiveFeed((prev) => [newFeedItem, ...prev]);

      // Step-by-step traffic request rate ramp up (1,200 -> 2,400 -> 4,800 -> 8,900 -> 13,700 -> 18,450)
      const steps = [2400, 4800, 8900, 13700, 18450];
      steps.forEach((targetReqs, index) => {
        setTimeout(() => {
          setRequestsPerSec(targetReqs);
          setTrafficData((prevData) => {
            const lastTime = prevData[prevData.length - 1]?.timestamp || '15:00';
            const [h, m] = lastTime.split(':').map(Number);
            const nextM = (m + 5) % 60;
            const nextH = m + 5 >= 60 ? (h + 1) % 24 : h;
            const nextTimeString = `${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`;

            return [
              ...prevData,
              {
                timestamp: nextTimeString,
                requests: targetReqs,
                isAnomaly: true,
              },
            ];
          });
        }, (index + 1) * 350);
      });
    } else {
      // END SIMULATION - RETURN TO NORMAL MODE
      setIsAttackMode(false);
      setSecurityStatus('PROTECTED');
      setActiveThreats(0);
      setAffectedNodes(0);
      setRequestsPerSec(1200);
      setMlConfidence(98.2);
      setAttackLog(null);
      setTrafficData(initialTrafficData);
      setChargingStations(initialChargingStations);

      const resolvedToast: NotificationItem = {
        id: `notif-resolved-${Date.now()}`,
        title: '✓ THREAT MITIGATED',
        message: 'Traffic returned to expected nominal range (~1,200 req/s).',
        type: 'success',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      };
      setNotifications((prev) => [resolvedToast, ...prev]);
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        isAttackMode,
        toggleDDoSAttack,
        securityStatus,
        activeThreats,
        requestsPerSec,
        affectedNodes,
        mlConfidence,
        trafficData,
        notifications,
        dismissNotification,
        chargingStations,
        attackLog,
        timelineEvents,
        liveFeed,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
