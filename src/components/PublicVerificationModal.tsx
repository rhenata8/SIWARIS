import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, CheckCircle2, FileText, Download, X, Calendar, User, MapPin } from 'lucide-react';
import { generateAndDownloadSKWPDF } from '../services/pdfGenerator';

export const PublicVerificationModal: React.FC = () => {
  const { publicVerifyId, setPublicVerifyId, archives, letterFormat, setSelectedArchive } = useApp();

  if (!publicVerifyId) return null;

  const matched = archives.find(
    (a) => a.idArsip === publicVerifyId || a.idArsip.toLowerCase() === publicVerifyId.toLowerCase()
  );

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

  const handleClose = () => {
    setPublicVerifyId(null);
    // Clean up query param from URL without refreshing
    const url = new URL(window.location.href);
    url.searchParams.delete('validasi');
    url.searchParams.delete('id');
    window.history.replaceState({}, '', url.pathname);
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <div className="modal-header" style={{ background: '#ecfdf5', borderBottomColor: '#a7f3d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={24} color="#059669" />
            <div>
              <h3 style={{ color: '#065f46', fontSize: 17 }}>Validasi Keaslian Surat Digital</h3>
              <p style={{ fontSize: 11, color: '#047857' }}>Sistem Informasi Arsip Surat Waris (SIWARIS)</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {matched ? (
            <div>
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 12,
                  padding: 16,
                  textAlign: 'center',
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      background: '#dcfce7',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={30} />
                  </div>
                </div>

                <div style={{ fontSize: 16, fontWeight: 800, color: '#166534' }}>
                  DOKUMEN RESMI TERVERIFIKASI SAH
                </div>
                <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>
                  Tercatat resmi dalam buku register arsip digital {letterFormat.namaKantor}, {letterFormat.namaKecamatan}
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', padding: '6px 0', width: 140 }}>Nomor SKW</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{matched.nomorSKW}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '6px 0' }}>ID Arsip Digital</td>
                      <td style={{ fontWeight: 600, color: '#2563eb' }}>{matched.idArsip}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '6px 0' }}>Nama Pewaris</td>
                      <td style={{ fontWeight: 700 }}>{matched.namaPewaris}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '6px 0' }}>Tanggal Terbit</td>
                      <td>{formatDate(matched.tanggalSurat)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '6px 0' }}>Tanggal Meninggal</td>
                      <td style={{ color: '#dc2626' }}>{formatDate(matched.tanggalMeninggal)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '6px 0' }}>Jumlah Ahli Waris</td>
                      <td><b>{matched.jumlahAhliWaris} Orang</b></td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '6px 0' }}>Status Dokumen</td>
                      <td>
                        <span className="badge badge-success">✓ {matched.status}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {matched.ahliWarisList && matched.ahliWarisList.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e3a8a', marginBottom: 8 }}>
                    Daftar Ahli Waris yang Sah:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {matched.ahliWarisList.map((a, i) => (
                      <span
                        key={i}
                        style={{
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          color: '#1e40af',
                        }}
                      >
                        <b>{a.nama}</b> ({a.hubungan})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>
                Arsip Tidak Ditemukan
              </div>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                ID Arsip "{publicVerifyId}" tidak terdaftar dalam basis data SIWARIS Kelurahan Sumbertaman.
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleClose}>
            Tutup
          </button>

          {matched && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSelectedArchive(matched);
                  handleClose();
                }}
              >
                <FileText size={14} /> Lihat Detail Lengkap
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => generateAndDownloadSKWPDF(matched, letterFormat)}
              >
                <Download size={14} /> Unduh PDF Resmi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
