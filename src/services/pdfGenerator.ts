import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { ArchiveSKW, LetterFormat } from '../types';

export const generateAndDownloadSKWPDF = async (
  archive: ArchiveSKW,
  letterFormat: LetterFormat
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // 1. KOP SURAT (Letterhead)
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text(letterFormat.namaPemerintah.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5.5;

  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.text(letterFormat.namaKecamatan.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFont('times', 'bold');
  doc.setFontSize(14.5);
  doc.text(letterFormat.namaKantor.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFont('times', 'italic');
  doc.setFontSize(8.5);
  doc.text(
    `${letterFormat.alamatKantor} • ${letterFormat.kontakKantor}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 4;

  // Double horizontal rule (Garuda / Kop Style)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 1.2;
  doc.setLineWidth(0.25);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7.5;

  // 2. JUDUL SURAT
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('SURAT KETERANGAN WARIS', pageWidth / 2, y, { align: 'center' });
  const titleW = doc.getTextWidth('SURAT KETERANGAN WARIS');
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - titleW / 2, y + 1, pageWidth / 2 + titleW / 2, y + 1);
  y += 5.5;

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(`Nomor: ${archive.nomorSKW}`, pageWidth / 2, y, { align: 'center' });
  y += 8;

  // 3. PARAGRAF PEMBUKA
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  const introText = `Yang bertanda tangan di bawah ini, Kepala ${letterFormat.namaKantor}, ${letterFormat.namaKecamatan}, ${letterFormat.namaPemerintah}, dengan ini menerangkan dengan sebenarnya bahwa:`;
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, y);
  y += splitIntro.length * 4.8 + 2.5;

  // 4. DATA PEWARIS (Table format with neat colons)
  const formatTgl = (tgl: string) => {
    try {
      return new Date(tgl + 'T00:00:00').toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return tgl;
    }
  };

  const pewarisData = [
    ['Nama Lengkap', ': ' + archive.namaPewaris],
    ['NIK', ': ' + (archive.nikPewaris || '-')],
    ['Alamat Terakhir', ': ' + (archive.alamat || 'Kelurahan Sumbertaman')],
    ['Tanggal Meninggal', ': ' + formatTgl(archive.tanggalMeninggal)],
  ];

  pewarisData.forEach(([label, val]) => {
    doc.setFont('times', 'normal');
    doc.text(label, margin + 4, y);
    doc.setFont('times', label === 'Nama Lengkap' ? 'bold' : 'normal');
    doc.text(val, margin + 45, y);
    y += 5.2;
  });

  y += 2.5;

  // 5. PARAGRAF TENGAH
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  const midText = `Telah berpulang ke rahmatullah dan meninggalkan ahli waris yang sah berjumlah ${archive.jumlahAhliWaris} (orang) sebagai berikut:`;
  doc.text(midText, margin, y);
  y += 5.5;

  // 6. TABEL AHLI WARIS
  const colX = [margin, margin + 12, margin + 80, margin + 125];
  const ahliList =
    archive.ahliWarisList && archive.ahliWarisList.length > 0
      ? archive.ahliWarisList
      : [{ nama: '-', hubungan: '-', nik: '-' }];

  // Draw table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.25);
  doc.rect(margin, y, contentWidth, 7, 'S');

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('No', colX[0] + 6, y + 4.8, { align: 'center' });
  doc.text('Nama Lengkap Ahli Waris', colX[1] + 2, y + 4.8);
  doc.text('Hubungan Keluarga', colX[2] + 2, y + 4.8);
  doc.text('NIK', colX[3] + 2, y + 4.8);
  y += 7;

  // Draw table rows
  ahliList.forEach((ahli, idx) => {
    const rowHeight = 6.5;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, rowHeight, 'S');

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(String(idx + 1), colX[0] + 6, y + 4.5, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.text(ahli.nama, colX[1] + 2, y + 4.5);

    doc.setFont('times', 'normal');
    doc.text(ahli.hubungan, colX[2] + 2, y + 4.5);
    doc.text(ahli.nik || '-', colX[3] + 2, y + 4.5);

    y += rowHeight;
  });

  y += 5.5;

  // 7. PENUTUP
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  const closingText =
    'Demikian Surat Keterangan Waris ini dibuat dengan sebenarnya atas sumpah jabatan untuk dapat dipergunakan sebagaimana mestinya oleh yang berkepentingan.';
  const splitClosing = doc.splitTextToSize(closingText, contentWidth);
  doc.text(splitClosing, margin, y);
  y += splitClosing.length * 4.8 + 6;

  // Ensure minimum bottom room for footer
  if (y < 215) {
    y = 215;
  }

  // 8. FOOTER: VERIFIKASI QR (KIRI) DAN TANDA TANGAN / TTE RESMI (KANAN)
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://siwaris.kelurahan-sumbertaman.go.id';
  const verifyUrl = `${baseUrl}/validasi?id=${archive.idArsip}&no=${encodeURIComponent(archive.nomorSKW)}`;

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 160,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR data URI for PDF', err);
  }

  // --- KIRI: Box Verifikasi Digital SIWARIS ---
  const sealWidth = 78;
  const sealHeight = 29;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, sealWidth, sealHeight, 2, 2, 'FD');

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', margin + 2.5, y + 2.5, 24, 24);
    } catch (e) {
      console.error(e);
    }
  }

  const metaX = margin + 29;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(29, 78, 216);
  doc.text('DOKUMEN RESMI TERVERIFIKASI', metaX, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SIWARIS Kelurahan Sumbertaman', metaX, y + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('ID Arsip : ', metaX, y + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(archive.idArsip, metaX + 13, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Status   : ', metaX, y + 19);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(21, 128, 61);
  doc.text(`${archive.status} Sah`, metaX + 13, y + 19);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  const noteSplit = doc.splitTextToSize(
    'Pindai QR fisik surat untuk validasi keabsahan dokumen di portal SIWARIS.',
    46
  );
  doc.text(noteSplit, metaX, y + 23);

  // --- KANAN: Pejabat Penandatangan & TTE ---
  const signerCenterX = 158;
  const badgeWidth = 64;
  const badgeHeight = 18;
  const badgeX = signerCenterX - badgeWidth / 2;

  // Lokasi & Tanggal
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `${letterFormat.namaKota}, ${formatTgl(archive.tanggalSurat)}`,
    signerCenterX,
    y + 3.5,
    { align: 'center' }
  );

  // Jabatan
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.text(`${letterFormat.jabatanPenandatangan},`, signerCenterX, y + 8, {
    align: 'center',
  });

  let yName = y + 33;

  if (letterFormat.ttdDigitalUrl && letterFormat.ttdDigitalUrl.startsWith('data:image')) {
    try {
      doc.addImage(letterFormat.ttdDigitalUrl, 'PNG', signerCenterX - 20, y + 10, 40, 18);
      yName = y + 32;
    } catch {
      drawCleanTTEBadge(doc, badgeX, y + 10, badgeWidth, badgeHeight, letterFormat);
      yName = y + 33;
    }
  } else {
    // Gambar badge TTE resmi berstandar BSrE / Kominfo
    drawCleanTTEBadge(doc, badgeX, y + 10, badgeWidth, badgeHeight, letterFormat);
    yName = y + 33;
  }

  // Nama Pejabat (Tengah & Digarisbawahi Pas Lebar Nama)
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text(letterFormat.namaPenandatangan, signerCenterX, yName, { align: 'center' });

  const nameWidth = doc.getTextWidth(letterFormat.namaPenandatangan);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(
    signerCenterX - nameWidth / 2,
    yName + 1,
    signerCenterX + nameWidth / 2,
    yName + 1
  );

  // NIP
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text(`NIP. ${letterFormat.nipPenandatangan}`, signerCenterX, yName + 5, {
    align: 'center',
  });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Download PDF
  const filename =
    archive.fileName && archive.fileName.endsWith('.pdf')
      ? archive.fileName
      : `SKW_${archive.namaPewaris.replace(/\s+/g, '_')}_${archive.idArsip}.pdf`;

  doc.save(filename);
};

/**
 * Menggambar Kotak Tanda Tangan Elektronik (TTE) Resmi Pemerintah Indonesia
 * Menghindari bug font unicode checklist jsPDF dan menghasilkan layout rapi.
 */
function drawCleanTTEBadge(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  letterFormat: LetterFormat
) {
  // Latar belakang gradient lembut / soft blue
  doc.setFillColor(240, 247, 255);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  // Ikon Lingkaran Keamanan Biru
  const iconCenterX = x + 6.5;
  const iconCenterY = y + h / 2;
  doc.setFillColor(37, 99, 235);
  doc.circle(iconCenterX, iconCenterY, 3.8, 'F');

  // Vector Centang Putih di dalam lingkaran (100% bebas bug karakter)
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.65);
  doc.line(iconCenterX - 1.8, iconCenterY - 0.2, iconCenterX - 0.5, iconCenterY + 1.3);
  doc.line(iconCenterX - 0.5, iconCenterY + 1.3, iconCenterX + 1.8, iconCenterY - 1.4);

  // Teks TTE Rapi & Presisi
  const textX = x + 12.5;

  // Baris 1: Header Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(30, 64, 175); // Blue 800
  doc.text('DITANDATANGANI SECARA ELEKTRONIK OLEH:', textX, y + 4.5);

  // Baris 2: Jabatan Penandatangan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(letterFormat.jabatanPenandatangan.toUpperCase(), textX, y + 8);

  // Baris 3: Nama Terang Penandatangan
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(51, 65, 85); // Slate 700
  doc.text(letterFormat.namaPenandatangan, textX, y + 11.5);

  // Baris 4: Status Sertifikasi Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text('SIWARIS / BSrE Terverifikasi Sah', textX, y + 15.2);
}
