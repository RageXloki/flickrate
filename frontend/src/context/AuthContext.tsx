import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { User } from "@/types";
import { tokenStorage } from "@/services/apiClient";
import * as authService from "@/services/authService";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, password2: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!tokenStorage.getAccess()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const currentUser = await authService.fetchCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
      tokenStorage.clear();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    const onExpired = () => setUser(null);
    window.addEventListener("flickrate:session-expired", onExpired);
    return () => window.removeEventListener("flickrate:session-expired", onExpired);
  }, [refreshUser]);

  const login = async (username: string, password: string) => {
    const loggedInUser = await authService.login(username, password);
    setUser(loggedInUser);
  };

  const register = async (username: string, email: string, password: string, password2: string) => {
    await authService.register(username, email, password, password2);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
