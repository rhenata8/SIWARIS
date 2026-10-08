import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Info, Eye, EyeOff, Search, ChevronRight } from 'lucide-react';

export const PewarisAhliWarisPage: React.FC = () => {
  const { archives, setSelectedArchive } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMaskedNIK, setShowMaskedNIK] = useState(false);

  const formatDate = (d: string) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const maskNIK = (nik?: string) => {
    if (!nik) return '-';
    if (showMaskedNIK) return nik;
    if (nik.length <= 8) return nik;
    return nik.slice(0, 6) + '******' + nik.slice(-4);
  };

  const filtered = archives.filter(
    (x) =>
      x.namaPewaris.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (x.nikPewaris && x.nikPewaris.includes(searchTerm)) ||
      x.idArsip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      x.ahliWarisList?.some((a) => a.nama.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-container">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-area">
            <h3>
              <Users size={20} color="#2563eb" />
              Data Pewaris & Hubungan Ahli Waris
            </h3>
            <p>Daftar identitas pewaris dan relasi silsilah ahli waris yang sah</p>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowMaskedNIK(!showMaskedNIK)}
          >
            {showMaskedNIK ? <EyeOff size={14} /> : <Eye size={14} />}
            {showMaskedNIK ? 'Sembunyikan NIK' : 'Tampilkan NIK Lengkap'}
          </button>
        </div>

        {/* Stakeholder Notice */}
        <div className="notice-box info">
          <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <b>Informasi Keamanan & Data Kependudukan:</b>
            <div style={{ marginTop: 2, fontSize: 12.5 }}>
              Data pada sistem ini terikat dengan kerahasiaan kependudukan Kelurahan Sumbertaman.
              Pastikan verifikasi fisik buku register tetap dilakukan saat pelayanan tatap muka.
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: 16, maxWidth: 360 }}>
          <div className="search-bar-wrapper">
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Cari nama pewaris atau ahli waris..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nama Pewaris</th>
                <th>Tanggal Meninggal</th>
                <th>Jumlah Ahli Waris</th>
                <th>Daftar Nama Ahli Waris</th>
                <th>ID Arsip</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((x) => (
                  <tr key={x.idArsip}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{x.namaPewaris}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        NIK: {maskNIK(x.nikPewaris)}
                      </div>
                    </td>
                    <td style={{ color: '#dc2626', fontWeight: 500 }}>
                      {formatDate(x.tanggalMeninggal)}
                    </td>
                    <td>
                      <span className="badge badge-primary">{x.jumlahAhliWaris} Orang</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 340 }}>
                        {x.ahliWarisList && x.ahliWarisList.length > 0 ? (
                          x.ahliWarisList.map((a, i) => (
                            <span
                              key={i}
                              style={{
                                background: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                borderRadius: 4,
                                padding: '2px 6px',
                                fontSize: 11,
                                color: '#334155',
                              }}
                            >
                              <b>{a.nama}</b> <span style={{ color: '#2563eb' }}>({a.hubungan})</span>
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>{x.jumlahAhliWaris} ahli waris</span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#1e40af' }}>{x.idArsip}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedArchive(x)}
                        title="Buka Rincian Lengkap"
                      >
                        Detail <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                    Data pewaris tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
