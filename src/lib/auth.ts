import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends NextRequest {
  userId?: number;
  userEmail?: string;
}

export async function authenticateToken(request: NextRequest): Promise<number | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number; email: string };

    return decoded.userId;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function generateToken(userId: number, email: string): string {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

// Client-side AuthService for browser usage
export class AuthService {
  private static readonly TOKEN_KEY = 'token';
  private static readonly USER_KEY = 'user';
  private static readonly API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  static async login(email: string, password: string): Promise<void> {
    const response = await fetch(`${this.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();

    if (data.user && data.token) {
      localStorage.setItem(this.TOKEN_KEY, data.token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
    } else if (data.user) {
      // If no token returned, create a simple one (for compatibility)
      localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
    }
  }

  static async register(email: string, password: string): Promise<void> {
    const response = await fetch(`${this.API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();

    if (data.user && data.token) {
      localStorage.setItem(this.TOKEN_KEY, data.token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
    } else if (data.user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
    }
  }

  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static getUser(): any | null {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;

    return localStorage.getItem(this.TOKEN_KEY);
  }

  static isAuthenticated(): boolean {
    return this.getUser() !== null;
  }
}