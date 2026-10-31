/**
 * EVShield Stage 1 - Baseline Service
 * Calculates and safely adapts normal traffic baseline statistics.
 */

import { NormalBaseline, MetricSummary, LiveTelemetryMetrics } from '../types/telemetry.types.js';

export class BaselineService {
  private observationWindowSeconds: number = 60;
  private maxHistorySamples: number = 60; // 60 1-second snapshots
  private normalMetricsHistory: LiveTelemetryMetrics[] = [];

  // Default established baseline for simulated EV charging infrastructure
  private baseline: NormalBaseline = {
    packetRate: { mean: 48, std: 8.5, min: 28, max: 72 },
    bytesPerSecond: { mean: 6144, std: 1024, min: 3500, max: 9500 },
    activeConnections: { mean: 3, std: 1.0, min: 1, max: 6 },
    newConnectionRate: { mean: 10, std: 2.5, min: 4, max: 18 },
    requestRate: { mean: 12, std: 2.5, min: 6, max: 18 },
    connectionDurationMs: { mean: 14.5, std: 3.2, min: 6, max: 28 },
    observationWindowSeconds: 60,
    sampleCount: 60,
    lastUpdated: new Date().toISOString(),
    isEstablished: true,
  };

  constructor(observationWindowSeconds = 60) {
    this.observationWindowSeconds = observationWindowSeconds;
    this.maxHistorySamples = Math.max(10, observationWindowSeconds);
    this.seedNominalHistory();
  }

  /**
   * Seed the history with nominal EV charging telemetry so baseline is immediately available.
   */
  private seedNominalHistory(): void {
    const now = Date.now();
    for (let i = this.maxHistorySamples; i > 0; i--) {
      const jitter = (Math.random() - 0.5) * 0.2; // +/- 10%
      const rps = Math.max(8, Math.round(12 * (1 + jitter)));
      this.normalMetricsHistory.push({
        packetRate: rps * 4,
        dataTransferredBytes: rps * 512,
        dataTransferredMB: Math.round(((rps * 512) / (1024 * 1024)) * 1000) / 1000,
        activeConnections: Math.max(1, Math.round(3 * (1 + jitter))),
        newConnectionRate: Math.max(4, Math.round(10 * (1 + jitter))),
        avgConnectionDurationMs: Math.round((14.5 + jitter * 5) * 10) / 10,
        requestRate: rps,
        requestFrequencyHz: rps,
        errorRatePercent: 0,
        windowSampleCount: rps,
        timestamp: new Date(now - i * 1000).toISOString(),
      });
    }
    this.recalculateBaseline();
  }

  /**
   * Safe adaptation update:
   * Only absorb telemetry if the metrics are NOT anomalous.
   * If traffic is abnormal, freeze updates to prevent baseline corruption.
   */
  public update(current: LiveTelemetryMetrics, isAbnormalTraffic: boolean): void {
    if (isAbnormalTraffic) {
      // Freeze baseline updates during anomalous periods
      return;
    }

    // Outlier rejection filter: do not absorb extreme spikes even before official classification
    if (
      current.requestRate > this.baseline.requestRate.mean * 3 ||
      current.newConnectionRate > this.baseline.newConnectionRate.mean * 3.5 ||
      current.packetRate > this.baseline.packetRate.mean * 3
    ) {
      return;
    }

    this.normalMetricsHistory.push(current);
    if (this.normalMetricsHistory.length > this.maxHistorySamples) {
      this.normalMetricsHistory.shift();
    }

    this.recalculateBaseline();
  }

  private calculateSummary(values: number[]): MetricSummary {
    if (values.length === 0) {
      return { mean: 0, std: 1, min: 0, max: 0 };
    }
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = Math.round((sum / values.length) * 100) / 100;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.max(0.1, Math.round(Math.sqrt(variance) * 100) / 100);
    const min = Math.round(Math.min(...values) * 100) / 100;
    const max = Math.round(Math.max(...values) * 100) / 100;

    return { mean, std, min, max };
  }

  private recalculateBaseline(): void {
    if (this.normalMetricsHistory.length < 5) return;

    this.baseline = {
      packetRate: this.calculateSummary(this.normalMetricsHistory.map((m) => m.packetRate)),
      bytesPerSecond: this.calculateSummary(this.normalMetricsHistory.map((m) => m.dataTransferredBytes)),
      activeConnections: this.calculateSummary(this.normalMetricsHistory.map((m) => m.activeConnections)),
      newConnectionRate: this.calculateSummary(this.normalMetricsHistory.map((m) => m.newConnectionRate)),
      requestRate: this.calculateSummary(this.normalMetricsHistory.map((m) => m.requestRate)),
      connectionDurationMs: this.calculateSummary(this.normalMetricsHistory.map((m) => m.avgConnectionDurationMs)),
      observationWindowSeconds: this.observationWindowSeconds,
      sampleCount: this.normalMetricsHistory.length,
      lastUpdated: new Date().toISOString(),
      isEstablished: this.normalMetricsHistory.length >= 10,
    };
  }

  public getBaseline(): NormalBaseline {
    return { ...this.baseline };
  }

  public reset(): void {
    this.normalMetricsHistory = [];
    this.seedNominalHistory();
  }

  public setObservationWindow(seconds: number): void {
    this.observationWindowSeconds = Math.max(10, seconds);
    this.maxHistorySamples = this.observationWindowSeconds;
    this.recalculateBaseline();
  }
}

export const baselineService = new BaselineService();

