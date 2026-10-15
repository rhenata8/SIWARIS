import { jsPDF } from 'jspdf';
import { ArchiveSKW, LetterFormat } from '../types';

/* ============================================================
 * LAPORAN ANALITIK ARSIP SKW — SIWARIS Kelurahan Sumbertaman
 * Generator PDF: kop resmi, ringkasan statistik, rekap bulanan,
 * daftar arsip multi-halaman, dan analisis otomatis.
 * Tabel digambar MANUAL (doc.rect/line/text) tanpa plugin
 * jspdf-autotable — kolom pas, header tabel diulang tiap halaman.
 * ============================================================ */

export type StatusSKW = ArchiveSKW['status'];

export interface LaporanOptions {
  periodeMulai?: string; // 'YYYY-MM-DD'
  periodeSelesai?: string; // 'YYYY-MM-DD'
  tahun?: string; // 'semua' | '2026' | ...
  status?: StatusSKW | 'semua';
}

export interface LaporanUserInfo {
  nama?: string;
  role?: string;
}

export interface BulanRekap {
  key: string; // 'YYYY-MM'
  label: string; // 'Agustus 2026'
  jumlah: number;
}

export interface LaporanSummary {
  periodeLabel: string;
  total: number;
  perStatus: Record<StatusSKW, number>;
  persenStatus: Record<StatusSKW, number>;
  tahunBerjalan: number;
  jumlahTahunBerjalan: number;
  pewarisUnik: number;
  totalAhliWaris: number;
  bulanData: BulanRekap[];
  bulanTertinggi: BulanRekap | null;
  bulanKosong: string[];
  anomali: string[];
}

const STATUS_LIST: StatusSKW[] = ['Tersimpan', 'Terverifikasi', 'Diproses'];

