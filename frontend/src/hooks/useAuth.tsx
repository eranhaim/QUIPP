import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { api, setAccessToken, getAccessToken } from '@/lib/api';
import type { Profile } from '@/lib/types';

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
  profile: Profile | null;
  loading: boolean;
  register: (input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  register: async () => {},
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
  refreshProfile: async () => null,
});

async function tryFetchProfile(): Promise<Profile | null> {
  try {
    const { profile } = await api<{ profile: Profile }>('/api/profile/me', { auth: true });
    return profile;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const p = await tryFetchProfile();
    setProfile(p);
    return p;
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const { user } = await api<{ user: AuthUser }>('/api/auth/me', { auth: true });
      setUser(user);
      await refreshProfile();
    } catch {
      setUser(null);
      setProfile(null);
    }
  }, [refreshProfile]);

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
        setProfile(null);
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
    await refreshProfile();
  };

  const login: AuthContextType['login'] = async (email, password) => {
    const { user, accessToken } = await api<{ user: AuthUser; accessToken: string }>(
      '/api/auth/login',
      { method: 'POST', body: { email, password } },
    );
    setAccessToken(accessToken);
    setUser(user);
    await refreshProfile();
  };

  const logout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } finally {
      setAccessToken(null);
      setUser(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, register, login, logout, refresh: fetchMe, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { getAccessToken };
