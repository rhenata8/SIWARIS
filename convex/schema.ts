import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  archives: defineTable({
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
    status: v.string(), // "Tersimpan" | "Terverifikasi" | "Diproses"
    catatan: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileSize: v.optional(v.string()),
    tahun: v.number(),
    createdAt: v.number(),
  })
    .index("by_idArsip", ["idArsip"])
    .index("by_nomorSKW", ["nomorSKW"])
    .index("by_tahun", ["tahun"])
    .searchIndex("search_archives", {
      searchField: "namaPewaris",
      filterFields: ["tahun", "status"],
    }),

  users: defineTable({
    nama: v.string(),
    username: v.string(),
    nip: v.optional(v.string()),
    role: v.string(),
    status: v.string(), // "Aktif" | "Nonaktif"
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_username", ["username"]),
});
