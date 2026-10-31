"use strict";

const express = require("express");
const path = require("path");
const healthRouter = require("./routes/health");
const { createStatusRouter } = require("./routes/status");
const { createAuthRouter } = require("./routes/auth");
const { createChargingRouter } = require("./routes/charging");
const { SessionStore } = require("./services/session-store");
const eventLogger = require("./services/event-logger");
const mlRoutes = require("./routes/ml");
const telemetryMiddleware = require("./middleware/telemetry");
const backgroundTelemetry = require("./services/background-telemetry");

const port = Number.parseInt(process.env.PORT || "8080", 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const app = express();
const sessionStore = new SessionStore();

// Capture real HTTP request metrics and stream to EVShield Telemetry Collector
app.use(telemetryMiddleware);

// Serve the simple frontend from the repository's web/ directory.
// This avoids CORS and makes the demo easy to run (open http://localhost:8080/).
const webRoot = path.resolve(__dirname, '..', '..', '..', 'web');
app.use(express.static(webRoot));

app.disable("x-powered-by");
app.use(express.json({ limit: "512kb", strict: true }));

// ML routes must be mounted before other API routes that may be used by the UI.
app.use("/health", healthRouter);
app.post("/api/telemetry/reset", (req, res) => {
  const telemetryEmitter = require("./services/telemetry-emitter");
  telemetryEmitter.clear();
  res.json({ ok: true, cleared: true });
});
app.use("/api/ml", mlRoutes);
app.use("/api/status", createStatusRouter(sessionStore));
app.use("/api/auth", createAuthRouter(eventLogger));
app.use("/api/charging", createChargingRouter(sessionStore, eventLogger));

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found." });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && Object.hasOwn(err, "body")) {
    return res.status(400).json({ error: "Malformed JSON request body." });
  }
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    event_type: "request_error",
    message: err.message,
  }));
  return res.status(500).json({ error: "Internal server error." });
});

app.listen(port, "0.0.0.0", () => {
  eventLogger.logEvent("charging_server_started", { host: "0.0.0.0", port });
  backgroundTelemetry.start(1500);
});
