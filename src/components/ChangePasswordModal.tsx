import React, { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChangePasswordModalProps {
  onClose: () => void;
}

/**
 * Modal ganti password sendiri (password lama + baru + konfirmasi).
 * Dipicu dari tombol "Ganti Password" di kartu pengguna pada Sidebar.
 */
export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const { changeOwnPassword, user } = useAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMsg('Semua kolom wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak sama.');
      return;
    }
    try {
      setIsSubmitting(true);
      await changeOwnPassword(oldPassword, newPassword);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mengubah password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !isSubmitting && onClose()}>
      <div className="modal-dialog small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <KeyRound size={20} color="#2563eb" /> Ganti Password
          </h3>
          <button
            className="modal-close-btn"
            onClick={() => !isSubmitting && onClose()}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && (
              <div
                className="notice-box"
                style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c' }}
              >
                {errorMsg}
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
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoFocus
                required
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div style={{ fontSize: 12, color: '#64748b' }}>
              Password digunakan oleh akun <b>@{user?.username || '-'}</b> untuk login ke SIWARIS.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <KeyRound size={16} />
              {isSubmitting ? 'Menyimpan…' : 'Simpan Password Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
