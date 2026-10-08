import React from 'react';
import { useApp } from '../context/AppContext';
import { PageId } from '../types';
import {
  LayoutDashboard,
  FileText,
  Users,
  FolderArchive,
  Search,
  BarChart3,
  Settings,
  Building2,
  PlusCircle,
  X,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activePage, setActivePage, archives, setIsAddModalOpen } = useApp();

  const navItems: { id: PageId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'surat', label: 'Data Surat Waris', icon: <FileText size={18} />, badge: archives.length },
    { id: 'pewaris', label: 'Pewaris & Ahli Waris', icon: <Users size={18} /> },
    { id: 'arsip', label: 'Arsip Digital', icon: <FolderArchive size={18} /> },
    { id: 'pencarian', label: 'Pencarian Arsip', icon: <Search size={18} /> },
    { id: 'laporan', label: 'Laporan & Statistik', icon: <BarChart3 size={18} /> },
    { id: 'pengguna', label: 'Manajemen Pengguna', icon: <Settings size={18} /> },
  ];

  const handleNav = (id: PageId) => {
    setActivePage(id);
    onClose();
  };

  return (
    <>
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
          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '11px' }}>
              <ShieldCheck size={13} color="#60a5fa" />
              <div>
                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '11px' }}>SIWARIS v1.0</div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: 1 }}>Kelurahan Sumbertaman © 2026</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
