import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from 'convex/react';
import { ArchiveSKW, User, PageId, LetterFormat } from '../types';
import { INITIAL_ARCHIVES, INITIAL_USERS } from '../data/initialData';
import { convexClient, isConvexEnabled } from '../services/convex';
import { api } from '../../convex/_generated/api';

const DEFAULT_LETTER_FORMAT: LetterFormat = {
  namaPemerintah: 'Pemerintah Kota Probolinggo',
  namaKecamatan: 'Kecamatan Wonoasih',
  namaKantor: 'Kelurahan Sumbertaman',
  alamatKantor: 'Jalan Mastrip No. 12, Sumbertaman, Probolinggo',
  kontakKantor: 'Kode Pos 67237 • Telp: (0335) 421xxx',
  namaKota: 'Sumbertaman',
  jabatanPenandatangan: 'Lurah Sumbertaman',
  namaPenandatangan: 'Drs. H. M. Syaifullah, M.Si',
  nipPenandatangan: '19740615 199803 1 004',
  statusTTE: 'Sertifikasi Dokumen Elektronik Sah',
  ttdDigitalUrl: '',
};

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
  addArchive: (data: Omit<ArchiveSKW, '_id' | 'idArsip' | 'createdAt' | 'tahun'>, file?: File | null) => Promise<ArchiveSKW>;
  updateArchive: (id: string, updates: Partial<ArchiveSKW>) => Promise<void>;
  deleteArchive: (id: string) => Promise<void>;
  updateStatus: (id: string, newStatus: 'Tersimpan' | 'Terverifikasi' | 'Diproses') => Promise<void>;
  addUser: (user: Omit<User, '_id' | 'createdAt'>) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  resetToDefault: () => void;
  // Modals & UI states
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  selectedArchive: ArchiveSKW | null;
  setSelectedArchive: (arch: ArchiveSKW | null) => void;
  editingArchive: ArchiveSKW | null;
  setEditingArchive: (arch: ArchiveSKW | null) => void;
  deletingArchive: ArchiveSKW | null;
  setDeletingArchive: (arch: ArchiveSKW | null) => void;
  qrModalArchive: ArchiveSKW | null;
  setQrModalArchive: (arch: ArchiveSKW | null) => void;
  previewDocArchive: ArchiveSKW | null;
  setPreviewDocArchive: (arch: ArchiveSKW | null) => void;
  isFormatModalOpen: boolean;
  setIsFormatModalOpen: (open: boolean) => void;
  publicVerifyId: string | null;
  setPublicVerifyId: (id: string | null) => void;
  // Letter format customization
  letterFormat: LetterFormat;
  updateLetterFormat: (format: Partial<LetterFormat>) => void;
  // Convex connection
  isConvexConfigured: boolean;
  convexUrl: string;
  setConvexUrl: (url: string) => void;
  isSyncing: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface LiveConvexSyncProps {
  applyServerArchives: (rows: any[]) => void;
  applyServerUsers: (rows: any[]) => void;
  onSyncStateChange: (syncing: boolean) => void;
}

/**
 * Live sync via reactive subscription — HARUS dirender di dalam
 * <ConvexProvider>. useQuery menjaga subscription WebSocket aktif dan
 * otomatis menerima setiap perubahan data dari server (<1 detik), termasuk
 * perubahan yang dibuat device lain. Komponen ini tidak merender apa pun.
 */
