import React from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export const DeleteConfirmModal: React.FC = () => {
  const { deletingArchive, setDeletingArchive, deleteArchive } = useApp();

  if (!deletingArchive) return null;

  const handleConfirm = async () => {
    await deleteArchive(deletingArchive.idArsip);
    setDeletingArchive(null);
  };

  return (
    <div className="modal-overlay" onClick={() => setDeletingArchive(null)}>
      <div className="modal-dialog small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ background: '#fef2f2', borderBottomColor: '#fecaca' }}>
          <h3 style={{ color: '#dc2626' }}>
            <AlertTriangle size={20} color="#dc2626" />
            Konfirmasi Hapus Arsip
          </h3>
          <button className="modal-close-btn" onClick={() => setDeletingArchive(null)}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center', padding: '28px 24px' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Trash2 size={26} />
          </div>

          <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
            Hapus Surat Keterangan Waris?
          </h4>

          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 16 }}>
            Anda akan menghapus arsip:
            <br />
            <b style={{ color: '#0f172a' }}>{deletingArchive.nomorSKW}</b>
            <br />
            Pewaris: <b style={{ color: '#2563eb' }}>{deletingArchive.namaPewaris}</b> ({deletingArchive.idArsip})
          </p>

          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              color: '#b91c1c',
            }}
          >
            Tindakan ini permanen dan akan menghapus data dari sistem SIWARIS.
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setDeletingArchive(null)}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirm}
            style={{ background: '#dc2626', color: '#fff' }}
          >
            <Trash2 size={15} /> Ya, Hapus Arsip
          </button>
        </div>
      </div>
    </div>
  );
};
