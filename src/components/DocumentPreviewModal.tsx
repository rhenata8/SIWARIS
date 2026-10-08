import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Download, Printer, ZoomIn, ZoomOut, FileText, CheckCircle, Shield } from 'lucide-react';

export const DocumentPreviewModal: React.FC = () => {
  const { previewDocArchive, setPreviewDocArchive } = useApp();
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!previewDocArchive) return null;

  const handleDownload = () => {
    // Simulate downloading PDF file
    const element = document.createElement('a');
    const file = new Blob(
      [
        `DOKUMEN SURAT KETERANGAN WARIS\nNomor: ${previewDocArchive.nomorSKW}\nID: ${previewDocArchive.idArsip}\nPewaris: ${previewDocArchive.namaPewaris}\nKelurahan Sumbertaman, Kota Probolinggo\nStatus: Terverifikasi di SIWARIS`,
      ],
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = previewDocArchive.fileName || `${previewDocArchive.idArsip}.pdf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="modal-overlay" onClick={() => setPreviewDocArchive(null)}>
      <div className="modal-dialog large" onClick={(e) => e.stopPropagation()} style={{ height: '88vh' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={20} color="#2563eb" />
            <div>
              <h3 style={{ fontSize: 16 }}>
                Pratinjau Berkas: {previewDocArchive.fileName || 'SKW_Digital.pdf'}
              </h3>
              <p style={{ fontSize: 11, color: '#64748b' }}>
                {previewDocArchive.idArsip} • {previewDocArchive.fileSize || '1.4 MB'} • Format Dokumen Digital
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

            <button className="btn btn-primary btn-sm" onClick={handleDownload}>
              <Download size={14} /> Unduh
            </button>
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
          {/* Simulated PDF Viewer Paper */}
          <div
            style={{
              width: '100%',
              maxWidth: 620,
              background: '#ffffff',
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
              borderRadius: 4,
              padding: '40px 36px',
              fontFamily: 'serif',
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
              position: 'relative',
              color: '#111827',
            }}
          >
            {/* Watermark */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-35deg)',
                fontSize: 34,
                fontWeight: 900,
                color: 'rgba(37, 99, 235, 0.07)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                fontFamily: 'sans-serif',
                border: '4px dashed rgba(37, 99, 235, 0.1)',
                padding: '16px 28px',
              }}
            >
              ARSIP RESMI KELURAHAN SUMBERTAMAN
            </div>

            {/* Official Header */}
            <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: 10, marginBottom: 18 }}>
              <div style={{ fontSize: 13, textTransform: 'uppercase' }}>Pemerintah Kota Probolinggo</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' }}>Kecamatan Wonoasih</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' }}>Kelurahan Sumbertaman</div>
              <div style={{ fontSize: 10, fontFamily: 'sans-serif', color: '#4b5563', marginTop: 2 }}>
                Jl. Mastrip No. 12 Probolinggo 67237 • SIWARIS Arsip Digital Terverifikasi
              </div>
            </div>

            <div style={{ textAlign: 'center', margin: '14px 0' }}>
              <div style={{ fontSize: 15, fontWeight: 'bold', textDecoration: 'underline' }}>
                SURAT KETERANGAN WARIS
              </div>
              <div style={{ fontSize: 11, fontFamily: 'sans-serif', marginTop: 2 }}>
                Nomor: {previewDocArchive.nomorSKW}
              </div>
            </div>

            <div style={{ fontSize: 12, lineHeight: 1.6, textAlign: 'justify', marginBottom: 14 }}>
              Menerangkan bahwa seorang penduduk bernama <b>{previewDocArchive.namaPewaris}</b>, NIK:{' '}
              {previewDocArchive.nikPewaris}, bertempat tinggal di {previewDocArchive.alamat || 'Kelurahan Sumbertaman'},
              telah berpulang ke rahmatullah pada tanggal{' '}
              {new Date(previewDocArchive.tanggalMeninggal).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}.
            </div>

            <div style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>
              Almarhum/Almarhumah meninggalkan ahli waris yang sah berjumlah{' '}
              <b>{previewDocArchive.jumlahAhliWaris} orang</b> sebagai berikut:
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 18 }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
                  <th style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'center', width: 30 }}>No</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'left' }}>Nama Ahli Waris</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'left' }}>Hubungan</th>
                  <th style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'left' }}>NIK</th>
                </tr>
              </thead>
              <tbody>
                {previewDocArchive.ahliWarisList && previewDocArchive.ahliWarisList.map((a, i) => (
                  <tr key={i}>
                    <td style={{ padding: '4px 6px', border: '1px solid #000', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #000' }}><b>{a.nama}</b></td>
                    <td style={{ padding: '4px 6px', border: '1px solid #000' }}>{a.hubungan}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #000' }}>{a.nik || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ fontSize: 10, fontFamily: 'sans-serif', color: '#6b7280' }}>
                <div>ID Arsip: {previewDocArchive.idArsip}</div>
                <div>Status: Disahkan Resmi Kelurahan Sumbertaman</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669', marginTop: 4, fontWeight: 'bold' }}>
                  <CheckCircle size={12} /> Terverifikasi Sistem SIWARIS
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: 11, width: 200 }}>
                <div>Sumbertaman, {previewDocArchive.tanggalSurat}</div>
                <div>Lurah Sumbertaman</div>
                <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, color: '#2563eb', border: '1px solid #2563eb', padding: '2px 6px', borderRadius: 4 }}>
                    ✓ TTE Verified
                  </span>
                </div>
                <div><b><u>Drs. H. M. Syaifullah, M.Si</u></b></div>
                <div style={{ fontSize: 9 }}>NIP. 19740615 199803 1 004</div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setPreviewDocArchive(null)}>
            Tutup
          </button>
          <button className="btn btn-primary" onClick={handleDownload}>
            <Download size={15} /> Unduh Berkas
          </button>
        </div>
      </div>
    </div>
  );
};
