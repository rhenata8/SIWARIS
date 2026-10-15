import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Download, ZoomIn, ZoomOut, FileText, FileWarning } from 'lucide-react';
import { generateAndDownloadSKWPDF } from '../services/pdfGenerator';
import { OfficialSKWDocument } from './OfficialSKWDocument';
import { convexClient, isConvexEnabled } from '../services/convex';
import { api } from '../../convex/_generated/api';

/**
 * Document Preview — SIWARIS v2.0
 *
 * Dua jenis dokumen yang jelas bedanya:
 * 1. BERKAS ASLI  → file yang diunggah operator saat menambah SKW
 *                   (disimpan di Convex File Storage). Tombol: "Unduh Berkas Asli".
 * 2. DOKUMEN RESMI → dokumen SIWARIS yang di-generate (kop surat, TTE, QR).
 *                   Tombol: "Unduh PDF Resmi SIWARIS".
 */
export const DocumentPreviewModal: React.FC = () => {
  const { previewDocArchive, setPreviewDocArchive, letterFormat } = useApp();
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [origUrl, setOrigUrl] = useState<string | null>(null);
  const [origLoading, setOrigLoading] = useState(false);

  const archive = previewDocArchive;
  const hasOriginal = Boolean(archive && (archive.storageId || archive.fileUrl));

  // Resolve a fresh storage URL for the original file each time the modal opens
  useEffect(() => {
    let cancelled = false;
    setOrigUrl(null);
    if (archive && archive.storageId && archive._id && !archive._id.startsWith('temp-') && convexClient && isConvexEnabled) {
      setOrigLoading(true);
      convexClient
        .query(api.skw.getFileUrl, { archiveId: archive._id as any })
        .then((url: any) => {
          if (!cancelled) setOrigUrl(url || archive.fileUrl || null);
        })
        .catch(() => {
          if (!cancelled) setOrigUrl(archive.fileUrl || null);
        })
        .finally(() => {
          if (!cancelled) setOrigLoading(false);
        });
    } else if (archive?.fileUrl) {
      setOrigUrl(archive.fileUrl);
    }
    return () => {
      cancelled = true;
    };
  }, [previewDocArchive]);

  if (!archive) return null;

  const handleDownloadGenerated = () => {
    generateAndDownloadSKWPDF(archive, letterFormat);
  };

  const handleDownloadOriginal = () => {
    if (!origUrl) return;
    const a = document.createElement('a');
    a.href = origUrl;
    a.download = archive.fileName || `${archive.idArsip}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(archive.fileName || '');
  const isPdf = !isImage && (archive.fileName || '').toLowerCase().endsWith('.pdf');

  const renderPreview = () => {
    if (hasOriginal && origLoading) {
      return (
        <div style={{ color: '#cbd5e1', fontSize: 13, padding: '60px 0', textAlign: 'center' }}>
          Memuat berkas asli...
        </div>
      );
    }
    if (hasOriginal && origUrl && isPdf) {
      return (
        <iframe
          src={origUrl}
          title={archive.fileName}
          style={{
            width: '100%',
            height: '80vh',
            border: 0,
            borderRadius: 8,
            background: '#fff',
          }}
        />
      );
    }
    if (hasOriginal && origUrl && isImage) {
      return (
        <img
          src={origUrl}
          alt={archive.fileName}
          style={{ width: '100%', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
        />
      );
    }
    if (hasOriginal && !origUrl) {
      return (
        <div style={{ color: '#fca5a5', fontSize: 13, padding: '60px 20px', textAlign: 'center' }}>
          <FileWarning size={28} style={{ marginBottom: 8 }} />
          <div>Berkas asli terdaftar tetapi URL-nya tidak dapat diselesaikan.</div>
          <div style={{ marginTop: 8, color: '#cbd5e1' }}>
            Menampilkan dokumen resmi yang di-generate SIWARIS sebagai gantinya.
          </div>
        </div>
      );
    }
    // No original uploaded — show the generated official document
    return (
      <>
        <div
          style={{
            background: '#fef9c3',
            border: '1px solid #fde047',
            color: '#854d0e',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            marginBottom: 14,
          }}
        >
          Berkas asli belum diunggah untuk arsip ini. Yang ditampilkan adalah dokumen resmi
          yang di-generate SIWARIS — unduh versi resmi dengan tombol <b>Unduh PDF Resmi SIWARIS</b>.
        </div>
        <div
          style={{
            width: '100%',
            maxWidth: 720,
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease',
          }}
        >
          <OfficialSKWDocument archive={archive} letterFormat={letterFormat} />
        </div>
      </>
    );
  };

  return (
    <div className="modal-overlay" onClick={() => setPreviewDocArchive(null)}>
      <div className="modal-dialog large" onClick={(e) => e.stopPropagation()} style={{ height: '88vh' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={20} color="#2563eb" />
            <div>
              <h3 style={{ fontSize: 16 }}>
                Pratinjau Berkas: {archive.fileName || `${archive.idArsip} (dokumen SIWARIS)`}
              </h3>
              <p style={{ fontSize: 11, color: '#64748b' }}>
                {archive.idArsip} • {archive.fileSize || '—'} •{' '}
                {hasOriginal ? 'Berkas Asli (Unggahan Operator)' : 'Dokumen Resmi Generated SIWARIS'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!hasOriginal && (
              <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 6, padding: '2px 6px', gap: 4 }}>
                <button
                  className="btn btn-sm"
                  style={{ padding: '4px 6px', background: 'none', border: 0 }}
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                  title="Perkecil"
                >
                  <ZoomOut size={15} />
                </button>
                <span style={{ fontSize: 11, fontWeight: 600, minWidth: 40, textAlign: 'center' }}>
                  {zoomLevel}%
                </span>
                <button
                  className="btn btn-sm"
                  style={{ padding: '4px 6px', background: 'none', border: 0 }}
                  onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                  title="Perbesar"
                >
                  <ZoomIn size={15} />
                </button>
              </div>
            )}

            {hasOriginal && (
              <button className="btn btn-primary btn-sm" onClick={handleDownloadOriginal} disabled={!origUrl}>
                <Download size={14} /> Unduh Berkas Asli
              </button>
            )}
            <button className="modal-close-btn" onClick={() => setPreviewDocArchive(null)}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div
          className="modal-body"
          style={{
            background: '#334155',
            padding: 24,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            overflow: 'auto',
          }}
        >
          {renderPreview()}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setPreviewDocArchive(null)}>
            Tutup
          </button>
          <button className="btn btn-primary" onClick={handleDownloadGenerated}>
            <Download size={15} /> Unduh PDF Resmi SIWARIS (Generated)
          </button>
        </div>
      </div>
    </div>
  );
};
