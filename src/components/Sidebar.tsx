import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PageId } from '../types';
import {
  LayoutDashboard,
  FileText,
  Users,
  FolderArchive,
  BarChart3,
  Settings,
  Building2,
  PlusCircle,
  X,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * CSS drawer mobile — scoped di komponen, JANGAN append ke index.css (dikerjakan subagent lain paralel).
 * Poin 4: hamburger + drawer sidebar berfungsi di viewport < 900px (index.css hanya menangani <= 768px).
 * Poin 3: nav "Pencarian Arsip" dihapus — pencarian menyatu di halaman Arsip Digital.
 */
const SIDEBAR_DRAWER_CSS = `
.sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  z-index: 45;
  border: 0;
  padding: 0;
}
@media (max-width: 900px) {
  .mobile-toggle { display: block; }
  .sidebar { transform: translateX(-100%); }
  .sidebar.open { transform: translateX(0); }
  .main-wrapper { margin-left: 0; width: 100%; }
  .sidebar-backdrop { display: block; }
}
`;

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activePage, setActivePage, archives, setIsAddModalOpen } = useApp();
  const { user } = useAuth();
  const [isChangePwOpen, setIsChangePwOpen] = useState(false);

  const navItems: { id: PageId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'surat', label: 'Data Surat Waris', icon: <FileText size={18} />, badge: archives.length },
    { id: 'pewaris', label: 'Pewaris & Ahli Waris', icon: <Users size={18} /> },
    { id: 'arsip', label: 'Arsip Digital', icon: <FolderArchive size={18} /> },
    { id: 'laporan', label: 'Laporan & Statistik', icon: <BarChart3 size={18} /> },
    { id: 'pengguna', label: 'Manajemen Pengguna', icon: <Settings size={18} /> },
  ];

  const handleNav = (id: PageId) => {
    setActivePage(id);
    onClose();
  };

  return (
    <>
      <style>{SIDEBAR_DRAWER_CSS}</style>

      {/* Backdrop drawer mobile — klik untuk menutup sidebar */}
      {isOpen && (
        <button
          className="sidebar-backdrop"
          onClick={onClose}
          aria-label="Tutup menu"
          tabIndex={-1}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="brand-badge">
              <div className="brand-logo-icon">
                <Building2 size={24} />
              </div>
              <div className="brand-text">
                <h1>SIWARIS</h1>
                <p>Sistem Arsip Surat Waris</p>
              </div>
            </div>
            {isOpen && (
              <button
                onClick={onClose}
                style={{ background: 'none', border: 0, color: '#fff', cursor: 'pointer', padding: 4 }}
                className="mobile-close"
              >
                <X size={20} />
              </button>
            )}
          </div>
          <div className="kelurahan-tag">
            <span>🏛️ Kel. Sumbertaman</span>
            <span>• Kota Probolinggo</span>
          </div>
        </div>

        <div style={{ padding: '16px 14px 4px' }}>
          <button
            onClick={() => {
              setIsAddModalOpen(true);
              onClose();
            }}
            className="btn btn-primary"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              padding: '10px 14px',
              fontSize: '13px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
            }}
          >
            <PlusCircle size={16} />
            <span>Tambah SKW Baru</span>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Menu Utama</div>
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
                title={item.label}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div
              style={{
                padding: '12px 14px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Kartu pengguna yang sedang login */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {user.nama?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: '#e2e8f0',
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={user.nama}
                  >
                    {user.nama}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
                    @{user.username} • {user.role}
                  </div>
                </div>
              </div>

              {/* Tombol ganti password sendiri */}
              <button
                onClick={() => setIsChangePwOpen(true)}
                className="btn btn-sm"
                title="Ganti password akun Anda"
                style={{
                  width: '100%',
                  marginTop: 10,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontSize: 12,
                }}
              >
                <KeyRound size={13} color="#60a5fa" />
                <span>Ganti Password</span>
              </button>
            </div>
          )}

          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '11px' }}>
              <ShieldCheck size={13} color="#60a5fa" />
              <div>
                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '11px' }}>SIWARIS v2.0</div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: 1 }}>Kelurahan Sumbertaman © 2026</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Modal ganti password sendiri */}
      {isChangePwOpen && <ChangePasswordModal onClose={() => setIsChangePwOpen(false)} />}
    </>
  );
};
