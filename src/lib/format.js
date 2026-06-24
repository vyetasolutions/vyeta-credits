// Mock conversion rate: 1 Credit = 0.42 ZMW (display-only, not real money)
export const ZMW_RATE = 0.42;

export function creditsToZmw(credits, rate) {
  return (Number(credits) * Number(rate)).toFixed(2);
}

export function formatCredits(value) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Simulated tiered fee: 0% under 50, scaling up to 2% for large transfers.
export function calculateFee(amount) {
  const amt = Number(amount) || 0;
  let rate;
  if (amt <= 50) rate = 0;
  else if (amt <= 250) rate = 0.005;
  else if (amt <= 1000) rate = 0.012;
  else rate = 0.02;

  const fee = Math.round(amt * rate * 100) / 100;
  return { rate, fee, total: Math.round((amt + fee) * 100) / 100 };
}

// Simulated "reliability score" for a transaction — a cosmetic confidence
// indicator (NOT a real risk/credit score), seeded from amount + timestamp
// so it's stable for a given transaction rather than random noise on every render.
export function reliabilityScore(amount, timestamp) {
  const seed = (Number(amount) * 13 + new Date(timestamp).getTime()) % 100;
  const base = 88 + (seed % 12); // 88-99 range, feels premium/trustworthy
  return Math.min(99, base);
}

export function formatDate(ts) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
