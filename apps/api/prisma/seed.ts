import { root } from "../src/db.js";
import { DEFAULT_PRIORITIES, DEFAULT_STATUSES } from "@jam/shared";
import { todayWIB, addDays } from "@jam/shared";

const DAY = 86_400_000;

function dateN(n: number, base = todayWIB()): Date {
  return new Date(`${addDays(base, n)}T00:00:00Z`);
}
function dateTimeN(n: number, base = new Date()): Date {
  return new Date(base.getTime() + n * DAY);
}

export async function seedOptionLists(userId: bigint): Promise<void> {
  await root.optionList.createMany({
    data: [
      ...DEFAULT_STATUSES.map((s) => ({
        userId, tipe: "status_lamaran", label: s.label,
        urutan: s.urutan, warnaToken: s.warnaToken, isTerminal: s.isTerminal,
      })),
      ...DEFAULT_PRIORITIES.map((p) => ({
        userId, tipe: "prioritas", label: p.label,
        urutan: p.urutan, warnaToken: p.warnaToken, isTerminal: false,
      })),
    ],
  });
}

const PORTALS: [string, string, string, string, string, string][] = [
  ["LinkedIn", "Networking + lowongan semua bidang", "Umum/Global", "https://linkedin.com/jobs", "Networking, semua level", "Sumber terbesar; perlu profil kuat"],
  ["JobStreet", "Asia Tenggara, semua industri", "Umum", "https://jobstreet.co.id", "Fresh grad – senior", "By SEEK, verifikasi perusahaan ketat"],
  ["Glints", "Digital, kreatif, startup", "Tech & Startup", "https://glints.com", "Fresh grad – mid", "Bisa chat langsung ke HR"],
  ["Kalibrr", "Tech & startup", "Tech & Startup", "https://kalibrr.com", "Fresh grad – mid", "AI matching; dipakai perusahaan besar"],
  ["Indeed", "Agregator global", "Umum/Global", "https://indeed.com", "Semua level", "Database terbesar, filter gaji"],
  ["KitaLulus", "Lokal, terverifikasi", "Umum", "https://kitalulus.com", "Fresh grad, SMK", "Aman dari loker fiktif, ada CV maker"],
  ["KarirHub SIAPkerja", "Portal resmi Kemnaker", "Pemerintah", "https://karirhub.kemnaker.go.id", "Semua level", "Gratis, terverifikasi Dukcapil"],
  ["Rekrutmen Bersama BUMN", "FHCI BUMN", "Pemerintah/BUMN", "https://recruitment.fhci-bumn.com", "Fresh grad", "Periodik tahunan, sekali daftar banyak BUMN"],
  ["Kerjawoy", "Loker luar negeri", "Luar Negeri", "https://kerjawoy.com", "Semua level", "Cek legalitas agency dulu"],
  ["Glassdoor", "Review + gaji", "Riset & Gaji", "https://glassdoor.com", "Riset sebelum apply", "Data gaji & review budaya"],
  ["Dealls", "Gen Z & kreatif", "Tech & Startup", "https://dealls.com", "Fresh grad", "UI modern, banyak startup"],
  ["Karir.com", "Umum Indonesia", "Umum", "https://karir.com", "Fresh grad – mid", "Ada fitur tes minat"],
  ["SOKU", "Kreatif & pariwisata", "Pemerintah", "https://soku.kemenparekraf.go.id", "Kreatif, fresh grad", "Portal resmi Kemenparekraf"],
  ["StartUp Jobs Asia", "Startup SEA", "Tech & Startup", "https://startupjobs.asia", "Tech, startup", "Remote & onsite startup"],
  ["Tech in Asia Jobs", "Startup Asia", "Tech & Startup", "https://jobs.techinasia.com", "Tech", "Perusahaan terverifikasi funding"],
  ["Remote OK", "Remote global", "Remote", "https://remoteok.com", "Remote worker", "Bahasa Inggris wajib"],
  ["We Work Remotely", "Remote global", "Remote", "https://weworkremotely.com", "Remote worker", "Board remote terbesar"],
  ["Wellfound", "Startup global", "Tech & Startup", "https://wellfound.com", "Tech, startup", "Eks AngelList; equity info"],
  ["TopKarir", "Umum Indonesia", "Umum", "https://topkarir.com", "Semua level", "Filter lokasi lengkap"],
  ["Karier.mu", "Umum + quiz", "Umum", "https://karier.mu", "Fresh grad", "Ada quiz minat karier"],
  ["LinkedIn Salary", "Benchmark gaji", "Riset & Gaji", "https://linkedin.com/salary", "Riset gaji", "Data gaji per role & lokasi"],
];

