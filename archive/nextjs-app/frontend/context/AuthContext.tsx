"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setToken, clearToken, type UserProfile } from "@/lib/api";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string; code?: string; hasGoogle?: boolean; hasPassword?: boolean }>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("wdai_token");
    if (token) {
      api.auth.me().then((res) => {
        if (res.ok) setUser(res.data);
        else if (res.status === 401) clearToken();
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    if (res.ok) {
      setToken(res.data.token);
      setUser(res.data.user);
      return { ok: true };
    }
    return { ok: false, error: res.error };
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await api.auth.signup(name, email, password);
    if (res.ok) {
      setToken(res.data.token);
      setUser(res.data.user);
      return { ok: true };
    }
    const body = res.data as Record<string, unknown> | null;
    return {
      ok: false,
      error: res.error,
      code: body?.["code"] as string | undefined,
      hasGoogle: body?.["hasGoogle"] as boolean | undefined,
      hasPassword: body?.["hasPassword"] as boolean | undefined,
    };
  };

  const logout = () => {
    api.auth.logout().catch(() => {});
    clearToken();
    setUser(null);
    window.location.href = "/login";
  };

  const refresh = async () => {
    const res = await api.auth.me();
    if (res.ok) setUser(res.data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
