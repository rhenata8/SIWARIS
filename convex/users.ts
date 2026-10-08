import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const createUser = mutation({
  args: {
    nama: v.string(),
    username: v.string(),
    nip: v.optional(v.string()),
    role: v.string(),
    status: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const toggleUserStatus = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");
    const newStatus = user.status === "Aktif" ? "Nonaktif" : "Aktif";
    await ctx.db.patch(args.id, { status: newStatus });
    return newStatus;
  },
});

export const seedUsers = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("users").first();
    if (existing) return;

    const initialUsers = [
      {
        nama: "Operator Kelurahan Sumbertaman",
        username: "operator",
        nip: "19880412 201201 1 002",
        role: "Operator Pelayanan",
        status: "Aktif",
        email: "operator.sumbertaman@probolinggokota.go.id",
        createdAt: Date.now(),
      },
      {
        nama: "Drs. H. M. Syaifullah, M.Si",
        username: "lurah",
        nip: "19740615 199803 1 004",
        role: "Lurah Sumbertaman",
        status: "Aktif",
        email: "lurah.sumbertaman@probolinggokota.go.id",
        createdAt: Date.now(),
      },
      {
        nama: "Anisa Fitriani, S.STP",
        username: "sekkel",
        nip: "19910214 201402 2 001",
        role: "Sekretaris Kelurahan",
        status: "Aktif",
        email: "sekkel.sumbertaman@probolinggokota.go.id",
        createdAt: Date.now(),
      },
    ];

    for (const u of initialUsers) {
      await ctx.db.insert("users", u);
    }
  },
});
