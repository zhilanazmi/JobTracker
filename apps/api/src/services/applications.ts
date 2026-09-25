import { root, currentUserId } from "../db";

export class NotFoundError extends Error {
  constructor() {
    super("Resource tidak ditemukan");
  }
}

/**
 * Satu pintu perubahan status (prompt §5): dalam SATU transaksi update
 * status + statusChangedAt + tulis 1 baris log. Semua endpoint (PATCH
 * status, drag kanban, aksi drawer) wajib lewat sini.
 * userId diambil dari AsyncLocalStorage context (isolasi terpusat).
 */
export async function changeApplicationStatus(
  applicationId: bigint,
  statusBaru: string,
): Promise<{ id: bigint; status: string; statusChangedAt: Date }> {
  const userId = currentUserId();
  if (!userId) throw new Error("changeApplicationStatus di luar user scope");

  const app = await root.jobApplication.findFirst({
    where: { id: applicationId, userId, deletedAt: null },
  });
  if (!app) throw new NotFoundError();

  return root.$transaction(async (tx) => {
    const updated = await tx.jobApplication.update({
      where: { id: app.id },
      data: { status: statusBaru, statusChangedAt: new Date() },
    });
    await tx.applicationStatusLog.create({
      data: {
        jobApplicationId: app.id,
        statusLama: app.status !== statusBaru ? app.status : null,
        statusBaru,
      },
    });
    return updated;
  });
}
