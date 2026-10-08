import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AhliWaris } from '../types';
import { X, Plus, Trash2, Upload, FileText, CheckCircle2 } from 'lucide-react';

export const AddSKWModal: React.FC = () => {
  const { isAddModalOpen, setIsAddModalOpen, addArchive, setActivePage, archives } = useApp();

  const nextSeq = 124 + archives.length;
  const defaultNomor = `470/${nextSeq}/SKW/2026`;
  const todayStr = new Date().toISOString().split('T')[0];

  const [nomorSKW, setNomorSKW] = useState(defaultNomor);
  const [tanggalSurat, setTanggalSurat] = useState(todayStr);
  const [namaPewaris, setNamaPewaris] = useState('');
  const [nikPewaris, setNikPewaris] = useState('');
  const [tanggalMeninggal, setTanggalMeninggal] = useState('');
  const [alamat, setAlamat] = useState('Kelurahan Sumbertaman, Kec. Wonoasih, Kota Probolinggo');
  const [status, setStatus] = useState<'Tersimpan' | 'Terverifikasi' | 'Diproses'>('Tersimpan');
  const [catatan, setCatatan] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');

  const [ahliWarisList, setAhliWarisList] = useState<AhliWaris[]>([
    { nama: '', hubungan: 'Istri', nik: '' },
    { nama: '', hubungan: 'Anak Kandung', nik: '' },
  ]);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAddModalOpen) return null;

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setFileSize(sizeMB + ' MB');
    }
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
      setIsSubmitting(true);
      await addArchive({
        nomorSKW: nomorSKW.trim(),
        tanggalSurat,
        namaPewaris: namaPewaris.trim(),
        nikPewaris: nikPewaris.trim() || '3574' + Math.floor(100000000000 + Math.random() * 900000000000),
        tanggalMeninggal,
        jumlahAhliWaris: validAhli.length,
        ahliWarisList: validAhli,
        alamat: alamat.trim(),
        status,
        catatan: catatan.trim() || 'Arsip tersimpan di Kelurahan Sumbertaman',
        fileName: fileName || `SKW_${namaPewaris.replace(/\s+/g, '_')}_Scan.pdf`,
        fileSize: fileSize || '1.1 MB',
      });

      setIsAddModalOpen(false);
      setActivePage('surat');
    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan saat menyimpan arsip.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
      <div className="modal-dialog large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <FileText size={20} color="#2563eb" />
            Tambah Surat Keterangan Waris (SKW)
          </h3>
          <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
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
                <CheckCircle2 size={16} /> Data Surat & Pewaris
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
                    placeholder="Contoh: 470/128/SKW/2026"
                    required
                  />
                  <span className="form-hint">Format resmi Kelurahan Sumbertaman</span>
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
                    Nama Pewaris (Almarhum/Almarhumah) <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={namaPewaris}
                    onChange={(e) => setNamaPewaris(e.target.value)}
                    placeholder="Nama lengkap sesuai KTP"
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
                    placeholder="16 digit NIK pewaris"
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
                  placeholder="RT/RW, Jalan, Kel. Sumbertaman"
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
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 12 }}>
                Unggah Dokumen Berkas Digital
              </div>
              <div className="form-group">
                <label className="form-label">File Scan Surat Keterangan Waris (PDF/JPG/PNG)</label>
                <div
                  style={{
                    border: '2px dashed #93c5fd',
                    background: '#f0f7ff',
                    padding: '16px',
                    borderRadius: 10,
                    textAlign: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    style={{
                      opacity: 0,
                      position: 'absolute',
                      inset: 0,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Upload size={24} color="#2563eb" />
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>
                      {fileName ? `File terpilih: ${fileName} (${fileSize})` : 'Klik atau seret file dokumen scan ke sini'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      Format didukung: PDF, JPG, PNG (Maksimal 10MB)
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Catatan Tambahan Arsip</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan register buku kelurahan, kelengkapan berkas fisik..."
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : '💾 Simpan Arsip SKW'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
