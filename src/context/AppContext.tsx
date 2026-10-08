import React, { createContext, useContext, useState, useEffect } from 'react';
import { ArchiveSKW, User, PageId } from '../types';
import { INITIAL_ARCHIVES, INITIAL_USERS, BASE_HISTORICAL_STATS } from '../data/initialData';

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
  isConvexConfigured: boolean;
  convexUrl: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_ARCHIVES = 'siwaris_archives_v1';
const STORAGE_KEY_USERS = 'siwaris_users_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<ArchiveSKW | null>(null);
  const [qrModalArchive, setQrModalArchive] = useState<ArchiveSKW | null>(null);
  const [previewDocArchive, setPreviewDocArchive] = useState<ArchiveSKW | null>(null);

  const convexUrl = import.meta.env.VITE_CONVEX_URL || '';
  const isConvexConfigured = Boolean(convexUrl && convexUrl.trim() !== '' && convexUrl.startsWith('http'));

  // Archives state
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

  // Users state
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

  // Sync to local storage
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

  // Computed stats
  const totalSKW = BASE_HISTORICAL_STATS.baseTotalSKW + archives.length;
  const uniquePewaris = new Set(archives.map((a) => a.nikPewaris || a.namaPewaris)).size;
  const totalPewaris = (BASE_HISTORICAL_STATS.baseTotalSKW) + uniquePewaris;
  
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

    setArchives((prev) => [newArch, ...prev]);
    return newArch;
  };

  const updateArchive = async (id: string, updates: Partial<ArchiveSKW>) => {
    setArchives((prev) =>
      prev.map((a) => (a.idArsip === id || a._id === id ? { ...a, ...updates } : a))
    );
  };

  const deleteArchive = async (id: string) => {
    setArchives((prev) => prev.filter((a) => a.idArsip !== id && a._id !== id));
  };

  const addUser = async (userData: Omit<User, '_id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      _id: 'usr-' + Date.now(),
      createdAt: Date.now(),
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const toggleUserStatus = async (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u._id === id || u.username === id
          ? { ...u, status: u.status === 'Aktif' ? 'Nonaktif' : 'Aktif' }
          : u
      )
    );
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
