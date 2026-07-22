import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function AdminHeader({ title = "Admin panel", pendingPaymentsCount = 0 }) {
  const location = useLocation();

  const navItems = [
    { label: "Overview", path: "/admin" },
    { 
      label: "Payments", 
      path: "/admin/payments", 
      badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : null 
    },
    { label: "Services", path: "/admin/services" },
    { label: "Support", path: "/admin/support" },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-base-700/60">
      <h1 className="font-display text-xl font-semibold text-ink-100 min-w-0">
        {title}
      </h1>

      <div className="flex items-center gap-2 flex-wrap">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "bg-base-850 text-ink-400 hover:text-ink-200 border border-base-700 hover:border-base-600"
              }`}
            >
              {item.label}
              {item.badge && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold bg-flame-500 text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
