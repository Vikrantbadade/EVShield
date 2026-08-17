const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const pythonCmd = path.resolve(root, '.venv', 'Scripts', 'python.exe');
const script = path.resolve(root, 'ml', 'inference', 'extract_and_predict.py');

console.log('Testing spawn:', { pythonCmd, script, exists: fs.existsSync(pythonCmd), scriptExists: fs.existsSync(script) });

const child = spawn(pythonCmd, ['-u', script], {
  cwd: root,
  env: { ...process.env, PYTHONPATH: root },
  stdio: ['pipe', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';

child.stdout.on('data', d => {
  stdout += d.toString();
  console.log('STDOUT chunk:', d.toString());
});

child.stderr.on('data', d => {
  stderr += d.toString();
  console.log('STDERR chunk:', d.toString());
});

child.on('error', err => {
  console.error('SPAWN ERROR:', err);
});

child.on('close', code => {
  console.log('EXIT CODE:', code, 'FULL STDOUT:', stdout, 'FULL STDERR:', stderr);
});

const payload = JSON.stringify({ data_point: [2.0, 2.5, 3.1, 2.4, 2.8], symbol: 'test' });
console.log('Writing payload:', payload);
child.stdin.write(payload + '\n');
child.stdin.end();
console.log('Payload written and stdin closed.');
