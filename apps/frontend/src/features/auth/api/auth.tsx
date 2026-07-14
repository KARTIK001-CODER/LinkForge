import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import axios from 'axios';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: 'USER' | 'ADMIN';
  isVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: { email: string; username: string; password: string; displayName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

let accessToken: string | null = null;

function setAccessToken(token: string | null) {
  accessToken = token;
}

axios.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  config.withCredentials = true;
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/v1/auth/refresh') &&
      !originalRequest.url?.includes('/api/v1/auth/login')
    ) {
      originalRequest._retry = true;
      try {
        const response = await axios.post('/api/v1/auth/refresh');
        const { accessToken: newToken } = response.data;
        setAccessToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch {
        setAccessToken(null);
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await axios.post('/api/v1/auth/refresh');
      const { user: userData, accessToken: newToken } = response.data;
      setAccessToken(newToken);
      setUser(userData);
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const response = await axios.post('/api/v1/auth/login', { email, password, rememberMe });
    const { user: userData, accessToken: newToken } = response.data;
    setAccessToken(newToken);
    setUser(userData);
  }, []);

  const register = useCallback(async (data: { email: string; username: string; password: string; displayName?: string }) => {
    const response = await axios.post('/api/v1/auth/register', data);
    const { user: userData, accessToken: newToken } = response.data;
    setAccessToken(newToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/v1/auth/logout');
    } catch {
      // ignore
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await axios.post('/api/v1/auth/logout-all');
    } catch {
      // ignore
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      logoutAll,
      refreshSession,
      updateUser: setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
