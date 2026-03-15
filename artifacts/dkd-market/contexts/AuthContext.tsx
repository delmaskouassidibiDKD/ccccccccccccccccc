import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { queryClient } from "@/lib/query-client";
import { AUTH_STORAGE_KEYS, setTokenGetter, setRefresher, clearHandlers, getApiBase } from "@/lib/auth-storage";

export interface User {
  id: number;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  country_id: number;
  country_code: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  email_verified: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  refreshAuth: () => Promise<string | null>;
  updateUser: (user: User) => void;
  resendVerification: () => Promise<void>;
  checkVerification: () => Promise<boolean>;
  cancelRegistration: () => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  country_id: number;
  country_code?: string;
  phone_number?: string;
  role?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveTokens = useCallback(async (tokens: AuthTokens) => {
    setAccessToken(tokens.accessToken);
    await AsyncStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await AsyncStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  }, []);

  const clearAuth = useCallback(async () => {
    setUser(null);
    setAccessToken(null);
    await AsyncStorage.multiRemove([
      AUTH_STORAGE_KEYS.ACCESS_TOKEN,
      AUTH_STORAGE_KEYS.REFRESH_TOKEN,
      AUTH_STORAGE_KEYS.USER,
    ]);
    queryClient.clear();
  }, []);

  const refreshAuth = useCallback(async (): Promise<string | null> => {
    try {
      const storedRefresh = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
      if (!storedRefresh) {
        await clearAuth();
        return null;
      }

      const res = await fetch(`${getApiBase()}/api/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefresh }),
      });

      if (!res.ok) {
        await clearAuth();
        return null;
      }

      const json = await res.json();
      const tokens: AuthTokens = {
        accessToken: json.data.accessToken,
        refreshToken: json.data.refreshToken,
      };
      await saveTokens(tokens);
      return tokens.accessToken;
    } catch {
      await clearAuth();
      return null;
    }
  }, [clearAuth, saveTokens]);

  useEffect(() => {
    setTokenGetter(async () => accessToken ?? AsyncStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN));
    setRefresher(refreshAuth);
    return () => {
      clearHandlers();
    };
  }, [accessToken, refreshAuth]);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
        const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.USER);

        if (storedToken && storedUser) {
          setAccessToken(storedToken);
          setUser(JSON.parse(storedUser));

          try {
            const res = await fetch(`${getApiBase()}/api/auth/me`, {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            if (res.ok) {
              const json = await res.json();
              setUser(json.data.user);
              await AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(json.data.user));
            } else if (res.status === 401) {
              const newToken = await refreshAuth();
              if (newToken) {
                const retryRes = await fetch(`${getApiBase()}/api/auth/me`, {
                  headers: { Authorization: `Bearer ${newToken}` },
                });
                if (retryRes.ok) {
                  const json = await retryRes.json();
                  setUser(json.data.user);
                  await AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(json.data.user));
                } else {
                  await clearAuth();
                }
              }
            }
          } catch {
          }
        }
      } catch {
        await clearAuth();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${getApiBase()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || json.message || "Erreur de connexion");
    }

    await saveTokens({ accessToken: json.data.accessToken, refreshToken: json.data.refreshToken });
    setUser(json.data.user);
    await AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(json.data.user));
  }, [saveTokens]);

  const register = useCallback(async (data: RegisterData) => {
    const res = await fetch(`${getApiBase()}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || json.message || "Erreur lors de l'inscription");
    }

    await saveTokens({ accessToken: json.data.accessToken, refreshToken: json.data.refreshToken });
    setUser(json.data.user);
    await AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(json.data.user));
  }, [saveTokens]);

  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        await fetch(`${getApiBase()}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch(() => {});
      }
    } finally {
      await clearAuth();
    }
  }, [accessToken, clearAuth]);

  const forgotPassword = useCallback(async (email: string) => {
    const res = await fetch(`${getApiBase()}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || json.message || "Erreur");
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(updatedUser));
  }, []);

  const resendVerification = useCallback(async () => {
    let token = accessToken ?? await AsyncStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) throw new Error("Non authentifié");

    let res = await fetch(`${getApiBase()}/api/auth/resend-verification`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      const newToken = await refreshAuth();
      if (!newToken) throw new Error("Session expirée, veuillez vous réinscrire");
      token = newToken;
      res = await fetch(`${getApiBase()}/api/auth/resend-verification`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || json.message || "Erreur lors du renvoi");
    }
  }, [accessToken, refreshAuth]);

  const checkVerification = useCallback(async (): Promise<boolean> => {
    const token = accessToken ?? await AsyncStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return false;

    const res = await fetch(`${getApiBase()}/api/auth/check-verification`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return false;
    const json = await res.json();
    if (json.data?.verified) {
      if (user) {
        const updatedUser = { ...user, email_verified: 1 };
        setUser(updatedUser);
        await AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      }
      return true;
    }
    return false;
  }, [accessToken, user]);

  const cancelRegistration = useCallback(async () => {
    const token = accessToken ?? await AsyncStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      await clearAuth();
      return;
    }

    try {
      await fetch(`${getApiBase()}/api/auth/cancel-registration`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    await clearAuth();
  }, [accessToken, clearAuth]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user && !!accessToken,
      accessToken,
      login,
      register,
      logout,
      forgotPassword,
      refreshAuth,
      updateUser,
      resendVerification,
      checkVerification,
      cancelRegistration,
    }),
    [user, isLoading, accessToken, login, register, logout, forgotPassword, refreshAuth, updateUser, resendVerification, checkVerification, cancelRegistration]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
