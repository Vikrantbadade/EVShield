/**
 * EVShield Stage 1 - Real-Time WebSocket Communication Service
 * Broadcasts live telemetry snapshots and explainable anomaly alerts to frontend clients.
 */

import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;

  public initialize(server: HttpServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws/telemetry' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      this.clients.add(ws);

      // Send connection acknowledgement
      ws.send(
        JSON.stringify({
          type: 'connected',
          eventType: 'CONNECTED',
          message: 'EVShield Telemetry Stream Connected (Stage 1 Real-Time)',
          timestamp: new Date().toISOString(),
          isSimulated: true,
        })
      );

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });

    // Heartbeat check every 30s
    this.pingInterval = setInterval(() => {
      for (const client of this.clients) {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.ping();
          } catch {
            this.clients.delete(client);
          }
        } else {
          this.clients.delete(client);
        }
      }
    }, 30000);
  }

  public broadcast(type: string, payload: unknown): void {
    if (!this.wss || this.clients.size === 0) return;

    const message = JSON.stringify({
      type: type.toLowerCase(),
      eventType: type,
      data: payload,
      payload,
      timestamp: new Date().toISOString(),
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch {
          this.clients.delete(client);
        }
      }
    }
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  public shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.wss) {
      for (const client of this.clients) {
        try { client.close(); } catch {}
      }
      this.clients.clear();
      this.wss.close();
      this.wss = null;
    }
  }
}

export const wsService = new WebSocketService();

