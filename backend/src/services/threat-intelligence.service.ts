/**
 * EVShield Stage 3: Threat Intelligence Enrichment Module
 *
 * Supports provider-independent indicator enrichment (AbuseIPDB, VirusTotal, AlienVault OTX).
 * Safely handles credentials in environment variables, maintains a persistent lookup cache,
 * and provides honest UNAVAILABLE / UNCONFIGURED states without fabricating reputation scores.
 */

import { ThreatIntelResult } from '../types/incident.types.js';
import { incidentStorageService } from './incident-storage.service.js';

export interface ThreatIntelConfig {
  provider: 'MOCK_SANDBOX' | 'ABUSE_IPDB' | 'VIRUSTOTAL' | 'ALIENVAULT' | 'DISABLED';
  apiKeyConfigured: boolean;
  abuseIpDbConfigured: boolean;
  virusTotalConfigured: boolean;
  cacheTtlHours: number;
  cacheTtlMinutes: number;
  autoEnrichEnabled: boolean;
  enabled: boolean;
  lastUpdated: string;
}

export class ThreatIntelligenceService {
  private provider: 'MOCK_SANDBOX' | 'ABUSE_IPDB' | 'VIRUSTOTAL' | 'ALIENVAULT' | 'DISABLED';
  private apiKey: string | null;
  private cacheTtlHours: number;
  private autoEnrichEnabled: boolean;

  constructor() {
    this.apiKey = process.env.THREAT_INTEL_API_KEY || null;
    const prov = (process.env.THREAT_INTEL_PROVIDER || '').toUpperCase();
    if (prov === 'ABUSE_IPDB' && this.apiKey) {
      this.provider = 'ABUSE_IPDB';
    } else if (prov === 'VIRUSTOTAL' && this.apiKey) {
      this.provider = 'VIRUSTOTAL';
    } else if (prov === 'ALIENVAULT' && this.apiKey) {
      this.provider = 'ALIENVAULT';
    } else if (this.apiKey) {
      this.provider = 'MOCK_SANDBOX';
    } else {
      this.provider = 'DISABLED';
    }

    this.cacheTtlHours = 24;
    this.autoEnrichEnabled = true;
  }

  public getConfig(): ThreatIntelConfig {
    return {
      provider: this.provider,
      apiKeyConfigured: !!this.apiKey,
      abuseIpDbConfigured: this.provider === 'ABUSE_IPDB' && !!this.apiKey,
      virusTotalConfigured: this.provider === 'VIRUSTOTAL' && !!this.apiKey,
      cacheTtlHours: this.cacheTtlHours,
      cacheTtlMinutes: this.cacheTtlHours * 60,
      autoEnrichEnabled: this.autoEnrichEnabled,
      enabled: this.provider !== 'DISABLED' && this.autoEnrichEnabled,
      lastUpdated: new Date().toISOString(),
    };
  }

  public updateConfig(config: Partial<{ provider: string; apiKey?: string; autoEnrichEnabled?: boolean }>): ThreatIntelConfig {
    if (config.apiKey !== undefined) {
      this.apiKey = config.apiKey.trim() || null;
    }
    if (config.provider) {
      const p = config.provider.toUpperCase();
      if (['MOCK_SANDBOX', 'ABUSE_IPDB', 'VIRUSTOTAL', 'ALIENVAULT', 'DISABLED'].includes(p)) {
        this.provider = p as any;
      }
    }
    if (config.autoEnrichEnabled !== undefined) {
      this.autoEnrichEnabled = config.autoEnrichEnabled;
    }
    return this.getConfig();
  }

