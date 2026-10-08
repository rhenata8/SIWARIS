import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Printer,
  QrCode,
  Calendar,
  MapPin,
  Users2,
  FileText,
  Download,
  Edit3,
  Settings,
} from 'lucide-react';
import { generateAndDownloadSKWPDF } from '../services/pdfGenerator';

export const DetailSKWModal: React.FC = () => {
  const {
    selectedArchive,
    setSelectedArchive,
    setQrModalArchive,
    setPreviewDocArchive,
    setEditingArchive,
    updateStatus,
    setIsFormatModalOpen,
    letterFormat,
  } = useApp();
  const [viewMode, setViewMode] = useState<'detail' | 'surat'>('detail');

  if (!selectedArchive) return null;

  const formatDate = (d: string) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateAndDownloadSKWPDF(selectedArchive, letterFormat);
  };

  return (
    <div className="modal-overlay" onClick={() => setSelectedArchive(null)}>
      <div className="modal-dialog large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3>Arsip SKW: {selectedArchive.idArsip}</h3>

              {/* Status Change Selector */}
              <select
                className="form-select"
                style={{
                  padding: '3px 8px',
                  fontSize: 12,
                  fontWeight: 600,
                  width: 'auto',
                  borderRadius: 20,
                  cursor: 'pointer',
                  borderColor:
                    selectedArchive.status === 'Terverifikasi'
                      ? '#a7f3d0'
                      : selectedArchive.status === 'Tersimpan'
                      ? '#bfdbfe'
                      : '#fde68a',
                  background:
                    selectedArchive.status === 'Terverifikasi'
                      ? '#ecfdf5'
                      : selectedArchive.status === 'Tersimpan'
                      ? '#eff6ff'
                      : '#fffbeb',
                  color:
                    selectedArchive.status === 'Terverifikasi'
                      ? '#059669'
                      : selectedArchive.status === 'Tersimpan'
                      ? '#1d4ed8'
                      : '#d97706',
                }}
                value={selectedArchive.status}
                onChange={(e) =>
                  updateStatus(
                    selectedArchive.idArsip,
                    e.target.value as 'Tersimpan' | 'Terverifikasi' | 'Diproses'
                  )
                }
                title="Klik untuk mengubah status arsip"
              >
                <option value="Tersimpan">Tersimpan</option>
                <option value="Terverifikasi">Terverifikasi</option>
                <option value="Diproses">Diproses</option>
              </select>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Nomor Registrasi: {selectedArchive.nomorSKW}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: '#f1f5f9', padding: 4, borderRadius: 8, display: 'flex', gap: 4 }}>
              <button
                className={`btn btn-sm ${viewMode === 'detail' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('detail')}
              >
                Rincian
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'surat' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('surat')}
              >
                Format Surat Resmi
              </button>
            </div>
            <button className="modal-close-btn" onClick={() => setSelectedArchive(null)}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {viewMode === 'detail' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Highlight card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
                  padding: 18,
                  borderRadius: 12,
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 600 }}>NAMA PEWARIS</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                    {selectedArchive.namaPewaris}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                    NIK: {selectedArchive.nikPewaris}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setEditingArchive(selectedArchive);
                    }}
                    style={{ background: '#2563eb' }}
                  >
                    <Edit3 size={14} /> Ubah Data SKW
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setQrModalArchive(selectedArchive)}
                    style={{ background: '#fff' }}
                  >
                    <QrCode size={14} /> QR Verifikasi
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPreviewDocArchive(selectedArchive)}
                    style={{ background: '#fff' }}
                  >
                    <FileText size={14} /> Buka Berkas Scan
                  </button>
                </div>
              </div>

              {/* Data Grid */}
              <div className="form-grid-2">
                <div className="panel" style={{ margin: 0, padding: 18 }}>
                  <h4 style={{ fontSize: 13, color: '#1e3a8a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={15} /> Data Tanggal & Nomor
                  </h4>
                  <table style={{ width: '100%', fontSize: 12.5 }}>
                    <tbody>
                      <tr>
                        <td style={{ color: '#64748b', padding: '6px 0', width: 140 }}>Nomor SKW</td>
                        <td style={{ fontWeight: 600 }}>{selectedArchive.nomorSKW}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', padding: '6px 0' }}>Tanggal Terbit</td>
                        <td>{formatDate(selectedArchive.tanggalSurat)}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', padding: '6px 0' }}>Tanggal Meninggal</td>
                        <td style={{ color: '#dc2626', fontWeight: 600 }}>{formatDate(selectedArchive.tanggalMeninggal)}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', padding: '6px 0' }}>Tahun Arsip</td>
                        <td>{selectedArchive.tahun}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="panel" style={{ margin: 0, padding: 18 }}>
                  <h4 style={{ fontSize: 13, color: '#1e3a8a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={15} /> Lokasi & Berkas Fisik
                  </h4>
                  <table style={{ width: '100%', fontSize: 12.5 }}>
                    <tbody>
                      <tr>
                        <td style={{ color: '#64748b', padding: '6px 0', width: 140 }}>Alamat Pewaris</td>
                        <td>{selectedArchive.alamat || 'Kelurahan Sumbertaman'}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', padding: '6px 0' }}>Nama Berkas</td>
                        <td style={{ fontWeight: 600, color: '#2563eb' }}>{selectedArchive.fileName || `${selectedArchive.idArsip}.pdf`}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', padding: '6px 0' }}>Ukuran Berkas</td>
                        <td>{selectedArchive.fileSize || '1.2 MB'}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', padding: '6px 0' }}>Catatan</td>
                        <td>{selectedArchive.catatan || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ahli Waris List */}
              <div className="panel" style={{ margin: 0, padding: 18 }}>
                <h4 style={{ fontSize: 13, color: '#1e3a8a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users2 size={15} /> Daftar Ahli Waris ({selectedArchive.ahliWarisList?.length || selectedArchive.jumlahAhliWaris} orang)
                </h4>
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Nama Lengkap Ahli Waris</th>
                        <th>Hubungan Keluarga</th>
                        <th>NIK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedArchive.ahliWarisList && selectedArchive.ahliWarisList.length > 0 ? (
                        selectedArchive.ahliWarisList.map((a, i) => (
                          <tr key={i}>
                            <td style={{ width: 40, fontWeight: 600 }}>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{a.nama}</td>
                            <td>
                              <span className="badge badge-primary">{a.hubungan}</span>
                            </td>
                            <td style={{ color: '#64748b' }}>{a.nik || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', color: '#64748b', padding: 12 }}>
                            Jumlah ahli waris: {selectedArchive.jumlahAhliWaris} orang.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Official Letterhead Template (Uses dynamic letterFormat) */
            <div className="official-letter" id="printSection">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }} className="no-print">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsFormatModalOpen(true)}
                >
                  <Settings size={14} /> Sesuaikan Kop Surat & TTD
                </button>
              </div>

              <div className="letter-kop">
                <h4>{letterFormat.namaPemerintah.toUpperCase()}</h4>
                <h3>{letterFormat.namaKecamatan.toUpperCase()}</h3>
                <h2>{letterFormat.namaKantor.toUpperCase()}</h2>
                <p>{letterFormat.alamatKantor} • {letterFormat.kontakKantor}</p>
              </div>

              <div className="letter-title">
                <h4>SURAT KETERANGAN WARIS</h4>
                <p>Nomor: {selectedArchive.nomorSKW}</p>
              </div>

              <div className="letter-content">
                <p>
                  Yang bertanda tangan di bawah ini, Kepala {letterFormat.namaKantor}, {letterFormat.namaKecamatan},
                  {letterFormat.namaPemerintah}, dengan ini menerangkan dengan sebenarnya bahwa:
                </p>

                <table className="letter-meta-table">
                  <tbody>
                    <tr>
                      <td style={{ width: 170 }}>Nama Lengkap</td>
                      <td style={{ width: 10 }}>:</td>
                      <td><b>{selectedArchive.namaPewaris}</b></td>
                    </tr>
                    <tr>
                      <td>NIK</td>
                      <td>:</td>
                      <td>{selectedArchive.nikPewaris}</td>
                    </tr>
                    <tr>
                      <td>Alamat Terakhir</td>
                      <td>:</td>
                      <td>{selectedArchive.alamat || 'Kelurahan Sumbertaman'}</td>
                    </tr>
                    <tr>
                      <td>Tanggal Meninggal</td>
                      <td>:</td>
                      <td>{formatDate(selectedArchive.tanggalMeninggal)}</td>
                    </tr>
                  </tbody>
                </table>

                <p style={{ marginTop: 12 }}>
                  Telah berpulang ke rahmatullah dan meninggalkan ahli waris yang sah berjumlah{' '}
                  <b>{selectedArchive.jumlahAhliWaris} orang</b> sebagai berikut:
                </p>

                <table style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0', border: '1px solid #000' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #000' }}>
                      <th style={{ padding: '4px 8px', border: '1px solid #000', fontSize: 12 }}>No</th>
                      <th style={{ padding: '4px 8px', border: '1px solid #000', fontSize: 12 }}>Nama Ahli Waris</th>
                      <th style={{ padding: '4px 8px', border: '1px solid #000', fontSize: 12 }}>Hubungan Keluarga</th>
                      <th style={{ padding: '4px 8px', border: '1px solid #000', fontSize: 12 }}>NIK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedArchive.ahliWarisList && selectedArchive.ahliWarisList.map((a, i) => (
                      <tr key={i}>
                        <td style={{ padding: '4px 8px', border: '1px solid #000', textAlign: 'center', fontSize: 12 }}>{i + 1}</td>
                        <td style={{ padding: '4px 8px', border: '1px solid #000', fontSize: 12 }}><b>{a.nama}</b></td>
                        <td style={{ padding: '4px 8px', border: '1px solid #000', fontSize: 12 }}>{a.hubungan}</td>
                        <td style={{ padding: '4px 8px', border: '1px solid #000', fontSize: 12 }}>{a.nik || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p style={{ marginTop: 14 }}>
                  Demikian Surat Keterangan Waris ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
                </p>

                <div className="letter-footer-signatures">
                  <div className="signature-box">
                    <p>ID Arsip Digital:</p>
                    <div style={{ padding: '8px', border: '1px dashed #999', margin: '6px auto', width: 140, fontSize: 11 }}>
                      <b>{selectedArchive.idArsip}</b>
                      <br />
                      Status: {selectedArchive.status}
                    </div>
                  </div>

                  <div className="signature-box">
                    <p>{letterFormat.namaKota}, {formatDate(selectedArchive.tanggalSurat)}</p>
                    <p>{letterFormat.jabatanPenandatangan}</p>
                    <div className="signature-space">
                      {letterFormat.ttdDigitalUrl ? (
                        <img src={letterFormat.ttdDigitalUrl} alt="TTD" style={{ maxHeight: 52, maxWidth: 120 }} />
                      ) : (
                        <div style={{ color: '#2563eb', fontSize: 11, border: '1px solid #93c5fd', padding: '4px 8px', borderRadius: 4, background: '#eff6ff' }}>
                          ✓ {letterFormat.statusTTE}
                        </div>
                      )}
                    </div>
                    <p><b><u>{letterFormat.namaPenandatangan}</u></b></p>
                    <p style={{ fontSize: 11 }}>NIP. {letterFormat.nipPenandatangan}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setSelectedArchive(null)}>
            Tutup
          </button>
          <button className="btn btn-secondary" onClick={() => setEditingArchive(selectedArchive)}>
            <Edit3 size={15} /> Ubah SKW
          </button>
          <button className="btn btn-secondary" onClick={() => setQrModalArchive(selectedArchive)}>
            <QrCode size={15} /> QR Code
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadPDF}>
            <Download size={15} /> Unduh PDF Asli
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={15} /> Cetak Dokumen
          </button>
        </div>
      </div>
    </div>
  );
};
