// Global auth state: current user, login/register/logout, and session bootstrap on load.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { LoginInput, RegisterInput } from '@pms/shared';
import * as authApi from './api';
import type { UserDto } from './types';
import { queryClient } from '../../app/queryClient';

interface AuthContextValue {
  user: UserDto | null;
  isBootstrapping: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Provides user/session state to app
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Tries to restore session on load
  useEffect(() => {
    let active = true;
    authApi.silentRefresh().then((result) => {
      if (active) {
        setUser(result);
        setIsBootstrapping(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Logs in, resets cached queries
  async function login(input: LoginInput): Promise<void> {
    const loggedInUser = await authApi.login(input);
    queryClient.clear();
    setUser(loggedInUser);
  }

  // Registers, resets cached queries
  async function register(input: RegisterInput): Promise<void> {
    const registeredUser = await authApi.register(input);
    queryClient.clear();
    setUser(registeredUser);
  }

  // Logs out, clears local state
  async function logout(): Promise<void> {
    await authApi.logout();
    queryClient.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isBootstrapping, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to access auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
