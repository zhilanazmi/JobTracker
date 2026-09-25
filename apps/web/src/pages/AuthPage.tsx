import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";
import { Button, Input, Field } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

/**
 * Login + Register satu halaman (tab). Di luar Layout (tanpa sidebar).
 * Setelah sukses → "/" dan invalidate semua cache query.
 */
export function AuthPage({ mode: initialMode }: { mode: "login" | "register" }) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: async () => {
      if (mode === "register") {
        return api.post<{ id: string }>("/api/auth/register", { email, password, nama });
      }
      return api.post<{ id: string }>("/api/auth/login", { email, password });
    },
    onSuccess: () => {
      qc.clear();
      navigate("/", { replace: true });
    },
    onError: (e) => {
      setError(e instanceof ApiError ? e.message : "Terjadi kesalahan. Coba lagi.");
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    submit.mutate();
  };

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setError(null);
    window.history.replaceState(null, "", m === "register" ? "/register" : "/login");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-pill bg-accent text-white shadow-clay-md">
            <Briefcase size={26} aria-hidden />
          </span>
          <span className="text-[24px] font-extrabold leading-tight">Job Application<br />Manager</span>
        </div>

        <div className="rounded-xl bg-surface p-card shadow-clay-lg">
          {/* Tab */}
          <div className="flex items-center gap-1 self-center rounded-pill bg-surface-sunken p-1" role="tablist" aria-label="Masuk atau daftar">
            <button role="tab" aria-selected={mode === "login"} onClick={() => switchMode("login")}
              className={`h-9 flex-1 rounded-pill text-[13px] font-semibold ${mode === "login" ? "bg-surface text-accent shadow-clay-sm" : "text-text-muted"}`}>
              Masuk
            </button>
            <button role="tab" aria-selected={mode === "register"} onClick={() => switchMode("register")}
              className={`h-9 flex-1 rounded-pill text-[13px] font-semibold ${mode === "register" ? "bg-surface text-accent shadow-clay-sm" : "text-text-muted"}`}>
              Daftar
            </button>
          </div>

          <h1 className="mt-5 text-[22px] font-extrabold">
            {mode === "login" ? "Selamat datang kembali" : "Mulai lacak lamaranmu"}
          </h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            {mode === "login"
              ? "Masuk untuk lanjut ke dashboard."
              : "Daftar = app langsung terisi data contoh biar kamu bisa lihat cara kerjanya."}
          </p>

          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4" noValidate>
            {mode === "register" && (
              <Field label="Nama">
                <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama kamu" autoComplete="name" required />
              </Field>
            )}
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" autoComplete="email" required />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Minimal 8 karakter" : "Password kamu"}
                autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={8} />
            </Field>

            {error && (
              <p role="alert" className="rounded-md bg-danger-soft px-4 py-2.5 text-[13px] font-semibold text-danger-text">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" loading={submit.isPending} disabled={!email || !password || (mode === "register" && !nama)}>
              {mode === "login" ? "Masuk" : "Daftar & Isi Data Contoh"}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-text-muted">
          Data tersimpan di MySQL lokal — tidak ada yang dikirim ke mana pun.
        </p>
      </div>
    </div>
  );
}
