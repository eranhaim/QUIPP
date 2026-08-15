import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { api, setAccessToken, getAccessToken } from '@/lib/api';

export type AppRole = 'worker' | 'operator' | 'manufacturer' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: AppRole[];
  emailVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  register: (input: { email: string; password: string; firstName?: string; lastName?: string }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  register: async () => {},
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { user } = await api<{ user: AuthUser }>('/api/auth/me', { auth: true });
      setUser(user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { accessToken } = await api<{ accessToken: string }>('/api/auth/refresh', {
          method: 'POST',
        });
        setAccessToken(accessToken);
        await fetchMe();
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchMe]);

  const register: AuthContextType['register'] = async (input) => {
    const { user, accessToken } = await api<{ user: AuthUser; accessToken: string }>(
      '/api/auth/register',
      { method: 'POST', body: input },
    );
    setAccessToken(accessToken);
    setUser(user);
  };

  const login: AuthContextType['login'] = async (email, password) => {
    const { user, accessToken } = await api<{ user: AuthUser; accessToken: string }>(
      '/api/auth/login',
      { method: 'POST', body: { email, password } },
    );
    setAccessToken(accessToken);
    setUser(user);
  };

  const logout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, refresh: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { getAccessToken };
