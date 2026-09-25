import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Isolasi user terpusat (prompt §6). Query lewat `db` otomatis inject
 * userId ke where (find/update/delete/count) dan data (create).
 * Handler TIDAK menulis userId manual.
 *
 * Model TANPA kolom userId (log, refresh token) dikecualikan — aksesnya
 * lewat relasi application.jobApplicationId milik user.
 *
 * Operasi sistem (register/login/refresh) memakai `root` = client dasar
 * tanpa scoping — eksplisit agar tidak lupa.
 */

const als = new AsyncLocalStorage<{ userId: bigint }>();

/** Jalankan fn dalam context user; semua query db() di dalamnya ter-scope. */
export function withUser<T>(userId: bigint, fn: () => Promise<T>): Promise<T> {
  return als.run({ userId }, fn);
}

export function currentUserId(): bigint | undefined {
  return als.getStore()?.userId;
}

export const root = new PrismaClient();

/** Model yang tidak punya kolom user_id — tidak di-inject. */
const NO_USER_MODELS = new Set(["ApplicationStatusLog"]);

type ScopedArgs = Record<string, any>;

function scopeArgs(operation: string, args: ScopedArgs, userId: bigint): void {
  if (args == null) return;
  if (operation === "create") {
    args.data = { ...args.data, userId };
  } else if (operation === "createMany") {
    if (Array.isArray(args.data)) {
      args.data = args.data.map((d: any) => ({ ...d, userId }));
    } else {
      args.data = { ...args.data, userId };
    }
  }
  // Where WAJIB ada — findMany/count tanpa where pun harus ter-scope.
  if ("where" in args || !["create", "createMany"].includes(operation)) {
    args.where = { ...(args.where ?? {}), userId };
  }
}

export const db = root.$extends({
  query: {
    $allModels: {
      $allOperations({ model, operation, args, query }) {
        if (model && NO_USER_MODELS.has(model)) {
          return query(args);
        }
        const userId = currentUserId();
        if (!userId) {
          return Promise.reject(
            new Error(
              "Query di luar user scope. Pakai withUser() atau root client untuk operasi sistem.",
            ),
          );
        }
        scopeArgs(operation, args as ScopedArgs, userId);
        return query(args);
      },
    },
  },
});

export type Db = typeof db;