interface SeedApp {
  perusahaan: string; posisi: string; portal: string;
  tglApply: number; status: string; prioritas: string;
  tipeKerja: string; modeKerja: string; lokasi: string;
  gajiBawah?: string; gajiAtas?: string; gajiTeks?: string;
  deadline?: number; tglInterview?: number; nextAction?: string;
  catatan?: string;
  /** Kapan status berubah menjadi status sekarang (hari lalu). */
  statusChanged: number;
  /** Jalur status yang sudah dilewati (untuk log & funnel). */
  path?: string[];
}

const APPS: SeedApp[] = [
  { perusahaan: "PT Kreatif Digital", posisi: "UI/UX Designer", portal: "Glints",
    tglApply: -12, status: "Interview User", prioritas: "Tinggi",
    tipeKerja: "Full-time", modeKerja: "Hybrid", lokasi: "Jakarta",
    gajiBawah: "8000000", gajiAtas: "11000000",
    deadline: 5, tglInterview: 2, nextAction: "Siapin portfolio walkthrough",
    catatan: "HR responsif, balas < 1 hari.", statusChanged: -4,
    path: ["Applied", "Screening HR", "Tes/Assignment", "Interview User"] },
  { perusahaan: "Tokopedia", posisi: "Product Analyst", portal: "LinkedIn",
    tglApply: -15, status: "Screening HR", prioritas: "Tinggi",
    tipeKerja: "Full-time", modeKerja: "WFO", lokasi: "Jakarta",
    gajiBawah: "10000000", gajiAtas: "14000000",
    nextAction: "Follow-up ke HR", statusChanged: -9,
    path: ["Applied", "Screening HR"] },
  { perusahaan: "Startup Fintech X", posisi: "Growth Marketing", portal: "Kalibrr",
    tglApply: -8, status: "Applied", prioritas: "Sedang",
    tipeKerja: "Full-time", modeKerja: "Remote", lokasi: "Remote",
    gajiBawah: "9000000", gajiAtas: "12000000", statusChanged: -8 },
  { perusahaan: "Bank BUMN", posisi: "Management Trainee", portal: "Rekrutmen Bersama BUMN",
    tglApply: -3, status: "Mau Apply", prioritas: "Tinggi",
    tipeKerja: "Full-time", modeKerja: "WFO", lokasi: "Bandung",
    gajiTeks: "Sesuai grade", deadline: 2,
    nextAction: "Polish essay & porto", statusChanged: -3 },
  { perusahaan: "Gojek", posisi: "Data Analyst", portal: "LinkedIn",
    tglApply: -20, status: "Interview Akhir", prioritas: "Tinggi",
    tipeKerja: "Full-time", modeKerja: "Hybrid", lokasi: "Jakarta",
    gajiBawah: "12000000", gajiAtas: "16000000",
    tglInterview: 1, nextAction: "Review case study", statusChanged: -3,
    path: ["Applied", "Screening HR", "Tes/Assignment", "Interview User", "Interview Akhir"] },
  { perusahaan: "Astra International", posisi: "HR Officer", portal: "Karir.com",
    tglApply: -25, status: "Offering", prioritas: "Tinggi",
    tipeKerja: "Full-time", modeKerja: "WFO", lokasi: "Jakarta",
    gajiBawah: "9500000", gajiAtas: "9500000",
    nextAction: "Tanya tunjangan & THR", statusChanged: -2,
    path: ["Applied", "Screening HR", "Tes/Assignment", "Interview User", "Interview Akhir", "Offering"] },
  { perusahaan: "Ruangguru", posisi: "Content Strategist", portal: "Dealls",
    tglApply: -18, status: "Ditolak", prioritas: "Rendah",
    tipeKerja: "Full-time", modeKerja: "Hybrid", lokasi: "Jakarta",
    statusChanged: -12, path: ["Applied"] },
  { perusahaan: "Tiket.com", posisi: "Digital Marketing", portal: "Dealls",
    tglApply: -30, status: "Ghosting", prioritas: "Rendah",
    tipeKerja: "Full-time", modeKerja: "WFO", lokasi: "Jakarta",
    statusChanged: -23, path: ["Applied"] },
  { perusahaan: "Traveloka", posisi: "Frontend Engineer", portal: "LinkedIn",
    tglApply: -6, status: "Applied", prioritas: "Sedang",
    tipeKerja: "Full-time", modeKerja: "Hybrid", lokasi: "Jakarta",
    gajiBawah: "11000000", gajiAtas: "15000000", statusChanged: -6 },
  { perusahaan: "Shopee", posisi: "Software Engineer", portal: "Glints",
    tglApply: -2, status: "Mau Apply", prioritas: "Tinggi",
    tipeKerja: "Full-time", modeKerja: "WFO", lokasi: "Jakarta",
    gajiBawah: "13000000", gajiAtas: "18000000", statusChanged: -2 },
  { perusahaan: "Bank Mandiri", posisi: "IT Management Trainee", portal: "Rekrutmen Bersama BUMN",
    tglApply: -1, status: "Wishlist", prioritas: "Sedang",
    tipeKerja: "Full-time", modeKerja: "WFO", lokasi: "Jakarta",
    statusChanged: -1 },
  { perusahaan: "Grab", posisi: "Product Manager", portal: "LinkedIn",
    tglApply: -10, status: "Screening HR", prioritas: "Tinggi",
    tipeKerja: "Full-time", modeKerja: "Hybrid", lokasi: "Singapura",
    gajiTeks: "SGD 5–6k", nextAction: "Cek visa & relokasi", statusChanged: -1,
    path: ["Applied", "Screening HR"] },
  { perusahaan: "Bukalapak", posisi: "Marketing Associate", portal: "Kalibrr",
    tglApply: -14, status: "Applied", prioritas: "Rendah",
    tipeKerja: "Full-time", modeKerja: "Remote", lokasi: "Remote",
    gajiBawah: "8000000", gajiAtas: "10000000",
    deadline: -1, statusChanged: -14 },
  { perusahaan: "Xendit", posisi: "Finance Associate", portal: "JobStreet",
    tglApply: -9, status: "Tes/Assignment", prioritas: "Sedang",
    tipeKerja: "Full-time", modeKerja: "Hybrid", lokasi: "Jakarta",
    gajiBawah: "12000000", gajiAtas: "13500000",
    deadline: 3, statusChanged: -5, path: ["Applied", "Screening HR", "Tes/Assignment"] },
  { perusahaan: "Blibli", posisi: "Category Manager", portal: "KitaLulus",
    tglApply: -22, status: "Ditolak", prioritas: "Rendah",
    tipeKerja: "Full-time", modeKerja: "WFO", lokasi: "Jakarta",
    statusChanged: -16, path: ["Applied"] },
  { perusahaan: "Sea Group", posisi: "Business Intelligence", portal: "LinkedIn",
    tglApply: -1, status: "Mau Apply", prioritas: "Sedang",
    tipeKerja: "Full-time", modeKerja: "Hybrid", lokasi: "Jakarta",
    statusChanged: -1 },
];

