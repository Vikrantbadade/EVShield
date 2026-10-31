"use strict";

class TelemetryEmitter {
  constructor() {
    this.queue = [];
    this.backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:5000";
    this.flushIntervalMs = 50;
    this.maxBatchSize = 25;
    this.isFlushing = false;

    // Start background flush interval
    this.intervalId = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  clear() {
    this.queue = [];
  }

  record(sample) {
    if (!sample) return;
    this.queue.push(sample);

    // If buffer grows large during high-throughput flood, flush immediately
    if (this.queue.length >= this.maxBatchSize && !this.isFlushing) {
      setImmediate(() => this.flush());
    }
  }

  async flush() {
    if (this.queue.length === 0 || this.isFlushing) return;

    this.isFlushing = true;
    const batch = this.queue.splice(0, 100);

    try {
      await fetch(`${this.backendUrl}/api/v1/telemetry/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samples: batch }),
        signal: AbortSignal.timeout(1500),
      });
    } catch {
      // Backend may be starting or unreachable; ignore network errors silently
    } finally {
      this.isFlushing = false;
      if (this.queue.length >= this.maxBatchSize) {
        setImmediate(() => this.flush());
      }
    }
  }
}

module.exports = new TelemetryEmitter();
