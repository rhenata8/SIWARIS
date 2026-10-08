import { jsPDF } from 'jspdf';
import { ArchiveSKW, LetterFormat } from '../types';

export const generateAndDownloadSKWPDF = (archive: ArchiveSKW, letterFormat: LetterFormat) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // 1. KOP SURAT
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text(letterFormat.namaPemerintah.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5.5;

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text(letterFormat.namaKecamatan.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.text(letterFormat.namaKantor.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5.5;

  doc.setFont('times', 'italic');
  doc.setFontSize(8.5);
  doc.text(
    `${letterFormat.alamatKantor} • ${letterFormat.kontakKantor}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 4;

  // Double horizontal rule
  doc.setLineWidth(0.7);
  doc.line(margin, y, pageWidth - margin, y);
  y += 1.2;
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // 2. JUDUL SURAT
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('SURAT KETERANGAN WARIS', pageWidth / 2, y, { align: 'center' });
  doc.setLineWidth(0.3);
  doc.line(75, y + 1, 135, y + 1);
  y += 6;

  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.text(`Nomor: ${archive.nomorSKW}`, pageWidth / 2, y, { align: 'center' });
  y += 9;

  // 3. PARAGRAF PEMBUKA
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  const introText = `Yang bertanda tangan di bawah ini, Kepala ${letterFormat.namaKantor}, ${letterFormat.namaKecamatan}, ${letterFormat.namaPemerintah}, dengan ini menerangkan dengan sebenarnya bahwa:`;
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, y);
  y += splitIntro.length * 5 + 3;

  // 4. DATA PEWARIS (TABLE FORMAT)
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
    ['NIK', ': ' + archive.nikPewaris],
    ['Alamat Terakhir', ': ' + (archive.alamat || 'Kelurahan Sumbertaman')],
    ['Tanggal Meninggal', ': ' + formatTgl(archive.tanggalMeninggal)],
  ];

  pewarisData.forEach(([label, val]) => {
    doc.setFont('times', 'normal');
    doc.text(label, margin + 4, y);
    doc.setFont('times', label === 'Nama Lengkap' ? 'bold' : 'normal');
    doc.text(val, margin + 45, y);
    y += 5.5;
  });

  y += 3;

  // 5. PARAGRAF TENGAH
  doc.setFont('times', 'normal');
  const midText = `Telah berpulang ke rahmatullah dan meninggalkan ahli waris yang sah berjumlah ${archive.jumlahAhliWaris} (orang) sebagai berikut:`;
  doc.text(midText, margin, y);
  y += 6;

  // 6. TABEL AHLI WARIS
  const tableHeaders = ['No', 'Nama Lengkap Ahli Waris', 'Hubungan Keluarga', 'NIK'];
  const colWidths = [12, 68, 45, 45]; // Total 170 mm (contentWidth)
  const colX = [margin, margin + 12, margin + 80, margin + 125];

  // Draw header
  doc.setFillColor(240, 243, 246);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, contentWidth, 7, 'S');

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text('No', colX[0] + 6, y + 4.8, { align: 'center' });
  doc.text('Nama Ahli Waris', colX[1] + 2, y + 4.8);
  doc.text('Hubungan Keluarga', colX[2] + 2, y + 4.8);
  doc.text('NIK', colX[3] + 2, y + 4.8);
  y += 7;

  // Draw rows
  const ahliList = archive.ahliWarisList && archive.ahliWarisList.length > 0
    ? archive.ahliWarisList
    : [{ nama: '-', hubungan: '-', nik: '-' }];

  ahliList.forEach((ahli, idx) => {
    const rowHeight = 6.5;
    doc.rect(margin, y, contentWidth, rowHeight, 'S');
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(String(idx + 1), colX[0] + 6, y + 4.5, { align: 'center' });
    doc.setFont('times', 'bold');
    doc.text(ahli.nama, colX[1] + 2, y + 4.5);
    doc.setFont('times', 'normal');
    doc.text(ahli.hubungan, colX[2] + 2, y + 4.5);
    doc.text(ahli.nik || '-', colX[3] + 2, y + 4.5);
    y += rowHeight;
  });

  y += 6;

  // 7. PENUTUP
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  const closingText = 'Demikian Surat Keterangan Waris ini dibuat dengan sebenarnya atas sumpah jabatan untuk dapat dipergunakan sebagaimana mestinya oleh yang berkepentingan.';
  const splitClosing = doc.splitTextToSize(closingText, contentWidth);
  doc.text(splitClosing, margin, y);
  y += splitClosing.length * 5 + 8;

  // 8. TANDA TANGAN
  const sigX = 130;
  doc.text(`${letterFormat.namaKota}, ${formatTgl(archive.tanggalSurat)}`, sigX, y);
  y += 5;
  doc.text(letterFormat.jabatanPenandatangan, sigX, y);
  y += 4;

  // TTE Stamp or Custom Signature Image
  if (letterFormat.ttdDigitalUrl && letterFormat.ttdDigitalUrl.startsWith('data:image')) {
    try {
      doc.addImage(letterFormat.ttdDigitalUrl, 'PNG', sigX - 5, y, 40, 20);
      y += 20;
    } catch {
      drawTTEBox(doc, sigX, y, letterFormat.statusTTE);
      y += 18;
    }
  } else {
    drawTTEBox(doc, sigX, y, letterFormat.statusTTE);
    y += 18;
  }

  doc.setFont('times', 'bold');
  doc.text(letterFormat.namaPenandatangan, sigX, y);
  doc.setLineWidth(0.2);
  doc.line(sigX, y + 1, sigX + 55, y + 1);
  y += 4.5;
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text(`NIP. ${letterFormat.nipPenandatangan}`, sigX, y);

  // Left Seal Box: QR Validation Note
  const sealY = y - 32;
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, sealY, 65, 28, 2, 2, 'S');
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235);
  doc.text('ARSIP RESMI TERVERIFIKASI', margin + 32.5, sealY + 5, { align: 'center' });
  doc.setTextColor(80, 80, 80);
  doc.setFont('times', 'normal');
  doc.setFontSize(7.5);
  doc.text(`ID Arsip : ${archive.idArsip}`, margin + 3, sealY + 11);
  doc.text(`Nomor    : ${archive.nomorSKW}`, margin + 3, sealY + 16);
  doc.text(`Status   : ${archive.status} di SIWARIS`, margin + 3, sealY + 21);
  doc.text('Validasi : Scan QR Code fisik surat', margin + 3, sealY + 25);

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Save the genuine PDF
  const filename = archive.fileName && archive.fileName.endsWith('.pdf')
    ? archive.fileName
    : `SKW_${archive.namaPewaris.replace(/\s+/g, '_')}_${archive.idArsip}.pdf`;

  doc.save(filename);
};

function drawTTEBox(doc: jsPDF, x: number, y: number, tteText: string) {
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(147, 197, 253);
  doc.roundedRect(x - 2, y, 54, 13, 1.5, 1.5, 'FD');
  doc.setTextColor(29, 78, 216);
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.text('✓ TERTANDA ELEKTRONIK', x + 25, y + 5.5, { align: 'center' });
  doc.setFont('times', 'italic');
  doc.setFontSize(7);
  doc.text(tteText || 'Sertifikasi Dokumen Sah', x + 25, y + 9.5, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}
