/**
 * Klien API minimal: fetch + error format konsisten { error: {code,message} }.
 * Cookie auth dikirim otomatis (same-origin via Vite proxy).
 */

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string[]>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (res.status === 401) {
    // Coba refresh sekali, lalu ulang.
    const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
    if (refreshed.ok) {
      return request<T>(path, init);
    }
    window.location.href = "/login";
    throw new ApiError(401, "UNAUTHENTICATED", "Sesi berakhir");
  }
  if (!res.ok) {
    let code = "ERROR";
    let message = res.statusText;
    let fields: Record<string, string[]> | undefined;
    try {
      const body = await res.json();
      code = body?.error?.code ?? code;
      message = body?.error?.message ?? message;
      fields = body?.error?.fields;
    } catch {
      // bukan JSON — pakai default
    }
    throw new ApiError(res.status, code, message, fields);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body != null ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body != null ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
