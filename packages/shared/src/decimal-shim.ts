/**
 * Shim Decimal ringan untuk aturan uang. Uang di API dikirim sebagai string;
 * perhitungan median memakai aritmetika string terkontrol agar tidak jatuh
 * ke float. Untuk kebutuhan median (rata-rata dua Decimal 15,2) ini cukup.
 */
export class Decimal {
  private cents: bigint;

  constructor(value: string | number | bigint) {
    const s = String(value).trim();
    if (!/^-?\d+(\.\d+)?$/.test(s)) {
      throw new Error(`Invalid decimal: ${value}`);
    }
    const neg = s.startsWith("-");
    const abs = neg ? s.slice(1) : s;
    const [int, frac = ""] = abs.split(".");
    const frac2 = (frac + "00").slice(0, 2);
    this.cents = BigInt((neg ? "-" : "") + int + frac2);
  }

  static fromCents(cents: bigint): Decimal {
    const d = Object.create(Decimal.prototype) as Decimal;
    d.cents = cents;
    return d;
  }

  add(other: Decimal): Decimal {
    return Decimal.fromCents(this.cents + other.cents);
  }

  div(n: bigint): Decimal {
    const neg = this.cents < 0n !== n < 0n;
    const abs = (a: bigint) => (a < 0n ? -a : a);
    const q = abs(this.cents) / abs(n);
    return Decimal.fromCents(neg ? -q : q);
  }

  /** Nilai sebagai string desimal 2 tempat — format JSON API. */
  toString(): string {
    const neg = this.cents < 0n;
    const abs = (neg ? -this.cents : this.cents).toString().padStart(3, "0");
    const int = abs.slice(0, -2);
    const frac = abs.slice(-2);
    return `${neg ? "-" : ""}${int}.${frac}`;
  }
}
