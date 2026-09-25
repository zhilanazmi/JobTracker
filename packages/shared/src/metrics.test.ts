import { describe, expect, it } from "vitest";
import {
  deadlineCategory,
  funnel,
  isAktifPipeline,
  isInterviewTerjadwal,
  isKontakPerluFollowup,
  isLamaranMingguIni,
  isPerluFollowup,
  isSudahApply,
  medianGaji,
  offerScore,
  responseRate,
  topScoreIds,
  umurLamaran,
} from "./metrics";
import { startOfWeekWIB, todayWIB } from "./dates";

describe("isSudahApply", () => {
  it("Wishlist dan Mau Apply tidak dihitung sudah apply", () => {
    expect(isSudahApply("Wishlist")).toBe(false);
    expect(isSudahApply("Mau Apply")).toBe(false);
  });
  it("Applied dan seterusnya sudah apply", () => {
    expect(isSudahApply("Applied")).toBe(true);
    expect(isSudahApply("Ditolak")).toBe(true);
    expect(isSudahApply("Ghosting")).toBe(true);
  });
  it("Aktif pipeline = sudah apply & tidak terminal", () => {
    expect(isAktifPipeline("Applied")).toBe(true);
    expect(isAktifPipeline("Diterima")).toBe(false);
    expect(isAktifPipeline("Wishlist")).toBe(false);
  });
});

describe("responseRate", () => {
  const apps = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1, status: "Applied" }));

  it("penyebut 0 → null (tampil '—', bukan 0%)", () => {
    const apps0 = [
      { id: 1, status: "Wishlist" },
      { id: 2, status: "Mau Apply" },
    ];
    expect(responseRate(apps0, new Map())).toBeNull();
  });
  it("tanpa log, fallback status terkini", () => {
    const rr = responseRate(apps(4), new Map());
    expect(rr).toBe(100);
  });
  it("dari log: hanya yang pernah mencapai Applied", () => {
    const reached = new Map<number, Set<string>>([
      [1, new Set(["Applied", "Screening HR"])],
      [2, new Set(["Applied"])],
      [3, new Set(["Applied"])],
      // app 4 belum melewati Applied (masih di Mau Apply lalu langsung Ditolak tanpa log Applied)
    ]);
    const list = [
      { id: 1, status: "Screening HR" },
      { id: 2, status: "Applied" },
      { id: 3, status: "Ditolak" },
      { id: 4, status: "Ditolak" },
    ];
    expect(responseRate(list, reached)).toBe(75);
  });
});

describe("isPerluFollowup", () => {
  const now = new Date("2026-09-24T10:00:00+07:00");
  it("Applied stuck ≥7 hari → true", () => {
    expect(isPerluFollowup({ status: "Applied", statusChangedAt: "2026-09-17T00:00:00Z" }, now)).toBe(true);
  });
  it("baru 6 hari → false", () => {
    expect(isPerluFollowup({ status: "Applied", statusChangedAt: "2026-09-18T00:00:00Z" }, now)).toBe(false);
  });
  it("tepat 7 hari → true (≤ hari ini − 7)", () => {
    expect(isPerluFollowup({ status: "Screening HR", statusChangedAt: "2026-09-17T00:00:00Z" }, now)).toBe(true);
  });
  it("status lain tidak pernah follow-up", () => {
    expect(isPerluFollowup({ status: "Interview User", statusChangedAt: "2020-01-01T00:00:00Z" }, now)).toBe(false);
  });
});

describe("deadlineCategory", () => {
  const now = new Date("2026-09-24T10:00:00+07:00"); // hari ini 2026-09-24 WIB
  it("deadline hari ini → mepet (inklusif)", () => {
    expect(deadlineCategory("2026-09-24", now)).toBe("mepet");
  });
  it("deadline +3 hari → mepet (inklusif)", () => {
    expect(deadlineCategory("2026-09-27", now)).toBe("mepet");
  });
  it("deadline +4 hari → null", () => {
    expect(deadlineCategory("2026-09-28", now)).toBeNull();
  });
  it("deadline kemarin → terlewat, bukan mepet", () => {
    expect(deadlineCategory("2026-09-23", now)).toBe("terlewat");
  });
  it("deadline null → null", () => {
    expect(deadlineCategory(null, now)).toBeNull();
  });
});

describe("isInterviewTerjadwal", () => {
  const now = new Date("2026-09-24T10:00:00+07:00");
  it("hari ini atau nanti → true", () => {
    expect(isInterviewTerjadwal("2026-09-24", now)).toBe(true);
    expect(isInterviewTerjadwal("2026-10-01", now)).toBe(true);
  });
  it("kemarin → false", () => {
    expect(isInterviewTerjadwal("2026-09-23", now)).toBe(false);
  });
  it("null → false", () => {
    expect(isInterviewTerjadwal(null, now)).toBe(false);
  });
});

describe("minggu WIB (Senin–Minggu)", () => {
  // 2026-09-24 = Kamis
  const now = new Date("2026-09-24T10:00:00+07:00");
  it("startOfWeek = Senin 2026-09-21", () => {
    expect(startOfWeekWIB(now)).toBe("2026-09-21");
  });
  it("Senin & Minggu minggu ini termasuk", () => {
    expect(isLamaranMingguIni("2026-09-21", now)).toBe(true);
    expect(isLamaranMingguIni("2026-09-27", now)).toBe(true);
  });
  it("Minggu lalu tidak termasuk", () => {
    expect(isLamaranMingguIni("2026-09-20", now)).toBe(false);
  });
  it("todayWIB memotong dengan benar", () => {
    expect(todayWIB(now)).toBe("2026-09-24");
  });
});