const LiveConvexSync: React.FC<LiveConvexSyncProps> = ({
  applyServerArchives,
  applyServerUsers,
  onSyncStateChange,
}) => {
  const rawArchives = useQuery(api.skw.getArchives, {});
  const rawUsers = useQuery(api.users.getUsers, {});
  const seededArchivesRef = useRef(false);
  const seededUsersRef = useRef(false);

  // Archives: dorong setiap hasil baru dari server ke state global
  useEffect(() => {
    if (rawArchives === undefined) return; // masih loading
    if (rawArchives.length > 0) {
      applyServerArchives(rawArchives);
    } else if (!seededArchivesRef.current) {
      // DB kosong — seed default sekali; hasilnya datang via subscription.
      seededArchivesRef.current = true;
      convexClient
        ?.mutation(api.skw.seedInitialData, {})
        .catch((e) => console.warn('Convex seed archives failed', e));
    } else {
      // Benar-benar kosong (mis. semua arsip dihapus di device lain).
      applyServerArchives([]);
    }
  }, [rawArchives, applyServerArchives]);

  // Users: dorong setiap hasil baru dari server ke state global
  useEffect(() => {
    if (rawUsers === undefined) return; // masih loading
    if (rawUsers.length > 0) {
      applyServerUsers(rawUsers);
    } else if (!seededUsersRef.current) {
      seededUsersRef.current = true;
      convexClient
        ?.mutation(api.users.seedUsers, {})
        .catch((e) => console.warn('Convex seed users failed', e));
    } else {
      applyServerUsers([]);
    }
  }, [rawUsers, applyServerUsers]);

  // isSyncing = true selama salah satu subscription masih loading
  useEffect(() => {
    onSyncStateChange(rawArchives === undefined || rawUsers === undefined);
  }, [rawArchives, rawUsers, onSyncStateChange]);

  return null;
};

const STORAGE_KEY_ARCHIVES = 'siwaris_archives_v1';
const STORAGE_KEY_USERS = 'siwaris_users_v1';
const STORAGE_KEY_CONVEX_URL = 'siwaris_convex_url';
const STORAGE_KEY_LETTER_FORMAT = 'siwaris_letter_format_v1';

