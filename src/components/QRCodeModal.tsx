import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import QRCode from 'qrcode';
import { X, Download, Check, ShieldCheck, Copy, ExternalLink } from 'lucide-react';

export const QRCodeModal: React.FC = () => {
  const { qrModalArchive, setQrModalArchive, setPublicVerifyId } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState<string>('');

  useEffect(() => {
    if (!qrModalArchive) return;

    // Use current web origin so scanning from mobile opens the real website!
    // URL format matches the production verification endpoint
    const baseUrl = window.location.origin;
    const encodedNo = encodeURIComponent(qrModalArchive.nomorSKW);
    const url = `${baseUrl}/validasi?id=${qrModalArchive.idArsip}&no=${encodedNo}`;
    setVerifyUrl(url);

    QRCode.toDataURL(
      url,
      {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, dataUri) => {
        if (!err && dataUri) {
          setQrDataUrl(dataUri);
        }
      }
    );
  }, [qrModalArchive]);

  if (!qrModalArchive) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_Verifikasi_${qrModalArchive.idArsip}.png`;
    a.click();
  };

  const handleTestVerify = () => {
    setPublicVerifyId(qrModalArchive.idArsip);
    setQrModalArchive(null);
  };

  const handleOpenLink = () => {
    window.open(verifyUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="modal-overlay" onClick={() => setQrModalArchive(null)}>
      <div className="modal-dialog small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <ShieldCheck size={20} color="#059669" />
            QR Verifikasi Keaslian
          </h3>
          <button className="modal-close-btn" onClick={() => setQrModalArchive(null)}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center' }}>
          <div
            style={{
              background: '#f8fafc',
              border: '2px solid #e2e8f0',
              borderRadius: 16,
              padding: 16,
              display: 'inline-block',
              margin: '0 auto 14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code Verifikasi"
                style={{ width: 210, height: 210, display: 'block', margin: '0 auto' }}
              />
            ) : (
              <div style={{ width: 210, height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Membuat QR Code...
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              {qrModalArchive.nomorSKW}
            </div>
            <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
              Pewaris: <b>{qrModalArchive.namaPewaris}</b>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              ID Arsip: {qrModalArchive.idArsip}
            </div>
          </div>

          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 11.5,
              color: '#065f46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginBottom: 12,
            }}
          >
            <ShieldCheck size={15} />
            <span>Tanda Tangan Digital & Arsip Sah Kelurahan Sumbertaman</span>
          </div>

          <button
            type="button"
            className="btn btn-subtle btn-sm"
            onClick={handleOpenLink}
            style={{ width: '100%', fontSize: 12 }}
          >
            <ExternalLink size={13} /> Buka Tautan Verifikasi
          </button>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
            {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
            {copied ? 'Tersalin' : 'Salin Tautan'}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setQrModalArchive(null)}>
              Tutup
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleDownload}>
              <Download size={14} /> Unduh QR PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
