import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AhliWaris } from '../types';
import { X, Plus, Trash2, Edit3, CheckCircle2 } from 'lucide-react';

export const EditSKWModal: React.FC = () => {
  const { editingArchive, setEditingArchive, updateArchive } = useApp();

  const [nomorSKW, setNomorSKW] = useState('');
  const [tanggalSurat, setTanggalSurat] = useState('');
  const [namaPewaris, setNamaPewaris] = useState('');
  const [nikPewaris, setNikPewaris] = useState('');
  const [tanggalMeninggal, setTanggalMeninggal] = useState('');
  const [alamat, setAlamat] = useState('');
  const [status, setStatus] = useState<'Tersimpan' | 'Terverifikasi' | 'Diproses'>('Tersimpan');
  const [catatan, setCatatan] = useState('');
  const [ahliWarisList, setAhliWarisList] = useState<AhliWaris[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingArchive) {
      setNomorSKW(editingArchive.nomorSKW || '');
      setTanggalSurat(editingArchive.tanggalSurat || '');
      setNamaPewaris(editingArchive.namaPewaris || '');
      setNikPewaris(editingArchive.nikPewaris || '');
      setTanggalMeninggal(editingArchive.tanggalMeninggal || '');
      setAlamat(editingArchive.alamat || '');
      setStatus(editingArchive.status || 'Tersimpan');
      setCatatan(editingArchive.catatan || '');
      setAhliWarisList(
        editingArchive.ahliWarisList && editingArchive.ahliWarisList.length > 0
          ? [...editingArchive.ahliWarisList]
          : [{ nama: '', hubungan: 'Anak Kandung', nik: '' }]
      );
      setErrorMsg('');
    }
  }, [editingArchive]);

  if (!editingArchive) return null;

  const handleAddAhli = () => {
    setAhliWarisList([...ahliWarisList, { nama: '', hubungan: 'Anak Kandung', nik: '' }]);
  };

  const handleRemoveAhli = (index: number) => {
    if (ahliWarisList.length <= 1) return;
    setAhliWarisList(ahliWarisList.filter((_, i) => i !== index));
  };

  const handleAhliChange = (index: number, field: keyof AhliWaris, value: string) => {
    const updated = [...ahliWarisList];
    updated[index] = { ...updated[index], [field]: value };
    setAhliWarisList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nomorSKW.trim() || !namaPewaris.trim() || !tanggalSurat || !tanggalMeninggal) {
      setErrorMsg('Mohon lengkapi semua data utama yang bertanda bintang (*).');
      return;
    }

    const validAhli = ahliWarisList.filter((a) => a.nama.trim() !== '');
    if (validAhli.length === 0) {
      setErrorMsg('Mohon masukkan minimal 1 nama ahli waris.');
      return;
    }

    try {
      setIsSaving(true);
      const yr = new Date(tanggalSurat).getFullYear();
      await updateArchive(editingArchive.idArsip, {
        nomorSKW: nomorSKW.trim(),
        tanggalSurat,
        tahun: !isNaN(yr) ? yr : editingArchive.tahun,
        namaPewaris: namaPewaris.trim(),
        nikPewaris: nikPewaris.trim(),
        tanggalMeninggal,
        jumlahAhliWaris: validAhli.length,
        ahliWarisList: validAhli,
        alamat: alamat.trim(),
        status,
        catatan: catatan.trim(),
      });

      setEditingArchive(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan saat memperbarui arsip.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setEditingArchive(null)}>
      <div className="modal-dialog large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Edit3 size={20} color="#2563eb" />
            Ubah Data Arsip: {editingArchive.idArsip}
          </h3>
          <button className="modal-close-btn" onClick={() => setEditingArchive(null)}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && (
              <div className="notice-box" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> Perbarui Data Surat & Pewaris
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Nomor SKW <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={nomorSKW}
                    onChange={(e) => setNomorSKW(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Tanggal Surat Terbit <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={tanggalSurat}
                    onChange={(e) => setTanggalSurat(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Nama Pewaris <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={namaPewaris}
                    onChange={(e) => setNamaPewaris(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">NIK Pewaris</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nikPewaris}
                    onChange={(e) => setNikPewaris(e.target.value)}
                    maxLength={16}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Tanggal Meninggal Dunia <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={tanggalMeninggal}
                    onChange={(e) => setTanggalMeninggal(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status Verifikasi</label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="Tersimpan">Tersimpan</option>
                    <option value="Terverifikasi">Terverifikasi</option>
                    <option value="Diproses">Diproses</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Alamat Terakhir Pewaris</label>
                <input
                  type="text"
                  className="form-input"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: 18, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a' }}>
                  Daftar Ahli Waris ({ahliWarisList.length} orang)
                </div>
                <button
                  type="button"
                  onClick={handleAddAhli}
                  className="btn btn-subtle btn-sm"
                >
                  <Plus size={14} /> Tambah Ahli Waris
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ahliWarisList.map((ahli, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr 1fr auto',
                      gap: 10,
                      alignItems: 'center',
                      background: '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Nama Ahli Waris ${idx + 1}`}
                      value={ahli.nama}
                      onChange={(e) => handleAhliChange(idx, 'nama', e.target.value)}
                      required={idx === 0}
                    />
                    <select
                      className="form-select"
                      value={ahli.hubungan}
                      onChange={(e) => handleAhliChange(idx, 'hubungan', e.target.value)}
                    >
                      <option value="Istri">Istri</option>
                      <option value="Suami">Suami</option>
                      <option value="Anak Kandung">Anak Kandung</option>
                      <option value="Cucu">Cucu</option>
                      <option value="Orang Tua">Orang Tua</option>
                      <option value="Saudara Kandung">Saudara Kandung</option>
                    </select>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="NIK (Opsional)"
                      value={ahli.nik || ''}
                      onChange={(e) => handleAhliChange(idx, 'nik', e.target.value)}
                      maxLength={16}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAhli(idx)}
                      disabled={ahliWarisList.length <= 1}
                      style={{
                        background: 'none',
                        border: 0,
                        color: ahliWarisList.length <= 1 ? '#cbd5e1' : '#ef4444',
                        cursor: ahliWarisList.length <= 1 ? 'not-allowed' : 'pointer',
                        padding: 6,
                      }}
                      title="Hapus baris"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <div className="form-group">
                <label className="form-label">Catatan Arsip</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingArchive(null)}
              disabled={isSaving}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
