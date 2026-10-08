import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, Printer, Download, TrendingUp, Calendar, CheckCircle } from 'lucide-react';

export const LaporanPage: React.FC = () => {
  const { stats, archives } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    // Generate CSV content with UTF-8 BOM
    const headers = [
      'ID Arsip',
      'Nomor SKW',
      'Nama Pewaris',
      'NIK Pewaris',
      'Tanggal Surat',
      'Tanggal Meninggal',
      'Jumlah Ahli Waris',
      'Status Verifikasi',
      'Alamat',
    ];

    const rows = archives.map((a) => [
      `"${a.idArsip}"`,
      `"${a.nomorSKW}"`,
      `"${a.namaPewaris}"`,
      `'${a.nikPewaris}`,
      `"${a.tanggalSurat}"`,
      `"${a.tanggalMeninggal}"`,
      a.jumlahAhliWaris,
      `"${a.status}"`,
      `"${a.alamat || 'Kelurahan Sumbertaman'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_SIWARIS_Sumbertaman_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute percentages for visual chart
  const maxVal = Math.max(stats.year2024, stats.year2025, stats.year2026, 1);

  return (
    <div className="page-container">
      <div className="panel" id="reportPrintable">
        <div className="panel-header" style={{ flexWrap: 'wrap' }}>
          <div className="panel-title-area">
            <h3>
              <BarChart3 size={20} color="#2563eb" />
              Laporan & Rekapitulasi Penerbitan SKW
            </h3>
            <p>Statistik surat keterangan waris tahunan di Kelurahan Sumbertaman, Kota Probolinggo</p>
          </div>

          <div className="actions" style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              <Download size={15} /> Export ke Excel / CSV
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={15} /> Cetak Laporan
            </button>
          </div>
        </div>

        {/* 3 Years Summary Cards */}
        <div className="stat-cards-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Tahun 2024</span>
              <div className="stat-icon-wrapper blue">
                <Calendar size={20} />
              </div>
            </div>
            <div className="stat-value">{stats.year2024}</div>
            <div className="stat-desc">
              <span>arsip tersimpan & terekap</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Tahun 2025</span>
              <div className="stat-icon-wrapper indigo">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="stat-value">{stats.year2025}</div>
            <div className="stat-desc">
              <span>arsip tercatat resmi</span>
            </div>
          </div>

          <div className="stat-card" style={{ borderColor: '#93c5fd' }}>
            <div className="stat-card-header">
              <span className="stat-card-title">Tahun 2026 (Berjalan)</span>
              <div className="stat-icon-wrapper emerald">
                <CheckCircle size={20} />
              </div>
            </div>
            <div className="stat-value" style={{ color: '#2563eb' }}>
              {stats.year2026}
            </div>
            <div className="stat-desc">
              <span className="stat-trend">Aktif</span>
              <span>terbit hingga periode berjalan</span>
            </div>
          </div>

          <div className="stat-card" style={{ background: '#f8fafc' }}>
            <div className="stat-card-header">
              <span className="stat-card-title">Total Keseluruhan</span>
              <div className="stat-icon-wrapper cyan">
                <BarChart3 size={20} />
              </div>
            </div>
            <div className="stat-value">{stats.totalSKW}</div>
            <div className="stat-desc">
              <span>arsip register buku SKW</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Comparison Chart */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>
            Grafik Perkembangan Penerbitan Surat Keterangan Waris
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 2024 Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>Tahun 2024</span>
                <span style={{ fontWeight: 700, color: '#1e40af' }}>{stats.year2024} SKW</span>
              </div>
              <div style={{ background: '#f1f5f9', height: 16, borderRadius: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(stats.year2024 / maxVal) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #93c5fd, #3b82f6)',
                    borderRadius: 8,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            {/* 2025 Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>Tahun 2025</span>
                <span style={{ fontWeight: 700, color: '#1e40af' }}>{stats.year2025} SKW</span>
              </div>
              <div style={{ background: '#f1f5f9', height: 16, borderRadius: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(stats.year2025 / maxVal) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #60a5fa, #2563eb)',
                    borderRadius: 8,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            {/* 2026 Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>Tahun 2026 (Berjalan)</span>
                <span style={{ fontWeight: 700, color: '#1e40af' }}>{stats.year2026} SKW</span>
              </div>
              <div style={{ background: '#f1f5f9', height: 16, borderRadius: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(stats.year2026 / maxVal) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #38bdf8, #0284c7)',
                    borderRadius: 8,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Table for Official Report Printing */}
        <div>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
            Daftar Rekapitulasi Dokumen Aktif
          </h4>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>ID Arsip</th>
                  <th>Nomor SKW</th>
                  <th>Nama Pewaris</th>
                  <th>Tanggal Terbit</th>
                  <th>Ahli Waris</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {archives.map((a, i) => (
                  <tr key={a.idArsip}>
                    <td style={{ width: 40 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: '#1e40af' }}>{a.idArsip}</td>
                    <td style={{ fontWeight: 600 }}>{a.nomorSKW}</td>
                    <td>{a.namaPewaris}</td>
                    <td>{a.tanggalSurat}</td>
                    <td>{a.jumlahAhliWaris} Orang</td>
                    <td>
                      <span className="badge badge-success">{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 24, padding: '16px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
          Dicetak dari SIWARIS (Sistem Informasi Arsip Surat Keterangan Waris) • Kelurahan Sumbertaman, Kecamatan Wonoasih, Kota Probolinggo
        </div>
      </div>
    </div>
  );
};
