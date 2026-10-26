import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { config } from '../config/env.js';

function extractToken(req: Request): string | null {
  // Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Check Cookie header
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/evshield_session=([^;]+)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

export const authController = {
  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login(email, password);

      res.cookie('evshield_session', token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.status(200).json({
        success: true,
        data: {
          user,
          token,
        },
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        message: err.message || 'Authentication failed.',
      });
    }
  },

  signup: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, name } = req.body;
      const { user, token } = await authService.signup(email, password, name);

      res.cookie('evshield_session', token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.status(201).json({
        success: true,
        data: {
          user,
          token,
        },
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Registration failed.',
      });
    }
  },

  me: async (req: Request, res: Response): Promise<void> => {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No active session found.',
      });
      return;
    }

    const user = authService.verifyToken(token);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Session is invalid or expired.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  },

  logout: async (req: Request, res: Response): Promise<void> => {
    const token = extractToken(req);
    if (token) {
      authService.logout(token);
    }

    res.clearCookie('evshield_session', { path: '/' });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  },

  demoAccounts: async (_req: Request, res: Response): Promise<void> => {
    const accounts = authService.getDemoAccounts();
    res.status(200).json({
      success: true,
      data: accounts,
    });
  },
};
