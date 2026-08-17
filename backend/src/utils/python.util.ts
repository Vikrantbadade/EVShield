import path from 'path';
import fs from 'fs';

/**
 * Resolves the Python executable path reliably.
 * Priority:
 * 1. process.env.PYTHON_EXECUTABLE (if set and exists on disk)
 * 2. .venv/Scripts/python.exe on Windows or .venv/bin/python on Unix
 * 3. venv/Scripts/python.exe on Windows or venv/bin/python on Unix
 * 4. process.env.PYTHON_EXECUTABLE (if set, even if not verified by fs)
 * 5. Platform default: 'python.exe' / 'python' on Windows, 'python3' on Unix (avoiding 'py' which can hang)
 */
export function resolvePythonExecutable(rootDir: string): string {
  if (process.env.PYTHON_EXECUTABLE && fs.existsSync(process.env.PYTHON_EXECUTABLE)) {
    return process.env.PYTHON_EXECUTABLE;
  }

  const isWin = process.platform === 'win32';
  const candidateRelativePaths = isWin
    ? [
        path.join('.venv', 'Scripts', 'python.exe'),
        path.join('venv', 'Scripts', 'python.exe'),
      ]
    : [
        path.join('.venv', 'bin', 'python3'),
        path.join('.venv', 'bin', 'python'),
        path.join('venv', 'bin', 'python3'),
        path.join('venv', 'bin', 'python'),
      ];

  const searchRoots = [
    rootDir,
    process.cwd(),
    path.resolve(rootDir, '..'),
    path.resolve(process.cwd(), '..'),
  ];

  for (const root of searchRoots) {
    for (const rel of candidateRelativePaths) {
      const candidate = path.resolve(root, rel);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  if (process.env.PYTHON_EXECUTABLE && process.env.PYTHON_EXECUTABLE.trim()) {
    return process.env.PYTHON_EXECUTABLE.trim();
  }

  return isWin ? 'python' : 'python3';
}
