import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { Settings, UserPlus, CheckCircle, RotateCcw, X, KeyRound, LockKeyhole } from 'lucide-react';

export const PenggunaPage: React.FC = () => {
  const { users, toggleUserStatus, resetToDefault } = useApp();
  const { registerUser, changeUserPassword, changeOwnPassword, user: currentUser, isAdmin } = useAuth();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Form states
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [nip, setNip] = useState('');
  const [role, setRole] = useState('Operator Pelayanan');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset password (admin) per baris pengguna
  const [pwTarget, setPwTarget] = useState<User | null>(null);
  const [pwBaru, setPwBaru] = useState('');
  const [pwKonfirmasi, setPwKonfirmasi] = useState('');
  const [pwErrorMsg, setPwErrorMsg] = useState('');
  const [pwSuccessMsg, setPwSuccessMsg] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Ganti password sendiri (semua role)
  const [isSelfPwOpen, setIsSelfPwOpen] = useState(false);
  const [selfOld, setSelfOld] = useState('');
  const [selfNew, setSelfNew] = useState('');
  const [selfNew2, setSelfNew2] = useState('');
  const [selfErrorMsg, setSelfErrorMsg] = useState('');
  const [selfSuccessMsg, setSelfSuccessMsg] = useState('');
  const [selfSubmitting, setSelfSubmitting] = useState(false);

  // Auto-hide pesan sukses inline halaman setelah beberapa detik
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 6000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // Auto-close modal reset password setelah pesan sukses tampil
  useEffect(() => {
    if (!pwSuccessMsg) return;
    const t = setTimeout(() => closePwModal(), 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pwSuccessMsg]);

  // Auto-close modal ganti password sendiri setelah pesan sukses tampil
  useEffect(() => {
    if (!selfSuccessMsg) return;
    const t = setTimeout(() => closeSelfPwModal(), 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfSuccessMsg]);

  const openPwModal = (u: User) => {
    setPwTarget(u);
    setPwBaru('');
    setPwKonfirmasi('');
    setPwErrorMsg('');
    setPwSuccessMsg('');
  };

  const closePwModal = () => {
    setPwTarget(null);
    setPwBaru('');
    setPwKonfirmasi('');
    setPwErrorMsg('');
    setPwSuccessMsg('');
  };

  const openSelfPwModal = () => {
    setSelfOld('');
    setSelfNew('');
    setSelfNew2('');
    setSelfErrorMsg('');
    setSelfSuccessMsg('');
    setIsSelfPwOpen(true);
  };

  const closeSelfPwModal = () => {
    setSelfOld('');
    setSelfNew('');
    setSelfNew2('');
    setSelfErrorMsg('');
    setSelfSuccessMsg('');
    setIsSelfPwOpen(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrorMsg('');
    if (!pwTarget) return;
    if (pwBaru.length < 6) {
      setPwErrorMsg('Password baru minimal 6 karakter.');
      return;
    }
    if (pwBaru !== pwKonfirmasi) {
      setPwErrorMsg('Konfirmasi password tidak sama.');
      return;
    }
    try {
      setPwSubmitting(true);
      await changeUserPassword(pwTarget._id as string, pwBaru);
      setPwSuccessMsg(`Password @${pwTarget.username} berhasil direset.`);
    } catch (err: any) {
      setPwErrorMsg(err?.message || 'Gagal mereset password pengguna.');
    } finally {
      setPwSubmitting(false);
    }
  };

  const handleChangeOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSelfErrorMsg('');
    if (!selfOld || !selfNew || !selfNew2) {
      setSelfErrorMsg('Semua kolom wajib diisi.');
      return;
    }
    if (selfNew.length < 6) {
      setSelfErrorMsg('Password baru minimal 6 karakter.');
      return;
    }
    if (selfNew !== selfNew2) {
      setSelfErrorMsg('Konfirmasi password baru tidak sama.');
      return;
    }
    if (selfOld === selfNew) {
      setSelfErrorMsg('Password baru tidak boleh sama dengan password lama.');
      return;
    }
    try {
      setSelfSubmitting(true);
      await changeOwnPassword(selfOld, selfNew);
      setSelfSuccessMsg('Password berhasil diubah.');
    } catch (err: any) {
      setSelfErrorMsg(err?.message || 'Gagal mengubah password.');
    } finally {
      setSelfSubmitting(false);
    }
  };

  const canResetPw = (u: User) =>
    isAdmin && Boolean(u._id) && !u._id!.startsWith('usr-');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!nama.trim() || !username.trim()) {
      setErrorMsg('Nama dan username wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password minimal 6 karakter.');
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
      setNama('');
      setUsername('');
      setPassword('');
      setPassword2('');
      setNip('');
      setEmail('');
      setIsAddUserOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menambahkan pengguna.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="panel">
        <div className="panel-header" style={{ flexWrap: 'wrap' }}>
          <div className="panel-title-area">
            <h3>
              <Settings size={20} color="#2563eb" />
              Manajemen Pengguna & Hak Akses
            </h3>
            <p>Pengelolaan akun operator kelurahan, sekretaris, dan pimpinan legalisir SKW</p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={openSelfPwModal}
              title="Ganti password akun yang sedang login"
            >
              <LockKeyhole size={14} /> Ganti Password
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (confirm('Reset semua data kembali ke default prototype?')) {
                  resetToDefault();
                }
              }}
              title="Reset data ke default"
            >
              <RotateCcw size={14} /> Reset Data Demo
            </button>
            <button className="btn btn-primary" onClick={() => setIsAddUserOpen(true)} disabled={!isAdmin}>
              <UserPlus size={16} /> Tambah Staf Baru
            </button>
          </div>
        </div>

        {!isAdmin && (
          <div className="notice-box" style={{ background: '#eff6ff', borderColor: '#93c5fd', color: '#1e40af', margin: '0 20px 16px' }}>
            Penambahan pengguna baru hanya dapat dilakukan oleh administrator (akun <b>admin</b>).
          </div>
        )}

        {successMsg && (
          <div className="notice-box" style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#15803d', margin: '0 20px 16px' }}>
            <CheckCircle size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
            {successMsg}
          </div>
        )}

        {/* User table */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Username</th>
                <th>NIP Pegawai</th>
                <th>Peran / Jabatan</th>
                <th>Status Akun</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id || u.username}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {u.nama.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.nama}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#1e40af' }}>@{u.username}</td>
                  <td style={{ color: '#475569' }}>{u.nip || '-'}</td>
                  <td>
                    <span className="badge badge-primary">{u.role}</span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        u.status === 'Aktif' ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {u.status === 'Aktif' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {canResetPw(u) && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => openPwModal(u)}
                          title={`Reset password @${u.username}`}
                        >
                          <KeyRound size={14} /> Reset Password
                        </button>
                      )}
                      <button
                        className={`btn btn-sm ${u.status === 'Aktif' ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => toggleUserStatus(u._id || u.username)}
                      >
                        {u.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User */}
      {isAddUserOpen && (
        <div className="modal-overlay" onClick={() => setIsAddUserOpen(false)}>
          <div className="modal-dialog small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <UserPlus size={20} color="#2563eb" /> Tambah Staf Pengguna
              </h3>
              <button className="modal-close-btn" onClick={() => setIsAddUserOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                {errorMsg && (
                  <div className="notice-box" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c' }}>
                    {errorMsg}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">
                    Nama Lengkap <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nama beserta gelar"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Username Login <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="contoh: kasi_pelayanan"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">NIP (Nomor Induk Pegawai)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="19800101 200501 1 001"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Password Login <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Konfirmasi Password <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Ulangi password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Peran / Jabatan</label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="Operator Pelayanan">Operator Pelayanan</option>
                    <option value="Sekretaris Kelurahan">Sekretaris Kelurahan</option>
                    <option value="Lurah Sumbertaman">Lurah Sumbertaman (Pimpinan)</option>
                    <option value="Kasi Pemerintahan">Kasi Pemerintahan</option>
                    <option value="Kasi Trantib">Kasi Ketentraman & Ketertiban</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Dinas</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="nama@probolinggokota.go.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddUserOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password (admin, per pengguna) */}
      {pwTarget && (
        <div className="modal-overlay" onClick={() => !pwSubmitting && closePwModal()}>
          <div className="modal-dialog small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <KeyRound size={20} color="#2563eb" /> Reset Password @{pwTarget.username}
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => !pwSubmitting && closePwModal()}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleResetPassword}>
              <div className="modal-body">
                {pwErrorMsg && (
                  <div
                    className="notice-box"
                    style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c' }}
                  >
                    {pwErrorMsg}
                  </div>
                )}
                {pwSuccessMsg && (
                  <div
                    className="notice-box"
                    style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#15803d' }}
                  >
                    <CheckCircle size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
                    {pwSuccessMsg}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">
                    Password Baru <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder={`Password baru untuk @${pwTarget.username}`}
                    value={pwBaru}
                    onChange={(e) => setPwBaru(e.target.value)}
                    autoFocus
                    required
                    minLength={6}
                    disabled={Boolean(pwSuccessMsg)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Konfirmasi Password Baru <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Ulangi password baru"
                    value={pwKonfirmasi}
                    onChange={(e) => setPwKonfirmasi(e.target.value)}
                    required
                    minLength={6}
                    disabled={Boolean(pwSuccessMsg)}
                  />
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Pengguna <b>{pwTarget.nama}</b> akan login dengan password baru ini pada sesi berikutnya.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closePwModal}
                  disabled={pwSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={pwSubmitting || Boolean(pwSuccessMsg)}
                >
                  <KeyRound size={16} />
                  {pwSubmitting ? 'Menyimpan…' : 'Simpan Password Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ganti Password Sendiri (semua role) */}
      {isSelfPwOpen && (
        <div className="modal-overlay" onClick={() => !selfSubmitting && closeSelfPwModal()}>
          <div className="modal-dialog small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <LockKeyhole size={20} color="#2563eb" /> Ganti Password
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => !selfSubmitting && closeSelfPwModal()}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangeOwnPassword}>
              <div className="modal-body">
                {selfErrorMsg && (
                  <div
                    className="notice-box"
                    style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c' }}
                  >
                    {selfErrorMsg}
                  </div>
                )}
                {selfSuccessMsg && (
                  <div
                    className="notice-box"
                    style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#15803d' }}
                  >
                    <CheckCircle size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
                    {selfSuccessMsg}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">
                    Password Lama <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Password saat ini"
                    value={selfOld}
                    onChange={(e) => setSelfOld(e.target.value)}
                    autoFocus
                    required
                    disabled={Boolean(selfSuccessMsg)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Password Baru <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Minimal 6 karakter"
                    value={selfNew}
                    onChange={(e) => setSelfNew(e.target.value)}
                    required
                    minLength={6}
                    disabled={Boolean(selfSuccessMsg)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Konfirmasi Password Baru <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Ulangi password baru"
                    value={selfNew2}
                    onChange={(e) => setSelfNew2(e.target.value)}
                    required
                    minLength={6}
                    disabled={Boolean(selfSuccessMsg)}
                  />
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Password digunakan oleh akun <b>@{currentUser?.username || '-'}</b> untuk login ke SIWARIS.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeSelfPwModal}
                  disabled={selfSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={selfSubmitting || Boolean(selfSuccessMsg)}
                >
                  <LockKeyhole size={16} />
                  {selfSubmitting ? 'Menyimpan…' : 'Simpan Password Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
