export interface AhliWaris {
  nama: string;
  hubungan: string;
  nik?: string;
}

export interface ArchiveSKW {
  _id?: string;
  idArsip: string;
  nomorSKW: string;
  namaPewaris: string;
  nikPewaris: string;
  tanggalSurat: string;
  tanggalMeninggal: string;
  jumlahAhliWaris: number;
  ahliWarisList: AhliWaris[];
  alamat?: string;
  status: 'Tersimpan' | 'Terverifikasi' | 'Diproses';
  catatan?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: string;
  tahun: number;
  createdAt: number;
}

export interface User {
  _id?: string;
  nama: string;
  username: string;
  nip?: string;
  role: string;
  status: 'Aktif' | 'Nonaktif';
  email?: string;
  createdAt: number;
}

export type PageId =
  | 'dashboard'
  | 'surat'
  | 'pewaris'
  | 'arsip'
  | 'pencarian'
  | 'laporan'
  | 'pengguna';
