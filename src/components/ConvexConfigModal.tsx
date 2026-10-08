import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Database, CheckCircle2, Copy, Check, ExternalLink, X, RefreshCw, Terminal, Cloud } from 'lucide-react';

interface ConvexConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConvexConfigModal: React.FC<ConvexConfigModalProps> = ({ isOpen, onClose }) => {
  const { isConvexConfigured, convexUrl, setConvexUrl, isSyncing } = useApp();
  const [inputUrl, setInputUrl] = useState(convexUrl || '');
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setConvexUrl(inputUrl.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
      window.location.reload();
    }, 800);
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3>
            <Database size={20} color="#2563eb" />
            Integrasi Backend & Database Convex
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Status badge */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: isConvexConfigured ? '#ecfdf5' : '#eff6ff',
              border: `1px solid ${isConvexConfigured ? '#a7f3d0' : '#bfdbfe'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: isConvexConfigured ? '#10b981' : '#f59e0b',
                  boxShadow: `0 0 10px ${isConvexConfigured ? '#10b981' : '#f59e0b'}`,
                }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: isConvexConfigured ? '#065f46' : '#1e40af' }}>
                  {isConvexConfigured ? 'Convex Cloud Terhubung Aktif' : 'Mode Offline / Local Storage Aktif'}
                </div>
                <div style={{ fontSize: 11, color: isConvexConfigured ? '#047857' : '#3b82f6' }}>
                  {isConvexConfigured
                    ? 'Perubahan data tersinkronisasi otomatis dengan server Convex'
                    : 'Data tersimpan di penyimpanan browser. Masukkan Convex URL untuk sinkronisasi cloud.'}
                </div>
              </div>
            </div>

            {isSyncing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#2563eb' }}>
                <RefreshCw size={13} className="spin" /> Sinkronisasi...
              </div>
            )}
          </div>

          <form onSubmit={handleSave} style={{ marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">
                Convex Deployment URL (VITE_CONVEX_URL)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://xxxxx.convex.cloud"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                  {savedSuccess ? 'Tersimpan!' : 'Simpan URL'}
                </button>
              </div>
              <span className="form-hint">
                Dapat diperoleh otomatis setelah menjalankan perintah <code>npx convex dev</code> atau dari dashboard Convex.
              </span>
            </div>
          </form>

          {/* Quick Guide */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Terminal size={15} color="#2563eb" />
              Cara Menghubungkan & Menjalankan Convex:
            </div>

            <ol style={{ fontSize: 12, color: '#475569', paddingLeft: 18, lineHeight: 1.7, margin: 0 }}>
              <li>
                Buka terminal di folder proyek ini dan jalankan:
                <div
                  style={{
                    background: '#0f172a',
                    color: '#38bdf8',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontFamily: 'monospace',
                    marginTop: 4,
                    marginBottom: 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>npx convex dev</span>
                  <button
                    type="button"
                    onClick={() => copyCommand('npx convex dev')}
                    style={{ background: 'none', border: 0, color: '#cbd5e1', cursor: 'pointer', padding: 2 }}
                    title="Salin Perintah"
                  >
                    {copiedCmd ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  </button>
                </div>
              </li>
              <li>
                Login akun Convex (gratis di <b>convex.dev</b> via GitHub/Google). CLI akan membuat file <code>.env.local</code> secara otomatis.
              </li>
              <li>
                Saat deploy di <b>Vercel</b>, tambahkan Environment Variable:
                <br />
                <code>VITE_CONVEX_URL</code> = <i>(URL deployment Convex Anda)</i>
              </li>
            </ol>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <a
            href="https://dashboard.convex.dev"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: 'none' }}
          >
            <Cloud size={14} /> Buka Convex Dashboard <ExternalLink size={12} />
          </a>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
