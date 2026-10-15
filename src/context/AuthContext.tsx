import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { convexClient, isConvexEnabled } from '../services/convex';
import { api } from '../../convex/_generated/api';

export interface AuthUser {
  _id: string;
  nama: string;
  username: string;
  nip?: string;
  role: string;
  status: string;
  email?: string;
  avatar?: string;
  createdAt: number;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthReady: boolean; // session validation finished
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registerUser: (data: {
    nama: string;
    username: string;
    password: string;
    role: string;
    nip?: string;
    email?: string;
  }) => Promise<any>;
  changeUserPassword: (targetUserId: string, newPassword: string) => Promise<void>;
  changeOwnPassword: (oldPassword: string, newPassword: string) => Promise<void>;
  createUser: (data: {
    nama: string;
    username: string;
    password: string;
    role: string;
    nip?: string;
    email?: string;
  }) => Promise<any>;
  updateUser: (targetUserId: string, data: {
    nama: string;
    username: string;
    role: string;
    nip?: string;
    email?: string;
    password?: string;
  }) => Promise<any>;
  deleteUser: (targetUserId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_TOKEN = 'siwaris_auth_token';
const STORAGE_KEY_USER = 'siwaris_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY_TOKEN)
  );
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Validate persisted session against the server on boot
  useEffect(() => {
    let cancelled = false;
    const validate = async () => {
      if (!token || !convexClient || !isConvexEnabled) {
        if (!token) {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY_USER);
        }
        setIsAuthReady(true);
        return;
      }
      try {
        const result: any = await convexClient.query(api.auth.getSession, { token });
        if (cancelled) return;
        if (result && result.user) {
          setUser(result.user);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(result.user));
        } else {
          // Expired or invalid — clear stale session
          setUser(null);
          setToken(null);
          localStorage.removeItem(STORAGE_KEY_TOKEN);
          localStorage.removeItem(STORAGE_KEY_USER);
        }
      } catch (e) {
        console.warn('Session validation failed, keeping cached user', e);
      } finally {
        if (!cancelled) setIsAuthReady(true);
      }
    };
    validate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      if (!convexClient || !isConvexEnabled) {
        throw new Error('Koneksi ke server Convex tidak tersedia.');
      }
      const result: any = await convexClient.action(api.authActions.login, {
        username,
        password,
      });
      if (result?.ok === false) {
        throw new Error(result.error || 'Login gagal.');
      }
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem(STORAGE_KEY_TOKEN, result.token);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(result.user));
    },
    []
  );

  const logout = useCallback(async () => {
    const currentToken = token;
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    if (currentToken && convexClient && isConvexEnabled) {
      try {
        await convexClient.mutation(api.auth.logout, { token: currentToken });
      } catch (e) {
        console.warn('Logout mutation failed (session cleared locally)', e);
      }
    }
  }, [token]);

  const registerUser = useCallback(
    async (data: {
      nama: string;
      username: string;
      password: string;
      role: string;
      nip?: string;
      email?: string;
    }) => {
      if (!convexClient || !isConvexEnabled) {
        throw new Error('Koneksi ke server Convex tidak tersedia.');
      }
      if (!token) {
        throw new Error('Hanya administrator yang sedang login dapat mendaftarkan pengguna.');
      }
      const result: any = await convexClient.action(api.authActions.registerUser, {
        adminToken: token,
        ...data,
      });
      if (result?.ok === false) {
        throw new Error(result.error || 'Registrasi gagal.');
      }
      return result;
    },
    [token]
  );

  // Admin resets another user's password (requires an admin session)
  const changeUserPassword = useCallback(
    async (targetUserId: string, newPassword: string) => {
      if (!convexClient || !isConvexEnabled) {
        throw new Error('Koneksi ke server Convex tidak tersedia.');
      }
      if (!token) {
        throw new Error('Sesi tidak ditemukan. Silakan login ulang.');
      }
      const result: any = await convexClient.action(api.authActions.changeUserPassword, {
        adminToken: token,
        targetUserId: targetUserId as any, // Convex Id<"users"> (string at runtime)
        newPassword,
      });
      if (result?.ok === false) {
        throw new Error(result.error || 'Gagal mengubah password pengguna.');
      }
    },
    [token]
  );

  // Change the password of the currently logged-in user
  const changeOwnPassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      if (!convexClient || !isConvexEnabled) {
        throw new Error('Koneksi ke server Convex tidak tersedia.');
      }
      if (!token) {
        throw new Error('Sesi tidak ditemukan. Silakan login ulang.');
      }
      const result: any = await convexClient.action(api.authActions.changeOwnPassword, {
        token,
        oldPassword,
        newPassword,
      });
      if (result?.ok === false) {
        throw new Error(result.error || 'Gagal mengubah password.');
      }
    },
    [token]
  );

  const isAdmin = Boolean(
    user && (user.username === 'admin' || user.role === 'Administrator')
  );

  // SIWARIS v2.2 — full user CRUD (admin-only actions with scrypt hashing)
  const createUser = useCallback(
    async (data: {
      nama: string;
      username: string;
      password: string;
      role: string;
      nip?: string;
      email?: string;
    }) => {
      if (!convexClient || !isConvexEnabled) {
        throw new Error('Koneksi ke server Convex tidak tersedia.');
      }
      if (!token) {
        throw new Error('Sesi tidak ditemukan. Silakan login ulang.');
      }
      const result: any = await convexClient.action(api.authActions.createUser, {
        adminToken: token,
        ...data,
      });
      if (result?.ok === false) {
        throw new Error(result.error || 'Gagal menambahkan pengguna.');
      }
      return result;
    },
    [token]
  );

  const updateUser = useCallback(
    async (
      targetUserId: string,
      data: {
        nama: string;
        username: string;
        role: string;
        nip?: string;
        email?: string;
        password?: string;
      }
    ) => {
      if (!convexClient || !isConvexEnabled) {
        throw new Error('Koneksi ke server Convex tidak tersedia.');
      }
      if (!token) {
        throw new Error('Sesi tidak ditemukan. Silakan login ulang.');
      }
      const result: any = await convexClient.action(api.authActions.updateUser, {
        adminToken: token,
        targetUserId: targetUserId as any, // Convex Id<"users"> (string at runtime)
        ...data,
      });
      if (result?.ok === false) {
        throw new Error(result.error || 'Gagal mengubah data pengguna.');
      }
      return result;
    },
    [token]
  );

  const deleteUser = useCallback(
    async (targetUserId: string) => {
      if (!convexClient || !isConvexEnabled) {
        throw new Error('Koneksi ke server Convex tidak tersedia.');
      }
      if (!token) {
        throw new Error('Sesi tidak ditemukan. Silakan login ulang.');
      }
      const result: any = await convexClient.action(api.authActions.deleteUser, {
        adminToken: token,
        targetUserId: targetUserId as any, // Convex Id<"users"> (string at runtime)
      });
      if (result?.ok === false) {
        throw new Error(result.error || 'Gagal menghapus pengguna.');
      }
    },
    [token]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthReady,
        isAdmin,
        login,
        logout,
        registerUser,
        changeUserPassword,
        changeOwnPassword,
        createUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
