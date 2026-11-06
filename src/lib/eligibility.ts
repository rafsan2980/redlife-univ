// 3-month donation eligibility — mirrors server.ts. Keep in sync.
// A donor may give blood again 3 calendar months after their last
// donation (e.g. last donated 1 Sept -> eligible again 1 Dec).
// A donor who has never donated (donationCount 0 or no last donation
// date) is eligible right away.

function addMonthsClamped(y: number, m: number, d: number, months: number): Date {
  const totalMonths = y * 12 + m + months;
  const newY = Math.floor(totalMonths / 12);
  const newM = totalMonths % 12;
  const lastDay = new Date(newY, newM + 1, 0).getDate();
  return new Date(newY, newM, Math.min(d, lastDay));
}

export function getNextEligibleDate(lastDonationDate: string): string | null {
  if (!lastDonationDate) return null;
  const parts = String(lastDonationDate).split("-");
  if (parts.length < 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  if (!y || m < 0 || m > 11 || !d) return null;
  const next = addMonthsClamped(y, m, d, 3);
  const mm = String(next.getMonth() + 1).padStart(2, "0");
  const dd = String(next.getDate()).padStart(2, "0");
  return `${next.getFullYear()}-${mm}-${dd}`;
}

export function isDonorEligible(donor: { lastDonationDate?: string; donationCount?: number }, now: Date = new Date()): boolean {
  if (!donor) return false;
  if (!donor.lastDonationDate) return true;
  if (!donor.donationCount) return true; // never donated: no wait
  const next = getNextEligibleDate(donor.lastDonationDate);
  if (!next) return true;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return todayStr >= next;
}

// "2026-12-01" -> "1 Dec 2026". Falls back to the raw value when invalid.
export function formatEligibleDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const parts = String(iso).split("-");
  if (parts.length < 3) return iso;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
