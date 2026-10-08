import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArchiveSKW } from '../types';
import {
  FileText,
  Plus,
  Search,
  Eye,
  QrCode,
  Trash2,
  Edit3,
  Settings,
} from 'lucide-react';

export const SuratWarisPage: React.FC = () => {
  const {
    archives,
    setIsAddModalOpen,
    setSelectedArchive,
    setQrModalArchive,
    setEditingArchive,
    setDeletingArchive,
    setIsFormatModalOpen,
  } = useApp();
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');

  const filteredArchives = archives.filter((a) => {
    const matchesSearch =
      a.namaPewaris.toLowerCase().includes(filterQuery.toLowerCase()) ||
      a.nomorSKW.toLowerCase().includes(filterQuery.toLowerCase()) ||
      a.idArsip.toLowerCase().includes(filterQuery.toLowerCase()) ||
      a.nikPewaris.toLowerCase().includes(filterQuery.toLowerCase());

    const matchesStatus = statusFilter === 'Semua' || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (d: string) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const handleDelete = (a: ArchiveSKW) => {
    setDeletingArchive(a);
  };

  return (
    <div className="page-container">
      <div className="panel">
        <div className="panel-header" style={{ flexWrap: 'wrap' }}>
          <div className="panel-title-area">
            <h3>
              <FileText size={20} color="#2563eb" />
              Data Surat Keterangan Waris (SKW)
            </h3>
            <p>Kelola data registrasi surat waris, status pengesahan, dan dokumen pendukung</p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary"
              onClick={() => setIsFormatModalOpen(true)}
            >
              <Settings size={16} /> Kop Surat & TTD
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={16} /> Tambah SKW Baru
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 20,
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="search-bar-wrapper" style={{ width: 320 }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Cari nama, no SKW, atau ID..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Status:</span>
            {['Semua', 'Terverifikasi', 'Tersimpan', 'Diproses'].map((st) => (
              <button
                key={st}
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID Arsip</th>
                <th>Nomor SKW</th>
                <th>Nama Pewaris</th>
                <th>Tanggal Terbit</th>
                <th>Ahli Waris</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredArchives.length > 0 ? (
                filteredArchives.map((x) => (
                  <tr key={x.idArsip}>
                    <td style={{ fontWeight: 600, color: '#1e40af' }}>{x.idArsip}</td>
                    <td style={{ fontWeight: 600 }}>{x.nomorSKW}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{x.namaPewaris}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>NIK: {x.nikPewaris}</div>
                    </td>
                    <td>{formatDate(x.tanggalSurat)}</td>
                    <td>
                      <span className="badge badge-neutral">{x.jumlahAhliWaris} Orang</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          x.status === 'Terverifikasi'
                            ? 'badge-success'
                            : x.status === 'Tersimpan'
                            ? 'badge-primary'
                            : 'badge-warning'
                        }`}
                      >
                        {x.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedArchive(x)}
                          title="Lihat Detail & Cetak"
                        >
                          <Eye size={13} /> Lihat
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditingArchive(x)}
                          title="Ubah Data SKW"
                        >
                          <Edit3 size={13} /> Ubah
                        </button>
                        <button
                          className="btn btn-subtle btn-sm"
                          onClick={() => setQrModalArchive(x)}
                          title="QR Verifikasi"
                        >
                          <QrCode size={13} /> QR
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(x)}
                          title="Hapus data"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
                    Tidak ada arsip yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Menampilkan <b>{filteredArchives.length}</b> dari total <b>{archives.length}</b> arsip surat waris
          </div>
        </div>
      </div>
    </div>
  );
};
