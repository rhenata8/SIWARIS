import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, FileText, Upload, Check, X, RotateCcw } from 'lucide-react';

export const FormatSuratModal: React.FC = () => {
  const { isFormatModalOpen, setIsFormatModalOpen, letterFormat, updateLetterFormat } = useApp();

  const [form, setForm] = useState({ ...letterFormat });
  const [successMsg, setSuccessMsg] = useState('');

  if (!isFormatModalOpen) return null;

  const handleChange = (field: string, val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setForm((prev) => ({ ...prev, ttdDigitalUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateLetterFormat(form);
    setSuccessMsg('Format surat resmi berhasil diperbarui!');
    setTimeout(() => {
      setSuccessMsg('');
      setIsFormatModalOpen(false);
    }, 800);
  };

  const handleReset = () => {
    const defaultVal = {
      namaPemerintah: 'Pemerintah Kota Probolinggo',
      namaKecamatan: 'Kecamatan Wonoasih',
      namaKantor: 'Kelurahan Sumbertaman',
      alamatKantor: 'Jalan Mastrip No. 12, Sumbertaman, Probolinggo',
      kontakKantor: 'Kode Pos 67237 • Telp: (0335) 421xxx',
      namaKota: 'Sumbertaman',
      jabatanPenandatangan: 'Lurah Sumbertaman',
      namaPenandatangan: 'Drs. H. M. Syaifullah, M.Si',
      nipPenandatangan: '19740615 199803 1 004',
      statusTTE: 'Sertifikasi Dokumen Elektronik Sah',
      ttdDigitalUrl: '',
    };
    setForm(defaultVal);
    updateLetterFormat(defaultVal);
  };

  return (
    <div className="modal-overlay" onClick={() => setIsFormatModalOpen(false)}>
      <div className="modal-dialog large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Settings size={20} color="#2563eb" />
            Pengaturan Format Surat Resmi & Kop Kelurahan
          </h3>
          <button className="modal-close-btn" onClick={() => setIsFormatModalOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            {successMsg && (
              <div className="notice-box" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}>
                <Check size={16} /> {successMsg}
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 12 }}>
                🏛️ Pengaturan Kop Surat (Header Dokumen)
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Nama Pemerintah / Instansi</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.namaPemerintah}
                    onChange={(e) => handleChange('namaPemerintah', e.target.value)}
                    placeholder="Contoh: Pemerintah Kota Probolinggo"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Kecamatan</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.namaKecamatan}
                    onChange={(e) => handleChange('namaKecamatan', e.target.value)}
                    placeholder="Contoh: Kecamatan Wonoasih"
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Nama Kantor / Kelurahan</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.namaKantor}
                    onChange={(e) => handleChange('namaKantor', e.target.value)}
                    placeholder="Contoh: Kelurahan Sumbertaman"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kota / Lokasi Surat</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.namaKota}
                    onChange={(e) => handleChange('namaKota', e.target.value)}
                    placeholder="Contoh: Sumbertaman"
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Alamat Lengkap Kantor</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.alamatKantor}
                    onChange={(e) => handleChange('alamatKantor', e.target.value)}
                    placeholder="Jl. Mastrip No. 12, Sumbertaman"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kontak / Kode Pos & Telp</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.kontakKantor}
                    onChange={(e) => handleChange('kontakKantor', e.target.value)}
                    placeholder="Kode Pos 67237 • Telp: (0335) 421xxx"
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 12 }}>
                ✍️ Pengaturan Pejabat Penandatangan & Tanda Tangan Digital (TTE)
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Jabatan Penandatangan</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.jabatanPenandatangan}
                    onChange={(e) => handleChange('jabatanPenandatangan', e.target.value)}
                    placeholder="Contoh: Lurah Sumbertaman"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Terang Penandatangan</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.namaPenandatangan}
                    onChange={(e) => handleChange('namaPenandatangan', e.target.value)}
                    placeholder="Drs. H. M. Syaifullah, M.Si"
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">NIP Penandatangan</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.nipPenandatangan}
                    onChange={(e) => handleChange('nipPenandatangan', e.target.value)}
                    placeholder="19740615 199803 1 004"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Keterangan Status TTE</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.statusTTE}
                    onChange={(e) => handleChange('statusTTE', e.target.value)}
                    placeholder="Sertifikasi Dokumen Elektronik Sah"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Upload Gambar Tanda Tangan / Stempel Digital (PNG transparan)</label>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  {form.ttdDigitalUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img
                        src={form.ttdDigitalUrl}
                        alt="Tanda Tangan"
                        style={{ height: 40, border: '1px solid #cbd5e1', borderRadius: 4, padding: 2, background: '#fff' }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleChange('ttdDigitalUrl', '')}
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
                <span className="form-hint">
                  Jika gambar tanda tangan diunggah, gambar akan dicetak langsung pada surat resmi dan dokumen PDF.
                </span>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleReset}
            >
              <RotateCcw size={14} /> Reset ke Default Kelurahan
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsFormatModalOpen(false)}
              >
                Batal
              </button>
              <button type="submit" className="btn btn-primary">
                💾 Simpan Format Surat
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
