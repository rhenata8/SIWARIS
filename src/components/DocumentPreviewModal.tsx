import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Download, ZoomIn, ZoomOut, FileText } from 'lucide-react';
import { generateAndDownloadSKWPDF } from '../services/pdfGenerator';
import { OfficialSKWDocument } from './OfficialSKWDocument';

export const DocumentPreviewModal: React.FC = () => {
  const { previewDocArchive, setPreviewDocArchive, letterFormat } = useApp();
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!previewDocArchive) return null;

  const handleDownload = () => {
    generateAndDownloadSKWPDF(previewDocArchive, letterFormat);
  };

  return (
    <div className="modal-overlay" onClick={() => setPreviewDocArchive(null)}>
      <div className="modal-dialog large" onClick={(e) => e.stopPropagation()} style={{ height: '88vh' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={20} color="#2563eb" />
            <div>
              <h3 style={{ fontSize: 16 }}>
                Pratinjau Berkas: {previewDocArchive.fileName || `${previewDocArchive.idArsip}.pdf`}
              </h3>
              <p style={{ fontSize: 11, color: '#64748b' }}>
                {previewDocArchive.idArsip} • {previewDocArchive.fileSize || '1.4 MB'} • Dokumen Resmi SIWARIS
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
              <Download size={14} /> Unduh PDF Asli
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
          {/* Simulated PDF Viewer Paper with real OfficialSKWDocument */}
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
            }}
          >
            <OfficialSKWDocument
              archive={previewDocArchive}
              letterFormat={letterFormat}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setPreviewDocArchive(null)}>
            Tutup
          </button>
          <button className="btn btn-primary" onClick={handleDownload}>
            <Download size={15} /> Unduh PDF Resmi
          </button>
        </div>
      </div>
    </div>
  );
};
