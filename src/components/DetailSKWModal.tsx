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
  Upload,
  AlertTriangle,
} from 'lucide-react';
import { OfficialSKWDocument } from './OfficialSKWDocument';
import { UploadScanModal } from './UploadScanModal';
import { setNextPreviewMode } from './DocumentPreviewModal';
import { convexClient, isConvexEnabled } from '../services/convex';
import { api } from '../../convex/_generated/api';

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
  const [uploadScanOpen, setUploadScanOpen] = useState(false);
  const [downloadingScan, setDownloadingScan] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!selectedArchive) return null;

  // Berkas Scan (Asli) tersimpan di Convex File Storage (field storageId).
  const hasScan = Boolean(selectedArchive.storageId);

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

  // Buka pratinjau BERKAS SCAN (asli) — unggahan operator.
  const handleOpenScanPreview = () => {
    setNextPreviewMode('scan');
    setPreviewDocArchive(selectedArchive);
  };

  // Buka pratinjau BERKAS RESMI SIWARIS — dokumen digenerate (kop surat + TTE + QR).
  const handleOpenResmiPreview = () => {
    setNextPreviewMode('resmi');
    setPreviewDocArchive(selectedArchive);
  };

  // Unduh BERKAS SCAN (asli) dari Convex File Storage — bukan meng-generate PDF baru.
  const handleDownloadScan = async () => {
    if (!selectedArchive.storageId) return;
    setErrorMsg('');
    try {
      setDownloadingScan(true);
      let url: string | null = selectedArchive.fileUrl || null;
      const realId =
        selectedArchive._id &&
        !selectedArchive._id.startsWith('temp-') &&
        !selectedArchive._id.startsWith('arch-');
      if (realId && convexClient && isConvexEnabled) {
        const fresh: any = await convexClient.query(api.skw.getFileUrl, {
          archiveId: selectedArchive._id as any,
        });
        if (fresh) url = fresh;
      }
      if (!url) {
        setErrorMsg('Berkas scan tidak dapat ditemukan di penyimpanan.');
        return;
      }
      // Unduh via blob: attribute `download` diabaikan browser untuk URL
      // lintas origin (convex.cloud), sehingga harus fetch → objectURL.
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = selectedArchive.fileName || `${selectedArchive.idArsip}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (e) {
      console.error(e);
      setErrorMsg('Gagal mengunduh berkas scan.');
    } finally {
      setDownloadingScan(false);
    }
  };

  return (
    <>
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
            {errorMsg && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 12.5,
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ flex: 1 }}>{errorMsg}</span>
                <button
                  type="button"
                  className="btn btn-subtle btn-sm"
                  onClick={() => setErrorMsg('')}
                  title="Tutup pesan"
                  style={{ padding: '2px 6px' }}
                >
                  <X size={13} />
                </button>
              </div>
            )}
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
                    {hasScan ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleOpenScanPreview}
                        style={{ background: '#fff' }}
                        title="Pratinjau berkas scan yang diunggah operator"
                      >
                        <FileText size={14} /> Buka Berkas Scan
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setUploadScanOpen(true)}
                        style={{ background: '#fef9c3', borderColor: '#fde047' }}
                        title="Arsip ini belum memiliki berkas scan"
                      >
                        <Upload size={14} /> Unggah Berkas Scan
                      </button>
                    )}
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
                          <td style={{ color: '#64748b', padding: '6px 0', verticalAlign: 'top' }}>Nama Berkas</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, color: '#2563eb' }}>
                                {selectedArchive.fileName ||
                                  (selectedArchive.storageId ? `${selectedArchive.idArsip}.pdf` : '—')}
                              </span>
                              {hasScan ? (
                                <span className="badge badge-success" style={{ fontSize: 10, padding: '2px 8px' }}>
                                  Berkas Scan
                                </span>
                              ) : (
                                <span className="badge badge-neutral" style={{ fontSize: 10, padding: '2px 8px' }}>
                                  Scan belum diunggah
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ color: '#64748b', padding: '6px 0' }}>Ukuran Berkas</td>
                          <td>{selectedArchive.fileSize || '—'}</td>
                        </tr>
                        <tr>
                          <td style={{ color: '#64748b', padding: '6px 0' }}>Berkas Resmi SIWARIS</td>
                          <td>
                            <span className="badge badge-primary" style={{ fontSize: 10, padding: '2px 8px' }}>
                              Digenerate otomatis
                            </span>
                          </td>
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
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }} className="no-print">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsFormatModalOpen(true)}
                  >
                    <Settings size={14} /> Sesuaikan Kop Surat & TTD
                  </button>
                </div>

                <OfficialSKWDocument
                  archive={selectedArchive}
                  letterFormat={letterFormat}
                  id="printSection"
                />
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
            {hasScan ? (
              <button className="btn btn-secondary" onClick={handleDownloadScan} disabled={downloadingScan}>
                <Download size={15} /> {downloadingScan ? 'Mengunduh...' : 'Unduh Berkas Scan'}
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                disabled
                title="Belum ada berkas scan"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              >
                <Download size={15} /> Unduh Berkas Scan
              </button>
            )}
            <button className="btn btn-primary" onClick={handleOpenResmiPreview}>
              <Printer size={15} /> Cetak Dokumen Resmi
            </button>
          </div>
        </div>
      </div>

      {/* Unggah berkas scan (asli) untuk arsip yang belum memilikinya */}
      {uploadScanOpen && (
        <UploadScanModal archive={selectedArchive} onClose={() => setUploadScanOpen(false)} />
      )}
    </>
  );
};