describe("umurLamaran", () => {
  const now = new Date("2026-09-24T10:00:00+07:00");
  it("12 hari lalu → 12", () => {
    expect(umurLamaran("2026-09-12", now)).toBe(12);
  });
  it("hari ini → 0", () => {
    expect(umurLamaran("2026-09-24", now)).toBe(0);
  });
  it("null → null", () => {
    expect(umurLamaran(null, now)).toBeNull();
  });
});

describe("isKontakPerluFollowup", () => {
  const now = new Date("2026-09-24T10:00:00+07:00");
  it("status Perlu Follow-up → true tanpa lihat tanggal", () => {
    expect(isKontakPerluFollowup({ statusFollowUp: "Perlu Follow-up", kontakTerakhir: null }, now)).toBe(true);
  });
  it("Menunggu Balasan >14 hari → true", () => {
    expect(isKontakPerluFollowup({ statusFollowUp: "Menunggu Balasan", kontakTerakhir: "2026-09-09" }, now)).toBe(true);
  });
  it("Menunggu Balasan tepat 14 hari → false (>14)", () => {
    expect(isKontakPerluFollowup({ statusFollowUp: "Menunggu Balasan", kontakTerakhir: "2026-09-10" }, now)).toBe(false);
  });
  it("Menunggu Balasan baru → false", () => {
    expect(isKontakPerluFollowup({ statusFollowUp: "Menunggu Balasan", kontakTerakhir: "2026-09-20" }, now)).toBe(false);
  });
});

describe("funnel (dari log, bukan status terkini)", () => {
  const reached = new Map<number, Set<string>>([
    [1, new Set(["Applied", "Screening HR", "Tes/Assignment", "Interview User", "Interview Akhir", "Offering", "Diterima"])],
    [2, new Set(["Applied", "Screening HR"])],
    [3, new Set(["Applied"])],
    [4, new Set(["Applied"])],
  ]);
  const apps = [
    { id: 1, status: "Diterima" },
    { id: 2, status: "Screening HR" },
    { id: 3, status: "Applied" },
    { id: 4, status: "Ditolak" },
  ];
  it("count = yang pernah mencapai tahap", () => {
    const f = funnel(reached, apps);
    expect(f.find((s) => s.stage === "Applied")!.count).toBe(4);
    expect(f.find((s) => s.stage === "Screening HR")!.count).toBe(2);
    expect(f.find((s) => s.stage === "Diterima")!.count).toBe(1);
  });
  it("konversi = tahap(n) / tahap(n−1)", () => {
    const f = funnel(reached, apps);
    expect(f[1]!.conversion).toBe(50); // 2/4
    expect(f[6]!.conversion).toBe(100); // 1/1
  });
  it("prev > 0 & count = 0 → konversi 0", () => {
    const empty = funnel(new Map([[1, new Set(["Applied"])]]), [{ id: 1, status: "Applied" }]);
    expect(empty[1]!.conversion).toBe(0);
    expect(empty[1]!.count).toBe(0);
  });
  it("aplikasi kosong → semua count 0, konversi null", () => {
    const empty = funnel(new Map(), []);
    expect(empty.every((s) => s.count === 0 && s.conversion === null)).toBe(true);
  });
});

describe("medianGaji (Decimal)", () => {
  it("rata-rata dua nilai", () => {
    expect(medianGaji("8000000.00", "12000000.00")).toBe("10000000.00");
  });
  it("hasil ganjil dibulatkan ke sen", () => {
    expect(medianGaji("0.01", "0.02")).toBe("0.01");
  });
  it("data tidak lengkap → null", () => {
    expect(medianGaji(null, "100")).toBeNull();
    expect(medianGaji("100", null)).toBeNull();
  });
});

describe("offerScore", () => {
  const w0 = { gaji: 0, wlb: 34, jenjang: 33, budaya: 33 };
  it("bobot default gaji 0 = rata-rata 3 rating (spreadsheet asli)", () => {
    const s = offerScore({ thpEstimasi: "11000000.00", wlb: 4, jenjang: 4, budaya: 4 }, w0, "72000000.00");
    expect(s).toBe(4.0);
  });
  it("THP tertinggi → komponen gaji 5", () => {
    const s = offerScore({ thpEstimasi: "72000000.00", wlb: 4, jenjang: 5, budaya: 4 }, { gaji: 100, wlb: 0, jenjang: 0, budaya: 0 }, "72000000.00");
    expect(s).toBe(5.0);
  });
  it("THP setengah dari maks → komponen gaji 2.5", () => {
    const s = offerScore({ thpEstimasi: "36000000.00", wlb: 0, jenjang: 0, budaya: 0 }, { gaji: 100, wlb: 0, jenjang: 0, budaya: 0 }, "72000000.00");
    expect(s).toBe(2.5);
  });
});

describe("topScoreIds (skor seri)", () => {
  const offers = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const scoreOf = () => 4.0; // ketiganya seri 4.0 seperti data contoh
  it("semua yang seri dapat badge", () => {
    const ids = topScoreIds(offers, scoreOf);
    expect(ids.size).toBe(3);
    expect(ids.has(1)).toBe(true);
  });
  it("hanya yang tertinggi", () => {
    const ids = topScoreIds(offers, (o) => (o.id === 3 ? 4.5 : 4.0));
    expect(ids.has(3)).toBe(true);
    expect(ids.size).toBe(1);
  });
});
