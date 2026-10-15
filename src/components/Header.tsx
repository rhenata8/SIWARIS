import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Menu, Search, UserCheck, LogOut } from 'lucide-react';
import { PageId } from '../types';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const pageTitles: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard Arsip',
    subtitle: 'Ringkasan data surat keterangan waris dan status pelayanan',
  },
  surat: {
    title: 'Data Surat Keterangan Waris',
    subtitle: 'Daftar seluruh arsip SKW terdaftar di Kelurahan Sumbertaman',
  },
  pewaris: {
    title: 'Pewaris & Ahli Waris',
    subtitle: 'Rincian data keluarga dan hubungan ahli waris terdaftar',
  },
  arsip: {
    title: 'Arsip Digital & Dokumen',
    subtitle: 'Manajemen berkas digital, scan SKW, dan verifikasi fisik',
  },
  laporan: {
    title: 'Laporan & Statistik',
    subtitle: 'Rekapitulasi penerbitan surat keterangan waris tahunan',
  },
  pengguna: {
    title: 'Manajemen Pengguna',
    subtitle: 'Pengaturan akun staf operator dan pimpinan kelurahan',
  },
};

/**
 * CSS topbar — scoped di komponen, JANGAN append ke index.css (dikerjakan subagent lain paralel).
 * Poin 1: search bar topbar kini lebar (flex-grow, min ~320px desktop, shrink responsif di mobile).
 * Poin 1: tombol "+ Tambah SKW" dihapus — entry point tambah SKW tetap ada di Sidebar ("Tambah SKW Baru").
 * Poin 4: search tetap tampil (compact) di mobile, judul & profil dipadatkan agar tidak overflow.
 */
const TOPBAR_CSS = `
.topbar-left { min-width: 0; }
.page-title-box { min-width: 0; overflow: hidden; }
.page-title-box h2 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.topbar-right { flex: 1 1 auto; min-width: 0; justify-content: flex-end; }

.swr-topbar-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  color: #64748b;
  cursor: text;
  flex: 1 1 480px;
  min-width: 320px;
  max-width: 720px;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.swr-topbar-search:focus-within {
  background: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}
.swr-topbar-search input {
  border: 0;
  outline: 0;
  background: transparent;
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13px;
  color: #0f172a;
  font-family: inherit;
}
.swr-topbar-search input::placeholder { color: #94a3b8; }
.swr-topbar-search kbd {
  background: #e2e8f0;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 10px;
  font-family: inherit;
  color: #475569;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .swr-topbar-search { flex: 1 1 auto; min-width: 120px; max-width: none; }
  .swr-topbar-search kbd { display: none; }
}
@media (max-width: 768px) {
  .swr-topbar-search { padding: 7px 12px; min-width: 0; }
  .topbar-right { gap: 10px; }
  .page-title-box p { display: none; }
  .page-title-box h2 { font-size: 15px; }
  .user-info { display: none; }
}
@media (max-width: 560px) {
  .swr-topbar-logout-label { display: none; }
}
`;

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { activePage, setActivePage, setSearchQuery } = useApp();
  const { user, logout } = useAuth();
  const { toast, confirmDialog } = useToast();
  const [searchText, setSearchText] = useState('');
  const current = pageTitles[activePage] || { title: 'Dashboard', subtitle: '' };

  const handleLogout = async () => {
    const confirmed = await confirmDialog({
      title: 'Keluar dari SIWARIS',
      message: 'Yakin ingin mengakhiri sesi Anda saat ini?',
      confirmLabel: 'Ya, Keluar',
      cancelLabel: 'Batal',
      danger: false,
    });
    if (confirmed) {
      await logout();
      toast.info('Anda telah keluar dari sistem');
    }
  };

  // Search menyatu di halaman Arsip Digital (poin 3) — submit di topbar mengarahkan ke sana.
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchText.trim();
    if (q) {
      setSearchQuery(q);
      setSearchText('');
    }
    setActivePage('arsip');
  };

  return (
    <header className="topbar">
      <style>{TOPBAR_CSS}</style>

      <div className="topbar-left">
        <button className="mobile-toggle" onClick={onToggleSidebar} aria-label="Buka menu">
          <Menu size={22} />
        </button>
        <div className="page-title-box">
          <h2>{current.title}</h2>
          <p>{current.subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        <form className="swr-topbar-search" onSubmit={handleSearchSubmit} role="search">
          <Search size={15} style={{ flexShrink: 0 }} />
          <input
            id="swr-topbar-search-input"
            type="text"
            placeholder="Cari arsip, nama pewaris, atau nomor SKW..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="Cari arsip"
            autoComplete="off"
          />
          <kbd>Ctrl+K</kbd>
        </form>

        <div className="user-profile-badge">
          <div className="user-avatar">
            <UserCheck size={18} />
          </div>
          <div className="user-info">
            <div className="user-name">{user?.nama || 'Pengguna'}</div>
            <div className="user-role">{user?.role || 'Kel. Sumbertaman'}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-secondary btn-sm"
          title="Keluar dari SIWARIS"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <LogOut size={15} />
          <span className="swr-topbar-logout-label">Keluar</span>
        </button>
      </div>
    </header>
  );
};
