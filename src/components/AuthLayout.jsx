import React from "react";
import { Link } from "react-router-dom";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-12">
      {/* Brand mark */}
      <Link to="/login" className="flex items-center gap-2.5 mb-8">
        <div className="h-10 w-10 rounded-2xl bg-mint-500/20 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-mint-400" />
        </div>
        <span className="font-display text-lg font-semibold text-ink-100">Vyeta Credits</span>
      </Link>

      <div className="w-full max-w-sm">
        {(title || subtitle) && (
          <div className="text-center mb-6">
            {title && <h1 className="font-display text-2xl font-semibold text-ink-100">{title}</h1>}
            {subtitle && <p className="text-sm text-ink-500 mt-1.5">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>

      <p className="text-xs text-ink-700 mt-8 text-center max-w-xs">
        Vyeta Credits is a closed-loop simulation system operated by{" "}
        <span className="text-ink-500">Vyeta Digital Solutions</span>. Credits have no monetary value outside the platform.
      </p>
    </div>
  );
}
