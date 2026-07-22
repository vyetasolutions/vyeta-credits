import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { initials, avatarColor } from "../lib/format.js";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/send", label: "Send", icon: SendIcon },
  { to: "/history", label: "Activity", icon: HistoryIcon },
  { to: "/services", label: "Network", icon: ServicesIcon },
  { to: "/analytics", label: "Insights", icon: InsightsIcon },
];

export default function Shell({ children }) {
  const { pathname } = useLocation();
  const { profile, signOut } = useAuth();

  const navItems = profile?.role === "admin"
    ? [...NAV_ITEMS, { to: "/admin", label: "Admin", icon: ShieldIcon }]
    : NAV_ITEMS;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-base-950/85 border-b border-base-700/60">
        <div className="max-w-md mx-auto w-full flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-7 w-7 rounded-lg bg-mint-500/20 flex items-center justify-center shrink-0">
              <div className="h-2.5 w-2.5 rounded-full bg-mint-400 animate-pulseRing absolute opacity-60" />
              <div className="h-2.5 w-2.5 rounded-full bg-mint-400 relative" />
            </div>
            <span className="font-display font-semibold text-ink-100 tracking-tight whitespace-nowrap truncate">Vyeta Credits</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Avatar → goes to contacts */}
            <Link
              to="/contacts"
              className={`h-11 w-11 rounded-full border flex items-center justify-center font-display text-xs transition-colors border-violet-500/30 ${avatarColor(profile?.full_name)}`}
              title={profile?.full_name}
            >
              {initials(profile?.full_name)}
            </Link>

            {/* Sign out */}
            <button
              onClick={() => { if (window.confirm("Sign out of Vyeta Credits?")) signOut(); }}
              className="h-11 w-11 rounded-full bg-base-800 border border-base-700 flex items-center justify-center text-ink-500 hover:text-flame-400 hover:border-flame-500/40 transition-colors"
              aria-label="Sign out"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 stroke-current" strokeWidth="2">
                <path d="M15 17v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12h11m0 0-3-3m3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-28 pt-5">{children}</main>

      {/* Bottom nav — pb includes safe-area-inset for iPhones with a home indicator */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-base-700/60 bg-base-900/95 backdrop-blur-lg"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-md mx-auto flex items-stretch">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[52px] text-[10px] font-medium transition-colors relative ${active ? "text-mint-400" : "text-ink-700 hover:text-ink-400"}`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 bg-mint-400 rounded-full" />
                )}
                <Icon active={active} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

const s = (active) => `h-5 w-5 transition-colors ${active ? "stroke-mint-400" : "stroke-current"}`;

function HomeIcon({ active }) {
  return <svg viewBox="0 0 24 24" fill="none" className={s(active)} strokeWidth="1.8"><path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M5.5 10v9h13v-9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function SendIcon({ active }) {
  return <svg viewBox="0 0 24 24" fill="none" className={s(active)} strokeWidth="1.8"><path d="M4 12 20 4l-6 16-3-7-7-1Z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function HistoryIcon({ active }) {
  return <svg viewBox="0 0 24 24" fill="none" className={s(active)} strokeWidth="1.8"><path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="8.5" /></svg>;
}
function ServicesIcon({ active }) {
  return <svg viewBox="0 0 24 24" fill="none" className={s(active)} strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
}
function InsightsIcon({ active }) {
  return <svg viewBox="0 0 24 24" fill="none" className={s(active)} strokeWidth="1.8"><path d="M4 19V5M4 19h16M8 16v-5M12.5 16V8m4.5 8v-3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function ShieldIcon({ active }) {
  return <svg viewBox="0 0 24 24" fill="none" className={s(active)} strokeWidth="1.8"><path d="M12 3.5 5 6v6c0 4 3 7 7 8.5C16 19 19 16 19 12V6l-7-2.5Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M9.5 12l1.8 1.8L14.5 10" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

