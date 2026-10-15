import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  filterArchivesForLaporan,
  buildLaporanSummary,
  buildAnalisisParagraf,
  generateLaporanPDF,
} from '../services/laporanGenerator';
import { ArchiveSKW } from '../types';
import {
  BarChart3,
  Download,
  RotateCcw,
  FileSpreadsheet,
  Printer,
  FileText,
  ShieldCheck,
  Clock,
  TrendingUp,
  Users,
  UserCheck,
  Info,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

const STATUS_OPTIONS: Array<ArchiveSKW['status'] | 'semua'> = [
  'semua',
  'Tersimpan',
  'Terverifikasi',
  'Diproses',
];

const tahunDari = (a: ArchiveSKW): number => {
  if (a.tahun && !isNaN(a.tahun)) return a.tahun;
  if (a.tanggalSurat && /^\d{4}-\d{2}-\d{2}$/.test(a.tanggalSurat)) {
    const y = new Date(a.tanggalSurat + 'T00:00:00').getFullYear();
    if (!isNaN(y)) return y;
  }
  return 0;
};

export const LaporanPage: React.FC = () => {
  const { archives, letterFormat, isConvexConfigured } = useApp();
  const { user } = useAuth();

  const [tahunFilter, setTahunFilter] = useState<string>('semua');
  const [statusFilter, setStatusFilter] = useState<string>('semua');
  const [periodeMulai, setPeriodeMulai] = useState<string>('');
  const [periodeSelesai, setPeriodeSelesai] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const options = useMemo(
    () => ({
      tahun: tahunFilter,
      status: statusFilter as ArchiveSKW['status'] | 'semua',
      periodeMulai: periodeMulai || undefined,
      periodeSelesai: periodeSelesai || undefined,
    }),
    [tahunFilter, statusFilter, periodeMulai, periodeSelesai]
  );

  // Data terfilter live dari context (mode offline tetap jalan — archives dummy)
  const filtered = useMemo(() => filterArchivesForLaporan(archives, options), [archives, options]);
  const summary = useMemo(() => buildLaporanSummary(filtered, options), [filtered, options]);
  const analisis = useMemo(() => buildAnalisisParagraf(summary), [summary]);

  const tahunTersedia = useMemo(() => {
    const set = new Set<number>();
    archives.forEach((a) => {
      const t = tahunDari(a);
      if (t) set.add(t);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [archives]);

  const resetFilter = () => {
    setTahunFilter('semua');
    setStatusFilter('semua');
    setPeriodeMulai('');
    setPeriodeSelesai('');
  };

  const handleUnduhPDF = () => {
    if (filtered.length === 0) return;
    setIsGenerating(true);
    try {
      generateLaporanPDF(archives, letterFormat, options, getCetakUser(), 'unduh');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCetak = () => {
    if (filtered.length === 0) return;
    setIsGenerating(true);
    try {
      generateLaporanPDF(archives, letterFormat, options, getCetakUser(), 'cetak');
    } finally {
      setIsGenerating(false);
    }
  };

  const getCetakUser = () =>
    user ? { nama: user.nama, role: user.role } : undefined;

  const handleExportCSV = () => {
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
    const rows = filtered.map((a) => [
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

  const formatDate = (d: string) => {
    try {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d || '-';
      return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const pctText = (n: number, total: number) =>
    total > 0 ? `${((n / total) * 100).toFixed(1).replace('.', ',')}%` : '0%';

  const previewRows = filtered.slice(0, 10);
  const statusBadge = (s: string) =>
    s === 'Terverifikasi' ? 'badge-success' : s === 'Tersimpan' ? 'badge-primary' : 'badge-warning';

  return (
    <div className="page-container">
      {/* Header + Aksi */}
      <div className="panel">
        <div className="panel-header" style={{ flexWrap: 'wrap' }}>
          <div className="panel-title-area">
            <h3>
              <BarChart3 size={20} color="#2563eb" />
              Laporan & Rekapitulasi Arsip SKW
            </h3>
            <p>
              Unduh laporan PDF profesional yang dapat dibaca dan dianalisis — lengkap dengan kop
              resmi, ringkasan eksekutif, rekap bulanan, daftar arsip, dan analisis otomatis.
            </p>
          </div>
          <div className="actions" style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary"
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              title="Ekspor data terfilter ke CSV/Excel"
            >
              <FileSpreadsheet size={15} /> Export CSV
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleCetak}
              disabled={filtered.length === 0 || isGenerating}
              title="Cetak laporan PDF langsung ke printer"
            >
              <Printer size={15} /> {isGenerating ? 'Menyiapkan...' : 'Cetak'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUnduhPDF}
              disabled={filtered.length === 0 || isGenerating}
              title="Unduh laporan PDF lengkap sesuai filter aktif"
            >
              <Download size={15} /> {isGenerating ? 'Menyiapkan PDF...' : 'Unduh Laporan PDF'}
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="form-grid-2" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Tahun Penerbitan</label>
            <select
              className="form-select"
              value={tahunFilter}
              onChange={(e) => setTahunFilter(e.target.value)}
            >
              <option value="semua">Semua Tahun</option>
              {tahunTersedia.map((t) => (
                <option key={t} value={String(t)}>
                  Tahun {t}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status Verifikasi</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === 'semua' ? 'Semua Status' : s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Periode Mulai (Tanggal Terbit)</label>
            <input
              type="date"
              className="form-input"
              value={periodeMulai}
              onChange={(e) => setPeriodeMulai(e.target.value)}
            />
            <span className="form-hint">Kosongkan untuk tidak membatasi tanggal awal</span>
          </div>
          <div className="form-group">
            <label className="form-label">Periode Selesai (Tanggal Terbit)</label>
            <input
              type="date"
              className="form-input"
              value={periodeSelesai}
              onChange={(e) => setPeriodeSelesai(e.target.value)}
            />
            <span className="form-hint">Kosongkan untuk tidak membatasi tanggal akhir</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 12.5, color: '#64748b' }}>
            Menampilkan <b style={{ color: '#1e40af' }}>{filtered.length}</b> dari{' '}
            <b>{archives.length}</b> arsip • {summary.periodeLabel}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={resetFilter}>
            <RotateCcw size={13} /> Reset Filter
          </button>
        </div>

        {!isConvexConfigured && (
          <div className="notice-box info" style={{ marginBottom: 0, marginTop: 16 }}>
            <Info size={16} />
            <div>
              Mode offline aktif — laporan disusun dari data lokal (data contoh tersimpan di
              perangkat). Seluruh statistik, tabel, dan PDF tetap berfungsi penuh.
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="panel">
          <div className="notice-box" style={{ marginBottom: 0 }}>
            <AlertTriangle size={16} />
            <div>
              <b>Belum ada arsip pada filter ini.</b> Ubah kombinasi tahun, status, atau rentang
              periode di atas, atau tekan <b>Reset Filter</b> untuk menampilkan seluruh data.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Kartu Statistik (live dari data terfilter) */}
          <div className="stat-cards-grid">
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Total Arsip</span>
                <div className="stat-icon-wrapper blue">
                  <FileText size={22} />
                </div>
              </div>
              <div className="stat-value">{summary.total}</div>
              <div className="stat-desc">
                <span className="stat-trend">Filter</span>
                <span>arsip sesuai kriteria</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Tersimpan</span>
                <div className="stat-icon-wrapper cyan">
                  <FileText size={22} />
                </div>
              </div>
              <div className="stat-value">{summary.perStatus.Tersimpan}</div>
              <div className="stat-desc">
                <span className="stat-trend">{pctText(summary.perStatus.Tersimpan, summary.total)}</span>
                <span>arsip tersimpan</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Terverifikasi</span>
                <div className="stat-icon-wrapper emerald">
                  <ShieldCheck size={22} />
                </div>
              </div>
              <div className="stat-value">{summary.perStatus.Terverifikasi}</div>
              <div className="stat-desc">
                <span className="stat-trend">
                  {pctText(summary.perStatus.Terverifikasi, summary.total)}
                </span>
                <span>arsip terverifikasi</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Diproses</span>
                <div className="stat-icon-wrapper indigo">
                  <Clock size={22} />
                </div>
              </div>
              <div className="stat-value">{summary.perStatus.Diproses}</div>
              <div className="stat-desc">
                <span className="stat-trend">{pctText(summary.perStatus.Diproses, summary.total)}</span>
                <span>arsip diproses</span>
              </div>
            </div>

            <div className="stat-card" style={{ borderColor: '#93c5fd' }}>
              <div className="stat-card-header">
                <span className="stat-card-title">Bulan Tertinggi</span>
                <div className="stat-icon-wrapper blue">
                  <TrendingUp size={22} />
                </div>
              </div>
              <div className="stat-value">
                {summary.bulanTertinggi ? summary.bulanTertinggi.jumlah : 0}
              </div>
              <div className="stat-desc">
                <span className="stat-trend">
                  {summary.bulanTertinggi ? summary.bulanTertinggi.label.split(' ')[0] : '-'}
                </span>
                <span>
                  {summary.bulanTertinggi
                    ? summary.bulanTertinggi.label
                    : 'belum ada data bulanan'}
                </span>
              </div>
            </div>
          </div>

          {/* Ringkasan Analisis Otomatis (teks sama dengan yang masuk PDF) */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title-area">
                <h3>
                  <Sparkles size={18} color="#2563eb" />
                  Ringkasan Analisis Otomatis
                </h3>
                <p>Paragraf berikut otomatis masuk ke bagian "Analisis & Catatan" pada PDF</p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 12,
                  color: '#475569',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <UserCheck size={13} color="#2563eb" /> <b>Pewaris unik</b>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  {summary.pewarisUnik}
                </div>
              </div>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 12,
                  color: '#475569',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Users size={13} color="#2563eb" /> <b>Total ahli waris</b>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  {summary.totalAhliWaris}
                </div>
              </div>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 12,
                  color: '#475569',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Clock size={13} color="#2563eb" /> <b>Arsip tahun {summary.tahunBerjalan}</b>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  {summary.jumlahTahunBerjalan}
                </div>
              </div>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 12,
                  color: '#475569',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <AlertTriangle size={13} color="#b45309" /> <b>Bulan tanpa SKW</b>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  {summary.bulanKosong.length}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {analisis.map((p, i) => (
                <p
                  key={i}
                  style={{
                    margin: 0,
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: '#334155',
                    textAlign: 'justify',
                  }}
                >
                  {p}
                </p>
              ))}
            </div>
          </div>

          {/* Tabel Pratinjau */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title-area">
                <h3>
                  <BarChart3 size={18} color="#2563eb" />
                  Pratinjau Daftar Arsip
                </h3>
                <p>
                  Menampilkan {previewRows.length} dari {filtered.length} arsip — tabel lengkap ada
                  di dalam PDF
                </p>
              </div>
            </div>
            <div className="table-responsive" style={{ maxHeight: 420, overflowY: 'auto' }}>
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
                  {previewRows.map((a, i) => (
                    <tr key={a.idArsip || i}>
                      <td style={{ width: 40 }}>{i + 1}</td>
                      <td style={{ fontWeight: 600, color: '#1e40af' }}>{a.idArsip}</td>
                      <td style={{ fontWeight: 600 }}>{a.nomorSKW}</td>
                      <td>{a.namaPewaris || '-'}</td>
                      <td>{formatDate(a.tanggalSurat)}</td>
                      <td>{a.jumlahAhliWaris} orang</td>
                      <td>
                        <span className={`badge ${statusBadge(a.status)}`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > previewRows.length && (
              <div
                style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#1e40af',
                  textAlign: 'center',
                }}
              >
                Menampilkan {previewRows.length} dari {filtered.length} arsip. Unduh PDF untuk
                melihat daftar arsip lengkap ({filtered.length} baris) beserta rekapitulasi dan
                analisis.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
