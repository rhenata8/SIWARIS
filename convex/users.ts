import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";

export const getUsers = query({
  handler: async (ctx) => {
    // Never expose password hashes to the client
    const users = await ctx.db.query("users").collect();
    return users.map((u) => {
      const { passwordHash, ...safe } = u;
      return safe;
    });
  },
});

/**
 * SIWARIS v2.2 — Admin-only user listing.
 * Validates the session token inline (queries cannot call actions) and
 * returns users without passwordHash.
 */
export const listUsers = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.adminToken))
      .first();
    if (!session || session.expiresAt < Date.now()) {
      throw new ConvexError("Sesi tidak valid atau sudah berakhir. Silakan login ulang.");
    }
    const me = await ctx.db.get(session.userId);
    if (!me || me.status !== "Aktif" || (me.username !== "admin" && me.role !== "Administrator")) {
      throw new ConvexError("Hanya administrator yang dapat melihat daftar pengguna.");
    }
    const users = await ctx.db.query("users").collect();
    return users
      .map((u) => {
        const { passwordHash, ...safe } = u;
        return safe;
      })
      .sort((a, b) => a.createdAt - b.createdAt);
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
