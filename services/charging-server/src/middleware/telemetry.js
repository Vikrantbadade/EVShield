"use strict";

const telemetryEmitter = require("../services/telemetry-emitter");

// Track active in-flight connections across the simulated charging station
let currentActiveConnections = 0;
let connectionCounter = 0;

/**
 * Express middleware to capture real HTTP request metrics and stream
 * telemetry observations to the EVShield Telemetry Collector.
 */
function telemetryMiddleware(req, res, next) {
  // Ignore internal health checks from the backend to avoid polluting telemetry
  if (req.headers["x-evshield-internal"] || req.headers["x-internal-probe"]) {
    return next();
  }

  currentActiveConnections++;
  connectionCounter++;
  const startTime = process.hrtime.bigint();

  res.on("finish", () => {
    currentActiveConnections = Math.max(0, currentActiveConnections - 1);
    const endTime = process.hrtime.bigint();
    const latencyMs = Number(endTime - startTime) / 1e6;

    // Feature metric value representing execution latency / timing characteristics
    const metricValue = Math.max(0.1, Math.round(latencyMs * 100) / 100);

    // Calculate byte transfer: request payload + response size + estimated HTTP/TCP headers
    const customBytes = parseInt(req.headers["x-bytes-transferred"] || "0", 10);
    const reqContentLength = parseInt(req.headers["content-length"] || "0", 10);
    const resContentLength = parseInt(res.getHeader("content-length") || "256", 10);
    const totalBytes = customBytes > 0 ? customBytes : Math.max(256, (reqContentLength || 256) + (resContentLength || 256) + 128);

    // Estimate TCP packet count based on standard MTU (1500 bytes) + handshake/ACKs
    const packetCount = parseInt(req.headers["x-packet-count"] || "0", 10) || Math.max(2, Math.ceil(totalBytes / 1460) * 2);
    const activeConns = parseInt(req.headers["x-active-connections"] || "0", 10) || Math.max(1, currentActiveConnections + 1);
    const newConns = parseInt(req.headers["x-new-connections"] || "0", 10) || 1;

    // Extract source and destination identifiers
    const sourceIp = (
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      req.ip ||
      "127.0.0.1"
    ).replace(/^.*:/, ""); // Normalize IPv6 mapped IPv4

    const destination = req.headers.host || "127.0.0.1:8080";
    const trafficCategory = req.headers["x-traffic-category"] || "NORMAL";

    telemetryEmitter.record({
      timestamp: Date.now(),
      endpoint: req.originalUrl || req.path || req.url || "/unknown",
      method: req.method || "GET",
      statusCode: res.statusCode || 200,
      latencyMs: Math.max(1, Math.round(latencyMs * 10) / 10),
      bytesTransferred: totalBytes,
      packetCount: packetCount,
      activeConnections: activeConns,
      newConnections: newConns,
      sourceIp: sourceIp || "127.0.0.1",
      destination: destination,
      trafficCategory: trafficCategory,
      payloadBytes: reqContentLength,
      success: res.statusCode < 400,
      metricValue: metricValue > 0 ? metricValue : 2.5,
      isSimulated: true, // Explicitly marked as simulated charging telemetry
    });
  });

  next();
}

module.exports = telemetryMiddleware;
