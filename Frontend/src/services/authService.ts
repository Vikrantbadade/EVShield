import { apiClient } from './apiClient';

export type UserRole = 'admin' | 'security_analyst' | 'soc_operator' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface DemoAccount {
  email: string;
  name: string;
  role: UserRole;
  description: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await apiClient.post<{ success: boolean; data: LoginResponse }>('/auth/login', {
      email,
      password,
    });
    const data = res.data.data;
    if (data?.token) {
      localStorage.setItem('evshield_token', data.token);
      localStorage.setItem('evshield_user', JSON.stringify(data.user));
    }
    return data;
  },

  async signup(name: string, email: string, password: string): Promise<LoginResponse> {
    const res = await apiClient.post<{ success: boolean; data: LoginResponse }>('/auth/signup', {
      name,
      email,
      password,
    });
    const data = res.data.data;
    if (data?.token) {
      localStorage.setItem('evshield_token', data.token);
      localStorage.setItem('evshield_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getMe(): Promise<AuthUser | null> {
    try {
      const res = await apiClient.get<{ success: boolean; data: { user: AuthUser } }>('/auth/me');
      const user = res.data.data?.user || null;
      if (user) {
        localStorage.setItem('evshield_user', JSON.stringify(user));
      }
      return user;
    } catch {
      localStorage.removeItem('evshield_token');
      localStorage.removeItem('evshield_user');
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('evshield_token');
      localStorage.removeItem('evshield_user');
    }
  },

  async getDemoAccounts(): Promise<DemoAccount[]> {
    const res = await apiClient.get<{ success: boolean; data: DemoAccount[] }>('/auth/demo-accounts');
    return res.data.data || [];
  },

  getStoredToken(): string | null {
    return localStorage.getItem('evshield_token');
  },

  getStoredUser(): AuthUser | null {
    const userStr = localStorage.getItem('evshield_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
};
