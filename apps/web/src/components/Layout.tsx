import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Settings, Globe, Briefcase, FileText, Users,
  GraduationCap, MessagesSquare, TrendingUp, Scale, Search, Moon, Sun, Menu, LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar } from "@/components/ui/Avatar";
import { useHotkeys } from "@/hooks/useHotkeys";

/**
 * Shell global dari spesifikasi MD: sidebar kiri 260 bg-surface radius kanan
 * xl (44), clay-md; area konten padding page (32); topbar 72 dengan judul
 * halaman + search pill 280×44 + toggle tema 44 + avatar 44.
 * Mobile: sidebar → bottom-nav 72.
 */

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/panduan", label: "Panduan", icon: BookOpen },
  { to: "/setup", label: "Setup", icon: Settings },
  { to: "/portal", label: "Portal Job", icon: Globe },
  { to: "/tracker", label: "Job Tracker", icon: Briefcase },
  { to: "/dokumen", label: "Dokumen", icon: FileText },
  { to: "/kontak", label: "Kontak", icon: Users },
  { to: "/upskill", label: "Upskill", icon: GraduationCap },
  { to: "/interview", label: "Interview", icon: MessagesSquare },
  { to: "/gaji", label: "Riset Gaji", icon: TrendingUp },
  { to: "/offer", label: "Offer", icon: Scale },
];

const TITLES: Record<string, { title: string; desc: string }> = {
  "/": { title: "Dashboard", desc: "Kelola semua lamaran, dokumen, dan kontak dari satu tempat." },
  "/panduan": { title: "Panduan", desc: "Mulai dari sini — 6 langkah setup awal." },
  "/setup": { title: "Setup", desc: "Profil, status kustom, dan data contoh." },
  "/portal": { title: "Portal Job", desc: "Daftar portal rekomendasi untuk hunting." },
  "/tracker": { title: "Job Tracker", desc: "Lacak semua lamaran dalam satu pipeline." },
  "/dokumen": { title: "Dokumen & Drive", desc: "Rapihin berkas sebelum dibutuhkan." },
  "/kontak": { title: "Kontak & Networking", desc: "Networking jangan didiemin." },
  "/upskill": { title: "Upskill", desc: "Skill yang lagi dan harus dipelajari." },
  "/interview": { title: "Bank Persiapan Interview", desc: "STAR story siap tempur." },
  "/gaji": { title: "Riset & Benchmark Gaji", desc: "Pahami nilai pasarmu." },
  "/offer": { title: "Perbandingan Offer", desc: "Keputusan berdasarkan angka, bukan perasaan." },
};

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === "dark");
  const toggle = () => {
    const next = !dark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  };
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      className="flex h-11 w-11 items-center justify-center rounded-pill bg-surface text-text-secondary shadow-clay-sm hover:text-accent"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

/** Menu akun: klik avatar → dropdown dengan logout. */
function AccountMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    qc.clear();
    navigate("/login", { replace: true });
  };
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu akun">
        <Avatar initials="Z" size={44} />
      </button>
      {open && (
        <div className="absolute right-0 top-13 z-50 w-44 rounded-md bg-surface p-1.5 shadow-clay-lg" role="menu">
          <button
            onClick={logout}
            role="menuitem"
            className="flex h-10 w-full items-center gap-2 rounded-pill px-4 text-[14px] font-semibold text-danger-text hover:bg-danger-soft"
          >
            <LogOut size={15} aria-hidden /> Keluar
          </button>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  useHotkeys();
  const { pathname } = useLocation();
  const meta = TITLES[pathname] ?? { title: "Job Application Manager", desc: "" };
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => setNavOpen(false), [pathname]);

  const navLinks = (
    <nav className="flex flex-col gap-1" aria-label="Navigasi utama">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-4 py-2.5 text-[15px] font-semibold transition-colors ${
              isActive
                ? "bg-accent-soft text-accent shadow-clay-pressed"
                : "text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
            }`
          }
        >
          <Icon size={20} aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh flex bg-canvas">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col gap-6 rounded-r-xl bg-surface p-6 shadow-clay-md sticky top-0 h-dvh">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-pill bg-accent text-white shadow-clay-sm font-extrabold">J</span>
          <span className="text-[17px] font-extrabold leading-tight">Job Application<br />Manager</span>
        </div>
        {navLinks}
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col p-page max-lg:p-4 pb-24 lg:pb-8">
        {/* Topbar */}
        <header className="flex h-18 items-end justify-between gap-4 pb-2">
          <div>
            <h1 className="text-[30px] leading-tight font-extrabold text-text-primary">{meta.title}</h1>
            <p className="text-[13px] text-text-secondary">{meta.desc}</p>
          </div>
          <div className="flex items-center gap-3 max-md:hidden">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
              <input
                placeholder="Cari…  (tekan /)"
                id="global-search"
                className="h-11 w-70 rounded-pill bg-surface-sunken pl-10 pr-4 text-[15px] shadow-clay-pressed focus:outline-3 focus:outline-accent"
              />
            </div>
            <ThemeToggle />
            <AccountMenu />
          </div>
          <button className="lg:hidden" onClick={() => setNavOpen(!navOpen)} aria-label="Buka menu">
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex h-18 items-center justify-around rounded-t-xl bg-surface px-2 shadow-clay-lg"
        aria-label="Navigasi utama mobile"
      >
        {NAV.filter((_, i) => [0, 4, 3, 5, 7].includes(i)).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-semibold ${isActive ? "text-accent" : "text-text-muted"}`
            }
          >
            <Icon size={22} aria-hidden />
            {label}
          </NavLink>
        ))}
        <NavLink to="/panduan" className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-semibold ${isActive ? "text-accent" : "text-text-muted"}`}>
          <Menu size={22} aria-hidden />
          Lainnya
        </NavLink>
      </nav>
    </div>
  );
}
