import { describe, expect, it, beforeAll } from "vitest";
import { root, withUser, db, currentUserId } from "../src/db";
import { createTestUser, resetDb } from "./setup";
import { changeApplicationStatus, NotFoundError } from "../src/services/applications";

/**
 * Test isolasi user (wajib checkpoint Fase 1, prompt §6):
 * user A tidak bisa baca/ubah/hapus data user B by ID → hasil kosong/404,
 * bukan 403 — tidak bocorkan keberadaan data.
 */

async function firstAppIdOf(userId: bigint): Promise<bigint> {
  const row = await root.jobApplication.findFirst({ where: { userId }, select: { id: true } });
  if (!row) throw new Error("seed user tidak menghasilkan lamaran");
  return row.id;
}

describe("Isolasi user (terpusat via client extension)", () => {
  let userA: bigint;
  let userB: bigint;
  let appB_id: bigint;

  beforeAll(async () => {
    await resetDb();
    userA = await createTestUser("a@test.id", "User A");
    userB = await createTestUser("b@test.id", "User B");
    appB_id = await firstAppIdOf(userB);
  }, 180_000);

  it("list A hanya memuat data A", async () => {
    await withUser(userA, async () => {
      const items = await db.jobApplication.findMany();
      expect(items.length).toBeGreaterThan(0);
      expect(items.every((x) => x.userId === userA)).toBe(true);
      expect(items.some((x) => x.userId === userB)).toBe(false);
    });
  });

  it("A findFirst data B by ID → null", async () => {
    await withUser(userA, async () => {
      const found = await db.jobApplication.findFirst({ where: { id: appB_id } });
      expect(found).toBeNull();
    });
  });

  it("A update data B by ID → 0 baris terpengaruh (updateMany)", async () => {
    await withUser(userA, async () => {
      const res = await db.jobApplication.updateMany({
        where: { id: appB_id },
        data: { status: "Diterima" },
      });
      expect(res.count).toBe(0);
    });
    // Status B tidak berubah di DB.
    const b = await root.jobApplication.findUnique({ where: { id: appB_id } });
    expect(b?.status).not.toBe("Diterima");
  });

  it("A delete data B by ID → 0 baris terhapus", async () => {
    await withUser(userA, async () => {
      const res = await db.jobApplication.deleteMany({ where: { id: appB_id } });
      expect(res.count).toBe(0);
    });
    const b = await root.jobApplication.findUnique({ where: { id: appB_id } });
    expect(b).not.toBeNull();
  });

  it("A count data B → 0", async () => {
    await withUser(userA, async () => {
      const n = await db.jobApplication.count({ where: { id: appB_id } });
      expect(n).toBe(0);
    });
  });

  it("A changeApplicationStatus data B → NotFoundError (404)", async () => {
    await withUser(userA, async () => {
      await expect(changeApplicationStatus(appB_id, "Diterima")).rejects.toThrow(NotFoundError);
    });
  });

  it("A create → userId otomatis = A (bukan B, bukan null)", async () => {
    await withUser(userA, async () => {
      const created = await db.jobApplication.create({
        data: { perusahaan: "Test Corp", posisi: "Dev", status: "Wishlist" } as any,
      });
      expect(created.userId).toBe(userA);
    });
  });

  it("query di luar scope → reject (tidak ada kebocoran tanpa auth)", async () => {
    await expect(db.jobApplication.findMany()).rejects.toThrow();
  });

  it("B masih bisa akses data sendiri setelah semua serangan A", async () => {
    await withUser(userB, async () => {
      const found = await db.jobApplication.findFirst({ where: { id: appB_id } });
      expect(found).not.toBeNull();
      expect(found?.userId).toBe(userB);
    });
  });

  it("changeApplicationStatus menulis log dalam transaksi (user sah)", async () => {
    await withUser(userB, async () => {
      const logsBefore = await root.applicationStatusLog.count({
        where: { jobApplicationId: appB_id },
      });
      const updated = await changeApplicationStatus(appB_id, "Applied");
      expect(updated.status).toBe("Applied");
      const logsAfter = await root.applicationStatusLog.count({
        where: { jobApplicationId: appB_id },
      });
      expect(logsAfter).toBe(logsBefore + 1);
      const last = await root.applicationStatusLog.findFirst({
        where: { jobApplicationId: appB_id },
        orderBy: { changedAt: "desc" },
      });
      expect(last?.statusBaru).toBe("Applied");
      expect(last?.statusLama).toBeTruthy();
    });
  });
});
