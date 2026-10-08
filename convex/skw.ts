import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getArchives = query({
  args: {
    searchTerm: v.optional(v.string()),
    status: v.optional(v.string()),
    tahun: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let archives = await ctx.db.query("archives").order("desc").collect();

    if (args.searchTerm && args.searchTerm.trim() !== "") {
      const q = args.searchTerm.toLowerCase().trim();
      archives = archives.filter(
        (a) =>
          a.namaPewaris.toLowerCase().includes(q) ||
          a.nomorSKW.toLowerCase().includes(q) ||
          a.idArsip.toLowerCase().includes(q) ||
          a.nikPewaris.toLowerCase().includes(q)
      );
    }

    if (args.status && args.status !== "Semua") {
      archives = archives.filter((a) => a.status === args.status);
    }

    if (args.tahun) {
      archives = archives.filter((a) => a.tahun === args.tahun);
    }

    return archives;
  },
});

export const getArchiveById = query({
  args: { id: v.id("archives") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getStats = query({
  handler: async (ctx) => {
    const archives = await ctx.db.query("archives").collect();
    const currentYear = new Date().getFullYear();

    const totalSKW = archives.length;
    const totalPewaris = new Set(archives.map((a) => a.nikPewaris || a.namaPewaris)).size;
    const totalAhliWaris = archives.reduce((acc, a) => acc + (a.jumlahAhliWaris || 0), 0);
    const thisYearCount = archives.filter((a) => a.tahun === currentYear).length;

    // Per tahun counts
    const perYearMap: Record<number, number> = {};
    for (const a of archives) {
      perYearMap[a.tahun] = (perYearMap[a.tahun] || 0) + 1;
    }

    // Status breakdown
    const statusMap: Record<string, number> = {};
    for (const a of archives) {
      statusMap[a.status] = (statusMap[a.status] || 0) + 1;
    }

    return {
      totalSKW,
      totalPewaris,
      totalAhliWaris,
      thisYearCount,
      currentYear,
      perYearMap,
      statusMap,
      recent: archives.slice(0, 5),
    };
  },
});

export const createArchive = mutation({
  args: {
    idArsip: v.string(),
    nomorSKW: v.string(),
    namaPewaris: v.string(),
    nikPewaris: v.string(),
    tanggalSurat: v.string(),
    tanggalMeninggal: v.string(),
    jumlahAhliWaris: v.number(),
    ahliWarisList: v.array(
      v.object({
        nama: v.string(),
        hubungan: v.string(),
        nik: v.optional(v.string()),
      })
    ),
    alamat: v.optional(v.string()),
    status: v.string(),
    catatan: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileSize: v.optional(v.string()),
    tahun: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("archives", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateArchive = mutation({
  args: {
    id: v.id("archives"),
    nomorSKW: v.optional(v.string()),
    namaPewaris: v.optional(v.string()),
    nikPewaris: v.optional(v.string()),
    tanggalSurat: v.optional(v.string()),
    tanggalMeninggal: v.optional(v.string()),
    jumlahAhliWaris: v.optional(v.number()),
    ahliWarisList: v.optional(
      v.array(
        v.object({
          nama: v.string(),
          hubungan: v.string(),
          nik: v.optional(v.string()),
        })
      )
    ),
    alamat: v.optional(v.string()),
    status: v.optional(v.string()),
    catatan: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileSize: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteArchive = mutation({
  args: { id: v.id("archives") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const seedInitialData = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("archives").first();
    if (existing) {
      return { status: "already_seeded" };
    }

    const defaultData = [
      {
        idArsip: "SW-SBT-2026-0001",
        nomorSKW: "470/123/SKW/2026",
        namaPewaris: "Budi Santoso",
        nikPewaris: "3574011205650001",
        tanggalSurat: "2026-08-12",
        tanggalMeninggal: "2026-07-30",
        jumlahAhliWaris: 4,
        ahliWarisList: [
          { nama: "Dewi Lestari", hubungan: "Istri", nik: "3574015003700002" },
          { nama: "Agus Pratama", hubungan: "Anak Kandung", nik: "3574011004950003" },
          { nama: "Rina Anggraeni", hubungan: "Anak Kandung", nik: "3574015509980004" },
          { nama: "Dimas Saputra", hubungan: "Anak Kandung", nik: "3574012011020005" },
        ],
        alamat: "Jl. Mastrip RT 03 / RW 02, Kel. Sumbertaman",
        status: "Terverifikasi",
        catatan: "Dokumen asli telah diverifikasi oleh Kasi Pelayanan",
        fileName: "SKW_Budi_Santoso_Scan.pdf",
        fileSize: "1.4 MB",
        tahun: 2026,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 50,
      },
      {
        idArsip: "SW-SBT-2026-0002",
        nomorSKW: "470/124/SKW/2026",
        namaPewaris: "Siti Aminah",
        nikPewaris: "3574014508680003",
        tanggalSurat: "2026-08-18",
        tanggalMeninggal: "2026-08-02",
        jumlahAhliWaris: 3,
        ahliWarisList: [
          { nama: "Ahmad Fauzi", hubungan: "Suami", nik: "3574011402660001" },
          { nama: "Nurul Hidayati", hubungan: "Anak Kandung", nik: "3574016107930002" },
          { nama: "Bambang Trianto", hubungan: "Anak Kandung", nik: "3574012512960004" },
        ],
        alamat: "Jl. Slamet Riyadi No. 44 RT 01 / RW 05, Kel. Sumbertaman",
        status: "Tersimpan",
        catatan: "Menunggu tanda tangan pengesahan fisik Lurah",
        fileName: "SKW_Siti_Aminah_Resmi.pdf",
        fileSize: "890 KB",
        tahun: 2026,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 44,
      },
      {
        idArsip: "SW-SBT-2026-0003",
        nomorSKW: "470/125/SKW/2026",
        namaPewaris: "Hadi Wijaya",
        nikPewaris: "3574010811550002",
        tanggalSurat: "2026-09-02",
        tanggalMeninggal: "2026-08-19",
        jumlahAhliWaris: 2,
        ahliWarisList: [
          { nama: "Sri Wahyuni", hubungan: "Istri", nik: "3574014704600003" },
          { nama: "Yudi Purnomo", hubungan: "Anak Kandung", nik: "3574011905890001" },
        ],
        alamat: "Jl. Bengawan Solo RT 04 / RW 01, Kel. Sumbertaman",
        status: "Terverifikasi",
        catatan: "Arsip buku register lengkap",
        fileName: "SKW_Hadi_Wijaya_Final.pdf",
        fileSize: "2.1 MB",
        tahun: 2026,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
      },
      {
        idArsip: "SW-SBT-2026-0004",
        nomorSKW: "470/126/SKW/2026",
        namaPewaris: "Kusuma Wardana",
        nikPewaris: "3574012204720004",
        tanggalSurat: "2026-09-15",
        tanggalMeninggal: "2026-09-01",
        jumlahAhliWaris: 3,
        ahliWarisList: [
          { nama: "Endang Supriyati", hubungan: "Istri", nik: "3574015206740001" },
          { nama: "Fajar Kusuma", hubungan: "Anak Kandung", nik: "3574011108010003" },
          { nama: "Anisa Kusuma", hubungan: "Anak Kandung", nik: "3574014909050005" },
        ],
        alamat: "Perum Sumbertaman Indah Blok C-12, Kel. Sumbertaman",
        status: "Tersimpan",
        catatan: "Dokumen pengantar RT/RW terlampir",
        fileName: "SKW_Kusuma_Wardana.pdf",
        fileSize: "1.2 MB",
        tahun: 2026,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 16,
      },
      {
        idArsip: "SW-SBT-2026-0005",
        nomorSKW: "470/127/SKW/2026",
        namaPewaris: "Suwandi Pratomo",
        nikPewaris: "3574010503600009",
        tanggalSurat: "2026-09-28",
        tanggalMeninggal: "2026-09-10",
        jumlahAhliWaris: 5,
        ahliWarisList: [
          { nama: "Siti Maryam", hubungan: "Istri", nik: "3574014401630002" },
          { nama: "Hendra Suwandi", hubungan: "Anak Kandung", nik: "3574011802870004" },
          { nama: "Indah Suwandi", hubungan: "Anak Kandung", nik: "3574015607900006" },
          { nama: "Bayu Suwandi", hubungan: "Anak Kandung", nik: "3574012304950008" },
          { nama: "Tri Suwandi", hubungan: "Anak Kandung", nik: "3574010908990001" },
        ],
        alamat: "Jl. Merapi Gang 2 RT 02 / RW 03, Kel. Sumbertaman",
        status: "Terverifikasi",
        catatan: "Lengkap dengan surat kematian dari RSUD",
        fileName: "SKW_Suwandi_Pratomo.pdf",
        fileSize: "3.4 MB",
        tahun: 2026,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
      },
    ];

    for (const item of defaultData) {
      await ctx.db.insert("archives", item);
    }

    return { status: "seeded", count: defaultData.length };
  },
});
