import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl2 border border-base-700 bg-base-850 shadow-card p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "w-full py-3.5 rounded-xl font-display font-semibold text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]";
  const variants = {
    primary: "bg-mint-500 text-base-950 hover:bg-mint-400 shadow-glow",
    secondary: "bg-base-800 text-ink-100 border border-base-600 hover:border-violet-500/50",
    ghost: "bg-transparent text-ink-300 hover:text-ink-100",
    danger: "bg-flame-500/15 text-flame-400 border border-flame-500/30 hover:bg-flame-500/25",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, error, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-ink-500 mb-1.5">{label}</span>}
      <input
        className={`w-full bg-base-800 border ${
          error ? "border-flame-500/60" : "border-base-600"
        } rounded-xl px-4 py-3 text-sm text-ink-100 placeholder:text-ink-700 focus:border-violet-500 outline-none transition-colors ${className}`}
        {...props}
      />
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
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
