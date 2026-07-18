export function creditsToZmw(credits, rate) {
  return (Number(credits) * Number(rate)).toFixed(2);
}

export function zmwToCredits(zmw, rate) {
  if (!rate || rate === 0) return "0.00";
  return (Number(zmw) / Number(rate)).toFixed(2);
}

export function formatRate(rate) {
  const r = Number(rate);
  const inverse = r > 0 ? (1 / r).toFixed(4) : "—";
  return { forward: r.toFixed(4), inverse };
}

export function formatCredits(value) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Tiered fee — mirrored exactly in supabase calculate_fee() SQL function.
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

// Deterministic cosmetic score — stable per transaction, not random noise on each render.
export function reliabilityScore(amount, timestamp) {
  const seed = (Number(amount) * 13 + new Date(timestamp).getTime()) % 100;
  return Math.min(99, 88 + (seed % 12));
}

export function formatDate(ts) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export function formatDateGroup(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString("en-GB", { weekday: "long" });
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function billingLabel(interval) {
  if (interval === "monthly") return "/ month";
  if (interval === "yearly") return "/ year";
  return "one-time";
}

export function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function avatarColor(name) {
  const colors = [
    "bg-violet-500/20 text-violet-300",
    "bg-mint-500/20 text-mint-400",
    "bg-amber-500/20 text-amber-400",
    "bg-flame-500/20 text-flame-400",
    "bg-blue-500/20 text-blue-300",
  ];
  if (!name) return colors[0];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}
