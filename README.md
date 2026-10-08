# SIWARIS (Sistem Informasi Arsip Surat Keterangan Waris)
### Kelurahan Sumbertaman, Kecamatan Wonoasih, Kota Probolinggo

Aplikasi dashboard modern untuk pengelolaan, pencatatan, dan verifikasi arsip digital Surat Keterangan Waris (SKW) dengan antarmuka yang bersih, elegan, dan profesional bernuansa biru modern (*government-grade blue aesthetic*), didukung oleh **Convex Backend & Database** serta siap di-deploy langsung di **Vercel**.

---

## 🌟 Fitur Utama (Sesuai Rancangan Stakeholder & Disempurnakan)

1. **Dashboard Eksekutif**:
   - 4 Kartu KPI: Total SKW (128), Pewaris (128), Ahli Waris (367), dan Penerbitan Berjalan 2026.
   - Pencarian cepat terintegrasi dengan filter instan.
   - Tabel 5 arsip terbaru dengan status dan akses langsung ke detail & QR.
2. **Data Surat Keterangan Waris (SKW)**:
   - Pencatatan surat lengkap: Nomor SKW (contoh: `470/128/SKW/2026`), tanggal terbit, nama & NIK pewaris, tanggal meninggal, serta status verifikasi.
   - Modal interaktif **Tambah SKW Baru** dengan pembuat daftar ahli waris dinamis (tambah/hapus baris, relasi keluarga: Istri, Suami, Anak Kandung, Cucu, dll.) serta simulasi upload berkas scan.
   - Filter tabel berdasarkan status (*Terverifikasi*, *Tersimpan*, *Diproses*).
3. **Data Pewaris & Ahli Waris**:
   - Tampilan silsilah dan relasi hubungan keluarga setiap pewaris.
   - Fitur keamanan privasi NIK (*Masking / Unmasking NIK*).
4. **Arsip Digital & Dokumen**:
   - Pengarsipan berkas digital (PDF scan & salinan resmi).
   - Penampil dokumen (*Document Preview Viewer*) dengan cap watermark resmi *"ARSIP RESMI KELURAHAN SUMBERTAMAN"*, kontrol zoom, dan opsi unduh berkas.
5. **Pencarian & Pelacakan Arsip**:
   - Pencarian *real-time* multi-parameter (Nama Pewaris, NIK, No SKW, ID Arsip).
   - Filter berdasarkan tahun penerbitan (2024, 2025, 2026).
6. **Laporan & Statistik**:
   - Rekapitulasi perbandingan tahunan (2024, 2025, 2026).
   - Grafik batang visual (*CSS Animated Progress Bars*).
   - Fitur **Export Excel / CSV** (dengan format UTF-8 BOM yang langsung rapi di Microsoft Excel).
   - Fitur **Cetak Laporan Resmi** (`window.print()` dengan stylesheet khusus cetak).
7. **Format Surat Resmi (Kop Surat Kelurahan)**:
   - Format cetak surat resmi lengkap dengan Kop Surat Pemerintah Kota Probolinggo, Kecamatan Wonoasih, Kelurahan Sumbertaman, garis ganda resmi, dan tanda tangan elektronik Lurah.
8. **QR Code Verifikasi**:
   - Generator QR Code digital untuk validasi keaslian surat fisik/digital oleh instansi (Perbankan, BPN, Notaris, Pengadilan Agama).
   - Opsi unduh QR Code berformat PNG resolusi tinggi.
9. **Manajemen Pengguna**:
   - Pengaturan akun staf operator pelayanan, sekretaris kelurahan, dan Lurah Sumbertaman.
   - Tambah staf baru dan aktifasi/nonaktifkan akun.

---

## 🛠️ Arsitektur Teknologi

- **Frontend**: React 18, TypeScript, Vite
- **Desain & Styling**: Vanilla CSS Modern Design System (Palette: Royal Blue, Slate, Sapphire, Sky Blue, Glassmorphism, Responsive Mobile & Desktop, Micro-animations)
- **Ikon**: Lucide React
- **QR Code**: QRCode generator
- **Backend & Database**: **Convex** (`convex.dev`) — real-time queries, mutations, indexes, cloud file storage & local backend support
- **Hosting**: **Vercel** (`vercel.json` SPA routing support)

---

## 🚀 Cara Menjalankan Secara Lokal

### 1. Jalankan Frontend
```bash
npm install
npm run dev
```
Buka peramban di: `http://localhost:5173/`

### 2. Jalankan Backend Convex
```bash
npx convex dev
```
Backend Convex akan otomatis mengaktifkan server backend lokal (`http://127.0.0.1:3210`) atau menghubungkan ke cloud Convex Anda.

---

## ☁️ Panduan Deploy ke Vercel

1. Push repository ini ke GitHub / GitLab.
2. Buka dashboard [Vercel](https://vercel.com/) dan impor repository ini.
3. Konfigurasi build setting di Vercel:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Tambahkan **Environment Variable** di project settings Vercel:
   - `VITE_CONVEX_URL`: URL deployment Convex Anda (contoh: `https://xxxx.convex.cloud`)
5. Klik **Deploy**! Aplikasi SIWARIS akan langsung aktif secara global.
