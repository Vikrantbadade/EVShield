"use strict";

const telemetryEmitter = require("../services/telemetry-emitter");

/**
 * Express middleware to capture real HTTP request metrics and stream
 * telemetry observations to the EVShield Telemetry Collector.
 */
function telemetryMiddleware(req, res, next) {
  // Ignore internal backend health checks so only external / client traffic is captured
  if (req.headers["x-evshield-internal"] || req.headers["x-internal-probe"]) {
    return next();
  }

  const startTime = process.hrtime.bigint();

  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const latencyMs = Number(endTime - startTime) / 1e6;

    // Feature metric value representing execution latency / timing characteristics
    const metricValue = Math.max(0.1, Math.round(latencyMs * 100) / 100);

    telemetryEmitter.record({
      timestamp: Date.now(),
      endpoint: req.originalUrl || req.path || req.url || "/unknown",
      method: req.method || "GET",
      statusCode: res.statusCode || 200,
      latencyMs: Math.max(1, Math.round(latencyMs * 10) / 10),
      success: res.statusCode < 400,
      metricValue: metricValue > 0 ? metricValue : 2.5,
    });
  });

  next();
}

module.exports = telemetryMiddleware;