const DOCS: [string, string, string, string | null, number | null, string, string][] = [
  ["CV/Resume ATS-friendly", "CV", "v1", null, -30, "Perlu Update", "1 halaman, sesuaikan keyword per lowongan"],
  ["CV Kreatif", "CV", "v1", null, null, "Draft", "Buat versi designer biar beda"],
  ["Cover Letter template", "Cover Letter", "v1", null, null, "Draft", "Template + slot customisasi"],
  ["Portfolio", "Portfolio", "v2", "https://drive.google.com/file/d/portfolio", -20, "Perlu Update", "Tambah project terbaru"],
  ["Ijazah", "Ijazah", "Final", "https://drive.google.com/file/d/ijazah", -60, "Final", "Scan berwarna"],
  ["Transkrip Nilai", "Transkrip", "Final", "https://drive.google.com/file/d/transkrip", -60, "Final", "Legalisir kampus"],
  ["Pas Foto", "Pas Foto", "Final", "https://drive.google.com/file/d/pasfoto", -45, "Final", "Background merah/biru"],
  ["KTP", "Identitas", "Final", "https://drive.google.com/file/d/ktp", -60, "Final", ""],
  ["Sertifikat kumpulan", "Sertifikat", "v1", null, null, "Draft", "Gabung jadi 1 PDF"],
  ["Surat Referensi", "Referensi", "v1", null, null, "Draft", "Minta dari dosen pembimbing"],
];