const BULAN_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DEFAULT_KOP = {
  namaPemerintah: 'Pemerintah Kota Probolinggo',
  namaKecamatan: 'Kecamatan Wonoasih',
  namaKantor: 'Kelurahan Sumbertaman',
  alamatKantor: 'Jalan Mastrip No. 12, Sumbertaman, Probolinggo',
  kontakKantor: 'Kode Pos 67237 • Telp. (0335) 421xxx',
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const parseTanggal = (s?: string): Date | null => {
  if (!s || !ISO_DATE_RE.test(s)) return null;
  const d = new Date(s + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
};

const tahunDari = (a: ArchiveSKW): number => {
  if (a.tahun && !isNaN(a.tahun)) return a.tahun;
  const d = parseTanggal(a.tanggalSurat);
  return d ? d.getFullYear() : 0;
};

const formatTanggalPanjang = (s: string): string => {
  const d = parseTanggal(s);
  if (!d) return s || '-';
  return `${d.getDate()} ${BULAN_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

/* ---------- FILTER ---------- */

export const filterArchivesForLaporan = (
  archives: ArchiveSKW[],
  options: LaporanOptions
): ArchiveSKW[] => {
  let out = archives.slice();

  if (options.tahun && options.tahun !== 'semua') {
    const t = parseInt(options.tahun, 10);
    out = out.filter((a) => tahunDari(a) === t);
  }

  if (options.status && options.status !== 'semua') {
    out = out.filter((a) => a.status === options.status);
  }

  if (options.periodeMulai && ISO_DATE_RE.test(options.periodeMulai)) {
    out = out.filter((a) => ISO_DATE_RE.test(a.tanggalSurat) && a.tanggalSurat >= options.periodeMulai!);
  }

  if (options.periodeSelesai && ISO_DATE_RE.test(options.periodeSelesai)) {
    out = out.filter((a) => ISO_DATE_RE.test(a.tanggalSurat) && a.tanggalSurat <= options.periodeSelesai!);
  }

  // Urut kronologis (laporan resmi dibaca urut waktu terbit)
  out.sort((a, b) => {
    const ta = a.tanggalSurat || '9999-12-31';
    const tb = b.tanggalSurat || '9999-12-31';
    if (ta !== tb) return ta < tb ? -1 : 1;
    return (a.idArsip || '').localeCompare(b.idArsip || '');
  });

  return out;
};

/* ---------- RINGKASAN & ANALISIS ---------- */

const buatPeriodeLabel = (options: LaporanOptions): string => {
  const parts: string[] = [];
  const mulai = options.periodeMulai && ISO_DATE_RE.test(options.periodeMulai) ? options.periodeMulai : null;
  const selesai = options.periodeSelesai && ISO_DATE_RE.test(options.periodeSelesai) ? options.periodeSelesai : null;

  if (mulai && selesai) {
    parts.push(`Periode ${formatTanggalPanjang(mulai)} s.d. ${formatTanggalPanjang(selesai)}`);
  } else if (mulai) {
    parts.push(`Periode mulai ${formatTanggalPanjang(mulai)}`);
  } else if (selesai) {
    parts.push(`Periode s.d. ${formatTanggalPanjang(selesai)}`);
  } else if (options.tahun && options.tahun !== 'semua') {
    parts.push(`Periode Tahun ${options.tahun}`);
  } else {
    parts.push('Seluruh Data Arsip (semua periode)');
  }

  if (options.status && options.status !== 'semua') {
    parts.push(`Status: ${options.status}`);
  }

  return parts.join(' • ');
};

const bulanLabel = (y: number, m0: number): string => `${BULAN_NAMES[m0]} ${y}`;

export const buildLaporanSummary = (
  filtered: ArchiveSKW[],
  options: LaporanOptions = {}
): LaporanSummary => {
  const total = filtered.length;

  const perStatus: Record<StatusSKW, number> = {
    Tersimpan: 0,
    Terverifikasi: 0,
    Diproses: 0,
  };
  filtered.forEach((a) => {
    perStatus[a.status] = (perStatus[a.status] || 0) + 1;
  });

  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  const persenStatus: Record<StatusSKW, number> = {
    Tersimpan: pct(perStatus.Tersimpan),
    Terverifikasi: pct(perStatus.Terverifikasi),
    Diproses: pct(perStatus.Diproses),
  };

  const tahunBerjalan = new Date().getFullYear();
  const jumlahTahunBerjalan = filtered.filter((a) => tahunDari(a) === tahunBerjalan).length;

  const pewarisUnik = new Set(filtered.map((a) => (a.nikPewaris || '').trim() || a.namaPewaris)).size;
  const totalAhliWaris = filtered.reduce((acc, a) => acc + (a.jumlahAhliWaris || 0), 0);

  // Rentang bulan: dari data, diperluas ke batas periode filter (max 600 bulan)
  const dates = filtered
    .map((a) => parseTanggal(a.tanggalSurat))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  let lo = dates.length ? dates[0] : null;
  let hi = dates.length ? dates[dates.length - 1] : null;

  const mFilter = parseTanggal(options.periodeMulai || undefined);
  const sFilter = parseTanggal(options.periodeSelesai || undefined);
  if (mFilter && (!lo || mFilter < lo)) lo = new Date(mFilter);
  if (sFilter && (!hi || sFilter > hi)) hi = new Date(sFilter);
  // Periode selesai di masa depan tidak ditarik sampai hari ini — biarkan sesuai filter.

  const bulanData: BulanRekap[] = [];
  if (lo && hi && lo <= hi) {
    let y = lo.getFullYear();
    let m = lo.getMonth();
    const endY = hi.getFullYear();
    const endM = hi.getMonth();
    let guard = 0;
    while ((y < endY || (y === endY && m <= endM)) && guard < 600) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      const jumlah = filtered.filter((a) => {
        const d = parseTanggal(a.tanggalSurat);
        return d !== null && d.getFullYear() === y && d.getMonth() === m;
      }).length;
      bulanData.push({ key, label: bulanLabel(y, m), jumlah });
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
      guard += 1;
    }
  }

  let bulanTertinggi: BulanRekap | null = null;
  bulanData.forEach((b) => {
    if (b.jumlah > 0 && (!bulanTertinggi || b.jumlah > bulanTertinggi.jumlah)) {
      bulanTertinggi = b;
    }
  });

  const bulanKosong = bulanData.filter((b) => b.jumlah === 0).map((b) => b.label);

  // Anomali data
  const anomali: string[] = [];
  const tanpaNama = filtered.filter((a) => !(a.namaPewaris || '').trim());
  if (tanpaNama.length > 0) {
    anomali.push(
      `${tanpaNama.length} arsip tanpa nama pewaris (${
        tanpaNama.length <= 5
          ? tanpaNama.map((a) => a.idArsip).join(', ')
          : tanpaNama.slice(0, 5).map((a) => a.idArsip).join(', ') + ', dll.'
      }).`
    );
  }
  const tanpaNomor = filtered.filter((a) => !(a.nomorSKW || '').trim());
  if (tanpaNomor.length > 0) {
    anomali.push(`${tanpaNomor.length} arsip tanpa nomor SKW.`);
  }
  const tanpaTanggal = filtered.filter((a) => !parseTanggal(a.tanggalSurat));
  if (tanpaTanggal.length > 0) {
    anomali.push(`${tanpaTanggal.length} arsip memiliki tanggal terbit kosong/tidak valid.`);
  }
  const jumlahNol = filtered.filter((a) => !a.jumlahAhliWaris || a.jumlahAhliWaris <= 0);
  if (jumlahNol.length > 0) {
    anomali.push(`${jumlahNol.length} arsip belum mencatat jumlah ahli waris.`);
  }
  const mismatch = filtered.filter(
    (a) => a.ahliWarisList && a.ahliWarisList.length > 0 && a.ahliWarisList.length !== a.jumlahAhliWaris
  );
  if (mismatch.length > 0) {
    anomali.push(
      `${mismatch.length} arsip memiliki selisih antara jumlah ahli waris dan daftar nama ahli waris.`
    );
  }

  return {
    periodeLabel: buatPeriodeLabel(options),
    total,
    perStatus,
    persenStatus,
    tahunBerjalan,
    jumlahTahunBerjalan,
    pewarisUnik,
    totalAhliWaris,
    bulanData,
    bulanTertinggi,
    bulanKosong,
    anomali,
  };
};

export const buildAnalisisParagraf = (summary: LaporanSummary): string[] => {
  const paras: string[] = [];
  if (summary.total === 0) {
    paras.push('Tidak terdapat arsip SKW pada rentang filter yang dipilih, sehingga analisis tidak dapat dihitung.');
    return paras;
  }

  if (summary.bulanTertinggi) {
    const persen = ((summary.bulanTertinggi.jumlah / summary.total) * 100).toFixed(1).replace('.', ',');
    paras.push(
      `Penerbitan tertinggi terjadi pada bulan ${summary.bulanTertinggi.label} sebanyak ${summary.bulanTertinggi.jumlah} surat (${persen}% dari total periode).`
    );
  } else {
    paras.push('Tidak ditemukan data penerbitan per bulan yang valid pada periode ini.');
  }

  const dominanEntry = STATUS_LIST.map((s) => ({ s, n: summary.perStatus[s] }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)[0];
  if (dominanEntry) {
    const persen = summary.persenStatus[dominanEntry.s].toFixed(1).replace('.', ',');
    paras.push(
      `Status dominan adalah "${dominanEntry.s}" dengan ${dominanEntry.n} arsip (${persen}%). Rincian lainnya: Tersimpan ${summary.perStatus.Tersimpan} arsip, Terverifikasi ${summary.perStatus.Terverifikasi} arsip, dan Diproses ${summary.perStatus.Diproses} arsip.`
    );
  }

  if (summary.bulanKosong.length > 0) {
    const list =
      summary.bulanKosong.length <= 8
        ? summary.bulanKosong.join(', ')
        : summary.bulanKosong.slice(0, 8).join(', ') + `, dan ${summary.bulanKosong.length - 8} bulan lainnya`;
    paras.push(`Terdapat ${summary.bulanKosong.length} bulan tanpa penerbitan SKW, yaitu: ${list}.`);
  } else {
    paras.push('Tidak terdapat bulan kosong; setiap bulan pada rentang periode memiliki penerbitan SKW.');
  }

  paras.push(
    `Rata-rata penerbitan adalah ${(summary.total / Math.max(summary.bulanData.filter((b) => b.jumlah > 0).length, 1)).toFixed(1).replace('.', ',')} surat per bulan aktif, dengan ${summary.pewarisUnik} pewaris unik dan total ${summary.totalAhliWaris} ahli waris tercatat. Arsip tahun berjalan (${summary.tahunBerjalan}) berjumlah ${summary.jumlahTahunBerjalan} surat.`
  );

  if (summary.anomali.length > 0) {
    paras.push(`Catatan anomali data: ${summary.anomali.join(' ')}`);
  } else {
    paras.push('Pemeriksaan kualitas data: tidak ditemukan anomali (nama, nomor, tanggal, dan ahli waris terisi lengkap).');
  }

  return paras;
};

/* ---------- TABEL MANUAL (tanpa plugin jspdf-autotable) ---------- */

type RGB = [number, number, number];

interface KolomTabel {
  header: string;
  width: number; // mm — total semua kolom harus = lebar konten
  align?: 'left' | 'center' | 'right';
}

interface GayaSel {
  warna?: RGB;
  tebal?: boolean;
}

interface OpsiTabelManual {
  startY: number;
  kolom: KolomTabel[];
  baris: string[][];
  margin: number;
  topOffset: number; // y awal konten pada halaman baru
  bottomLimit: number; // batas konten sebelum area footer
  fontSize?: number;
  headFontSize?: number;
  rowHeight?: number;
  headHeight?: number;
  cellStyler?: (rowIndex: number, colIndex: number, value: string) => GayaSel | undefined;
}

const WARNA_HEAD: RGB = [30, 64, 175];
const WARNA_GRID: RGB = [203, 213, 225];
const WARNA_ALT: RGB = [241, 245, 249];
const WARNA_TEKS: RGB = [15, 23, 42];

/** Potong teks dengan elipsis "..." agar muat dalam lebar kolom. */
const fitText = (doc: jsPDF, text: string, maxW: number): string => {
  const t = text == null ? '' : String(text);
  if (doc.getTextWidth(t) <= maxW) return t;
  let s = t;
  while (s.length > 1 && doc.getTextWidth(s + '...') > maxW) {
    s = s.slice(0, -1);
  }
  return s + '...';
};

/**
 * Menggambar tabel bergaya grid sepenuhnya manual:
 * header biru (diulang tiap halaman baru), baris selang-seling,
 * garis cell pakai doc.rect/doc.line, teks dipotong agar kolom selalu muat.
 * Mengembalikan posisi y setelah baris terakhir.
 */
const drawManualTable = (doc: jsPDF, opts: OpsiTabelManual): number => {
  const {
    startY,
    kolom,
    baris,
    margin,
    topOffset,
    bottomLimit,
    fontSize = 9,
    headFontSize = 9,
    rowHeight = 5.8,
    headHeight = 6.4,
    cellStyler,
  } = opts;

  const totalW = kolom.reduce((acc, c) => acc + c.width, 0);
  const pad = 1.6;
  let y = startY;

  const drawHead = () => {
    doc.setFillColor(WARNA_HEAD[0], WARNA_HEAD[1], WARNA_HEAD[2]);
    doc.setDrawColor(WARNA_HEAD[0], WARNA_HEAD[1], WARNA_HEAD[2]);
    doc.setLineWidth(0.25);
    doc.rect(margin, y, totalW, headHeight, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(headFontSize);
    doc.setTextColor(255, 255, 255);
    let cx = margin;
    kolom.forEach((c) => {
      const label = fitText(doc, c.header, c.width - pad * 2);
      doc.text(label, cx + c.width / 2, y + headHeight / 2 + 1.1, { align: 'center' });
      cx += c.width;
    });
    y += headHeight;
  };

  drawHead();

  baris.forEach((row, ri) => {
    // Pindah halaman bila baris tidak muat — header tabel digambar ulang
    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = topOffset;
      drawHead();
    }

    // Latar baris selang-seling
    const isi = ri % 2 === 1 ? WARNA_ALT : [255, 255, 255] as RGB;
    doc.setFillColor(isi[0], isi[1], isi[2]);
    doc.rect(margin, y, totalW, rowHeight, 'F');

    // Garis luar + garis vertikal antar kolom
    doc.setDrawColor(WARNA_GRID[0], WARNA_GRID[1], WARNA_GRID[2]);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, totalW, rowHeight, 'S');
    let vx = margin;
    for (let ci = 0; ci < kolom.length - 1; ci++) {
      vx += kolom[ci].width;
      doc.line(vx, y, vx, y + rowHeight);
    }

    // Isi teks per sel
    let cx = margin;
    row.forEach((val, ci) => {
      const kol = kolom[ci];
      const gaya = cellStyler ? cellStyler(ri, ci, val) : undefined;
      doc.setFont('helvetica', gaya && gaya.tebal ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      const warna = gaya && gaya.warna ? gaya.warna : WARNA_TEKS;
      doc.setTextColor(warna[0], warna[1], warna[2]);

      const align = kol.align || 'left';
      const teks = fitText(doc, val == null || val === '' ? '-' : String(val), kol.width - pad * 2);
      const tx =
        align === 'center'
          ? cx + kol.width / 2
          : align === 'right'
            ? cx + kol.width - pad
            : cx + pad;
      doc.text(teks, tx, y + rowHeight / 2 + 1.05, { align });
      cx += kol.width;
    });

    y += rowHeight;
  });

  return y;
};

/* ---------- GENERATOR PDF ---------- */

export const generateLaporanPDF = (
  archives: ArchiveSKW[],
  letterFormat: LetterFormat | undefined,
  periode: LaporanOptions = {},
  userInfo?: LaporanUserInfo,
  mode: 'unduh' | 'cetak' = 'unduh'
): void => {
  const filtered = filterArchivesForLaporan(archives, periode);
  const summary = buildLaporanSummary(filtered, periode);
  const analisis = buildAnalisisParagraf(summary);
  const kop = { ...DEFAULT_KOP, ...(letterFormat || {}) };

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const topOffset = 26; // ruang header lanjutan halaman 2+
  const bottomLimit = 274; // batas konten sebelum area footer
  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = topOffset;
    }
  };

  const sectionTitle = (label: string) => {
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175);
    doc.text(label, margin, y);
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 1.6, margin + contentWidth, y + 1.6);
    y += 7;
  };

  const bodyText = (text: string, size = 9.5) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    lines.forEach((line) => {
      ensureSpace(6);
      doc.text(line, margin, y);
      y += 4.6;
    });
    y += 2;
  };

  // ===== (a) KOP RESMI =====
  y = 16;
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text(kop.namaPemerintah.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5.5;

  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.text(kop.namaKecamatan.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFont('times', 'bold');
  doc.setFontSize(14.5);
  doc.text(kop.namaKantor.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFont('times', 'italic');
  doc.setFontSize(8.5);
  doc.text(`${kop.alamatKantor} • ${kop.kontakKantor}`, pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Garis pemisah tebal + tipis (gaya kop dinas)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1.1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 1.3;
  doc.setLineWidth(0.25);
  doc.line(margin, y, pageWidth - margin, y);
  y += 9;

  // Judul laporan + periode + tanggal cetak
  const now = new Date();
  const tanggalCetak = `${now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}, pukul ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const judul = 'LAPORAN ARSIP SURAT KETERANGAN WARIS (SKW)';
  doc.text(judul, pageWidth / 2, y, { align: 'center' });
  const judulW = doc.getTextWidth(judul);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - judulW / 2, y + 1.2, pageWidth / 2 + judulW / 2, y + 1.2);
  y += 6.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const periodeLines = doc.splitTextToSize(summary.periodeLabel, contentWidth) as string[];
  periodeLines.forEach((line) => {
    doc.text(line, pageWidth / 2, y, { align: 'center' });
    y += 5;
  });

  // Sub-judul identitas sistem + tanggal cetak
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 64, 175);
  doc.text('SIWARIS — Sistem Informasi Arsip Surat Keterangan Waris', pageWidth / 2, y, {
    align: 'center',
  });
  y += 4.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Dicetak pada: ${tanggalCetak}`, pageWidth / 2, y, { align: 'center' });
  y += 8;

  // ===== (b) BAGIAN I — RINGKASAN STATISTIK =====
  sectionTitle('I. RINGKASAN STATISTIK');
  bodyText(
    `Laporan ini merangkum ${summary.total} arsip Surat Keterangan Waris (SKW) yang tercatat pada sistem SIWARIS ${kop.namaKantor} untuk ${summary.periodeLabel.toLowerCase()}. Berikut indikator utama hasil rekapitulasi:`
  );

  const fmtPersen = (n: number) => `${n.toFixed(1).replace('.', ',')}%`;
  const ringkasanBaris = [
    ['Total Arsip SKW', `${summary.total} arsip`],
    ['Status Tersimpan', `${summary.perStatus.Tersimpan} arsip (${fmtPersen(summary.persenStatus.Tersimpan)})`],
    ['Status Terverifikasi', `${summary.perStatus.Terverifikasi} arsip (${fmtPersen(summary.persenStatus.Terverifikasi)})`],
    ['Status Diproses', `${summary.perStatus.Diproses} arsip (${fmtPersen(summary.persenStatus.Diproses)})`],
    [`Arsip Tahun Berjalan (${summary.tahunBerjalan})`, `${summary.jumlahTahunBerjalan} arsip`],
    ['Jumlah Pewaris Unik', `${summary.pewarisUnik} pewaris`],
    ['Total Ahli Waris Tercatat', `${summary.totalAhliWaris} orang`],
  ];

  y = drawManualTable(doc, {
    startY: y,
    kolom: [
      { header: 'Indikator', width: 70 },
      { header: 'Nilai', width: 110, align: 'right' },
    ],
    baris: ringkasanBaris,
    margin,
    topOffset,
    bottomLimit,
    fontSize: 9,
    headFontSize: 9,
    rowHeight: 6.2,
    headHeight: 6.6,
    cellStyler: (ri, ci) => (ci === 0 ? { tebal: true } : undefined),
  }) + 8;

  // ===== (c) BAGIAN II — REKAPITULASI BULANAN =====
  sectionTitle('II. REKAPITULASI BULANAN');
  if (summary.bulanData.length === 0) {
    bodyText('Tidak terdapat data bulan yang dapat direkapitulasi pada periode ini (tanggal terbit kosong atau tidak valid).');
  } else {
    bodyText('Rekapitulasi jumlah SKW terbit per bulan beserta tren terhadap bulan sebelumnya:');
    const bulanBaris = summary.bulanData.map((b, i) => {
      let tren = '-';
      if (i > 0) {
        const prev = summary.bulanData[i - 1].jumlah;
        if (b.jumlah > prev) tren = `Naik (+${b.jumlah - prev})`;
        else if (b.jumlah < prev) tren = `Turun (-${prev - b.jumlah})`;
        else tren = 'Stabil';
      }
      return [b.label, `${b.jumlah}`, tren];
    });

    y = drawManualTable(doc, {
      startY: y,
      kolom: [
        { header: 'Bulan', width: 70 },
        { header: 'Jumlah SKW Terbit', width: 45, align: 'center' },
        { header: 'Tren', width: 65, align: 'center' },
      ],
      baris: bulanBaris,
      margin,
      topOffset,
      bottomLimit,
      fontSize: 9,
      headFontSize: 8.5,
      rowHeight: 6.2,
      headHeight: 6.6,
      cellStyler: (ri, ci, val) => {
        if (ci === 1 && parseInt(val, 10) === 0) return { warna: [148, 163, 184] };
        return undefined;
      },
    }) + 8;
  }

  // ===== (d) BAGIAN III — DAFTAR ARSIP (MULTI-HALAMAN, HEADER DIULANG) =====
  sectionTitle('III. DAFTAR ARSIP PERIODE');
  if (filtered.length === 0) {
    bodyText('Tidak ada arsip yang masuk dalam kriteria filter laporan ini.');
  } else {
    const daftarBaris = filtered.map((a, i) => [
      `${i + 1}`,
      a.idArsip || '-',
      a.nomorSKW || '-',
      a.namaPewaris && a.namaPewaris.trim() ? a.namaPewaris : '(tanpa nama)',
      formatTanggalPanjang(a.tanggalSurat),
      `${a.jumlahAhliWaris || 0} org`,
      a.status,
    ]);

    y = drawManualTable(doc, {
      startY: y,
      kolom: [
        { header: 'No', width: 10, align: 'center' },
        { header: 'ID Arsip', width: 30 },
        { header: 'Nomor SKW', width: 32 },
        { header: 'Nama Pewaris', width: 36 },
        { header: 'Tgl Terbit', width: 30 },
        { header: 'Ahli Waris', width: 20, align: 'center' },
        { header: 'Status', width: 22, align: 'center' },
      ],
      baris: daftarBaris,
      margin,
      topOffset,
      bottomLimit,
      fontSize: 8,
      headFontSize: 8,
      rowHeight: 5.6,
      headHeight: 6.2,
      cellStyler: (ri, ci, val) => {
        if (ci === 6) {
          if (val === 'Terverifikasi') return { warna: [21, 128, 61], tebal: true };
          if (val === 'Tersimpan') return { warna: [37, 99, 235], tebal: true };
          if (val === 'Diproses') return { warna: [180, 83, 9], tebal: true };
        }
        if (ci === 1) return { warna: [30, 64, 175], tebal: true };
        return undefined;
      },
    }) + 8;
  }

  // ===== (e) BAGIAN IV — RINGKASAN ANALISIS OTOMATIS =====
  sectionTitle('IV. RINGKASAN ANALISIS');
  bodyText('Analisis berikut dihitung otomatis dari data arsip pada periode laporan ini:');
  analisis.forEach((p) => bodyText(p));

  // ===== (f) HEADER LANJUTAN + FOOTER SEMUA HALAMAN =====
  const namaCetak = userInfo?.nama?.trim() || 'Operator SIWARIS';
  const roleCetak = userInfo?.role?.trim() || 'Pengguna';

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Header lanjutan untuk halaman 2+
    if (i > 1) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 64, 175);
      doc.text('LAPORAN ARSIP SKW', margin, 11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`${kop.namaKantor} • ${kop.namaKecamatan}`, pageWidth - margin, 11, { align: 'right' });
      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.25);
      doc.line(margin, 13.5, pageWidth - margin, 13.5);
    }

    // Footer: garis + dicetak oleh + timestamp + nomor halaman
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.25);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Dicetak oleh: ${namaCetak} (${roleCetak})`, margin, pageHeight - 10);

    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`Dicetak pada: ${tanggalCetak} • SIWARIS - Sistem Informasi Arsip SKW`, margin, pageHeight - 6.5);
    doc.text(
      `${kop.namaKantor}, ${kop.namaKecamatan}, ${kop.namaPemerintah}`,
      pageWidth - margin,
      pageHeight - 6.5,
      { align: 'right' }
    );
  }

  // ===== KELUARKAN PDF (UNDUH ATAU CETAK) =====
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const namaFile = `Laporan_Arsip_SKW_Sumbertaman_${stamp}.pdf`;

  if (mode === 'cetak' && typeof document !== 'undefined') {
    try {
      const blobUrl = URL.createObjectURL(doc.output('blob'));
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } finally {
          window.setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
            iframe.remove();
          }, 60000);
        }
      };
      document.body.appendChild(iframe);
      return;
    } catch {
      // Gagal menyiapkan mode cetak → jatuh kembali ke unduh
    }
  }

  doc.save(namaFile);
};
