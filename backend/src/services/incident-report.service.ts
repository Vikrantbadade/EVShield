/**
 * EVShield Stage 3: Incident Investigation Report Generator
 * Generates downloadable investigation reports in standard PDF 1.4 format and RFC 4180 CSV format.
 * Pure Node.js implementation: zero external heavy binary dependencies, 100% portable.
 */

import { SecurityIncident } from '../types/incident.types.js';

export class IncidentReportService {
  /**
   * Generate an RFC 4180 compliant CSV export for a single incident and its evidence.
   */
  public generateIncidentCsv(incident: SecurityIncident): string {
    const escapeCsv = (str: string | number | undefined | null) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const lines: string[] = [];

    // Header Metadata
    lines.push('=== EVSHIELD CYBERSECURITY OPERATIONS CENTER (SOC) INVESTIGATION REPORT ===');
    lines.push(`Report Generated,${escapeCsv(new Date().toISOString())}`);
    lines.push(`Incident ID,${escapeCsv(incident.id)}`);
    lines.push(`Title,${escapeCsv(incident.title)}`);
    lines.push(`Status,${escapeCsv(incident.status)}`);
    lines.push(`Severity,${escapeCsv(incident.severity)}`);
    lines.push(`Risk Score,${escapeCsv(incident.riskScore + '/100 (' + incident.riskLevel + ')')}`);
    lines.push(`Category,${escapeCsv(incident.category)}`);
    lines.push(`Primary Station,${escapeCsv(incident.primaryStationId)}`);
    lines.push(`Affected Stations,${escapeCsv(incident.affectedStations.join('; '))}`);
    lines.push(`Source IPs,${escapeCsv(incident.sourceIps.join('; '))}`);
    lines.push(`Assigned Analyst,${escapeCsv(incident.assignedTo ? `${incident.assignedTo.name} (${incident.assignedTo.email})` : 'Unassigned')}`);
    lines.push(`First Detected At,${escapeCsv(incident.firstDetectedAt)}`);
    lines.push(`Last Updated At,${escapeCsv(incident.lastUpdatedAt)}`);
    lines.push(`Contained At,${escapeCsv(incident.containedAt || 'N/A')}`);
    lines.push(`Resolved At,${escapeCsv(incident.resolvedAt || 'N/A')}`);
    lines.push(`Root Cause Analysis,${escapeCsv(incident.rootCauseAnalysis || 'N/A')}`);
    lines.push('');

    // Section 1: Correlated Alerts
    lines.push('--- SECTION 1: CORRELATED ALERTS ---');
    lines.push('Alert ID,Timestamp,Category,Severity,Source IP,Target Station,Observed Metric Value,Deviation %,Explanation');
    for (const a of incident.alerts) {
      lines.push([
        escapeCsv(a.alertId),
        escapeCsv(a.timestamp),
        escapeCsv(a.category),
        escapeCsv(a.severity),
        escapeCsv(a.sourceIp || 'N/A'),
        escapeCsv(a.targetStationId || incident.primaryStationId),
        escapeCsv(a.metricValue ?? 'N/A'),
        escapeCsv(a.deviationPercent ? `+${a.deviationPercent}%` : '0%'),
        escapeCsv(a.explanation),
      ].join(','));
    }
    lines.push('');

    // Section 2: Attack Timeline Events
    lines.push('--- SECTION 2: ATTACK TIMELINE EVENTS ---');
    lines.push('Event ID,Timestamp,Event Type,Actor Type,Actor Name,Title,Description');
    for (const ev of incident.timeline) {
      lines.push([
        escapeCsv(ev.id),
        escapeCsv(ev.timestamp),
        escapeCsv(ev.eventType),
        escapeCsv(ev.actor.type),
        escapeCsv(ev.actor.name),
        escapeCsv(ev.title),
        escapeCsv(ev.description),
      ].join(','));
    }
    lines.push('');

    // Section 3: Response Playbook Actions
    lines.push('--- SECTION 3: RESPONSE PLAYBOOK ACTIONS ---');
    lines.push('Action ID,Priority,Status,Type,Title,Rationale,Updated By,Updated At');
    for (const act of incident.responseActions) {
      lines.push([
        escapeCsv(act.id),
        escapeCsv(act.priority),
        escapeCsv(act.status),
        escapeCsv(act.actionType),
        escapeCsv(act.title),
        escapeCsv(act.rationale),
        escapeCsv(act.updatedBy || 'Unassigned'),
        escapeCsv(act.updatedAt || 'N/A'),
      ].join(','));
    }
    lines.push('');

    // Section 4: Investigation Notes
    lines.push('--- SECTION 4: INVESTIGATION NOTES ---');
    lines.push('Note ID,Author Name,Author Email,Role,Timestamp,Content');
    for (const n of incident.notes) {
      lines.push([
        escapeCsv(n.id),
        escapeCsv(n.authorName),
        escapeCsv(n.authorEmail),
        escapeCsv(n.authorRole),
        escapeCsv(n.timestamp),
        escapeCsv(n.content),
      ].join(','));
    }

    return lines.join('\r\n');
  }