/** Seed lengkap untuk user yang diberikan — dipanggil register & seed demo. */
export async function seedUserData(userId: bigint, withSample = true): Promise<void> {
  await seedOptionLists(userId);

  if (!withSample) return;

  await root.jobPortal.createMany({
    data: PORTALS.map(([namaPortal, fokus, tipe, link, cocokUntuk, catatan]) => ({
      userId, namaPortal, fokus, tipe, link, cocokUntuk, catatan, isSample: true,
    })),
  });

  const portals = await root.jobPortal.findMany({ where: { userId } });
  const portalId = (name: string) => portals.find((p) => p.namaPortal.startsWith(name))?.id ?? null;

  for (const a of APPS) {
    const app = await root.jobApplication.create({
      data: {
        userId,
        tglApply: dateN(a.tglApply),
        perusahaan: a.perusahaan,
        posisi: a.posisi,
        portalId: portalId(a.portal),
        tipeKerja: a.tipeKerja,
        modeKerja: a.modeKerja,
        lokasi: a.lokasi,
        estGajiBawah: a.gajiBawah,
        estGajiAtas: a.gajiAtas,
        estGajiTeks: a.gajiTeks,
        status: a.status,
        prioritas: a.prioritas,
        deadline: a.deadline != null ? dateN(a.deadline) : null,
        tglInterview: a.tglInterview != null ? dateN(a.tglInterview) : null,
        nextAction: a.nextAction,
        catatan: a.catatan,
        statusChangedAt: dateTimeN(-a.statusChanged),
        isSample: true,
      } as any,
    });
    // Log pertama: statusLama null (lamaran dibuat), lalu jalur statusnya.
    await root.applicationStatusLog.create({
      data: { jobApplicationId: app.id, statusLama: null, statusBaru: "Wishlist", changedAt: dateTimeN(a.tglApply) },
    });
    const path = a.path ?? [];
    let prev = "Wishlist";
    // sebar log antara tglApply dan statusChanged
    const startAt = a.tglApply + 1;
    const endAt = a.statusChanged;
    const span = Math.max(1, endAt - startAt);
    for (let i = 0; i < path.length; i++) {
      const at = dateTimeN(-Math.min(startAt + Math.round((span * i) / Math.max(1, path.length - 1)), endAt));
      await root.applicationStatusLog.create({
        data: { jobApplicationId: app.id, statusLama: prev, statusBaru: path[i]!, changedAt: at },
      });
      prev = path[i]!;
    }
  }

  await root.document.createMany({
    data: DOCS.map(([namaDokumen, jenis, versi, linkDrive, upd, status, catatan]) => ({
      userId, namaDokumen, jenis, versi, linkDrive,
      updateTerakhir: upd != null ? dateN(upd) : null,
      status, catatan, isSample: true,
    })),
  });

  await root.contact.createMany({
    data: [
      { userId, nama: "Rina", perusahaan: "PT Maju Jaya", posisi: "HR Recruiter",
        hubungan: "Recruiter", kontak: "https://linkedin.com/in/rina",
        kontakTerakhir: dateN(-18), statusFollowUp: "Perlu Follow-up",
        catatan: "Kenal di job fair Kemnaker.", isSample: true },
      { userId, nama: "Budi", perusahaan: "Tokopedia", posisi: "Senior Engineer",
        hubungan: "Alumni", kontak: "budi@email.com",
        kontakTerakhir: dateN(-5), statusFollowUp: "Menunggu Balasan",
        catatan: "Temen sekolah SMA.", isSample: true },
    ],
  });

  await root.upskill.createMany({
    data: [
      { userId, skill: "Excel/Spreadsheet lanjutan", kategori: "Tools", platform: "YouTube/Coursera",
        linkCourse: "https://coursera.org/excel", prioritas: "Tinggi", status: "Sedang Belajar",
        progress: 40, isSample: true },
      { userId, skill: "Bahasa Inggris speaking", kategori: "Bahasa", platform: "Cakap/EF",
        linkCourse: "https://cakap.com", prioritas: "Tinggi", status: "Sedang Belajar",
        progress: 30, isSample: true },
      { userId, skill: "Data Analysis SQL", kategori: "Technical", platform: "DataCamp/Prakerja",
        linkCourse: "https://datacamp.com/sql", prioritas: "Sedang", status: "Belum Mulai",
        progress: 0, isSample: true },
      { userId, skill: "Komunikasi & Public Speaking", kategori: "Soft Skill", platform: "YouTube",
        prioritas: "Sedang", status: "Belum Mulai", progress: 0, isSample: true },
      { userId, skill: "Bahasa Jepang", kategori: "Bahasa", platform: "Zenleap",
        linkCourse: "https://zenleap.jp", prioritas: "Rendah", status: "Belum Mulai",
        progress: 0, isSample: true },
    ],
  });

  await root.interviewQuestion.createMany({
    data: [
      { userId, pertanyaan: "Ceritakan tentang diri Anda", kategori: "Umum", untukRole: "Semua",
        starSituation: "Saya fresh grad jurusan SI...", status: "Siap", prioritas: "Tinggi",
        contohKonkret: "Fokus 90 detik: pendidikan, pengalaman organisasi, kenapa fit.", isSample: true },
      { userId, pertanyaan: "Apa kelebihan & kekurangan Anda?", kategori: "Perilaku", untukRole: "Semua",
        status: "Perlu Latihan", prioritas: "Sedang", isSample: true },
      { userId, pertanyaan: "Kenapa tertarik dengan perusahaan kami?", kategori: "Tentang Perusahaan",
        untukRole: "Semua", status: "Belum Disiapkan", prioritas: "Tinggi",
        catatan: "Riset produk & berita terbaru dulu.", isSample: true },
      { userId, pertanyaan: "Ceritakan saat menghadapi konflik di tim", kategori: "Perilaku", untukRole: "Semua",
        starSituation: "Proyek akhir, beda pendapat soal arsitektur", starTask: "Mediator antar 2 pihak",
        starAction: "Bikin meet khusus, minta tiap orang tulis trade-off", starResult: "Konsensus 3 jam, tepat deadline",
        status: "Draft", prioritas: "Sedang", isSample: true },
      { userId, pertanyaan: "Berapa ekspektasi gaji Anda?", kategori: "Gaji & Benefit", untukRole: "Semua",
        starSituation: "Riset benchmark di sheet ini", status: "Perlu Latihan", prioritas: "Tinggi",
        contohKonkret: "Beri range, bukan angka mutlak. Cek sheet Gaji.", isSample: true },
      { userId, pertanyaan: "Apakah ada pertanyaan untuk kami?", kategori: "Pertanyaan Balik", untukRole: "Semua",
        status: "Siap", prioritas: "Sedang", contohKonkret: "Tanya onboarding, mentor, success metric 3 bulan.", isSample: true },
    ],
  });

  await root.salaryBenchmark.createMany({
    data: [
      { userId, role: "UI/UX Designer", level: "Mid", industri: "Tech/Startup", lokasi: "Jakarta",
        gajiBawah: "9000000", gajiAtas: "15000000", sumber: "LinkedIn Salary", isSample: true },
      { userId, role: "Product Analyst", level: "Junior", industri: "Tech", lokasi: "Jakarta",
        gajiBawah: "8000000", gajiAtas: "12000000", sumber: "Glassdoor", isSample: true },
      { userId, role: "Data Scientist", level: "Senior", industri: "Tech", lokasi: "Jakarta",
        gajiBawah: "20000000", gajiAtas: "35000000", sumber: "Kalibrr", catatan: "butuh 3+ th", isSample: true },
      { userId, role: "Growth Marketing", level: "Mid", industri: "Startup", lokasi: "Remote",
        gajiBawah: "10000000", gajiAtas: "16000000", sumber: "Glints", isSample: true },
      { userId, role: "Product Manager", level: "Mid", industri: "Tech", lokasi: "Singapura",
        gajiBawah: "60000000", gajiAtas: "90000000", sumber: "LinkedIn", catatan: "SGD 5–7,5k, kurs ~Rp12rb", isSample: true },
      { userId, role: "Management Trainee", level: "Fresh Grad", industri: "BUMN", lokasi: "Jakarta",
        gajiBawah: "6000000", gajiAtas: "9000000", sumber: "FHCI BUMN", isSample: true },
    ],
  });

  // 3 offer: Astra (terkait lamaran Astra), Xendit, Grab Singapura.
  const astraApp = await root.jobApplication.findFirst({
    where: { userId, perusahaan: "Astra International" },
  });
  const xenditApp = await root.jobApplication.findFirst({
    where: { userId, perusahaan: "Xendit" },
  });
  const grabApp = await root.jobApplication.findFirst({
    where: { userId, perusahaan: "Grab" },
  });
  await root.jobOffer.createMany({
    data: [
      { userId, jobApplicationId: astraApp?.id ?? null, perusahaan: "Astra International",
        posisi: "HR Officer", gajiPokok: "9500000",
        tunjangan: "BPJS, THR, bonus tahunan", thpEstimasi: "11000000",
        wlb: 4, jenjang: 4, budaya: 4, catatan: "Sudah tahap Offering", isSample: true },
      { userId, jobApplicationId: xenditApp?.id ?? null, perusahaan: "Xendit",
        posisi: "Finance Associate", gajiPokok: "12000000",
        tunjangan: "Asuransi premium, opsi saham, WFH stipend", thpEstimasi: "13500000",
        wlb: 3, jenjang: 5, budaya: 4, catatan: "Fintech, growth cepat", isSample: true },
      { userId, jobApplicationId: grabApp?.id ?? null, perusahaan: "Grab (Singapura)",
        posisi: "Product Manager", gajiPokok: "65000000",
        tunjangan: "Relokasi, asuransi internasional", thpEstimasi: "72000000",
        wlb: 3, jenjang: 5, budaya: 4, catatan: "Perlu relokasi", isSample: true },
    ],
  });
}
