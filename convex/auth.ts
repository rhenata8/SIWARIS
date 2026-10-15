import { v } from "convex/values";
import { internalQuery, internalMutation, mutation, query } from "./_generated/server";

/**
 * SIWARIS Auth — DB-side helpers (V8 runtime).
 * Crypto (scrypt) lives in authActions.ts ("use node" actions).
 * These internal functions are NOT exposed as public API surface
 * but are called from the actions.
 */

export const getUserForAuth = internalQuery({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    if (!user) return null;
    return {
      _id: user._id,
      nama: user.nama,
      username: user.username,
      nip: user.nip,
      role: user.role,
      status: user.status,
      email: user.email,
      avatar: user.avatar,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
    };
  },
});

export const createSession = internalMutation({
  args: { token: v.string(), userId: v.id("users"), expiresAt: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.insert("sessions", {
      token: args.token,
      userId: args.userId,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });
    return true;
  },
});

export const validateSession = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session) return null;
    if (session.expiresAt < Date.now()) return null;
    const user = await ctx.db.get(session.userId);
    if (!user || user.status !== "Aktif") return null;
    return {
      user: {
        _id: user._id,
        nama: user.nama,
        username: user.username,
        nip: user.nip,
        role: user.role,
        status: user.status,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      expiresAt: session.expiresAt,
    };
  },
});

export const findUserByUsername = internalQuery({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});

/**
 * Fetch a single user by ID, including passwordHash.
 * Internal-only — used by the auth actions (password change flows).
 */
export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      nama: user.nama,
      username: user.username,
      nip: user.nip,
      role: user.role,
      status: user.status,
      email: user.email,
      avatar: user.avatar,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
    };
  },
});

export const insertUserWithHash = internalMutation({
  args: {
    nama: v.string(),
    username: v.string(),
    role: v.string(),
    passwordHash: v.string(),
    nip: v.optional(v.string()),
    email: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("users", {
      nama: args.nama,
      username: args.username,
      nip: args.nip,
      role: args.role,
      status: args.status || "Aktif",
      email: args.email,
      passwordHash: args.passwordHash,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const setUserPasswordHash = internalMutation({
  args: { userId: v.id("users"), passwordHash: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { passwordHash: args.passwordHash });
    return true;
  },
});

/** Public session validation — returns the logged-in user (no hash). */
export const getSession = query({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<{ user: any; expiresAt: number } | null> => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session) return null;
    if (session.expiresAt < Date.now()) return null;
    const user = await ctx.db.get(session.userId);
    if (!user || user.status !== "Aktif") return null;
    return {
      user: {
        _id: user._id,
        nama: user.nama,
        username: user.username,
        nip: user.nip,
        role: user.role,
        status: user.status,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      expiresAt: session.expiresAt,
    };
  },
});

/** Public logout mutation — deletes the session row. No crypto needed. */
export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (session) {
      await ctx.db.delete(session._id);
    }
    return { ok: true };
  },
});
