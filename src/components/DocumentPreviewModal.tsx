import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Download, ZoomIn, ZoomOut, FileText, FileWarning } from 'lucide-react';
import { generateAndDownloadSKWPDF } from '../services/pdfGenerator';
import { OfficialSKWDocument } from './OfficialSKWDocument';
import { convexClient, isConvexEnabled } from '../services/convex';
import { api } from '../../convex/_generated/api';

/**
 * Document Preview — SIWARIS v2.1
 *
 * Dua jenis berkas yang dibedakan dengan jelas:
 * 1. BERKAS SCAN (ASLI)  → hasil scan dokumen fisik yang diunggah operator
 *                          saat menambah SKW (disimpan di Convex File Storage).
 *                          Tombol: "Unduh Berkas Scan".
 * 2. BERKAS RESMI SIWARIS → dokumen yang DI-GENERATE aplikasi (kop surat, TTE, QR).
 *                          Tombol: "Unduh PDF Resmi SIWARIS".
 *
 * Mode pratinjau:
 * - 'scan'  → paksa tampilkan berkas scan (asli) unggahan operator.
 * - 'resmi' → paksa tampilkan Berkas Resmi SIWARIS (digenerate).
 * - 'auto'  → perilaku lama: tampilkan scan bila ada, jika tidak tampilkan resmi.
 */
export type DocumentPreviewMode = 'scan' | 'resmi' | 'auto';

/**
 * Channel mode pratinjau antar-komponen.
 * App.tsx memasang <DocumentPreviewModal /> tanpa prop, jadi pemanggil
 * (mis. DetailSKWModal) mengarahkan mode lewat helper ini SEBELUM
 * memanggil setPreviewDocArchive(). Nilai dikonsumsi sekali lalu reset ke 'auto'.
 */
let nextPreviewMode: DocumentPreviewMode = 'auto';
export function setNextPreviewMode(mode: DocumentPreviewMode) {
  nextPreviewMode = mode;
}

export const DocumentPreviewModal: React.FC<{ mode?: DocumentPreviewMode }> = ({ mode = 'auto' }) => {
  const { previewDocArchive, setPreviewDocArchive, letterFormat } = useApp();
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [origUrl, setOrigUrl] = useState<string | null>(null);
  const [origLoading, setOrigLoading] = useState(false);
  const [origSettled, setOrigSettled] = useState(false);
  const [requestedMode, setRequestedMode] = useState<DocumentPreviewMode>('auto');

  const archive = previewDocArchive;
  const hasOriginal = Boolean(archive && (archive.storageId || archive.fileUrl));

  // Mode efektif: prop eksplisit menang; jika 'auto', pakai mode dari channel.
  const effectiveMode: DocumentPreviewMode = mode !== 'auto' ? mode : requestedMode;
  const showScan = Boolean(hasOriginal && effectiveMode !== 'resmi');

  // Konsumsi mode dari channel SEBELUM paint (useLayoutEffect) supaya
  // render pertama modal sudah memakai mode yang benar (scan/resmi).
  useLayoutEffect(() => {
    if (previewDocArchive) {
      const pending = nextPreviewMode;
      nextPreviewMode = 'auto'; // consume once
      setRequestedMode(pending);
    } else {
      setRequestedMode('auto');
    }
  }, [previewDocArchive]);

  // Resolve a fresh storage URL for the original file each time the modal opens.
  useEffect(() => {
    let cancelled = false;
    setOrigUrl(null);
    setOrigSettled(false);
    setZoomLevel(100);
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
          if (!cancelled) {
            setOrigLoading(false);
            setOrigSettled(true);
          }
        });
    } else if (archive?.fileUrl) {
      setOrigUrl(archive.fileUrl);
      setOrigSettled(true);
    } else {
      setOrigSettled(true);
    }
    return () => {
      cancelled = true;
    };
  }, [previewDocArchive]);

  if (!archive) return null;

  const handleDownloadGenerated = () => {
    generateAndDownloadSKWPDF(archive, letterFormat);
  };

  const handleDownloadScan = () => {
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
    if (showScan && (origLoading || !origSettled)) {
      return (
        <div style={{ color: '#cbd5e1', fontSize: 13, padding: '60px 0', textAlign: 'center' }}>
          Memuat berkas scan...
        </div>
      );
    }
    if (showScan && origUrl && isPdf) {
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
    if (showScan && origUrl && isImage) {
      return (
        <img
          src={origUrl}
          alt={archive.fileName}
          style={{ width: '100%', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
        />
      );
    }
    if (showScan && !origUrl) {
      // Berkas scan terdaftar tetapi URL-nya tidak dapat diselesaikan → fallback resmi
      return (
        <>
          <div style={{ color: '#fca5a5', fontSize: 13, padding: '0 0 18px', textAlign: 'center' }}>
            <FileWarning size={28} style={{ marginBottom: 8 }} />
            <div>Berkas scan terdaftar tetapi URL-nya tidak dapat diselesaikan.</div>
            <div style={{ marginTop: 8, color: '#cbd5e1' }}>
              Menampilkan Berkas Resmi SIWARIS sebagai gantinya.
            </div>
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
    }
    // Tidak menampilkan scan: mode 'resmi' atau scan belum diunggah →
    // tampilkan Berkas Resmi SIWARIS yang di-generate.
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
          {hasOriginal ? (
            <>
              Menampilkan <b>Berkas Resmi SIWARIS</b> — dokumen digenerate (kop surat, TTE, QR) dari
              data arsip ini. Berkas scan unggahan operator tidak ditampilkan pada mode ini.
              Unduh versi resmi dengan tombol <b>Unduh PDF Resmi SIWARIS</b>.
            </>
          ) : (
            <>
              Berkas scan belum diunggah untuk arsip ini. Yang ditampilkan adalah{' '}
              <b>Berkas Resmi SIWARIS</b> yang digenerate — unduh versi resmi dengan tombol{' '}
              <b>Unduh PDF Resmi SIWARIS</b>.
            </>
          )}
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
                {showScan
                  ? 'Berkas Scan — unggahan operator'
                  : 'Berkas Resmi SIWARIS — dokumen digenerate'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!showScan && (
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
              <button className="btn btn-primary btn-sm" onClick={handleDownloadScan} disabled={!origUrl}>
                <Download size={14} /> Unduh Berkas Scan
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
            <Download size={15} /> Unduh PDF Resmi SIWARIS
          </button>
        </div>
      </div>
    </div>
  );
};
