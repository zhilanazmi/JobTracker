import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";

/**
 * Halaman berat (form besar, chart) di-lazy-load per route (prompt §12:
 * Recharts dan halaman berat lazy-load). Dashboard & Tracker = eager
 * (halaman paling sering dibuka).
 */
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const TrackerPage = lazy(() => import("@/pages/TrackerPage").then((m) => ({ default: m.TrackerPage })));
const SetupPage = lazy(() => import("@/pages/SetupPage").then((m) => ({ default: m.SetupPage })));
const PanduanPage = lazy(() => import("@/pages/PanduanPage").then((m) => ({ default: m.PanduanPage })));
const PortalPage = lazy(() => import("@/pages/PortalPage").then((m) => ({ default: m.PortalPage })));
const DocumentsPage = lazy(() => import("@/pages/DocumentsPage").then((m) => ({ default: m.DocumentsPage })));
const ContactsPage = lazy(() => import("@/pages/ContactsPage").then((m) => ({ default: m.ContactsPage })));
const UpskillPage = lazy(() => import("@/pages/UpskillPage").then((m) => ({ default: m.UpskillPage })));
const InterviewPage = lazy(() => import("@/pages/InterviewPage").then((m) => ({ default: m.InterviewPage })));
const InterviewPracticePage = lazy(() => import("@/pages/InterviewPage").then((m) => ({ default: m.InterviewPracticePage })));
const SalaryPage = lazy(() => import("@/pages/SalaryPage").then((m) => ({ default: m.SalaryPage })));
const OffersPage = lazy(() => import("@/pages/OffersPage").then((m) => ({ default: m.OffersPage })));
const ComponentsPage = lazy(() => import("@/pages/dev/ComponentsPage").then((m) => ({ default: m.ComponentsPage })));
const AuthPage = lazy(() => import("@/pages/AuthPage").then((m) => ({ default: m.AuthPage })));

function RouteFallback() {
  return (
    <div className="flex flex-col gap-gap" aria-busy="true">
      <div className="h-32 animate-pulse rounded-lg bg-surface shadow-clay-md" />
      <div className="h-64 animate-pulse rounded-lg bg-surface shadow-clay-md" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Suspense fallback={<RouteFallback />}><AuthPage mode="login" /></Suspense>} />
      <Route path="/register" element={<Suspense fallback={<RouteFallback />}><AuthPage mode="register" /></Suspense>} />
      <Route element={<Layout />}>
        <Route path="/" element={<Suspense fallback={<RouteFallback />}><DashboardPage /></Suspense>} />
        <Route path="/panduan" element={<Suspense fallback={<RouteFallback />}><PanduanPage /></Suspense>} />
        <Route path="/setup" element={<Suspense fallback={<RouteFallback />}><SetupPage /></Suspense>} />
        <Route path="/portal" element={<Suspense fallback={<RouteFallback />}><PortalPage /></Suspense>} />
        <Route path="/tracker" element={<Suspense fallback={<RouteFallback />}><TrackerPage /></Suspense>} />
        <Route path="/dokumen" element={<Suspense fallback={<RouteFallback />}><DocumentsPage /></Suspense>} />
        <Route path="/kontak" element={<Suspense fallback={<RouteFallback />}><ContactsPage /></Suspense>} />
        <Route path="/upskill" element={<Suspense fallback={<RouteFallback />}><UpskillPage /></Suspense>} />
        <Route path="/interview" element={<Suspense fallback={<RouteFallback />}><InterviewPage /></Suspense>} />
        <Route path="/interview/latihan" element={<Suspense fallback={<RouteFallback />}><InterviewPracticePage /></Suspense>} />
        <Route path="/gaji" element={<Suspense fallback={<RouteFallback />}><SalaryPage /></Suspense>} />
        <Route path="/offer" element={<Suspense fallback={<RouteFallback />}><OffersPage /></Suspense>} />
        <Route path="/dev/components" element={<Suspense fallback={<RouteFallback />}><ComponentsPage /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
