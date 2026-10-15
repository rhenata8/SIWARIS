"use node";

import { v, ConvexError } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * SIWARIS Auth — Node.js actions.
 * Only actions may live in "use node" files, so password hashing
 * (scrypt) and secure token generation happen here, coordinating
 * with the DB via internal queries/mutations.
 *
 * - Passwords: scrypt + per-user random salt, stored as `salt:hash`.
 * - Sessions: 32-byte random token, 7-day expiry, stored server-side.
 * - Register: admin-only (valid admin session token required).
 */

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const candidate = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    if (candidate.length !== expected.length) return false;
    return timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

function publicUser(u: any) {
  if (!u) return null;
  return {
    _id: u._id,
    nama: u.nama,
    username: u.username,
    nip: u.nip,
    role: u.role,
    status: u.status,
    email: u.email,
    avatar: u.avatar,
    createdAt: u.createdAt,
  };
}

export const login = action({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const username = args.username.trim().toLowerCase();
    const user: any = await ctx.runQuery(internal.auth.getUserForAuth, { username });

    // Structured results (not throws) so error messages reach the client
    // cleanly — errors thrown from Node actions surface as generic
    // "Server Error" on the browser side.
    if (!user) {
      return { ok: false, error: "Username atau password salah." };
    }
    if (user.status !== "Aktif") {
      return { ok: false, error: "Akun ini nonaktif. Hubungi administrator kelurahan." };
    }
    if (!user.passwordHash || !verifyPassword(args.password, user.passwordHash)) {
      return { ok: false, error: "Username atau password salah." };
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = Date.now() + SESSION_TTL_MS;
    await ctx.runMutation(internal.auth.createSession, {
      token,
      userId: user._id,
      expiresAt,
    });

    return { ok: true, token, expiresAt, user: publicUser(user) };
  },
});

/**
 * Ensure the built-in administrator account exists with the given credentials.
 * Idempotent — called on app boot. Password is supplied at runtime by the
 * frontend boot sequence, never hard-coded in the repo.
 */
export const seedAdmin = action({
  args: {
    username: v.string(),
    password: v.string(),
    nama: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const username = args.username.trim().toLowerCase();
    const existing: any = await ctx.runQuery(internal.auth.findUserByUsername, { username });
    if (existing) {
      if (!existing.passwordHash) {
        await ctx.runMutation(internal.auth.setUserPasswordHash, {
          userId: existing._id,
          passwordHash: hashPassword(args.password),
        });
        return { status: "upgraded", username };
      }
      return { status: "exists", username };
    }
    await ctx.runMutation(internal.auth.insertUserWithHash, {
      nama: args.nama || "Administrator Kelurahan",
      username,
      role: "Administrator",
      status: "Aktif",
      email: "admin@kelurahan-sumbertaman.go.id",
      passwordHash: hashPassword(args.password),
    });
    return { status: "created", username };
  },
});

export const registerUser = action({
  args: {
    adminToken: v.string(),
    nama: v.string(),
    username: v.string(),
    password: v.string(),
    role: v.string(),
    nip: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Only the administrator may register new users
    const session: any = await ctx.runQuery(internal.auth.validateSession, {
      token: args.adminToken,
    });
    if (!session) {
      return { ok: false, error: "Sesi admin tidak valid atau sudah berakhir. Silakan login ulang." };
    }
    const admin = session.user;
    if (admin.username !== "admin" && admin.role !== "Administrator") {
      return { ok: false, error: "Hanya administrator yang dapat mendaftarkan pengguna baru." };
    }

    const username = args.username.trim().toLowerCase();
    if (username.length < 3) {
      return { ok: false, error: "Username minimal 3 karakter." };
    }
    if (args.password.length < 6) {
      return { ok: false, error: "Password minimal 6 karakter." };
    }

    const existing: any = await ctx.runQuery(internal.auth.findUserByUsername, { username });
    if (existing) {
      return { ok: false, error: `Username "${username}" sudah digunakan.` };
    }

    const id: any = await ctx.runMutation(internal.auth.insertUserWithHash, {
      nama: args.nama.trim(),
      username,
      role: args.role || "Operator Pelayanan",
      nip: args.nip,
      email: args.email,
      status: "Aktif",
      passwordHash: hashPassword(args.password),
    });

    const created: any = await ctx.runQuery(internal.auth.getUserForAuth, { username });
    return { ok: true, id, user: publicUser(created) };
  },
});

/**
 * Admin resets another user's password.
 * Requires a valid admin session (username "admin" or role "Administrator").
 * Returns structured results (not throws) so error messages reach the
 * client cleanly — errors thrown from Node actions surface as generic
 * "Server Error" on the browser side.
 */
export const changeUserPassword = action({
  args: {
    adminToken: v.string(),
    targetUserId: v.id("users"),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const session: any = await ctx.runQuery(internal.auth.validateSession, {
      token: args.adminToken,
    });
    if (!session) {
      return { ok: false, error: "Sesi admin tidak valid atau sudah berakhir. Silakan login ulang." };
    }
    const admin = session.user;
    if (admin.username !== "admin" && admin.role !== "Administrator") {
      return { ok: false, error: "Hanya administrator yang dapat mengubah password pengguna lain." };
    }
    if (args.newPassword.length < 6) {
      return { ok: false, error: "Password baru minimal 6 karakter." };
    }

    const target: any = await ctx.runQuery(internal.auth.getUserById, {
      userId: args.targetUserId,
    });
    if (!target) {
      return { ok: false, error: "Pengguna tidak ditemukan." };
    }

    await ctx.runMutation(internal.auth.setUserPasswordHash, {
      userId: args.targetUserId,
      passwordHash: hashPassword(args.newPassword),
    });
    return { ok: true };
  },
});

/**
 * Change the password of the currently logged-in user.
 * Requires the old password to match before the new one is stored.
 */
export const changeOwnPassword = action({
  args: {
    token: v.string(),
    oldPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const session: any = await ctx.runQuery(internal.auth.validateSession, {
      token: args.token,
    });
    if (!session) {
      return { ok: false, error: "Sesi tidak valid atau sudah berakhir. Silakan login ulang." };
    }
    if (args.newPassword.length < 6) {
      return { ok: false, error: "Password baru minimal 6 karakter." };
    }

    const me: any = await ctx.runQuery(internal.auth.getUserById, {
      userId: session.user._id,
    });
    if (!me) {
      return { ok: false, error: "Data pengguna tidak ditemukan." };
    }
    if (!me.passwordHash || !verifyPassword(args.oldPassword, me.passwordHash)) {
      return { ok: false, error: "Password lama salah." };
    }
    if (args.oldPassword === args.newPassword) {
      return { ok: false, error: "Password baru tidak boleh sama dengan password lama." };
    }

    await ctx.runMutation(internal.auth.setUserPasswordHash, {
      userId: me._id,
      passwordHash: hashPassword(args.newPassword),
    });
    return { ok: true };
  },
});
