import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, LogIn, User as UserIcon, ShieldCheck, UserPlus } from 'lucide-react';

/**
 * SIWARIS Login page.
 * Style follows the existing government-blue design system.
 */
export const LoginPage: React.FC<{ onGoRegister?: () => void }> = ({ onGoRegister }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim() || !password) {
      setErrorMsg('Mohon isi username dan password.');
      return;
    }
    try {
      setIsSubmitting(true);
      await login(username.trim(), password);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal masuk. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-icon">
            <Building2 size={34} color="#fff" />
          </div>
          <h1>SIWARIS</h1>
          <p>Sistem Informasi Arsip Surat Keterangan Waris</p>
          <div className="auth-instansi">Kelurahan Sumbertaman, Kec. Wonoasih, Kota Probolinggo</div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errorMsg && <div className="auth-error">{errorMsg}</div>}

          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="auth-input-wrap">
              <UserIcon size={16} color="#94a3b8" />
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="auth-input-wrap">
              <Lock size={16} color="#94a3b8" />
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={isSubmitting}>
            <LogIn size={16} />
            {isSubmitting ? 'Memproses...' : 'Masuk ke Dashboard'}
          </button>

          {onGoRegister && (
            <button
              type="button"
              className="auth-register-link"
              onClick={onGoRegister}
            >
              <UserPlus size={14} />
              Daftarkan pengguna baru (khusus administrator)
            </button>
          )}
        </form>

        <div className="auth-footer">
          <ShieldCheck size={13} color="#60a5fa" />
          <span>Akses terbatas untuk staf Kelurahan Sumbertaman</span>
        </div>
      </div>
    </div>
  );
};
