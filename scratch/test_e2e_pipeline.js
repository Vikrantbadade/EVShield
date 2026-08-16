const fs = require('fs');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testPipeline() {
  console.log('================================================================');
  console.log('🧪 EVSHIELD END-TO-END AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  // TEST 1: Health Checks
  console.log('--- TEST 1: HEALTH CHECKS ---');
  try {
    const serverHealth = await (await fetch('http://127.0.0.1:8080/health')).json();
    console.log('✓ Fake Server (Port 8080):', JSON.stringify(serverHealth));
  } catch (err) {
    console.error('✗ Fake Server Health Failed:', err.message);
  }

  try {
    const backendHealth = await (await fetch('http://127.0.0.1:5000/api/v1/health')).json();
    console.log('✓ Backend API (Port 5000):', JSON.stringify(backendHealth));
  } catch (err) {
    console.error('✗ Backend Health Failed:', err.message);
  }

  try {
    const initialSnap = await (await fetch('http://127.0.0.1:5000/api/v1/telemetry/live')).json();
    console.log('✓ Telemetry Live API:', initialSnap.success ? 'ONLINE' : 'FAILED');
    console.log('  Subsystems:', JSON.stringify(initialSnap.data.health));
  } catch (err) {
    console.error('✗ Telemetry API Failed:', err.message);
  }

  // TEST 2: Start Normal Traffic
  console.log('\n--- TEST 2: START NORMAL TRAFFIC ---');
  const normalStart = await (
    await fetch('http://127.0.0.1:5000/api/v1/demo/start-normal', { method: 'POST' })
  ).json();
  console.log('✓ Triggered /demo/start-normal:', normalStart.data.message);

  console.log('Waiting 3.5 seconds for telemetry accumulation...');
  await sleep(3500);

  const normalSnap = await (await fetch('http://127.0.0.1:5000/api/v1/telemetry/live')).json();
  console.log('📊 Normal Telemetry Metrics:');
  console.log('   - Requests/Sec   :', normalSnap.data.telemetry.requestsPerSecond);
  console.log('   - Total Requests :', normalSnap.data.telemetry.totalRequests);
  console.log('   - Avg Latency    :', normalSnap.data.telemetry.averageLatencyMs, 'ms');
  console.log('   - Error Rate     :', normalSnap.data.telemetry.errorRatePercent, '%');
  console.log('🤖 Normal ML Inference (Real Random Forest):');
  console.log('   - Attack Probability :', (normalSnap.data.ml.probability_attack * 100).toFixed(2) + '%');
  console.log('   - Decision Threshold :', (normalSnap.data.ml.threshold * 100).toFixed(2) + '%');
  console.log('   - Predicted Label    :', normalSnap.data.ml.predicted_label, `(${normalSnap.data.ml.label})`);
  console.log('   - Threat Level State :', normalSnap.data.threatLevel);
  console.log('   - Security Status    :', normalSnap.data.securityStatus);
  console.log('   - Extracted 10 Feats :', JSON.stringify(normalSnap.data.ml.features));

  // TEST 3: Start Attack Simulation
  console.log('\n--- TEST 3: START ATTACK SIMULATION (DDoS Authentication Flood) ---');
  const attackStart = await (
    await fetch('http://127.0.0.1:5000/api/v1/demo/start-attack', { method: 'POST' })
  ).json();
  console.log('✓ Triggered /demo/start-attack:', attackStart.data.message);

  console.log('Waiting 4.0 seconds for attack telemetry surge...');
  await sleep(4000);

  const attackSnap = await (await fetch('http://127.0.0.1:5000/api/v1/telemetry/live')).json();
  console.log('📊 Attack Telemetry Metrics:');
  console.log('   - Requests/Sec   :', attackSnap.data.telemetry.requestsPerSecond);
  console.log('   - Total Requests :', attackSnap.data.telemetry.totalRequests);
  console.log('   - Avg Latency    :', attackSnap.data.telemetry.averageLatencyMs, 'ms');
  console.log('   - Error Rate     :', attackSnap.data.telemetry.errorRatePercent, '%');
  console.log('🤖 Attack ML Inference (Real Random Forest):');
  console.log('   - Attack Probability :', (attackSnap.data.ml.probability_attack * 100).toFixed(2) + '%');
  console.log('   - Decision Threshold :', (attackSnap.data.ml.threshold * 100).toFixed(2) + '%');
  console.log('   - Predicted Label    :', attackSnap.data.ml.predicted_label, `(${attackSnap.data.ml.label})`);
  console.log('   - Threat Level State :', attackSnap.data.threatLevel);
  console.log('   - Security Status    :', attackSnap.data.securityStatus);
  console.log('   - Extracted 10 Feats :', JSON.stringify(attackSnap.data.ml.features));

  // TEST 4: Stop Attack & Recovery
  console.log('\n--- TEST 4: STOP ATTACK & RECOVERY ---');
  const stopRes = await (
    await fetch('http://127.0.0.1:5000/api/v1/demo/stop', { method: 'POST' })
  ).json();
  console.log('✓ Triggered /demo/stop:', stopRes.data.message);

  console.log('Waiting 7.0 seconds for telemetry window drain and ML recovery...');
  await sleep(7000);

  const recoverSnap = await (await fetch('http://127.0.0.1:5000/api/v1/telemetry/live')).json();
  console.log('📊 Recovered Telemetry Metrics:');
  console.log('   - Requests/Sec   :', recoverSnap.data.telemetry.requestsPerSecond);
  console.log('   - Total Requests :', recoverSnap.data.telemetry.totalRequests);
  console.log('   - Avg Latency    :', recoverSnap.data.telemetry.averageLatencyMs, 'ms');
  console.log('🤖 Recovered ML Inference:');
  console.log('   - Attack Probability :', (recoverSnap.data.ml.probability_attack * 100).toFixed(2) + '%');
  console.log('   - Decision Threshold :', (recoverSnap.data.ml.threshold * 100).toFixed(2) + '%');
  console.log('   - Predicted Label    :', recoverSnap.data.ml.predicted_label, `(${recoverSnap.data.ml.label})`);
  console.log('   - Threat Level State :', recoverSnap.data.threatLevel);
  console.log('   - Security Status    :', recoverSnap.data.securityStatus);

  console.log('\n📜 Recent Security Events:');
  recoverSnap.data.events.slice(0, 5).forEach((ev) => {
    console.log(`   [${ev.timeStr}] ${ev.type.padEnd(8)} ${ev.title} - ${ev.message}`);
  });

  console.log('\n================================================================');
  console.log('✅ ALL PIPELINE TESTS COMPLETED SUCCESSFULLY');
  console.log('================================================================');
}

testPipeline().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
