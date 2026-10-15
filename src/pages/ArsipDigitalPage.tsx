import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FolderArchive, FileText, Download, Eye, QrCode, CloudUpload, ShieldCheck, FileCheck2, FileX2 } from 'lucide-react';
import { convexClient, isConvexEnabled } from '../services/convex';
import { api } from '../../convex/_generated/api';

export const ArsipDigitalPage: React.FC = () => {
  const { archives, setPreviewDocArchive, setQrModalArchive, setIsAddModalOpen } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = archives.filter(
    (x) =>
      x.idArsip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      x.namaPewaris.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (x.fileName && x.fileName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Download the ORIGINAL uploaded file (from Convex File Storage)
  const handleDownloadOriginal = async (x: (typeof archives)[number]) => {
    if (!x.storageId || !x._id || x._id.startsWith('temp-')) return;
    try {
      setDownloadingId(x._id);
      let url: string | null = x.fileUrl || null;
      if (convexClient && isConvexEnabled) {
        const fresh: any = await convexClient.query(api.skw.getFileUrl, {
          archiveId: x._id as any,
        });
        if (fresh) url = fresh;
      }
      if (!url) {
        alert('Berkas asli tidak dapat ditemukan di penyimpanan.');
        return;
      }
      const a = document.createElement('a');
      a.href = url;
      a.download = x.fileName || `${x.idArsip}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      alert('Gagal mengunduh berkas asli.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-area">
            <h3>
              <FolderArchive size={20} color="#2563eb" />
              Arsip Digital & Dokumen Scan
            </h3>
            <p>Penyimpanan berkas digital resmi, salinan scan, dan pengarsipan elektronik</p>
          </div>

          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <CloudUpload size={16} /> Unggah Berkas Baru
          </button>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nama Dokumen</th>
                <th>ID Arsip</th>
                <th>Pewaris / Pemohon</th>
                <th>Berkas Asli</th>
                <th>Ukuran</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((x) => (
                <tr key={x.idArsip}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: '#eff6ff',
                          color: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FileText size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {x.fileName || `SKW_${x.namaPewaris.replace(/\s+/g, '_')}.pdf`}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          Terdaftar: {new Date(x.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#1e40af' }}>{x.idArsip}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{x.namaPewaris}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{x.nomorSKW}</div>
                  </td>
                  <td>
                    {x.storageId ? (
                      <span className="badge badge-success">
                        <FileCheck2 size={12} /> Tersimpan
                      </span>
                    ) : (
                      <span className="badge badge-neutral">
                        <FileX2 size={12} /> Belum diunggah
                      </span>
                    )}
                  </td>
                  <td style={{ color: '#64748b' }}>{x.fileSize || '—'}</td>
                  <td>
                    <span
                      className={`badge ${
                        x.status === 'Terverifikasi' ? 'badge-success' : 'badge-primary'
                      }`}
                    >
                      <ShieldCheck size={12} /> {x.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      {x.storageId && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDownloadOriginal(x)}
                          title="Unduh berkas asli yang diunggah operator"
                          disabled={downloadingId === x._id}
                        >
                          <Download size={13} />
                          {downloadingId === x._id ? 'Mengunduh...' : 'Unduh Asli'}
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setPreviewDocArchive(x)}
                        title="Buka Pratinjau Dokumen"
                      >
                        <Eye size={13} /> Pratinjau
                      </button>
                      <button
                        className="btn btn-subtle btn-sm"
                        onClick={() => setQrModalArchive(x)}
                        title="Lihat QR Code"
                      >
                        <QrCode size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
