import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../use-auth';

// Mock the API
vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      login: vi.fn().mockResolvedValue({
        user: { id: 1, email: 'test@example.com' },
        token: 'mock-token',
      }),
      register: vi.fn().mockResolvedValue({
        user: { id: 1, email: 'test@example.com' },
        token: 'mock-token',
      }),
    },
  },
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with unauthenticated state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles login successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.user).toEqual({
      id: 1,
      email: 'test@example.com',
    });
    expect(result.current.token).toBe('mock-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe('mock-token');
  });

  it('handles register successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register('new@example.com', 'password123');
    });

    expect(result.current.user).toEqual({
      id: 1,
      email: 'test@example.com',
    });
    expect(result.current.token).toBe('mock-token');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('handles logout correctly', () => {
    const { result } = renderHook(() => useAuth());

    // First login
    act(() => {
      result.current.setAuth(
        { id: 1, email: 'test@example.com' },
        'mock-token'
      );
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('persists auth state', () => {
    const { result, rerender } = renderHook(() => useAuth());

    act(() => {
      result.current.setAuth(
        { id: 1, email: 'test@example.com' },
        'persisted-token'
      );
    });

    // Simulate remounting component
    rerender();

    expect(result.current.user).toEqual({
      id: 1,
      email: 'test@example.com',
    });
    expect(result.current.token).toBe('persisted-token');
    expect(result.current.isAuthenticated).toBe(true);
  });
});
