import React from "react";
export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl2 border border-base-700 bg-base-850 shadow-card p-5 ${className}`}>
      {children}
    </div>
  );
}
export function Button({ children, variant = "primary", size = "md", className = "", ...props }) {
  const base = "w-full font-display font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2 min-h-[44px]";
  const sizes = {
    sm: "py-2.5 px-4 rounded-xl text-xs",
    md: "py-3.5 px-5 rounded-xl text-sm",
    lg: "py-4 px-6 rounded-xl2 text-base",
  };
  const variants = {
    primary: "bg-mint-500 text-base-950 hover:bg-mint-400 shadow-glow",
    secondary: "bg-base-800 text-ink-100 border border-base-600 hover:border-violet-500/50 hover:bg-base-700",
    ghost: "bg-transparent text-ink-300 hover:text-ink-100",
    danger: "bg-flame-500/15 text-flame-400 border border-flame-500/30 hover:bg-flame-500/25",
    violet: "bg-violet-500 text-white hover:bg-violet-400 shadow-glow-violet",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Input({ label, error, hint, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-ink-500 mb-1.5">{label}</span>}
      <input
        // text-base (16px) is deliberate: anything smaller triggers iOS Safari's
        // auto-zoom-on-focus, which is jarring on a mobile-first app.
        className={`w-full bg-base-800 border ${error ? "border-flame-500/60" : "border-base-600"} rounded-xl px-4 py-3 text-base text-ink-100 placeholder:text-ink-700 focus:border-violet-500 outline-none transition-colors ${className}`}
        {...props}
      />
      {hint && !error && <span className="block text-xs text-ink-700 mt-1.5">{hint}</span>}
      {error && <span className="block text-xs text-flame-400 mt-1.5">{error}</span>}
    </label>
  );
}
export function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-base-700 text-ink-300",
    mint: "bg-mint-500/15 text-mint-400",
    violet: "bg-violet-500/15 text-violet-300",
    flame: "bg-flame-500/15 text-flame-400",
    amber: "bg-amber-500/15 text-amber-400",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
export function Divider({ label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-base-700" />
      {label && <span className="text-xs text-ink-700">{label}</span>}
      <div className="h-px flex-1 bg-base-700" />
    </div>
  );
}
export function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold bg-flame-500 text-white ${className}`}>
      {children}
    </span>
  );
}

