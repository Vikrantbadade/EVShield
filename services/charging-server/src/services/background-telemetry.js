"use strict";

const telemetryEmitter = require("./telemetry-emitter");

/**
 * Continuous background telemetry generator for the simulated EV Charging Server.
 * Generates realistic steady-state EV charging station telemetry (OCPP Heartbeats,
 * MeterValues, and StatusNotification messages) at nominal intervals.
 */
class BackgroundTelemetryGenerator {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.stations = ["CS-0421", "CS-0422", "CS-0423", "CS-0424"];
  }

  start(intervalMs = 1500) {
    if (this.isRunning) return;
    this.isRunning = true;

    this.intervalId = setInterval(() => {
      this.generateNominalPulse();
    }, intervalMs);
  }

  generateNominalPulse() {
    const stationId = this.stations[Math.floor(Math.random() * this.stations.length)];
    const endpoints = [
      "/ocpp/1.6/Heartbeat",
      "/ocpp/1.6/MeterValues",
      "/ocpp/1.6/StatusNotification",
      "/api/status",
    ];
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const bytes = Math.floor(320 + Math.random() * 280);
    const latency = Math.round((8 + Math.random() * 12) * 10) / 10;
    const metricValue = Math.round((2.2 + Math.random() * 1.0) * 100) / 100;

    telemetryEmitter.record({
      timestamp: Date.now(),
      endpoint: endpoint,
      method: "POST",
      statusCode: 200,
      latencyMs: latency,
      bytesTransferred: bytes,
      packetCount: 4,
      activeConnections: Math.floor(1 + Math.random() * 3),
      newConnections: 1,
      sourceIp: `192.168.1.${Math.floor(10 + Math.random() * 80)}`,
      destination: "127.0.0.1:8080",
      trafficCategory: "NORMAL",
      payloadBytes: bytes - 128,
      success: true,
      metricValue: metricValue,
      isSimulated: true,
    });
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }
}

module.exports = new BackgroundTelemetryGenerator();

