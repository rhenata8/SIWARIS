import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Users,
  UserCheck,
  CalendarDays,
  Search,
  ArrowRight,
  Clock,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
  Eye,
  QrCode,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { stats, archives, setActivePage, setSearchQuery, setSelectedArchive, setQrModalArchive, setIsAddModalOpen } =
    useApp();
  const [quickInput, setQuickInput] = useState('');

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      setSearchQuery(quickInput.trim());
      setActivePage('pencarian');
    }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const recentArchives = archives.slice(0, 5);

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #0369a1 100%)',
          color: '#ffffff',
          borderRadius: 16,
          padding: '24px 28px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 24px rgba(3, 105, 161, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ zIndex: 2, maxWidth: 650 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              marginBottom: 10,
              backdropFilter: 'blur(4px)',
            }}
          >
            <Sparkles size={13} />
            <span>Sistem Informasi Arsip Digital Kelurahan Sumbertaman</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            Selamat Datang di Portal SIWARIS
          </h2>
          <p style={{ fontSize: 13, color: '#e0f2fe', marginTop: 6, lineHeight: 1.5 }}>
            Kelola arsip Surat Keterangan Waris (SKW), data pewaris, ahli waris, dan dokumen digital
            secara tertib, akurat, dan terverifikasi secara elektronik.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, zIndex: 2 }}>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn"
            style={{
              background: '#ffffff',
              color: '#0369a1',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <PlusCircle size={16} /> Tambah SKW
          </button>
        </div>

        {/* Decorative circle */}
        <div
          style={{
            position: 'absolute',
            right: -40,
            top: -50,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* 4 Stat Cards */}
      <div className="stat-cards-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total SKW</span>
            <div className="stat-icon-wrapper blue">
              <FileText size={22} />
            </div>
          </div>
          <div className="stat-value">{stats.totalSKW}</div>
          <div className="stat-desc">
            <span className="stat-trend">Aktif</span>
            <span>arsip tercatat resmi</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Pewaris</span>
            <div className="stat-icon-wrapper cyan">
              <UserCheck size={22} />
            </div>
          </div>
          <div className="stat-value">{stats.totalPewaris}</div>
          <div className="stat-desc">
            <span>data pewaris terdaftar</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Ahli Waris</span>
            <div className="stat-icon-wrapper indigo">
              <Users size={22} />
            </div>
          </div>
          <div className="stat-value">{stats.totalAhliWaris}</div>
          <div className="stat-desc">
            <span>ahli waris terdaftar</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Tahun 2026</span>
            <div className="stat-icon-wrapper emerald">
              <CalendarDays size={22} />
            </div>
          </div>
          <div className="stat-value">{stats.total2026}</div>
          <div className="stat-desc">
            <span className="stat-trend">Aktif</span>
            <span>SKW diterbitkan tahun ini</span>
          </div>
        </div>
      </div>

      {/* Grid: Quick Search & Quick Actions */}
      <div className="form-grid-2" style={{ marginBottom: 24 }}>
        {/* Quick Search Panel */}
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-header">
            <div className="panel-title-area">
              <h3>
                <Search size={18} color="#2563eb" />
                Pencarian Cepat Arsip
              </h3>
              <p>Cari berkas berdasarkan nama pewaris, NIK, atau nomor surat</p>
            </div>
          </div>

          <form onSubmit={handleQuickSearch} style={{ display: 'flex', gap: 10 }}>
            <div className="search-bar-wrapper" style={{ flex: 1 }}>
              <Search size={16} color="#64748b" />
              <input
                type="text"
                placeholder="Nama pewaris, NIK, atau nomor SKW..."
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Cari Arsip
            </button>
          </form>

          <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>Pencarian populer:</span>
            {['Budi Santoso', 'Siti Aminah', '470/123/SKW/2026', 'Hadi Wijaya'].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setSearchQuery(term);
                  setActivePage('pencarian');
                }}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: 20,
                  padding: '3px 10px',
                  fontSize: 11,
                  color: '#1e40af',
                  cursor: 'pointer',
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Guide Card */}
        <div className="panel" style={{ margin: 0, background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' }}>
          <div className="panel-header">
            <div className="panel-title-area">
              <h3>
                <ShieldCheck size={18} color="#059669" />
                Integritas & Verifikasi Digital
              </h3>
              <p>Layanan prima administrasi kependudukan Kelurahan Sumbertaman</p>
            </div>
          </div>

          <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.6 }}>
            Setiap arsip SKW yang diterbitkan memiliki <b>ID Arsip Tunggal</b> dan kode QR yang dapat
            diverifikasi kapan saja oleh instansi terkait (Perbankan, BPN, Pengadilan Agama, maupun Notaris).
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button
              onClick={() => setActivePage('arsip')}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
            >
              Buka Arsip Digital <ArrowRight size={13} />
            </button>
            <button
              onClick={() => setActivePage('laporan')}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
            >
              Lihat Laporan Tahunan <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Archives Section */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-area">
            <h3>
              <Clock size={18} color="#2563eb" />
              Arsip Terbaru Diterbitkan
            </h3>
            <p>5 surat keterangan waris paling mutakhir yang tercatat dalam register</p>
          </div>
          <button
            onClick={() => setActivePage('surat')}
            className="btn btn-subtle btn-sm"
          >
            Lihat Semua Arsip <ChevronRight size={14} />
          </button>
        </div>

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
              {recentArchives.map((x) => (
                <tr key={x.idArsip}>
                  <td style={{ fontWeight: 600, color: '#1e40af' }}>{x.idArsip}</td>
                  <td style={{ fontWeight: 600 }}>{x.nomorSKW}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{x.namaPewaris}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>NIK: {x.nikPewaris}</div>
                  </td>
                  <td>{formatDate(x.tanggalSurat)}</td>
                  <td>{x.jumlahAhliWaris} orang</td>
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
                        title="Lihat Detail"
                      >
                        <Eye size={13} /> Detail
                      </button>
                      <button
                        className="btn btn-subtle btn-sm"
                        onClick={() => setQrModalArchive(x)}
                        title="Lihat QR Code"
                      >
                        <QrCode size={13} /> QR
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
