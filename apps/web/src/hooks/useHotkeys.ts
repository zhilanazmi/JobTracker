import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Hotkey global (prompt §8): "/" fokus search, "n" buka form tambah baris,
 * Esc tutup drawer/dialog. Skip saat user sedang mengetik.
 */
export function useHotkeys(): void {
  const navigate = useNavigate();

  useEffect(() => {
    const isTyping = (t: EventTarget | null): boolean => {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Escape") {
        const dialog = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
        const closeBtn = dialog?.querySelector<HTMLElement>("button[aria-label='Tutup'], button[aria-label='Tutup drawer'], button[aria-label='Batal']");
        if (closeBtn) {
          closeBtn.click();
          return;
        }
      }

      if (isTyping(e.target)) return;

      if (e.key === "/") {
        const search = document.querySelector<HTMLInputElement>("#global-search, input[aria-label='Cari lamaran'], input[aria-label='Cari dokumen'], input[aria-label='Cari kontak']");
        if (search) {
          e.preventDefault();
          search.focus();
        }
      }

      if (e.key === "n") {
        const addBtn = document.querySelector<HTMLButtonElement>("button:has(svg + :scope)")
          ?? Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((b) => b.textContent?.trim().startsWith("Tambah"));
        if (addBtn) {
          e.preventDefault();
          addBtn.click();
        }
        if (location.pathname === "/tracker") {
          navigate("/tracker?add=1");
          return;
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);
}
