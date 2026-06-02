import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

interface User {
  _id: string;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  role: 'user' | 'admin';
  gamesPlayed: number;
  avatar: string | null;
  level: {
    name: string;
    number: number;
    gamesPlayed: number;
    gamesForNext: number | null;
    progress: number;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync('token');
      if (stored) {
        setToken(stored);
        try {
          const res = await authAPI.me();
          setUser(res.data.user);
        } catch {
          await SecureStore.deleteItemAsync('token');
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    const { token: t, user: u } = res.data;
    await SecureStore.setItemAsync('token', t);
    setToken(t);
    setUser(u);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await authAPI.me();
    setUser(res.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider');
  return ctx;
};
