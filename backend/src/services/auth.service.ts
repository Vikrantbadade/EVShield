import crypto from 'crypto';
import { db, checkDatabaseConnection } from '../config/database.js';
import { config } from '../config/env.js';

export type UserRole = 'admin' | 'security_analyst' | 'soc_operator' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface DemoAccountInfo {
  email: string;
  name: string;
  role: UserRole;
  description: string;
}

export const DEMO_ACCOUNTS: DemoAccountInfo[] = [
  {
    email: 'admin@evshield.demo',
    name: 'Admin',
    role: 'admin',
    description: 'Full administration and system management',
  },
  {
    email: 'analyst@evshield.demo',
    name: 'Security Analyst',
    role: 'security_analyst',
    description: 'Incident investigation, logs, telemetry, and ML analysis',
  },
  {
    email: 'operator@evshield.demo',
    name: 'SOC Operator',
    role: 'soc_operator',
    description: 'Live monitoring, alert acknowledgement, and authorized response actions',
  },
  {
    email: 'viewer@evshield.demo',
    name: 'Viewer',
    role: 'viewer',
    description: 'Read-only monitoring and reporting',
  },
];

export const DEMO_PASSWORD = 'EVShieldDemo@2026';

interface SessionData {
  user: AuthUser;
  expiresAt: number;
}

class AuthService {
  private inMemoryUsers: Map<string, { id: string; email: string; name: string; role: UserRole; passwordHash: string; createdAt: string }> = new Map();
  private sessions: Map<string, SessionData> = new Map();
  private initialized = false;

  constructor() {
    this.init();
  }

  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, storedHash: string): boolean {
    try {
      const [salt, hash] = storedHash.split(':');
      if (!salt || !hash) return false;
      const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
    } catch {
      return false;
    }
  }

  /**
   * Idempotent initialization & demo account seeding
   */
  public async init(): Promise<void> {
    if (this.initialized) return;

    // Seed demo accounts in-memory first for guaranteed resilience
    for (const demo of DEMO_ACCOUNTS) {
      const emailLower = demo.email.toLowerCase();
      const pwdHash = this.hashPassword(DEMO_PASSWORD);
      this.inMemoryUsers.set(emailLower, {
        id: `usr-demo-${demo.role}`,
        email: emailLower,
        name: demo.name,
        role: demo.role,
        passwordHash: pwdHash,
        createdAt: new Date().toISOString(),
      });
    }

    // Check if database is reachable before attempting Prisma seeding
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      console.log('ℹ️ [AuthService] PostgreSQL offline; using in-memory demo account store.');
      this.initialized = true;
      return;
    }

    // Attempt persistent PostgreSQL database seeding via Prisma
    try {
      for (const demo of DEMO_ACCOUNTS) {
        const emailLower = demo.email.toLowerCase();
        const pwdHash = this.hashPassword(DEMO_PASSWORD);

        await db.user.upsert({
          where: { email: emailLower },
          update: {
            name: demo.name,
            role: demo.role,
            password: pwdHash,
          },
          create: {
            email: emailLower,
            name: demo.name,
            role: demo.role,
            password: pwdHash,
          },
        });
      }
      console.log('🔐 [AuthService] 4 Demo accounts seeded idempotently in PostgreSQL.');
    } catch (err) {
      console.warn('⚠️ [AuthService] Database seed fallback to memory store:', err instanceof Error ? err.message : err);
    }

    this.initialized = true;
  }

  /**
   * Get public list of demo accounts for dev/demo mode
   */
  public getDemoAccounts(): DemoAccountInfo[] {
    if (config.isProduction) {
      return [];
    }
    return DEMO_ACCOUNTS;
  }

  /**
   * Authenticate user with email and password
   */
  public async login(emailInput: string, passwordInput: string): Promise<{ user: AuthUser; token: string }> {
    await this.init();

    if (!emailInput || !passwordInput) {
      throw new Error('Email and password are required.');
    }

    const email = emailInput.trim().toLowerCase();

    // Check PostgreSQL database first
    let dbUser: any = null;
    try {
      dbUser = await db.user.findUnique({ where: { email } });
    } catch (err) {
      console.warn('[AuthService] DB query failed, using memory store:', err);
    }

    if (dbUser) {
      const isValid = this.verifyPassword(passwordInput, dbUser.password);
      if (!isValid) {
        throw new Error('Invalid email or password.');
      }

      const role = (['admin', 'security_analyst', 'soc_operator', 'viewer'].includes(dbUser.role)
        ? dbUser.role
        : 'viewer') as UserRole;

      const user: AuthUser = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role,
        createdAt: dbUser.createdAt.toISOString(),
      };

      const token = this.createSession(user);
      return { user, token };
    }

    // Fallback to in-memory store
    const memUser = this.inMemoryUsers.get(email);
    if (!memUser) {
      throw new Error('Invalid email or password.');
    }

    const isValid = this.verifyPassword(passwordInput, memUser.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }

    const user: AuthUser = {
      id: memUser.id,
      email: memUser.email,
      name: memUser.name,
      role: memUser.role,
      createdAt: memUser.createdAt,
    };

    const token = this.createSession(user);
    return { user, token };
  }

  /**
   * Public user registration — enforces least-privileged 'viewer' role by default
   */
  public async signup(emailInput: string, passwordInput: string, nameInput?: string): Promise<{ user: AuthUser; token: string }> {
    await this.init();

    if (!emailInput || !passwordInput) {
      throw new Error('Email and password are required.');
    }

    const email = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please provide a valid email address.');
    }

    if (passwordInput.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const name = nameInput && nameInput.trim() ? nameInput.trim() : email.split('@')[0];

    // Enforce least-privileged role by default
    const role: UserRole = 'viewer';
    const pwdHash = this.hashPassword(passwordInput);

    // Check memory first
    if (this.inMemoryUsers.has(email)) {
      throw new Error('An account with this email already exists.');
    }

    // Attempt creation in database
    let createdId = `usr-${Date.now()}`;
    let createdAt = new Date().toISOString();

    try {
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        throw new Error('An account with this email already exists.');
      }

      const created = await db.user.create({
        data: {
          email,
          password: pwdHash,
          name,
          role,
        },
      });
      createdId = created.id;
      createdAt = created.createdAt.toISOString();
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        throw err;
      }
      console.warn('[AuthService] DB user creation failed, using memory fallback:', err);
    }

    this.inMemoryUsers.set(email, {
      id: createdId,
      email,
      name,
      role,
      passwordHash: pwdHash,
      createdAt,
    });

    const user: AuthUser = {
      id: createdId,
      email,
      name,
      role,
      createdAt,
    };

    const token = this.createSession(user);
    return { user, token };
  }

  /**
   * Verify session token and retrieve user
   */
  public verifyToken(token: string): AuthUser | null {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    return session.user;
  }

  /**
   * Invalidate session on logout
   */
  public logout(token: string): boolean {
    if (!token) return false;
    return this.sessions.delete(token);
  }

  private createSession(user: AuthUser): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    this.sessions.set(token, { user, expiresAt });
    return token;
  }
}

export const authService = new AuthService();