/** Map a raw Convex archives doc to the frontend ArchiveSKW shape. */
function mapConvexArchive(a: any): ArchiveSKW {
  return {
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
    storageId: a.storageId,
    fileName: a.fileName,
    fileUrl: a.fileUrl,
    fileSize: a.fileSize,
    tahun: a.tahun,
    createdAt: a.createdAt,
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<ArchiveSKW | null>(null);
  const [editingArchive, setEditingArchive] = useState<ArchiveSKW | null>(null);
  const [deletingArchive, setDeletingArchive] = useState<ArchiveSKW | null>(null);
  const [qrModalArchive, setQrModalArchive] = useState<ArchiveSKW | null>(null);
  const [previewDocArchive, setPreviewDocArchive] = useState<ArchiveSKW | null>(null);
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [publicVerifyId, setPublicVerifyId] = useState<string | null>(null);

  // Check URL parameters for QR scan verification (?validasi=SW-SBT-..., /validasi?id=..., /validasi/SW-SBT-...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      let valId = params.get('validasi') || params.get('id');
      if (!valId && window.location.pathname.startsWith('/validasi/')) {
        const seg = window.location.pathname.replace('/validasi/', '').trim();
        if (seg) valId = seg;
      }
      if (valId) {
        setPublicVerifyId(valId);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Letter Format State
  const [letterFormat, setLetterFormat] = useState<LetterFormat>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LETTER_FORMAT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_LETTER_FORMAT;
  });

  const updateLetterFormat = (updates: Partial<LetterFormat>) => {
    setLetterFormat((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY_LETTER_FORMAT, JSON.stringify(updated));
      return updated;
    });
  };

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

  // ─────────────────────────────────────────────────────────────────────────────
  // LIVE SYNC (realtime antar device).
  // AppProvider selalu dirender di dalam <ConvexProvider> saat isConvexEnabled,
  // jadi kita bisa memakai hook useQuery() dari convex/react: Convex menjaga
  // subscription WebSocket aktif dan otomatis mendorong setiap perubahan data
  // (<1 detik) ke SEMUA device. useQuery tidak boleh dipanggil tanpa
  // ConvexProvider, makanya subscription diisolasi di komponen <LiveConvexSync>
  // yang hanya dirender saat backend aktif. Jika !isConvexEnabled, data dummy
  // offline (initialData/localStorage) tetap dipakai (perilaku lama).
  // ─────────────────────────────────────────────────────────────────────────────
  const applyServerArchives = useCallback((rows: any[]) => {
    const serverRows: ArchiveSKW[] = rows.map(mapConvexArchive);
    setArchives((prev) => {
      // Pertahankan optimistic "temp-" entries yang belum digantikan row
      // server (idArsip masih placeholder, jadi tidak mungkin bentrok).
      // Semua row non-temp diganti barusan dari server — row server selalu
      // menang, tidak ada data ganda.
      const pendingOptimistic = prev.filter(
        (p) => typeof p._id === 'string' && p._id.startsWith('temp-')
      );
      return [...pendingOptimistic, ...serverRows];
    });
  }, []);

  const applyServerUsers = useCallback((rows: any[]) => {
    const serverRows = rows as User[];
    setUsers((prev) => {
      // Pertahankan optimistic "usr-" entries lokal yang belum ada
      // padanannya di server (dicocokkan via username).
      const pendingOptimistic = prev.filter(
        (p) =>
          typeof p._id === 'string' &&
          p._id.startsWith('usr-') &&
          !serverRows.some((s) => s.username === p.username)
      );
      return [...pendingOptimistic, ...serverRows];
    });
  }, []);

  const handleSyncStateChange = useCallback((syncing: boolean) => {
    setIsSyncing(syncing);
  }, []);

  // Live sync aktif hanya saat backend Convex tersedia; <LiveConvexSync>
  // memakai useQuery() sehingga wajib berada di dalam <ConvexProvider>.
  // Jika !isConvexEnabled, data dummy offline tetap dipakai (perilaku lama).

  // REAL COMPUTED STATS: 100% based on real database records!
  const totalSKW = archives.length;
  const uniquePewaris = new Set(archives.map((a) => a.nikPewaris || a.namaPewaris)).size;
  const totalPewaris = uniquePewaris;
  const totalAhliWaris = archives.reduce((acc, a) => acc + (a.jumlahAhliWaris || 0), 0);
  const total2026 = archives.filter((a) => a.tahun === 2026).length;
  const year2024 = archives.filter((a) => a.tahun === 2024).length;
  const year2025 = archives.filter((a) => a.tahun === 2025).length;

  const stats = {
    totalSKW,
    totalPewaris,
    totalAhliWaris,
    total2026,
    year2024,
    year2025,
    year2026: total2026,
  };

  const addArchive = async (
    data: Omit<ArchiveSKW, '_id' | 'idArsip' | 'createdAt' | 'tahun'>,
    file?: File | null
  ) => {
    const cleanNomor = data.nomorSKW.trim();
    const existing = archives.find(
      (a) => a.nomorSKW.trim().toLowerCase() === cleanNomor.toLowerCase()
    );
    if (existing) {
      throw new Error(
        `Nomor SKW "${cleanNomor}" sudah terdaftar pada arsip ${existing.idArsip} (Pewaris: ${existing.namaPewaris}).`
      );
    }

    const year = data.tanggalSurat ? new Date(data.tanggalSurat).getFullYear() : 2026;
    const tempId = 'temp-' + Date.now();
    const createdAt = Date.now();

    // Optimistic placeholder with temp ID (will be replaced after server responds)
    const optimisticArch: ArchiveSKW = {
      ...data,
      _id: tempId,
      idArsip: `SW-SBT-${year}-????`, // placeholder
      tahun: year,
      createdAt,
    };
    setArchives((prev) => [optimisticArch, ...prev]);

    if (convexClient && isConvexConfigured) {
      try {
        // Server generates the unique idArsip atomically — no race condition
        const result = await convexClient.mutation(api.skw.createArchive, {
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

        // Replace the optimistic placeholder with real server data
        const realArch: ArchiveSKW = {
          ...data,
          _id: result.id,
          idArsip: result.idArsip,
          tahun: year,
          createdAt,
        };

        // Upload the original document file (if attached) to Convex File Storage
        if (file) {
          try {
            const postUrl: string = await convexClient.mutation(
              api.skw.generateUploadUrl,
              {}
            );
            const uploadRes = await fetch(postUrl, {
              method: 'POST',
              headers: { 'Content-Type': file.type || 'application/octet-stream' },
              body: file,
            });
            if (!uploadRes.ok) {
              throw new Error(`Upload gagal (HTTP ${uploadRes.status}).`);
            }
            const { storageId } = await uploadRes.json();
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            const fin: any = await convexClient.mutation(api.skw.finalizeUpload, {
              id: result.id,
              storageId,
              fileName: file.name,
              fileSize: sizeMB,
            });
            realArch.fileName = file.name;
            realArch.fileSize = sizeMB;
            realArch.storageId = storageId;
            realArch.fileUrl = fin?.fileUrl || undefined;
          } catch (uploadErr: any) {
            // The archive record is already saved — the file failed to attach.
            console.error('Gagal mengunggah berkas asli:', uploadErr);
            throw new Error(
              `Arsip tersimpan, tetapi unggahan berkas asli gagal: ${uploadErr?.message || uploadErr}`
            );
          }
        }

        // Replace the optimistic placeholder with real server data.
        // Dedupe by _id: jika subscription sudah lebih dulu mendorong row
        // server ini, jangan tambahkan dua kali (row server selalu menang).
        setArchives((prev) => [
          realArch,
          ...prev.filter((a) => a._id !== tempId && a._id !== result.id),
        ]);
        return realArch;
      } catch (e) {
        console.error('Failed to sync new archive to Convex', e);
        // Remove the failed optimistic entry
        setArchives((prev) => prev.filter((a) => a._id !== tempId));
        throw e;
      }
    }

    // Offline mode: generate local ID (best-effort, no conflict guarantee)
    const existingNums = archives
      .map((a) => {
        const parts = a.idArsip.split('-');
        return parts.length === 4 && parts[2] === String(year) ? parseInt(parts[3], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
    const nextSeq = maxNum + 1;
    const idArsip = `SW-SBT-${year}-${String(nextSeq).padStart(4, '0')}`;
    const finalArch: ArchiveSKW = { ...optimisticArch, idArsip };
    setArchives((prev) => prev.map((a) => (a._id === tempId ? finalArch : a)));
    return finalArch;
  };

  const updateArchive = async (id: string, updates: Partial<ArchiveSKW>) => {
    setArchives((prev) =>
      prev.map((a) => (a.idArsip === id || a._id === id ? { ...a, ...updates } : a))
    );

    // If selectedArchive is open, keep it in sync
    setSelectedArchive((prev) => {
      if (prev && (prev.idArsip === id || prev._id === id)) {
        return { ...prev, ...updates };
      }
      return prev;
    });

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

  const updateStatus = async (id: string, newStatus: 'Tersimpan' | 'Terverifikasi' | 'Diproses') => {
    await updateArchive(id, { status: newStatus });
  };

  const deleteArchive = async (id: string) => {
    setArchives((prev) => prev.filter((a) => a.idArsip !== id && a._id !== id));
    if (selectedArchive && (selectedArchive.idArsip === id || selectedArchive._id === id)) {
      setSelectedArchive(null);
    }

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
    localStorage.removeItem(STORAGE_KEY_LETTER_FORMAT);
    setArchives(INITIAL_ARCHIVES);
    setUsers(INITIAL_USERS);
    setLetterFormat(DEFAULT_LETTER_FORMAT);
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
        updateStatus,
        addUser,
        toggleUserStatus,
        resetToDefault,
        isAddModalOpen,
        setIsAddModalOpen,
        selectedArchive,
        setSelectedArchive,
        editingArchive,
        setEditingArchive,
        deletingArchive,
        setDeletingArchive,
        qrModalArchive,
        setQrModalArchive,
        previewDocArchive,
        setPreviewDocArchive,
        isFormatModalOpen,
        setIsFormatModalOpen,
        publicVerifyId,
        setPublicVerifyId,
        letterFormat,
        updateLetterFormat,
        isConvexConfigured,
        convexUrl,
        setConvexUrl,
        isSyncing,
      }}
    >
      {/* Live sync subscription (reactive) — null-render, hanya jalan saat
          Convex aktif karena useQuery butuh <ConvexProvider> di atasnya. */}
      {isConvexEnabled && convexClient && (
        <LiveConvexSync
          applyServerArchives={applyServerArchives}
          applyServerUsers={applyServerUsers}
          onSyncStateChange={handleSyncStateChange}
        />
      )}
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
