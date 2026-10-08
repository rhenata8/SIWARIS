import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ArchiveSKW, User, PageId } from '../types';
import { INITIAL_ARCHIVES, INITIAL_USERS, BASE_HISTORICAL_STATS } from '../data/initialData';
import { convexClient, isConvexEnabled } from '../services/convex';
import { api } from '../../convex/_generated/api';

interface AppContextType {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  archives: ArchiveSKW[];
  users: User[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  stats: {
    totalSKW: number;
    totalPewaris: number;
    totalAhliWaris: number;
    total2026: number;
    year2024: number;
    year2025: number;
    year2026: number;
  };
  addArchive: (archive: Omit<ArchiveSKW, '_id' | 'idArsip' | 'createdAt' | 'tahun'>) => Promise<ArchiveSKW>;
  updateArchive: (id: string, updates: Partial<ArchiveSKW>) => Promise<void>;
  deleteArchive: (id: string) => Promise<void>;
  addUser: (user: Omit<User, '_id' | 'createdAt'>) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  resetToDefault: () => void;
  // Modal states
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  selectedArchive: ArchiveSKW | null;
  setSelectedArchive: (arch: ArchiveSKW | null) => void;
  qrModalArchive: ArchiveSKW | null;
  setQrModalArchive: (arch: ArchiveSKW | null) => void;
  previewDocArchive: ArchiveSKW | null;
  setPreviewDocArchive: (arch: ArchiveSKW | null) => void;
  // Convex connection
  isConvexConfigured: boolean;
  convexUrl: string;
  setConvexUrl: (url: string) => void;
  isSyncing: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_ARCHIVES = 'siwaris_archives_v1';
const STORAGE_KEY_USERS = 'siwaris_users_v1';
const STORAGE_KEY_CONVEX_URL = 'siwaris_convex_url';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<ArchiveSKW | null>(null);
  const [qrModalArchive, setQrModalArchive] = useState<ArchiveSKW | null>(null);
  const [previewDocArchive, setPreviewDocArchive] = useState<ArchiveSKW | null>(null);

  // Convex URL state (can be sourced from env or localStorage)
  const [convexUrl, setConvexUrlState] = useState<string>(() => {
    return import.meta.env.VITE_CONVEX_URL || localStorage.getItem(STORAGE_KEY_CONVEX_URL) || '';
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const isConvexConfigured = Boolean(
    isConvexEnabled || (convexUrl && convexUrl.trim() !== '' && convexUrl.startsWith('http'))
  );

  const setConvexUrl = (url: string) => {
    setConvexUrlState(url);
    if (url) {
      localStorage.setItem(STORAGE_KEY_CONVEX_URL, url);
    } else {
      localStorage.removeItem(STORAGE_KEY_CONVEX_URL);
    }
  };

  // Archives state with initial loader from localStorage
  const [archives, setArchives] = useState<ArchiveSKW[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ARCHIVES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading localStorage archives', e);
    }
    return INITIAL_ARCHIVES;
  });

  // Users state with initial loader from localStorage
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading localStorage users', e);
    }
    return INITIAL_USERS;
  });

  // Sync to local storage for instant offline / cache resilience
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ARCHIVES, JSON.stringify(archives));
    } catch (e) {
      console.error('Error saving archives to localStorage', e);
    }
  }, [archives]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users to localStorage', e);
    }
  }, [users]);

  // Load from Convex backend if configured and available
  const syncFromConvex = useCallback(async () => {
    if (!convexClient) return;
    try {
      setIsSyncing(true);
      // Fetch archives from Convex
      const convexArchives = await convexClient.query(api.skw.getArchives, {});
      if (convexArchives && Array.isArray(convexArchives) && convexArchives.length > 0) {
        const mapped: ArchiveSKW[] = convexArchives.map((a: any) => ({
          _id: a._id,
          idArsip: a.idArsip,
          nomorSKW: a.nomorSKW,
          namaPewaris: a.namaPewaris,
          nikPewaris: a.nikPewaris,
          tanggalSurat: a.tanggalSurat,
          tanggalMeninggal: a.tanggalMeninggal,
          jumlahAhliWaris: a.jumlahAhliWaris,
          ahliWarisList: a.ahliWarisList || [],
          alamat: a.alamat,
          status: a.status,
          catatan: a.catatan,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          fileSize: a.fileSize,
          tahun: a.tahun,
          createdAt: a.createdAt,
        }));
        setArchives(mapped);
      } else {
        // Seed default initial data into Convex if database is empty
        await convexClient.mutation(api.skw.seedInitialData, {});
        const recheck = await convexClient.query(api.skw.getArchives, {});
        if (recheck && recheck.length > 0) {
          setArchives(recheck as any);
        }
      }

      // Fetch users from Convex
      const convexUsers = await convexClient.query(api.users.getUsers, {});
      if (convexUsers && Array.isArray(convexUsers) && convexUsers.length > 0) {
        setUsers(convexUsers as any);
      } else {
        await convexClient.mutation(api.users.seedUsers, {});
        const recheckUsers = await convexClient.query(api.users.getUsers, {});
        if (recheckUsers && recheckUsers.length > 0) {
          setUsers(recheckUsers as any);
        }
      }
    } catch (err) {
      console.warn('Convex sync info: Using local cache as fallback', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (isConvexConfigured && convexClient) {
      syncFromConvex();
    }
  }, [isConvexConfigured, syncFromConvex]);

  // Computed stats
  const totalSKW = BASE_HISTORICAL_STATS.baseTotalSKW + archives.length;
  const uniquePewaris = new Set(archives.map((a) => a.nikPewaris || a.namaPewaris)).size;
  const totalPewaris = BASE_HISTORICAL_STATS.baseTotalSKW + uniquePewaris;

  const currentAhliWarisCount = archives.reduce((acc, a) => acc + (a.jumlahAhliWaris || 0), 0);
  const totalAhliWaris = BASE_HISTORICAL_STATS.baseAhliWaris + currentAhliWarisCount;

  const count2026 = archives.filter((a) => a.tahun === 2026).length;
  const total2026 = BASE_HISTORICAL_STATS.year2026Base + count2026;

  const stats = {
    totalSKW,
    totalPewaris,
    totalAhliWaris,
    total2026,
    year2024: BASE_HISTORICAL_STATS.year2024,
    year2025: BASE_HISTORICAL_STATS.year2025,
    year2026: total2026,
  };

  const addArchive = async (data: Omit<ArchiveSKW, '_id' | 'idArsip' | 'createdAt' | 'tahun'>) => {
    const year = data.tanggalSurat ? new Date(data.tanggalSurat).getFullYear() : 2026;
    const nextSeq = archives.length + 1;
    const idArsip = `SW-SBT-${year}-${String(nextSeq).padStart(4, '0')}`;

    const newArch: ArchiveSKW = {
      ...data,
      _id: 'arch-' + Date.now(),
      idArsip,
      tahun: year,
      createdAt: Date.now(),
    };

    // Optimistic state update
    setArchives((prev) => [newArch, ...prev]);

    // Push to Convex backend if client active
    if (convexClient && isConvexConfigured) {
      try {
        await convexClient.mutation(api.skw.createArchive, {
          idArsip,
          nomorSKW: data.nomorSKW,
          namaPewaris: data.namaPewaris,
          nikPewaris: data.nikPewaris,
          tanggalSurat: data.tanggalSurat,
          tanggalMeninggal: data.tanggalMeninggal,
          jumlahAhliWaris: data.jumlahAhliWaris,
          ahliWarisList: data.ahliWarisList,
          alamat: data.alamat,
          status: data.status,
          catatan: data.catatan,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          tahun: year,
        });
      } catch (e) {
        console.error('Failed to sync new archive to Convex', e);
      }
    }

    return newArch;
  };

  const updateArchive = async (id: string, updates: Partial<ArchiveSKW>) => {
    setArchives((prev) =>
      prev.map((a) => (a.idArsip === id || a._id === id ? { ...a, ...updates } : a))
    );

    if (convexClient && isConvexConfigured) {
      try {
        const item = archives.find((a) => a.idArsip === id || a._id === id);
        if (item && item._id && !item._id.startsWith('arch-')) {
          await convexClient.mutation(api.skw.updateArchive, {
            id: item._id as any,
            ...updates,
          });
        }
      } catch (e) {
        console.error('Failed to update archive on Convex', e);
      }
    }
  };

  const deleteArchive = async (id: string) => {
    setArchives((prev) => prev.filter((a) => a.idArsip !== id && a._id !== id));

    if (convexClient && isConvexConfigured) {
      try {
        const item = archives.find((a) => a.idArsip === id || a._id === id);
        if (item && item._id && !item._id.startsWith('arch-')) {
          await convexClient.mutation(api.skw.deleteArchive, { id: item._id as any });
        }
      } catch (e) {
        console.error('Failed to delete archive on Convex', e);
      }
    }
  };

  const addUser = async (userData: Omit<User, '_id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      _id: 'usr-' + Date.now(),
      createdAt: Date.now(),
    };
    setUsers((prev) => [...prev, newUser]);

    if (convexClient && isConvexConfigured) {
      try {
        await convexClient.mutation(api.users.createUser, userData);
      } catch (e) {
        console.error('Failed to create user on Convex', e);
      }
    }
  };

  const toggleUserStatus = async (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u._id === id || u.username === id
          ? { ...u, status: u.status === 'Aktif' ? 'Nonaktif' : 'Aktif' }
          : u
      )
    );

    if (convexClient && isConvexConfigured) {
      try {
        const u = users.find((x) => x._id === id || x.username === id);
        if (u && u._id && !u._id.startsWith('usr-')) {
          await convexClient.mutation(api.users.toggleUserStatus, { id: u._id as any });
        }
      } catch (e) {
        console.error('Failed to toggle user status on Convex', e);
      }
    }
  };

  const resetToDefault = () => {
    localStorage.removeItem(STORAGE_KEY_ARCHIVES);
    localStorage.removeItem(STORAGE_KEY_USERS);
    setArchives(INITIAL_ARCHIVES);
    setUsers(INITIAL_USERS);
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        archives,
        users,
        searchQuery,
        setSearchQuery,
        stats,
        addArchive,
        updateArchive,
        deleteArchive,
        addUser,
        toggleUserStatus,
        resetToDefault,
        isAddModalOpen,
        setIsAddModalOpen,
        selectedArchive,
        setSelectedArchive,
        qrModalArchive,
        setQrModalArchive,
        previewDocArchive,
        setPreviewDocArchive,
        isConvexConfigured,
        convexUrl,
        setConvexUrl,
        isSyncing,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