  /**
   * Generate an RFC 4180 CSV export for a list of incidents.
   */
  public generateBulkIncidentsCsv(incidents: SecurityIncident[]): string {
    const escapeCsv = (str: string | number | undefined | null) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const headers = [
      'Incident ID',
      'Title',
      'Category',
      'Severity',
      'Status',
      'Risk Score',
      'Risk Level',
      'Primary Station',
      'Affected Stations',
      'Source IPs',
      'Alert Count',
      'Confidence %',
      'Assigned Analyst',
      'Created At',
      'First Detected',
      'Last Updated',
      'Contained At',
      'Resolved At',
      'Root Cause',
    ];

    const rows: string[] = [headers.join(',')];

    for (const inc of incidents) {
      rows.push([
        escapeCsv(inc.id),
        escapeCsv(inc.title),
        escapeCsv(inc.category),
        escapeCsv(inc.severity),
        escapeCsv(inc.status),
        escapeCsv(inc.riskScore),
        escapeCsv(inc.riskLevel),
        escapeCsv(inc.primaryStationId),
        escapeCsv(inc.affectedStations.join('; ')),
        escapeCsv(inc.sourceIps.join('; ')),
        escapeCsv(inc.alerts.length),
        escapeCsv(Math.round(inc.confidence * 100)),
        escapeCsv(inc.assignedTo ? inc.assignedTo.name : 'Unassigned'),
        escapeCsv(inc.createdAt),
        escapeCsv(inc.firstDetectedAt),
        escapeCsv(inc.lastUpdatedAt),
        escapeCsv(inc.containedAt || 'N/A'),
        escapeCsv(inc.resolvedAt || 'N/A'),
        escapeCsv(inc.rootCauseAnalysis || 'N/A'),
      ].join(','));
    }

    return rows.join('\r\n');
  }

