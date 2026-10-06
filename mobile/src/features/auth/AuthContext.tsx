import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { LoginInput, RegisterInput } from '@pms/shared';
import * as authApi from './api';
import type { UserDto } from './types';
import { loadTokensFromStorage } from '../../lib/api/tokenStore';
import { setForcedLogoutHandler } from '../../lib/api/client';

interface AuthContextValue {
  user: UserDto | null;
  isBootstrapping: boolean;
  sessionExpired: boolean;
  dismissSessionExpired: () => void;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const userRef = useRef<UserDto | null>(null);
  userRef.current = user;

  useEffect(() => {
    setForcedLogoutHandler(() => {
      if (userRef.current) {
        setSessionExpired(true);
      }
      setUser(null);
    });
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const hasRefreshToken = await loadTokensFromStorage();
      if (!hasRefreshToken) {
        if (active) setIsBootstrapping(false);
        return;
      }
      try {
        const me = await authApi.fetchMe();
        if (active) setUser(me);
      } catch {
        // Refresh token invalid/expired; stay logged out silently (not a forced-logout event).
      } finally {
        if (active) setIsBootstrapping(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function login(input: LoginInput): Promise<void> {
    const loggedInUser = await authApi.login(input);
    setSessionExpired(false);
    setUser(loggedInUser);
  }

  async function register(input: RegisterInput): Promise<void> {
    const registeredUser = await authApi.register(input);
    setSessionExpired(false);
    setUser(registeredUser);
  }

  async function logout(): Promise<void> {
    await authApi.logout();
    setUser(null);
  }

  function dismissSessionExpired(): void {
    setSessionExpired(false);
  }

  return (
    <AuthContext.Provider
      value={{ user, isBootstrapping, sessionExpired, dismissSessionExpired, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
