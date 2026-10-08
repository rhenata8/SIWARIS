import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { Settings, UserPlus, Shield, CheckCircle, XCircle, RotateCcw, X, Mail } from 'lucide-react';

export const PenggunaPage: React.FC = () => {
  const { users, toggleUserStatus, addUser, resetToDefault } = useApp();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Form states
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [nip, setNip] = useState('');
  const [role, setRole] = useState('Operator Pelayanan');
  const [email, setEmail] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !username.trim()) return;

    await addUser({
      nama: nama.trim(),
      username: username.trim().toLowerCase(),
      nip: nip.trim() || undefined,
      role,
      status: 'Aktif',
      email: email.trim() || `${username.trim().toLowerCase()}@kelurahan-sumbertaman.go.id`,
    });

    setNama('');
    setUsername('');
    setNip('');
    setEmail('');
    setIsAddUserOpen(false);
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

          <div style={{ display: 'flex', gap: 10 }}>
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
            <button className="btn btn-primary" onClick={() => setIsAddUserOpen(true)}>
              <UserPlus size={16} /> Tambah Staf Baru
            </button>
          </div>
        </div>

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
                    <button
                      className={`btn btn-sm ${u.status === 'Aktif' ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => toggleUserStatus(u._id || u.username)}
                    >
                      {u.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
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
    </div>
  );
};
