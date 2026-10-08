import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, FileText, QrCode, Eye, Calendar, User, CheckCircle2, AlertCircle } from 'lucide-react';

export const PencarianPage: React.FC = () => {
  const { archives, searchQuery, setSearchQuery, setSelectedArchive, setQrModalArchive, setPreviewDocArchive } =
    useApp();
  const [selectedYear, setSelectedYear] = useState<string>('Semua');

  const filtered = archives.filter((x) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      q === '' ||
      x.namaPewaris.toLowerCase().includes(q) ||
      x.nomorSKW.toLowerCase().includes(q) ||
      x.idArsip.toLowerCase().includes(q) ||
      (x.nikPewaris && x.nikPewaris.toLowerCase().includes(q)) ||
      (x.alamat && x.alamat.toLowerCase().includes(q)) ||
      x.ahliWarisList?.some((a) => a.nama.toLowerCase().includes(q));

    const matchesYear =
      selectedYear === 'Semua' || String(x.tahun) === selectedYear;

    return matchesQuery && matchesYear;
  });

  const formatDate = (d: string) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="page-container">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-area">
            <h3>
              <Search size={20} color="#2563eb" />
              Pencarian & Pelacakan Arsip Surat Waris
            </h3>
            <p>Telusuri arsip berdasarkan nama lengkap almarhum/pewaris, nomor SKW, atau ID arsip</p>
          </div>
        </div>

        {/* Search controls */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div className="search-bar-wrapper" style={{ flex: 1, minWidth: 280 }}>
            <Search size={18} color="#2563eb" />
            <input
              type="text"
              placeholder="Ketik nama pewaris, nomor SKW (contoh: 470/123/SKW/2026), atau ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 0, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}
              >
                ✕ Hapus
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Tahun:</span>
            {['Semua', '2026', '2025', '2024'].map((y) => (
              <button
                key={y}
                className={`btn btn-sm ${selectedYear === y ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Search status header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#475569' }}>
            Ditemukan <b>{filtered.length} arsip</b>
            {searchQuery ? ` untuk pencarian "${searchQuery}"` : ''}
          </div>
        </div>

        {/* Search results cards */}
        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gap: 14 }}>
            {filtered.map((item) => (
              <div
                key={item.idArsip}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '18px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={22} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                        {item.nomorSKW}
                      </span>
                      <span
                        className={`badge ${
                          item.status === 'Terverifikasi' ? 'badge-success' : 'badge-primary'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginTop: 4 }}>
                      Pewaris: {item.namaPewaris}
                    </div>

                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b', marginTop: 6, flexWrap: 'wrap' }}>
                      <span>
                        <b>ID:</b> {item.idArsip}
                      </span>
                      <span>•</span>
                      <span>
                        <b>Tanggal Surat:</b> {formatDate(item.tanggalSurat)}
                      </span>
                      <span>•</span>
                      <span>
                        <b>Ahli Waris:</b> {item.jumlahAhliWaris} orang
                      </span>
                      <span>•</span>
                      <span>
                        <b>Alamat:</b> {item.alamat || 'Kelurahan Sumbertaman'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setSelectedArchive(item)}
                  >
                    <Eye size={14} /> Lihat Detail
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setQrModalArchive(item)}
                  >
                    <QrCode size={14} /> QR Verifikasi
                  </button>
                  <button
                    className="btn btn-subtle btn-sm"
                    onClick={() => setPreviewDocArchive(item)}
                  >
                    <FileText size={14} /> Pratinjau PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              background: '#f8fafc',
              borderRadius: 12,
              border: '1px dashed #cbd5e1',
            }}
          >
            <AlertCircle size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: 16, fontWeight: 700, color: '#334155' }}>
              Arsip Tidak Ditemukan
            </h4>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, maxWidth: 420, margin: '4px auto 0' }}>
              Tidak ditemukan surat waris dengan kata kunci "{searchQuery}". Periksa ejaan nama pewaris
              atau format nomor SKW (contoh: 470/123/SKW/2026).
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
