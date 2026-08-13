"use strict";

const { spawn } = require("child_process");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../../../..");
const PYTHON = path.join(PROJECT_ROOT, ".venv", "bin", "python");
const PREDICT = path.join(PROJECT_ROOT, "ml", "inference", "predict.py");

function predict(features, opts = {}) {
  const timeoutMs = typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 5000; // default 5s
  return new Promise((resolve, reject) => {
    // Basic existence check for Python executable is useful to fail fast
    // without exposing filesystem paths in error messages.
    try {
      const child = spawn(PYTHON, [PREDICT], {
        cwd: PROJECT_ROOT,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let finished = false;

      const timer = setTimeout(() => {
        if (finished) return;
        finished = true;
        try { child.kill('SIGKILL'); } catch (e) {}
        return reject(new Error('ML inference timeout'));
      }, timeoutMs);

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (err) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        // Do not leak internal paths or stack traces to client
        return reject(new Error('Failed to start ML process'));
      });

      child.on("close", (code) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (code !== 0) {
          // Provide sanitized error but include stderr if available
          const msg = stderr.trim() ? `ML process error: ${stderr.trim()}` : `ML process exited with code ${code}`;
          return reject(new Error(msg));
        }

        try {
          const parsed = JSON.parse(stdout);
          return resolve(parsed);
        } catch (e) {
          return reject(new Error('ML returned invalid JSON'));
        }
      });

      // Write features to the ML process
      try {
        child.stdin.write(JSON.stringify(features));
        child.stdin.end();
      } catch (e) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        try { child.kill('SIGKILL'); } catch (e) {}
        return reject(new Error('Failed to send data to ML process'));
      }
    } catch (err) {
      return reject(new Error('ML service unavailable'));
    }
  });
}

module.exports = { predict };
