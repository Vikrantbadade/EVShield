import {
  PrismaClient,
  StationStatus,
  SeverityLevel,
  IncidentStatus,
  AttackType,
  ClassificationType,
  SystemEventType,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding EVShield database...\n');

  // ─────────────────────────────────────────────
  // 1. CHARGING STATIONS
  //    metadata carries all operational/telemetry fields that are not
  //    part of the normalized schema columns. The service layer unpacks them.
  // ─────────────────────────────────────────────
  console.log('📍 Creating charging stations...');

  const station1 = await prisma.chargingStation.upsert({
    where: { stationId: 'EVS-DEMO-001' },
    update: {
      name: 'Mumbai Central Supercharger Hub',
      location: 'Bandra-Kurla Complex, Mumbai',
      status: StationStatus.ONLINE,
      metadata: {
        vendor: 'ChargePoint',
        model: 'CT4000',
        firmwareVersion: '1.4.2',
        // Telemetry / operational fields (unpacked by StationService)
        region: 'MUM',
        regionLabel: 'Mumbai Metro Region',
        requestsPerSec: 420,
        latencyMs: 14,
        healthPercent: 99.1,
        errorRatePercent: 0.12,
        connectedChargers: 48,
        lastEvent: 'Telemetry pulse nominal',
        mlStatus: 'NORMAL',
        mlConfidence: 99.4,
      },
    },
    create: {
      stationId: 'EVS-DEMO-001',
      name: 'Mumbai Central Supercharger Hub',
      location: 'Bandra-Kurla Complex, Mumbai',
      status: StationStatus.ONLINE,
      ipAddress: '192.168.10.1',
      latitude: 19.0596,
      longitude: 72.8656,
      totalSessions: 1247,
      metadata: {
        vendor: 'ChargePoint',
        model: 'CT4000',
        firmwareVersion: '1.4.2',
        region: 'MUM',
        regionLabel: 'Mumbai Metro Region',
        requestsPerSec: 420,
        latencyMs: 14,
        healthPercent: 99.1,
        errorRatePercent: 0.12,
        connectedChargers: 48,
        lastEvent: 'Telemetry pulse nominal',
        mlStatus: 'NORMAL',
        mlConfidence: 99.4,
      },
    },
  });

  const station2 = await prisma.chargingStation.upsert({
    where: { stationId: 'CS-0421' },
    update: {
      name: 'Pune Express Terminal',
      location: 'Viman Nagar, Pune',
      status: StationStatus.UNDER_ATTACK,
      metadata: {
        vendor: 'Tesla',
        model: 'Supercharger V3',
        firmwareVersion: '2.1.0',
        region: 'PUN',
        regionLabel: 'Pune Metropolitan',
        requestsPerSec: 1850,
        latencyMs: 120,
        healthPercent: 65.0,
        errorRatePercent: 12.4,
        connectedChargers: 36,
        lastEvent: 'DDoS mitigation rule applied',
        mlStatus: 'ATTACK DETECTED',
        mlConfidence: 97.9,
      },
    },
    create: {
      stationId: 'CS-0421',
      name: 'Pune Express Terminal',
      location: 'Viman Nagar, Pune',
      status: StationStatus.UNDER_ATTACK,
      ipAddress: '192.168.10.2',
      latitude: 18.5679,
      longitude: 73.9143,
      totalSessions: 891,
      metadata: {
        vendor: 'Tesla',
        model: 'Supercharger V3',
        firmwareVersion: '2.1.0',
        region: 'PUN',
        regionLabel: 'Pune Metropolitan',
        requestsPerSec: 1850,
        latencyMs: 120,
        healthPercent: 65.0,
        errorRatePercent: 12.4,
        connectedChargers: 36,
        lastEvent: 'DDoS mitigation rule applied',
        mlStatus: 'ATTACK DETECTED',
        mlConfidence: 97.9,
      },
    },
  });

  const station3 = await prisma.chargingStation.upsert({
    where: { stationId: 'ALT-1092' },
    update: {
      name: 'Bengaluru Tech Park Station',
      location: 'Electronic City Phase 1, Bengaluru',
      status: StationStatus.ONLINE,
      metadata: {
        vendor: 'ABB',
        model: 'Terra 54',
        firmwareVersion: '3.0.1',
        region: 'BLR',
        regionLabel: 'Bengaluru Urban',
        requestsPerSec: 310,
        latencyMs: 16,
        healthPercent: 99.5,
        errorRatePercent: 0.05,
        connectedChargers: 40,
        lastEvent: 'Telemetry normal',
        mlStatus: 'NORMAL',
        mlConfidence: 99.6,
      },
    },
    create: {
      stationId: 'ALT-1092',
      name: 'Bengaluru Tech Park Station',
      location: 'Electronic City Phase 1, Bengaluru',
      status: StationStatus.ONLINE,
      ipAddress: '192.168.10.3',
      latitude: 12.8399,
      longitude: 77.6770,
      totalSessions: 2103,
      metadata: {
        vendor: 'ABB',
        model: 'Terra 54',
        firmwareVersion: '3.0.1',
        region: 'BLR',
        regionLabel: 'Bengaluru Urban',
        requestsPerSec: 310,
        latencyMs: 16,
        healthPercent: 99.5,
        errorRatePercent: 0.05,
        connectedChargers: 40,
        lastEvent: 'Telemetry normal',
        mlStatus: 'NORMAL',
        mlConfidence: 99.6,
      },
    },
  });

  console.log(`   ✅ ${station1.stationId} — ${station1.name}`);
  console.log(`   ✅ ${station2.stationId} — ${station2.name}`);
  console.log(`   ✅ ${station3.stationId} — ${station3.name}`);

  // ─────────────────────────────────────────────
  // 2. ATTACK INCIDENTS
  //    metadata carries rich operational fields (labels, affected stations,
  //    ml confidence, etc.) that don't belong in normalized columns.
  // ─────────────────────────────────────────────
  console.log('\n⚔️  Creating attack incidents...');

  const incident1 = await prisma.attackIncident.upsert({
    where: { incidentId: 'INC-20240801-001' },
    update: {
      metadata: {
        protocol: 'UDP',
        amplificationFactor: 42.3,
        botnetId: 'MIRAI-VARIANT-7',
        // Frontend-facing operational fields
        attackType: 'DDOS',
        attackTypeLabel: 'OCPP Auth Flood (DDoS)',
        classification: 'ATTACK',
        mlConfidence: 98.6,
        baselineRequestsPerSecond: 420,
        peakRequestsPerSecond: 18200,
        affectedNodes: 24,
        affectedStations: [
          { id: 'CS-0421', name: 'Pune Express Terminal', location: 'Viman Nagar, Pune', status: 'UNDER ATTACK', requestsPerSec: 1850 },
          { id: 'EVS-DEMO-001', name: 'Mumbai Central Supercharger Hub', location: 'BKC, Mumbai', status: 'PROTECTED', requestsPerSec: 320 },
        ],
        sourceCategory: 'Botnet (Distributed Multi-Region IP Cluster)',
        targetInfrastructure: 'Authentication API Gateway (OCPP 2.0.1)',
        mitigationStatus: 'Rate limiting applied & malicious IP blocks deployed.',
        mitigationTime: 'Ongoing',
        detectionSummary: 'CICEV2023 RF Classifier flagged abnormal TCP SYN burst and high packet count variance across 42 subnets.',
      },
    },
    create: {
      incidentId: 'INC-20240801-001',
      stationId: 'CS-0421',
      attackType: AttackType.VOLUMETRIC,
      severity: SeverityLevel.CRITICAL,
      status: IncidentStatus.ACTIVE,
      startTime: new Date('2024-08-01T14:32:00Z'),
      requestsPerSec: 15000,
      sourceIps: ['203.0.113.42', '198.51.100.7', '192.0.2.91', '203.0.113.88'],
      packetsDropped: 47823,
      description: 'High-volume distributed SYN/HTTP POST flood targeting electric vehicle authentication endpoints to disrupt charging sessions.',
      metadata: {
        protocol: 'UDP',
        amplificationFactor: 42.3,
        botnetId: 'MIRAI-VARIANT-7',
        attackType: 'DDOS',
        attackTypeLabel: 'OCPP Auth Flood (DDoS)',
        classification: 'ATTACK',
        mlConfidence: 98.6,
        baselineRequestsPerSecond: 420,
        peakRequestsPerSecond: 18200,
        affectedNodes: 24,
        affectedStations: [
          { id: 'CS-0421', name: 'Pune Express Terminal', location: 'Viman Nagar, Pune', status: 'UNDER ATTACK', requestsPerSec: 1850 },
          { id: 'EVS-DEMO-001', name: 'Mumbai Central Supercharger Hub', location: 'BKC, Mumbai', status: 'PROTECTED', requestsPerSec: 320 },
        ],
        sourceCategory: 'Botnet (Distributed Multi-Region IP Cluster)',
        targetInfrastructure: 'Authentication API Gateway (OCPP 2.0.1)',
        mitigationStatus: 'Rate limiting applied & malicious IP blocks deployed.',
        mitigationTime: 'Ongoing',
        detectionSummary: 'CICEV2023 RF Classifier flagged abnormal TCP SYN burst and high packet count variance across 42 subnets.',
      },
    },
  });

  const incident2 = await prisma.attackIncident.upsert({
    where: { incidentId: 'INC-20240725-002' },
    update: {
      metadata: {
        toolSignature: 'OpenBullet2',
        successRate: 0.003,
        attackType: 'AUTHENTICATION_BURST',
        attackTypeLabel: 'Credential Stuffing / Auth Burst',
        classification: 'ATTACK',
        mlConfidence: 94.2,
        baselineRequestsPerSecond: 380,
        peakRequestsPerSecond: 8100,
        affectedNodes: 12,
        affectedStations: [
          { id: 'EVS-DEMO-001', name: 'Mumbai Central Supercharger Hub', location: 'BKC, Mumbai', status: 'PROTECTED', requestsPerSec: 210 },
        ],
        sourceCategory: 'Anomalous Gateway Proxy Cluster',
        targetInfrastructure: 'User Auth & Key Exchange Service',
        mitigationStatus: 'CAPTCHA challenge activated; geo-filtering enforced.',
        mitigationTime: '2h 37m',
        detectionSummary: 'Elevated failed authentication error rate detected combined with low packet inter-arrival time.',
      },
    },
    create: {
      incidentId: 'INC-20240725-002',
      stationId: 'EVS-DEMO-001',
      attackType: AttackType.CREDENTIAL_STUFFING,
      severity: SeverityLevel.HIGH,
      status: IncidentStatus.RESOLVED,
      startTime: new Date('2024-07-25T09:10:00Z'),
      endTime: new Date('2024-07-25T11:47:00Z'),
      requestsPerSec: 340,
      sourceIps: ['185.220.101.5', '185.220.101.6'],
      packetsDropped: 1209,
      description: 'Automated credential stuffing attack against user authentication API.',
      metadata: {
        toolSignature: 'OpenBullet2',
        successRate: 0.003,
        attackType: 'AUTHENTICATION_BURST',
        attackTypeLabel: 'Credential Stuffing / Auth Burst',
        classification: 'ATTACK',
        mlConfidence: 94.2,
        baselineRequestsPerSecond: 380,
        peakRequestsPerSecond: 8100,
        affectedNodes: 12,
        affectedStations: [
          { id: 'EVS-DEMO-001', name: 'Mumbai Central Supercharger Hub', location: 'BKC, Mumbai', status: 'PROTECTED', requestsPerSec: 210 },
        ],
        sourceCategory: 'Anomalous Gateway Proxy Cluster',
        targetInfrastructure: 'User Auth & Key Exchange Service',
        mitigationStatus: 'CAPTCHA challenge activated; geo-filtering enforced.',
        mitigationTime: '2h 37m',
        detectionSummary: 'Elevated failed authentication error rate detected combined with low packet inter-arrival time.',
      },
    },
  });

  const incident3 = await prisma.attackIncident.upsert({
    where: { incidentId: 'INC-20240720-003' },
    update: {
      metadata: {
        tokenAge: '72h',
        protocol: 'OCPP 1.6',
        attackType: 'AUTHENTICATION_BURST',
        attackTypeLabel: 'Credential Spraying / Token Burst',
        classification: 'ATTACK',
        mlConfidence: 89.1,
        baselineRequestsPerSecond: 350,
        peakRequestsPerSecond: 3400,
        affectedNodes: 5,
        affectedStations: [
          { id: 'ALT-1092', name: 'Bengaluru Tech Park Station', location: 'Electronic City, Bengaluru', status: 'PROTECTED', requestsPerSec: 540 },
        ],
        sourceCategory: 'Rotated Residential Proxies',
        targetInfrastructure: 'User Auth & Key Exchange Service',
        mitigationStatus: 'Session invalidation applied; replay window closed.',
        mitigationTime: '33m',
        detectionSummary: 'OCPP session token replay attempt intercepted. Token timestamp outside valid window.',
      },
    },
    create: {
      incidentId: 'INC-20240720-003',
      stationId: 'ALT-1092',
      attackType: AttackType.REPLAY_ATTACK,
      severity: SeverityLevel.MEDIUM,
      status: IncidentStatus.MITIGATED,
      startTime: new Date('2024-07-20T22:05:00Z'),
      endTime: new Date('2024-07-20T22:38:00Z'),
      requestsPerSec: 120,
      sourceIps: ['10.0.0.55'],
      packetsDropped: 612,
      description: 'OCPP session token replay attempt intercepted by EVShield.',
      metadata: {
        tokenAge: '72h',
        protocol: 'OCPP 1.6',
        attackType: 'AUTHENTICATION_BURST',
        attackTypeLabel: 'Credential Spraying / Token Burst',
        classification: 'ATTACK',
        mlConfidence: 89.1,
        baselineRequestsPerSecond: 350,
        peakRequestsPerSecond: 3400,
        affectedNodes: 5,
        affectedStations: [
          { id: 'ALT-1092', name: 'Bengaluru Tech Park Station', location: 'Electronic City, Bengaluru', status: 'PROTECTED', requestsPerSec: 540 },
        ],
        sourceCategory: 'Rotated Residential Proxies',
        targetInfrastructure: 'User Auth & Key Exchange Service',
        mitigationStatus: 'Session invalidation applied; replay window closed.',
        mitigationTime: '33m',
        detectionSummary: 'OCPP session token replay attempt intercepted. Token timestamp outside valid window.',
      },
    },
  });

  console.log(`   ✅ ${incident1.incidentId} — ${incident1.attackType} (${incident1.severity})`);
  console.log(`   ✅ ${incident2.incidentId} — ${incident2.attackType} (${incident2.severity})`);
  console.log(`   ✅ ${incident3.incidentId} — ${incident3.attackType} (${incident3.severity})`);

  // ─────────────────────────────────────────────
  // 3. SECURITY ALERTS
  //    metadata carries mlConfidence for frontend Alert interface.
  // ─────────────────────────────────────────────
  console.log('\n🔔 Creating security alerts...');

  const alert1 = await prisma.securityAlert.upsert({
    where: { alertId: 'ALERT-001' },
    update: {
      metadata: { autoTriggered: true, notificationSent: true, mlConfidence: 98.6 },
    },
    create: {
      alertId: 'ALERT-001',
      stationId: 'CS-0421',
      incidentId: 'INC-20240801-001',
      severity: SeverityLevel.CRITICAL,
      title: 'CRITICAL: High Volume Volumetric DDoS Triggered',
      message: 'Authentication API target scope receiving > 18,000 req/sec from suspicious botnet cluster.',
      acknowledged: false,
      metadata: { autoTriggered: true, notificationSent: true, mlConfidence: 98.6 },
    },
  });

  const alert2 = await prisma.securityAlert.upsert({
    where: { alertId: 'ALERT-002' },
    update: {
      metadata: { autoTriggered: true, mlConfidence: 94.2 },
    },
    create: {
      alertId: 'ALERT-002',
      stationId: 'EVS-DEMO-001',
      incidentId: 'INC-20240725-002',
      severity: SeverityLevel.HIGH,
      title: 'HIGH: Credential Bursting Pattern Detected',
      message: 'Multiple login tokens generated within 50ms window across Mumbai station nodes.',
      acknowledged: true,
      acknowledgedAt: new Date('2024-07-25T12:00:00Z'),
      acknowledgedBy: 'security-team@evshield.io',
      metadata: { autoTriggered: true, mlConfidence: 94.2 },
    },
  });

  const alert3 = await prisma.securityAlert.upsert({
    where: { alertId: 'ALERT-003' },
    update: {
      metadata: { autoTriggered: true, mlConfidence: 89.1 },
    },
    create: {
      alertId: 'ALERT-003',
      stationId: 'ALT-1092',
      incidentId: 'INC-20240720-003',
      severity: SeverityLevel.MEDIUM,
      title: 'WARNING: Unusual Flow Duration Variance',
      message: 'Bengaluru station experiencing 3x baseline HTTP keep-alive duration.',
      acknowledged: true,
      acknowledgedAt: new Date('2024-07-20T23:00:00Z'),
      acknowledgedBy: 'security-team@evshield.io',
      metadata: { autoTriggered: true, mlConfidence: 89.1 },
    },
  });

  console.log(`   ✅ ${alert1.alertId} — ${alert1.title}`);
  console.log(`   ✅ ${alert2.alertId} — ${alert2.title}`);
  console.log(`   ✅ ${alert3.alertId} — ${alert3.title}`);

  // ─────────────────────────────────────────────
  // 4. ML PREDICTIONS (placeholder — populated by Python service in Phase 10)
  // ─────────────────────────────────────────────
  console.log('\n🤖 Creating ML prediction placeholders...');

  const pred1 = await prisma.mLPrediction.upsert({
    where: { predictionId: 'PRED-001' },
    update: {},
    create: {
      predictionId: 'PRED-001',
      stationId: 'CS-0421',
      incidentId: 'INC-20240801-001',
      classification: ClassificationType.ATTACK,
      confidence: 0.9832,
      modelVersion: 'CICEV2023-v1.0',
      featureSummary: { packetRate: 15000, protocolDistribution: { UDP: 0.87, TCP: 0.13 }, anomalyScore: 0.98 },
      rawFeatureRef: 'feature-store://cicev2023/INC-20240801-001',
    },
  });

  const pred2 = await prisma.mLPrediction.upsert({
    where: { predictionId: 'PRED-002' },
    update: {},
    create: {
      predictionId: 'PRED-002',
      stationId: 'EVS-DEMO-001',
      classification: ClassificationType.NORMAL,
      confidence: 0.9121,
      modelVersion: 'CICEV2023-v1.0',
      featureSummary: { packetRate: 42, anomalyScore: 0.04 },
      rawFeatureRef: 'feature-store://cicev2023/EVS-DEMO-001-baseline',
    },
  });

  console.log(`   ✅ ${pred1.predictionId} — ${pred1.classification} (confidence: ${pred1.confidence})`);
  console.log(`   ✅ ${pred2.predictionId} — ${pred2.classification} (confidence: ${pred2.confidence})`);

  // ─────────────────────────────────────────────
  // 5. SYSTEM EVENTS
  // ─────────────────────────────────────────────
  console.log('\n📋 Creating system events...');

  await prisma.systemEvent.createMany({
    data: [
      {
        eventType: SystemEventType.SERVER_START,
        source: 'backend-api',
        message: 'EVShield API server started successfully on port 5000.',
        metadata: { nodeVersion: process.version, environment: 'development' },
        createdAt: new Date('2024-08-01T00:00:00Z'),
      },
      {
        eventType: SystemEventType.DB_CONNECTED,
        source: 'backend-api',
        message: 'PostgreSQL database connection established via Prisma ORM.',
        createdAt: new Date('2024-08-01T00:00:01Z'),
      },
      {
        eventType: SystemEventType.ML_MODEL_LOADED,
        source: 'ml-service',
        message: 'CICEV2023 model weights loaded successfully.',
        metadata: { modelVersion: 'CICEV2023-v1.0', loadTimeMs: 1243 },
        createdAt: new Date('2024-08-01T00:00:05Z'),
      },
    ],
    skipDuplicates: true,
  });

  console.log('   ✅ System events logged');

  // ─────────────────────────────────────────────
  console.log('\n✅ Database seeding complete!');
  console.log(`   • ${await prisma.chargingStation.count()} charging stations`);
  console.log(`   • ${await prisma.attackIncident.count()} attack incidents`);
  console.log(`   • ${await prisma.securityAlert.count()} security alerts`);
  console.log(`   • ${await prisma.mLPrediction.count()} ML predictions`);
  console.log(`   • ${await prisma.systemEvent.count()} system events`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