  /**
   * Generate a standard valid PDF 1.4 document buffer.
   * Built from raw PDF specifications with Type1 fonts, content streams, and xref tables.
   */
  public generateIncidentPdf(incident: SecurityIncident): Buffer {
    const lines: string[] = [];

    const sanitize = (text: string) => {
      return text.replace(/[\\()]/g, '').slice(0, 95);
    };

    // Build plain lines of text for document content
    lines.push('================================================================================');
    lines.push('      EVSHIELD CYBERSECURITY OPERATIONS CENTER (SOC) INVESTIGATION REPORT       ');
    lines.push('================================================================================');
    lines.push(`Report Generated: ${new Date().toISOString()}`);
    lines.push(`Incident Identifier: ${incident.id}`);
    lines.push(`Classification: ${incident.category} (${incident.categoryLabel})`);
    lines.push(`Severity Rating: ${incident.severity}   |   Current Status: ${incident.status}`);
    lines.push(`Risk Assessment: ${incident.riskScore}/100 [Level: ${incident.riskLevel}]`);
    lines.push(`Target Gateway / Station: ${incident.primaryStationId} (All Affected: ${incident.affectedStations.join(', ')})`);
    lines.push(`Observed Source Indicators: ${incident.sourceIps.join(', ') || 'Internal subnet'}`);
    lines.push(`Assigned SOC Investigator: ${incident.assignedTo ? `${incident.assignedTo.name} (${incident.assignedTo.email})` : 'Unassigned'}`);
    lines.push(`First Detected: ${incident.firstDetectedAt}   |   Last Updated: ${incident.lastUpdatedAt}`);
    if (incident.containedAt) lines.push(`Containment Confirmed: ${incident.containedAt}`);
    if (incident.resolvedAt) lines.push(`Incident Resolved: ${incident.resolvedAt}`);
    lines.push('--------------------------------------------------------------------------------');
    lines.push('1. EXECUTIVE SUMMARY & ATTRIBUTION');
    lines.push(`   ${sanitize(incident.description)}`);
    lines.push(`   Detector Attribution: ${incident.detectorAttribution} (Confidence: ${Math.round(incident.confidence * 100)}%)`);
    lines.push(`   Root Cause Analysis: ${sanitize(incident.rootCauseAnalysis || 'Automated volumetric flood exceeding rate baseline.')}`);
    lines.push('--------------------------------------------------------------------------------');
    lines.push('2. RISK FACTORS & EXPLAINABLE EVALUATION');
    lines.push(`   ${sanitize(incident.riskAssessment.explanation)}`);
    for (const factor of incident.riskAssessment.factors) {
      lines.push(`   * ${factor.name.padEnd(28)} Impact: ${factor.impact.padEnd(12)} Score: ${factor.score > 0 ? '+' : ''}${factor.score} pts`);
    }
    lines.push('--------------------------------------------------------------------------------');
    lines.push(`3. CORRELATED ALERTS (${incident.alerts.length} Records Ingested)`);
    lines.push(`   Correlation Pattern: ${incident.correlationGroup.patternType}`);
    lines.push(`   Correlation Reason: ${sanitize(incident.correlationGroup.correlationReason)}`);
    for (const a of incident.alerts.slice(0, 6)) {
      lines.push(`   - [${a.timestamp.slice(11, 19)}] Alert ${a.alertId}: ${a.category} (${a.severity}) | ${sanitize(a.explanation)}`);
    }
    lines.push('--------------------------------------------------------------------------------');
    lines.push(`4. ATTACK TIMELINE (${incident.timeline.length} Chronological Observations)`);
    for (const ev of incident.timeline.slice(0, 8)) {
      lines.push(`   - [${ev.timestamp.slice(11, 19)}] ${ev.eventType.padEnd(22)} (${ev.actor.name}): ${sanitize(ev.title)}`);
    }
    lines.push('--------------------------------------------------------------------------------');
    lines.push('5. RESPONSE PLAYBOOK & CONTAINMENT ACTIONS');
    for (const act of incident.responseActions) {
      lines.push(`   [${act.status.padEnd(9)}] (${act.priority}) ${sanitize(act.title)} - ${sanitize(act.rationale)}`);
    }
    lines.push('--------------------------------------------------------------------------------');
    lines.push(`6. INVESTIGATION NOTES & AUDIT EVIDENCE (${incident.notes.length} Recorded Notes)`);
    if (incident.notes.length === 0) {
      lines.push('   No notes recorded by security analyst.');
    } else {
      for (const n of incident.notes.slice(0, 4)) {
        lines.push(`   - [${n.timestamp.slice(11, 19)}] ${n.authorName} (${n.authorRole}): ${sanitize(n.content)}`);
      }
    }
    lines.push('================================================================================');
    lines.push('      END OF OFFICIAL EVSHIELD INCIDENT INVESTIGATION REPORT - SECURE RECORD    ');
    lines.push('================================================================================');

    // Split into pages of ~45 lines each
    const pageSize = 45;
    const pages: string[][] = [];
    for (let i = 0; i < lines.length; i += pageSize) {
      pages.push(lines.slice(i, i + pageSize));
    }

    // Build raw PDF 1.4 stream
    const chunks: string[] = [];
    chunks.push('%PDF-1.4\n%âãÏÓ\n');

    let objectIndex = 1;
    const offsets: number[] = [];

    // Helper to add object
    const addObject = (content: string) => {
      offsets.push(Buffer.byteLength(chunks.join(''), 'utf-8'));
      chunks.push(`${objectIndex} 0 obj\n${content}\nendobj\n`);
      objectIndex++;
      return objectIndex - 1;
    };

    // Obj 1: Catalog
    // Obj 2: Pages
    // Obj 3: Font
    // Followed by Page and Content objects
    const catalogObj = objectIndex++;
    const pagesObj = objectIndex++;
    const fontObj = objectIndex++;

    const pageObjIds: number[] = [];
    const contentObjIds: number[] = [];

    for (let p = 0; p < pages.length; p++) {
      const pageId = objectIndex++;
      const contentId = objectIndex++;
      pageObjIds.push(pageId);
      contentObjIds.push(contentId);
    }

    // Write Page Content streams
    const pageStreams: string[] = [];
    for (let p = 0; p < pages.length; p++) {
      const pageLines = pages[p];
      let streamContent = 'BT\n/F1 9.5 Tf\n14 TL\n40 760 Td\n';
      for (let l = 0; l < pageLines.length; l++) {
        const line = pageLines[l].replace(/[\\()]/g, '');
        streamContent += `(${line}) '\n`;
      }
      streamContent += 'ET\n';
      pageStreams.push(streamContent);
    }

    // Now emit objects
    offsets[catalogObj] = Buffer.byteLength(chunks.join(''), 'utf-8');
    chunks.push(`${catalogObj} 0 obj\n<< /Type /Catalog /Pages ${pagesObj} 0 R >>\nendobj\n`);

    offsets[pagesObj] = Buffer.byteLength(chunks.join(''), 'utf-8');
    chunks.push(
      `${pagesObj} 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj\n`
    );

    offsets[fontObj] = Buffer.byteLength(chunks.join(''), 'utf-8');
    chunks.push(
      `${fontObj} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n`
    );

    for (let p = 0; p < pages.length; p++) {
      const pId = pageObjIds[p];
      const cId = contentObjIds[p];
      const stream = pageStreams[p];

      offsets[pId] = Buffer.byteLength(chunks.join(''), 'utf-8');
      chunks.push(
        `${pId} 0 obj\n<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${cId} 0 R >>\nendobj\n`
      );

      offsets[cId] = Buffer.byteLength(chunks.join(''), 'utf-8');
      chunks.push(
        `${cId} 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf-8')} >>\nstream\n${stream}endstream\nendobj\n`
      );
    }

    // Cross-reference table
    const startXref = Buffer.byteLength(chunks.join(''), 'utf-8');
    chunks.push(`xref\n0 ${objectIndex}\n0000000000 65535 f \n`);
    for (let i = 1; i < objectIndex; i++) {
      const offset = (offsets[i] || 0).toString().padStart(10, '0');
      chunks.push(`${offset} 00000 n \n`);
    }

    // Trailer
    chunks.push(`trailer\n<< /Size ${objectIndex} /Root ${catalogObj} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`);

    return Buffer.from(chunks.join(''), 'utf-8');
  }
}

export const incidentReportService = new IncidentReportService();

