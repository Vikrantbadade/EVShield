import { PrismaClient } from '@prisma/client';
import { config } from './env';

// ─────────────────────────────────────────────────────────────────────────────
// Prisma Client Singleton
//
// In Express/Node.js applications, we must export a single PrismaClient
// instance to avoid connection pool exhaustion. In development with hot-reload
// (tsx --watch), we cache it on the globalThis object to prevent multiple
// instances across HMR reloads.
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: config.isDevelopment
      ? ['warn', 'error']
      : ['error'],
    errorFormat: 'colorless',
  });
};

export const db: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (config.isDevelopment) {
  globalThis.__prisma = db;
}

// ─────────────────────────────────────────────────────────────────────────────
// Graceful Disconnect on Shutdown
// ─────────────────────────────────────────────────────────────────────────────

process.on('beforeExit', async () => {
  await db.$disconnect();
});

process.on('SIGINT', async () => {
  await db.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.$disconnect();
  process.exit(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Database Health Check Utility
// ─────────────────────────────────────────────────────────────────────────────

export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const queryPromise = db.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timed out')), 1500)
    );
    await Promise.race([queryPromise, timeoutPromise]);
    return { connected: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : 'Database offline',
    };
  }
}
