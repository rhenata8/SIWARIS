import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { convexClient, isConvexEnabled } from '../services/convex';
import { api } from '../../convex/_generated/api';
import { ArchiveSKW } from '../types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

interface UploadScanModalProps {
  archive: ArchiveSKW;
  onClose: () => void;
}

/**
 * UploadScanModal — unggah BERKAS SCAN (asli) untuk arsip yang belum memilikinya.
 *
 * Berkas Scan (Asli) = hasil scan dokumen fisik SKW yang diunggah operator.
 * Tersimpan di Convex File Storage dan ditempelkan ke arsip via:
 *   generateUploadUrl() → POST file → finalizeUpload(id, storageId, fileName, fileSize)
 * State lokal diperbarui lewat updateArchive() dari AppContext.
 */
export const UploadScanModal: React.FC<UploadScanModalProps> = ({ archive, onClose }) => {
  const { updateArchive } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2) + ' MB';

  const isRealConvexId = (id?: string) =>
    Boolean(id && !id.startsWith('temp-') && !id.startsWith('arch-'));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setErrorMsg('');

    if (!ALLOWED_EXTENSIONS.some((ext) => selected.name.toLowerCase().endsWith(ext))) {
      setErrorMsg('Format berkas tidak didukung. Gunakan PDF, JPG, atau PNG.');
      e.target.value = '';
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setErrorMsg('Ukuran berkas melebihi 10MB. Mohon kompres dokumen terlebih dahulu.');
      e.target.value = '';
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setErrorMsg('');

    if (!convexClient || !isConvexEnabled) {
      setErrorMsg('Unggahan memerlukan koneksi ke server penyimpanan (Convex). Konfigurasi belum tersedia.');
      return;
    }
    if (!isRealConvexId(archive._id)) {
      setErrorMsg('Arsip ini belum tersinkron ke server, sehingga berkas scan tidak dapat dilampirkan.');
      return;
    }

    setBusy(true);
    try {
      // 1. Minta URL unggahan dari Convex File Storage
      const postUrl: string = await convexClient.mutation(api.skw.generateUploadUrl, {});

      // 2. POST file mentah ke storage
      const uploadRes = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!uploadRes.ok) {
        throw new Error(`Unggahan gagal (HTTP ${uploadRes.status}).`);
      }
      const { storageId } = await uploadRes.json();

      // 3. Tempelkan berkas ke arsip (server-side)
      const sizeMB = formatSize(file.size);
      const fin: any = await convexClient.mutation(api.skw.finalizeUpload, {
        id: archive._id as any,
        storageId,
        fileName: file.name,
        fileSize: sizeMB,
      });

      // 4. Perbarui state lokal via AppContext
      await updateArchive(archive._id as string, {
        storageId,
        fileName: file.name,
        fileSize: sizeMB,
        fileUrl: fin?.fileUrl || undefined,
      });

      setSuccessMsg('Berkas scan (asli) berhasil diunggah dan dilampirkan ke arsip ini.');
      setTimeout(() => onClose(), 1400);
    } catch (err: any) {
      console.error('Gagal mengunggah berkas scan:', err);
      setErrorMsg(`Gagal mengunggah: ${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !busy && onClose()}>
      <div className="modal-dialog small" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Upload size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 15 }}>Unggah Berkas Scan</h3>
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                {archive.idArsip} • {archive.namaPewaris}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={() => !busy && onClose()} disabled={busy}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              background: '#f0f7ff',
              border: '1px solid #bfdbfe',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 12,
              color: '#1e40af',
            }}
          >
            <b>Berkas Scan (Asli)</b> = hasil scan dokumen fisik SKW yang diunggah operator dan
            disimpan di penyimpanan digital. Arsip ini belum memiliki berkas scan.
          </div>

          <div className="form-group">
            <label className="form-label">Pilih Berkas Scan (PDF/JPG/PNG, maks 10MB)</label>
            <div
              style={{
                border: '2px dashed #93c5fd',
                background: '#f0f7ff',
                padding: '16px',
                borderRadius: 10,
                textAlign: 'center',
                cursor: busy ? 'wait' : 'pointer',
                position: 'relative',
              }}
              onClick={() => !busy && inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={busy}
                style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', width: '100%' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <Upload size={24} color="#2563eb" />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>
                  {file ? 'Ganti berkas (klik di sini)' : 'Klik atau seret berkas scan ke sini'}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  Format didukung: PDF, JPG, PNG (Maksimal 10MB)
                </div>
              </div>
            </div>
          </div>

          {file && (
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#f8fafc',
              }}
            >
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
                  flexShrink: 0,
                }}
              >
                <FileText size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', wordBreak: 'break-all' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {formatSize(file.size)} • siap diunggah
                </div>
              </div>
              <button
                type="button"
                className="btn btn-subtle btn-sm"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                disabled={busy}
                title="Hapus pilihan berkas"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#047857',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Tutup
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!file || busy || Boolean(successMsg)}
          >
            {busy ? (
              <>
                <Loader2 size={15} /> Mengunggah...
              </>
            ) : (
              <>
                <Upload size={15} /> Unggah Sekarang
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
