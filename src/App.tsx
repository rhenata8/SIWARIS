import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { SuratWarisPage } from './pages/SuratWarisPage';
import { PewarisAhliWarisPage } from './pages/PewarisAhliWarisPage';
import { ArsipDigitalPage } from './pages/ArsipDigitalPage';
import { PencarianPage } from './pages/PencarianPage';
import { LaporanPage } from './pages/LaporanPage';
import { PenggunaPage } from './pages/PenggunaPage';
import { AddSKWModal } from './components/AddSKWModal';
import { DetailSKWModal } from './components/DetailSKWModal';
import { EditSKWModal } from './components/EditSKWModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { QRCodeModal } from './components/QRCodeModal';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { FormatSuratModal } from './components/FormatSuratModal';
import { PublicVerificationModal } from './components/PublicVerificationModal';

export const AppContent: React.FC = () => {
  const { activePage, setActivePage } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global keyboard shortcuts (Ctrl+K to search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setActivePage('pencarian');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActivePage]);

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'surat':
        return <SuratWarisPage />;
      case 'pewaris':
        return <PewarisAhliWarisPage />;
      case 'arsip':
        return <ArsipDigitalPage />;
      case 'pencarian':
        return <PencarianPage />;
      case 'laporan':
        return <LaporanPage />;
      case 'pengguna':
        return <PenggunaPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main>{renderActivePage()}</main>

        <footer
          style={{
            padding: '24px 32px',
            borderTop: '1px solid #e2e8f0',
            color: '#64748b',
            fontSize: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            marginTop: 'auto',
          }}
          className="no-print"
        >
          <div>
            <b>SIWARIS</b> • Sistem Informasi Arsip Surat Keterangan Waris • Kelurahan Sumbertaman, Kecamatan Wonoasih, Kota Probolinggo
          </div>
          <div>
            Arsip Digital Terverifikasi & Terintegrasi
          </div>
        </footer>
      </div>

      {/* Global Modals */}
      <AddSKWModal />
      <DetailSKWModal />
      <EditSKWModal />
      <DeleteConfirmModal />
      <QRCodeModal />
      <DocumentPreviewModal />
      <FormatSuratModal />
      <PublicVerificationModal />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
