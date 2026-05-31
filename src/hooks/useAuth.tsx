'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '@/services/api';

interface User { id: number; username: string; email: string; role: string; }
interface AuthCtx { user: User | null; loading: boolean; login: (u: string, p: string) => Promise<void>; logout: () => void; }

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      authAPI.getProfile()
        .then(res => setUser(res.data.data))
        .catch(() => Cookies.remove('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await authAPI.login({ username, password });
    Cookies.set('token', res.data.token, { expires: 7 });
    setUser(res.data.user);
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    window.location.href = '/login';
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
