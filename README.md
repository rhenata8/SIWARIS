# SIWARIS (Sistem Informasi Arsip Surat Keterangan Waris)
### Kelurahan Sumbertaman, Kecamatan Wonoasih, Kota Probolinggo

[![Deployment Status](https://img.shields.io/badge/Deployment-Live%20on%20Vercel-brightgreen)](https://siwaris-three.vercel.app/)
[![Database](https://img.shields.io/badge/Database-Convex%20Cloud-blue)](https://convex.dev/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-blueviolet)](https://react.dev/)
[![Integrity](https://img.shields.io/badge/Tests-11%2F11%20Passed-success)](https://github.com/rhenata8/SIWARIS)

SIWARIS adalah aplikasi web modern dan sistem informasi pengarsipan digital Surat Keterangan Waris (SKW) resmi untuk **Kelurahan Sumbertaman, Kecamatan Wonoasih, Kota Probolinggo**. 

Sistem ini didesain dengan standar antarmuka pemerintahan modern (*government-grade blue aesthetic*), arsitektur *serverless real-time backend* didukung oleh **Convex Database & Cloud Functions**, dan telah terintegrasi untuk *continuous deployment* melalui **Vercel**.

---

## 🌟 Fitur Utama

### 1. Dashboard Eksekutif & Statistik Real-Time
- **Metrik KPI Akurat**: Menghitung secara otomatis Total SKW terbit, Pewaris unik, total Ahli Waris, dan total SKW tahun berjalan langsung dari database Convex.
- **Pencarian Cepat**: Pelacakan instan di header berdasarkan nama pewaris, NIK, nomor SKW, maupun ID arsip.
- **Tabel 5 Arsip Terbaru**: Akses cepat ke berkas yang baru diterbitkan beserta status verifikasinya.

### 2. Pengelolaan Data Surat Keterangan Waris (SKW)
- **Pencatatan Surat Lengkap**: Nomor SKW resmi (contoh: `500.17.4.1/0759.PE/425.503.6/2026`), tanggal permohonan, tanggal meninggal dunia, data pewaris, dan status berkas (*Terverifikasi*, *Tersimpan*, *Diproses*).
- **Daftar Ahli Waris Dinamis**: Input relasi keluarga fleksibel (Istri, Suami, Anak Kandung, Cucu, dsb.) dengan validasi minimal 1 ahli waris.
- **Pencegahan Human Error & Duplikasi Form**: Modal form dilengkapi pembersihan state (*auto-reset*) saat ditutup atau dibuka kembali, mencegah tertinggalnya data lama.

### 3. Keamanan Data & Validasi Multi-Lapis
- **Atomic ID Generation Server-Side**: Sequence ID arsip (`SW-SBT-YYYY-XXXX`) di-generate secara atomik di server Convex, mengeliminasi risiko *race condition* jika ada beberapa operator menginput bersamaan dari tab/perangkat berbeda.
- **Validasi Keunikan Nomor SKW**: Sistem menolak input nomor SKW ganda baik di sisi antarmuka maupun level mutasi basis data.
- **Proteksi Privasi NIK**: Fitur *masking/unmasking* NIK untuk melindungi data kependudukan warga.

### 4. Format Cetak Resmi & TTE (Kop Kelurahan)
- Format surat standar resmi berdasar regulasi Pemerintah Kota Probolinggo dengan Kop Surat dinas lengkap, garis ganda resmi, dan stempel digital.
- **QR Code Validasi**: Mengenerate QR Code unik untuk setiap surat fisik.
- **Halaman Verifikasi Publik** (`/validasi/:idArsip`): Instansi eksternal (Perbankan, BPN, Notaris, Pengadilan Agama) dapat memindai QR Code untuk memeriksa keaslian dan status arsip secara langsung.

### 5. Arsip Digital & Pratinjau Dokumen
- Penampil dokumen (*Document Preview Viewer*) dengan kontrol zoom in/out, rotasi, watermark dinamis *"ARSIP RESMI KELURAHAN SUMBERTAMAN"*, serta opsi unduh PDF.

### 6. Laporan, Rekapitulasi, & Ekspor
- Grafik perbandingan volume arsip per tahun (2024, 2025, 2026).
- **Ekspor Excel / CSV**: Kompatibel dengan Microsoft Excel (UTF-8 BOM encoding).
- **Cetak Laporan**: Template cetak bersih via tombol cetak browser teroptimasi.

### 7. Manajemen Pengguna & Hak Akses
- Pengaturan akun staf operator pelayanan, sekretaris kelurahan, dan Lurah Sumbertaman.

---

## 🛠️ Arsitektur Teknologi

| Komponen | Teknologi | Keterangan |
|---|---|---|
| **Frontend Framework** | React 18, TypeScript, Vite 6 | SPA responsif berkinerja tinggi |
| **Styling** | Vanilla CSS Design System | Modern government blue, glassmorphism, micro-animations |
| **Ikon** | Lucide React | Ikon modern dan konsisten |
| **QR Code & PDF** | `qrcode`, `jspdf`, `html2canvas` | Pembuatan QR verifikasi & cetak dokumen |
| **Backend & Database** | **Convex** (`convex.dev`) | Database reaktif, transaksi atomik, serverless functions |
| **Hosting & CI/CD** | **Vercel** + GitHub Integration | Otomatisasi deploy saat commit ke branch `main` |

---

## 📁 Struktur Direktori

```text
SIWARIS/
├── convex/                          # Skema & Backend Cloud Functions (Convex)
│   ├── _generated/                  # Kode binding otomatis Convex
│   ├── schema.ts                    # Skema tabel 'archives' & 'users' beserta index
│   ├── skw.ts                       # Mutasi, Query, Atomic ID Generator, Dedup, Reassign
│   └── users.ts                     # Autentikasi dan manajemen pengguna
├── public/                          # Aset statis & logo instansi
├── scripts/                         # Script otomasi, tes integritas, dan build
│   ├── apply-dedup-and-verify.cjs   # Script perapian dan verifikasi ID arsip
│   ├── audit-all-duplicates.cjs     # Audit duplikasi Nomor SKW, Pewaris, File
│   ├── build.js                     # Script build untuk Vercel (Convex + Vite)
│   ├── check-all-records.cjs        # Timeline inspeksi entri data
│   └── test-dedup-and-integrity.cjs # Suite pengujian integritas 11 skenario
├── src/
│   ├── components/                  # Komponen UI modular (Modal, Header, Sidebar, Preview)
│   ├── context/                     # AppContext (State management & Convex client wrapper)
│   ├── pages/                       # Halaman tampilan aplikasi
│   ├── types/                       # Definisi tipe TypeScript
│   ├── App.tsx                      # Root component & routing
│   └── main.tsx                     # Entry point React
├── index.html                       # HTML Template
├── package.json                     # Konfigurasi dependensi dan scripts
└── vercel.json                      # Konfigurasi SPA rewrite untuk Vercel
```

---

## 🚀 Panduan Menjalankan Secara Lokal

### Prasyarat
- Node.js versi 18 atau lebih baru
- NPM atau PNPM

### 1. Kloning Repository
```bash
git clone https://github.com/rhenata8/SIWARIS.git
cd SIWARIS
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat berkas `.env.local` di direktori root:
```env
VITE_CONVEX_URL=https://giddy-mule-928.convex.cloud
```

### 4. Jalankan Aplikasi
```bash
npm run dev
```
Buka peramban di: `http://localhost:5173/`

---

## 🧪 Pengujian Integritas & Audit Data

Aplikasi dilengkapi suite pengujian otomatis untuk memvalidasi keutuhan data dan menguji ketahanan terhadap *race condition*:

```bash
# Menjalankan 11 pengujian integritas (Deduplikasi, Reassign ID, Concurrent Insert, NomorSKW uniqueness)
npm run test:integrity

# Menjalankan audit menyeluruh terhadap data duplikat
npm run audit:duplicates
```

Hasil pengujian otomatis:
- ✅ **Initial State Analysis**: Memeriksa seluruh baris data.
- ✅ **Deduplication Mutation**: Menghapus duplikasi arsip tanpa data loss.
- ✅ **Sequential ID Verification**: Memastikan format `SW-SBT-YYYY-XXXX` urut dari 0001 tanpa celah.
- ✅ **Concurrent Race Condition Test**: Mensimulasikan 5 input bersamaan untuk membuktikan keunikan ID atomik.
- ✅ **Nomor SKW Uniqueness**: Memvalidasi bahwa setiap nomor surat unik di database.
- ✅ **Stats Synchronous Check**: Memvalidasi kecocokan total SKW & ahli waris di dashboard.

---

## ☁️ Panduan Deploy ke Vercel

1. Push repository ke GitHub:
   ```bash
   git push origin main
   ```
2. Hubungkan repository ke project di [Vercel](https://vercel.com/).
3. Atur **Environment Variables** di dashboard Vercel (`Project Settings > Environment Variables`):
   - `VITE_CONVEX_URL`: URL deployment Convex produksi (`https://giddy-mule-928.convex.cloud`)
   - `CONVEX_DEPLOY_KEY`: Production deploy key Convex Anda (opsional, untuk auto-deploy fungsi Convex saat build).
4. Vercel akan otomatis menjalankan build melalui script `scripts/build.js` dan mempublikasikan versi terbaru.

---

## 🏛️ Lisensi & Hak Cipta

Dikembangkan untuk **Pemerintah Kelurahan Sumbertaman, Kecamatan Wonoasih, Kota Probolinggo**.  
Seluruh hak cipta dan kepemilikan data dilindungi.
