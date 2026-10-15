import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SplashScreen } from './components/SplashScreen';
import { PageSkeleton } from './components/PageSkeleton';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SuratWarisPage } from './pages/SuratWarisPage';
import { PewarisAhliWarisPage } from './pages/PewarisAhliWarisPage';
import { ArsipDigitalPage } from './pages/ArsipDigitalPage';
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
import { PageId } from './types';

type AppRoute = 'app' | 'login' | 'register';

/** Durasi skeleton saat pindah halaman (poin 9). */
const PAGE_SKELETON_MS = 400;

function getRouteFromPath(): { route: AppRoute } {
  const path = window.location.pathname.toLowerCase();
  if (path === '/register' || path.startsWith('/register/')) {
    return { route: 'register' };
  }
  return { route: 'app' };
}

export const AppContent: React.FC = () => {
  const { activePage, setActivePage, isSyncing } = useApp();
  const { user, isAuthReady } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [booted, setBooted] = useState<{ route: AppRoute }>(getRouteFromPath());

  // Poin 9 — cache halaman yang sudah pernah dimuat: skeleton hanya muncul
  // sekali per halaman per sesi. Ref dibaca saat render agar perpindahan
  // ke halaman yang belum pernah dimuat langsung menampilkan skeleton
  // (tidak ada kedipan halaman asli terlebih dahulu).
  // skeletonRerender hanya pemicu re-render setelah cache diperbarui.
  const loadedPagesRef = useRef<Set<PageId>>(new Set([activePage]));
  const [, setSkeletonRerender] = useState(0);

  useEffect(() => {
    if (loadedPagesRef.current.has(activePage)) return;
    const timer = window.setTimeout(() => {
      loadedPagesRef.current.add(activePage);
      setSkeletonRerender((v) => v + 1);
    }, PAGE_SKELETON_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

  const showSkeleton = !loadedPagesRef.current.has(activePage);

  // Track path changes for /register (SPA-friendly, no extra deps)
  useEffect(() => {
    const onPop = () => setBooted(getRouteFromPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigateToRegister = () => {
    window.history.pushState({}, '', '/register');
    setBooted({ route: 'register' });
  };
  const navigateToLogin = () => {
    window.history.pushState({}, '', '/');
    setBooted({ route: 'app' });
  };

  // Global keyboard shortcuts (Ctrl+K → fokus search topbar;
  // pencarian menyatu di Arsip Digital — poin 3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('swr-topbar-search-input') as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.select();
        } else {
          setActivePage('arsip');
        }
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
      case 'laporan':
        return <LaporanPage />;
      case 'pengguna':
        return <PenggunaPage />;
      default:
        return <DashboardPage />;
    }
  };

  const splashDone = isAuthReady && !isSyncing;
  const isRegisterRoute = booted.route === 'register';
  const isAuthed = Boolean(user);

  return (
    <>
      <SplashScreen done={splashDone} />

      {/* Public QR-scan verification works for everyone, logged in or not */}
      <PublicVerificationModal />

      {isAuthReady && isRegisterRoute ? (
        <RegisterPage onBack={navigateToLogin} />
      ) : isAuthReady && !isAuthed ? (
        <LoginPage onGoRegister={navigateToRegister} />
      ) : (
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
            <main>
              {showSkeleton ? <PageSkeleton /> : renderActivePage()}
            </main>

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
        </div>
      )}
    </>
  );
};

export default function App() {
  return <AppContent />;
};
