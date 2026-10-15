import React, { useEffect, useState } from 'react';
import { Building2, ShieldCheck } from 'lucide-react';

/**
 * SIWARIS splash / loading screen.
 * Shown on app boot while the session and data are being prepared,
 * with a minimum display time so the animation is visible.
 */
export const SplashScreen: React.FC<{ done: boolean }> = ({ done }) => {
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (done && minTimePassed) {
      setFadingOut(true);
      const t = setTimeout(() => setHidden(true), 450);
      return () => clearTimeout(t);
    }
  }, [done, minTimePassed]);

  if (hidden) return null;

  return (
    <div className={`splash-screen ${fadingOut ? 'splash-fade-out' : ''}`}>
      <div className="splash-inner">
        <div className="splash-logo">
          <div className="splash-logo-icon">
            <Building2 size={44} color="#fff" />
          </div>
        </div>
        <h1 className="splash-title">SIWARIS</h1>
        <p className="splash-subtitle">
          Sistem Informasi Arsip Surat Keterangan Waris
        </p>
        <p className="splash-instansi">
          Kelurahan Sumbertaman • Kecamatan Wonoashi • Kota Probolinggo
        </p>
        <div className="splash-loader">
          <div className="splash-loader-bar" />
        </div>
        <div className="splash-footer">
          <ShieldCheck size={13} color="#60a5fa" />
          <span>Arsip Digital Terverifikasi</span>
        </div>
      </div>
    </div>
  );
};
