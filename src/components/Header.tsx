import React from 'react';
import { useApp } from '../context/AppContext';
import { Menu, Search, Plus, UserCheck } from 'lucide-react';
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
  pencarian: {
    title: 'Pencarian & Pelacakan Arsip',
    subtitle: 'Temukan surat berdasarkan nomor SKW, nama pewaris, atau ID arsip',
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

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { activePage, setActivePage, setIsAddModalOpen } = useApp();
  const current = pageTitles[activePage] || { title: 'Dashboard', subtitle: '' };

  return (
    <header className="topbar">
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
        {activePage !== 'pencarian' && (
          <div
            className="topbar-search-trigger"
            onClick={() => setActivePage('pencarian')}
            title="Buka Pencarian Arsip"
          >
            <Search size={15} />
            <span>Cari arsip...</span>
            <kbd style={{ background: '#e2e8f0', padding: '1px 6px', borderRadius: 4, fontSize: 10 }}>Ctrl+K</kbd>
          </div>
        )}

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={15} />
          <span>Tambah SKW</span>
        </button>

        <div className="user-profile-badge">
          <div className="user-avatar">
            <UserCheck size={18} />
          </div>
          <div className="user-info">
            <div className="user-name">Operator Kelurahan</div>
            <div className="user-role">Kel. Sumbertaman</div>
          </div>
        </div>
      </div>
    </header>
  );
};