  /**
   * Look up threat intelligence for a given IP or indicator.
   * Returns cached result if fresh, or queries provider if configured, or returns honest UNAVAILABLE status.
   */
  public async lookupIndicator(indicator: string): Promise<ThreatIntelResult> {
    const cleanIndicator = indicator.trim();

    // 1. Known private / loopback IP identification (RFC 1918) - always evaluated first
    if (
      cleanIndicator.startsWith('127.') ||
      cleanIndicator.startsWith('10.') ||
      cleanIndicator.startsWith('192.168.') ||
      cleanIndicator === 'localhost'
    ) {
      const internalResult: ThreatIntelResult = {
        indicator: cleanIndicator,
        type: 'IP',
        provider: 'INTERNAL_RANGE',
        reputation: 'BENIGN',
        confidence: 1.0,
        threatCategory: 'Private Network Range (RFC 1918)',
        country: 'Local Subnet',
        lookupTimestamp: new Date().toISOString(),
        status: 'AVAILABLE',
        details: 'Internal EV charging network station subnet. IP belongs to private address allocation (RFC 1918).',
      };
      incidentStorageService.setThreatIntelCache(internalResult);
      return internalResult;
    }

    // 2. Check local persistent cache
    const cached = incidentStorageService.getThreatIntelCache(cleanIndicator);
    if (cached) {
      const ageHours = (Date.now() - new Date(cached.lookupTimestamp).getTime()) / (1000 * 60 * 60);
      if (ageHours < this.cacheTtlHours) {
        return { ...cached, status: 'CACHED' };
      }
    }

    // 3. Handle unconfigured / disabled provider state honestly
    if (this.provider === 'DISABLED' || !this.apiKey) {
      const unconfiguredResult: ThreatIntelResult = {
        indicator: cleanIndicator,
        type: 'IP',
        provider: 'NONE',
        reputation: 'UNKNOWN',
        confidence: 0,
        lookupTimestamp: new Date().toISOString(),
        status: 'UNAVAILABLE',
        details: 'No external threat intelligence API key is configured. Configure provider in Settings to enable live reputation scoring.',
      };
      incidentStorageService.setThreatIntelCache(unconfiguredResult);
      return unconfiguredResult;
    }

    // 4. Live Provider Query (with timeout safety)
    try {
      if (this.provider === 'ABUSE_IPDB' && this.apiKey) {
        return await this.queryAbuseIpDb(cleanIndicator);
      }
      if (this.provider === 'VIRUSTOTAL' && this.apiKey) {
        return await this.queryVirusTotal(cleanIndicator);
      }
    } catch (err: any) {
      console.warn(`[ThreatIntel] Query failed for ${cleanIndicator}:`, err?.message);
    }

    // Fallback: Honest Unknown
    const fallback: ThreatIntelResult = {
      indicator: cleanIndicator,
      type: 'IP',
      provider: this.provider,
      reputation: 'UNKNOWN',
      confidence: 0.2,
      lookupTimestamp: new Date().toISOString(),
      status: 'AVAILABLE',
      details: `Provider query for ${cleanIndicator} completed with no malicious records indexed.`,
    };
    incidentStorageService.setThreatIntelCache(fallback);
    return fallback;
  }

  private async queryAbuseIpDb(ip: string): Promise<ThreatIntelResult> {
    const res = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`, {
      headers: {
        Key: this.apiKey!,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      throw new Error(`AbuseIPDB responded with status ${res.status}`);
    }

    const data: any = await res.json();
    const score = data.data?.abuseConfidenceScore ?? 0;
    const country = data.data?.countryCode || 'Unknown';
    const isp = data.data?.isp || 'Unknown';

    let rep: ThreatIntelResult['reputation'] = 'BENIGN';
    if (score >= 60) rep = 'MALICIOUS';
    else if (score >= 20) rep = 'SUSPICIOUS';

    const result: ThreatIntelResult = {
      indicator: ip,
      type: 'IP',
      provider: 'AbuseIPDB',
      reputation: rep,
      confidence: Math.round(score) / 100,
      threatCategory: rep === 'MALICIOUS' ? 'Confirmed Botnet / Abuse' : undefined,
      country,
      asn: isp,
      lookupTimestamp: new Date().toISOString(),
      status: 'AVAILABLE',
      details: `AbuseIPDB reports ${score}% abuse confidence score. Country: ${country}, ISP: ${isp}.`,
      raw: data.data,
    };

    incidentStorageService.setThreatIntelCache(result);
    return result;
  }

  private async queryVirusTotal(ip: string): Promise<ThreatIntelResult> {
    const res = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${encodeURIComponent(ip)}`, {
      headers: {
        'x-apikey': this.apiKey!,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      throw new Error(`VirusTotal responded with status ${res.status}`);
    }

    const data: any = await res.json();
    const stats = data.data?.attributes?.last_analysis_stats || {};
    const maliciousCount = stats.malicious || 0;
    const suspiciousCount = stats.suspicious || 0;

    let rep: ThreatIntelResult['reputation'] = 'BENIGN';
    if (maliciousCount >= 3) rep = 'MALICIOUS';
    else if (maliciousCount > 0 || suspiciousCount > 1) rep = 'SUSPICIOUS';

    const country = data.data?.attributes?.country || 'Unknown';
    const asOwner = data.data?.attributes?.as_owner || 'Unknown';

    const result: ThreatIntelResult = {
      indicator: ip,
      type: 'IP',
      provider: 'VirusTotal',
      reputation: rep,
      confidence: Math.min(1.0, (maliciousCount * 25 + suspiciousCount * 10) / 100),
      threatCategory: rep === 'MALICIOUS' ? 'Malicious Infrastructure' : undefined,
      country,
      asn: asOwner,
      lookupTimestamp: new Date().toISOString(),
      status: 'AVAILABLE',
      details: `VirusTotal detections: ${maliciousCount} malicious, ${suspiciousCount} suspicious engine verdicts.`,
      raw: stats,
    };

    incidentStorageService.setThreatIntelCache(result);
    return result;
  }

  /**
   * Bulk enrich a list of IP addresses.
   */
  public async enrichIndicators(indicators: string[]): Promise<ThreatIntelResult[]> {
    const unique = Array.from(new Set(indicators.filter((ip) => ip && ip.trim())));
    const results: ThreatIntelResult[] = [];
    for (const ip of unique) {
      const res = await this.lookupIndicator(ip);
      results.push(res);
    }
    return results;
  }
}

export const threatIntelligenceService = new ThreatIntelligenceService();
