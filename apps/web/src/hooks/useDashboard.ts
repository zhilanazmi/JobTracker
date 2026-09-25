import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DashboardData {
  metrics: {
    totalEntri: number;
    sudahApply: number;
    interviewTes: number;
    offerDiterima: number;
    aktifPipeline: number;
    responseRate: number | null;
  };
  todo: { key: string; judul: string; jumlah: number; deskripsi: string; href: string }[];
  funnel: { stage: string; count: number; conversion: number | null }[];
  profileIncomplete: boolean;
}

export interface Application {
  id: string;
  tglApply: string | null;
  perusahaan: string;
  posisi: string;
  portalId: string | null;
  tipeKerja: string | null;
  modeKerja: string | null;
  lokasi: string | null;
  estGajiBawah: string | null;
  estGajiAtas: string | null;
  estGajiTeks: string | null;
  status: string;
  prioritas: string | null;
  deadline: string | null;
  tglInterview: string | null;
  nextAction: string | null;
  linkLowongan: string | null;
  catatan: string | null;
  statusChangedAt: string;
}

export interface ApplicationList {
  items: Application[];
  pagination: { page: number; take: number; total: number };
}

export interface OptionItem {
  id: string;
  tipe: "status_lamaran" | "prioritas";
  label: string;
  urutan: number;
  warnaToken: string;
  isTerminal: boolean;
}

export const useDashboard = () => useQuery({ queryKey: ["dashboard"], queryFn: () => api.get<DashboardData>("/api/dashboard") });

export const useApplications = (params: URLSearchParams) => {
  const q = params.toString();
  return useQuery({ queryKey: ["applications", q], queryFn: () => api.get<ApplicationList>(`/api/applications?${q}`) });
};

export const useOptions = () =>
  useQuery({ queryKey: ["options"], queryFn: () => api.get<{ items: OptionItem[] }>("/api/options") });

/** Semua perubahan status lewat endpoint /status (satu pintu prompt §5). */
export function useChangeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch<Application>(`/api/applications/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["timeline"] });
    },
  });
}

export interface TimelineItem {
  id: string;
  statusLama: string | null;
  statusBaru: string;
  changedAt: string;
}

export const useTimeline = (id: string | null) =>
  useQuery({
    queryKey: ["timeline", id],
    queryFn: () => api.get<{ items: TimelineItem[] }>(`/api/applications/${id}/timeline`),
    enabled: !!id,
  });
