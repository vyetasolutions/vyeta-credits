import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { initials } from "../lib/format.js";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/send", label: "Send", icon: SendIcon },
  { to: "/history", label: "Activity", icon: HistoryIcon },
  { to: "/contacts", label: "Contacts", icon: ContactsIcon },
  { to: "/analytics", label: "Insights", icon: InsightsIcon },
];

export default function Shell({ children }) {
  const { pathname } = useLocation();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems =
    profile?.role === "admin"
      ? [...NAV_ITEMS, { to: "/admin", label: "Admin", icon: ShieldIcon }]
      : NAV_ITEMS;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-base-950/80 border-b border-base-700">
        <div className="max-w-md mx-auto w-full flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-mint-500/20 flex items-center justify-center">
              <div className="h-2.5 w-2.5 rounded-full bg-mint-400 animate-pulseRing absolute" />
              <div className="h-2.5 w-2.5 rounded-full bg-mint-400 relative" />
            </div>
            <span className="font-display font-semibold text-ink-100 tracking-tight">Vyeta Credits</span>
          </div>
          <button
            onClick={() => navigate("/contacts")}
            className="h-9 w-9 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center font-display text-xs text-violet-300"
            title={profile?.full_name}
          >
            {initials(profile?.full_name)}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-5 pb-28 pt-5">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-base-700 bg-base-900/95 backdrop-blur-md">
        <div className="max-w-md mx-auto flex items-stretch">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-mint-400" : "text-ink-500 hover:text-ink-300"
                }`}
              >
                <Icon active={active} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <button
        onClick={signOut}
        className="hidden md:block fixed top-4 right-4 text-xs text-ink-500 hover:text-ink-300"
      >
        Sign out
      </button>
    </div>
  );
}

function iconBase(active) {
  return `h-5 w-5 ${active ? "stroke-mint-400" : "stroke-current"}`;
}

function HomeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconBase(active)} strokeWidth="1.8">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9h13v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SendIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconBase(active)} strokeWidth="1.8">
      <path d="M4 12 20 4l-6 16-3-7-7-1Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HistoryIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconBase(active)} strokeWidth="1.8">
      <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="8.5" />
    </svg>
  );
}
function ContactsIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconBase(active)} strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" strokeLinecap="round" />
    </svg>
  );
}
function InsightsIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconBase(active)} strokeWidth="1.8">
      <path d="M4 19V5M4 19h16M8 16v-5M12.5 16V8m4.5 8v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ShieldIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconBase(active)} strokeWidth="1.8">
      <path d="M12 3.5 5 6v6c0 4 3 7 7 8.5 4-1.5 7-4.5 7-8.5V6l-7-2.5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 12l1.8 1.8L14.5 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
