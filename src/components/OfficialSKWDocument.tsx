import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ArchiveSKW, LetterFormat } from '../types';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface OfficialSKWDocumentProps {
  archive: ArchiveSKW;
  letterFormat: LetterFormat;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const OfficialSKWDocument: React.FC<OfficialSKWDocumentProps> = ({
  archive,
  letterFormat,
  id = 'printSection',
  className = '',
  style = {},
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://siwaris.kelurahan-sumbertaman.go.id';
    const verifyUrl = `${baseUrl}/validasi?id=${archive.idArsip}&no=${encodeURIComponent(archive.nomorSKW)}`;

    QRCode.toDataURL(
      verifyUrl,
      {
        width: 160,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, dataUri) => {
        if (!err && dataUri && isMounted) {
          setQrDataUrl(dataUri);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [archive.idArsip, archive.nomorSKW]);

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
    <div className={`official-letter ${className}`} id={id} style={style}>
      {/* Official Government Kop Surat */}
      <div className="letter-kop">
        <h4>{letterFormat.namaPemerintah.toUpperCase()}</h4>
        <h3>{letterFormat.namaKecamatan.toUpperCase()}</h3>
        <h2>{letterFormat.namaKantor.toUpperCase()}</h2>
        <p>
          {letterFormat.alamatKantor} • {letterFormat.kontakKantor}
        </p>
        <div className="kop-double-line">
          <div className="line-thick"></div>
          <div className="line-thin"></div>
        </div>
      </div>

      {/* Official Letter Title & Number */}
      <div className="letter-title">
        <h4>SURAT KETERANGAN WARIS</h4>
        <div className="title-underline"></div>
        <p>Nomor: {archive.nomorSKW}</p>
      </div>

      {/* Main Letter Content */}
      <div className="letter-content">
        <p className="letter-paragraph">
          Yang bertanda tangan di bawah ini, Kepala {letterFormat.namaKantor}, {letterFormat.namaKecamatan},{' '}
          {letterFormat.namaPemerintah}, dengan ini menerangkan dengan sebenarnya bahwa:
        </p>

        {/* Pewaris Meta Table */}
        <table className="letter-meta-table">
          <tbody>
            <tr>
              <td style={{ width: 170 }}>Nama Lengkap</td>
              <td style={{ width: 15, textAlign: 'center' }}>:</td>
              <td>
                <b>{archive.namaPewaris}</b>
              </td>
            </tr>
            <tr>
              <td>NIK</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td>{archive.nikPewaris || '-'}</td>
            </tr>
            <tr>
              <td>Alamat Terakhir</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td>{archive.alamat || 'Kelurahan Sumbertaman'}</td>
            </tr>
            <tr>
              <td>Tanggal Meninggal</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td>{formatDate(archive.tanggalMeninggal)}</td>
            </tr>
          </tbody>
        </table>

        <p className="letter-paragraph" style={{ marginTop: 12 }}>
          Telah berpulang ke rahmatullah dan meninggalkan ahli waris yang sah berjumlah{' '}
          <b>{archive.jumlahAhliWaris} (orang)</b> sebagai berikut:
        </p>

        {/* Heirs Table */}
        <table className="letter-ahli-waris-table">
          <thead>
            <tr>
              <th style={{ width: '8%', textAlign: 'center' }}>No</th>
              <th style={{ width: '42%' }}>Nama Lengkap Ahli Waris</th>
              <th style={{ width: '25%' }}>Hubungan Keluarga</th>
              <th style={{ width: '25%' }}>NIK</th>
            </tr>
          </thead>
          <tbody>
            {archive.ahliWarisList && archive.ahliWarisList.length > 0 ? (
              archive.ahliWarisList.map((a, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'center' }}>{i + 1}</td>
                  <td>
                    <b>{a.nama}</b>
                  </td>
                  <td>{a.hubungan}</td>
                  <td>{a.nik || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={{ textAlign: 'center' }}>1</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
            )}
          </tbody>
        </table>

        <p className="letter-paragraph" style={{ marginTop: 14 }}>
          Demikian Surat Keterangan Waris ini dibuat dengan sebenarnya atas sumpah jabatan untuk dapat
          dipergunakan sebagaimana mestinya oleh yang berkepentingan.
        </p>

        {/* Footer: Digital Verification Seal (Left) and Signer / TTE (Right) */}
        <div className="letter-footer-signatures">
          {/* Left: Official Digital Verification Box */}
          <div className="digital-verification-box">
            <div className="verification-qr-wrapper">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code Keabsahan" className="verification-qr-img" />
              ) : (
                <div className="verification-qr-placeholder">QR Code</div>
              )}
            </div>

            <div className="verification-meta">
              <div className="verification-badge-label">
                <ShieldCheck size={11} color="#1d4ed8" /> DOKUMEN RESMI TERVERIFIKASI
              </div>
              <div className="verification-system-title">SIWARIS Kelurahan Sumbertaman</div>
              <div className="verification-detail-line">
                <span>ID Arsip :</span> <b>{archive.idArsip}</b>
              </div>
              <div className="verification-detail-line">
                <span>Status :</span> <b style={{ color: '#15803d' }}>{archive.status} Sah</b>
              </div>
              <div className="verification-note">
                Pindai QR fisik surat untuk verifikasi keabsahan dokumen di portal SIWARIS.
              </div>
            </div>
          </div>

          {/* Right: Official Signer & TTE */}
          <div className="signer-block">
            <div className="signer-location-date">
              {letterFormat.namaKota}, {formatDate(archive.tanggalSurat)}
            </div>
            <div className="signer-role">{letterFormat.jabatanPenandatangan},</div>

            {/* Signature or Indonesian Standard TTE Seal */}
            <div className="signer-signature-area">
              {letterFormat.ttdDigitalUrl ? (
                <img
                  src={letterFormat.ttdDigitalUrl}
                  alt="Tanda Tangan Lurah"
                  className="manual-signature-img"
                />
              ) : (
                <div className="tte-official-badge">
                  <div className="tte-badge-icon">
                    <CheckCircle2 size={18} color="#2563eb" />
                  </div>
                  <div className="tte-badge-content">
                    <div className="tte-badge-header">DITANDATANGANI SECARA ELEKTRONIK OLEH:</div>
                    <div className="tte-badge-role">{letterFormat.jabatanPenandatangan.toUpperCase()}</div>
                    <div className="tte-badge-name">{letterFormat.namaPenandatangan}</div>
                    <div className="tte-badge-cert">
                      <span className="cert-check">✓</span> {letterFormat.statusTTE || 'Sertifikasi Dokumen Elektronik Sah'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="signer-name-wrapper">
              <span className="signer-name">{letterFormat.namaPenandatangan}</span>
            </div>
            <div className="signer-nip">NIP. {letterFormat.nipPenandatangan}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
