import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  UserPlus,
  ArrowLeft,
  Lock,
  User as UserIcon,
  BadgeCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

/**
 * SIWARIS Register page — ADMIN ONLY.
 * Accessible only while an administrator session is active.
 * If opened without a valid admin session, shows a notice instead.
 */
export const RegisterPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { registerUser, isAdmin, user } = useAuth();

  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [role, setRole] = useState('Operator Pelayanan');
  const [nip, setNip] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAdmin) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-logo-icon">
              <Building2 size={34} color="#fff" />
            </div>
            <h1>SIWARIS</h1>
            <p>Registrasi Pengguna</p>
          </div>
          <div className="auth-notice">
            Pendaftaran pengguna baru hanya dapat dilakukan oleh <b>administrator</b> yang
            sedang login. Silakan masuk terlebih dahulu menggunakan akun administrator,
            lalu buka halaman ini atau gunakan menu <b>Manajemen Pengguna</b>.
          </div>
          <button className="btn btn-primary auth-submit" onClick={onBack}>
            <ArrowLeft size={15} /> Kembali ke Halaman Login
          </button>
          <div className="auth-footer">
            <Lock size={13} color="#60a5fa" />
            <span>Fitur terlindungi — khusus administrator</span>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!nama.trim() || !username.trim() || !password) {
      setErrorMsg('Mohon lengkapi nama, username, dan password.');
      return;
    }
    if (password !== password2) {
      setErrorMsg('Konfirmasi password tidak sama.');
      return;
    }
    try {
      setIsSubmitting(true);
      await registerUser({
        nama: nama.trim(),
        username: username.trim(),
        password,
        role,
        nip: nip.trim() || undefined,
        email: email.trim() || undefined,
      });
      setSuccessMsg(
        `Pengguna "${nama.trim()}" (username: ${username.trim().toLowerCase()}) berhasil didaftarkan. Silakan masuk dengan akun tersebut.`
      );
      setNama('');
      setUsername('');
      setPassword('');
      setPassword2('');
      setNip('');
      setEmail('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mendaftarkan pengguna.');
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
          <p>Registrasi Pengguna Baru</p>
          <div className="auth-instansi">
            Didaftarkan oleh: {user?.nama} ({user?.username})
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errorMsg && <div className="auth-error">{errorMsg}</div>}
          {successMsg && <div className="auth-success">{successMsg}</div>}

          <div className="form-group">
            <label className="form-label">Nama Lengkap <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama lengkap staf"
              required
            />
          </div>

          <div className="auth-form-grid">
            <div className="form-group">
              <label className="form-label">Username <span className="required">*</span></label>
              <div className="auth-input-wrap">
                <UserIcon size={16} color="#94a3b8" />
                <input
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="min. 3 karakter"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">NIP</label>
              <input
                type="text"
                className="form-input"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="Opsional"
              />
            </div>
          </div>

          <div className="auth-form-grid">
            <div className="form-group">
              <label className="form-label">Password <span className="required">*</span></label>
              <div className="auth-input-wrap has-eye">
                <Lock size={16} color="#94a3b8" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="min. 6 karakter"
                  required
                />
                <button
                  type="button"
                  className="auth-eye-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Konfirmasi Password <span className="required">*</span></label>
              <div className="auth-input-wrap has-eye">
                <Lock size={16} color="#94a3b8" />
                <input
                  type={showPassword2 ? 'text' : 'password'}
                  className="form-input"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="Ulangi password"
                  required
                />
                <button
                  type="button"
                  className="auth-eye-toggle"
                  onClick={() => setShowPassword2((v) => !v)}
                  aria-label={showPassword2 ? 'Sembunyikan password' : 'Tampilkan password'}
                  title={showPassword2 ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword2 ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="auth-form-grid">
            <div className="form-group">
              <label className="form-label">Peran / Jabatan</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Operator Pelayanan">Operator Pelayanan</option>
                <option value="Sekretaris Kelurahan">Sekretaris Kelurahan</option>
                <option value="Lurah Sumbertaman">Lurah Sumbertaman</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Opsional"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={isSubmitting}>
            <UserPlus size={16} />
            {isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Pengguna'}
          </button>

          <div className="auth-register-note">
            <BadgeCheck size={13} />
            <span>
              Pengguna baru dapat langsung masuk menggunakan username & password ini.
            </span>
          </div>

          {onBack && (
            <button type="button" className="auth-register-link" onClick={onBack}>
              <ArrowLeft size={14} /> Kembali ke Halaman Login
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
