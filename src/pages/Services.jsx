import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { Card } from "../components/ui.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";

// Custom line icons matching the app's hand-drawn nav icon style
// (viewBox 24x24, strokeWidth 1.8, currentColor)
const ICONS = {
  swiftrade: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" {...p}>
      <path d="M3 8h13M13 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 16H8m8 4-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  business_suite: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" {...p}>
      <rect x="3" y="8" width="18" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 13h18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  mobility: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" {...p}>
      <path d="M4 16V11l2-5h8l3 5h1a2 2 0 0 1 2 2v3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16h16" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.5" cy="16.5" r="1.8" />
      <circle cx="17.5" cy="16.5" r="1.8" />
    </svg>
  ),
  consult: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" {...p}>
      <path d="M4 5h13a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 9.5h8M8 12.5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  rewards: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" {...p}>
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 5H5a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3M16 5h3a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12v3m-3 3h6m-3 0v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  balloon: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" {...p}>
      <path d="M12 3a5 5 0 0 1 5 5c0 4-3 6.5-4 8.5h-2C10 14.5 7 12 7 8a5 5 0 0 1 5-5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 16.5h2l.5 2-1 1-1-1 .5-2Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 20v1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function PartnerIcon({ iconKey, className }) {
  const Icon = ICONS[iconKey];
  if (!Icon) return null;
  return <Icon className={className} />;
}

export default function Services() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("partner_links")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      setPartners(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-100 whitespace-nowrap truncate">Vyeta Network</h1>
        <p className="text-sm text-ink-500 mt-1">Explore the platforms in the Vyeta ecosystem.</p>
      </div>

      {loading ? <SkeletonCard rows={4} /> : partners.length === 0 ? (
        <Card><p className="text-sm text-ink-500 text-center py-4">No platforms available yet.</p></Card>
      ) : (
        <div className="space-y-3">
          {partners.map((p) => (
<a            
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="flex items-center gap-4 hover:border-violet-500/40 transition-colors">
                <div className="h-11 w-11 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                  <PartnerIcon iconKey={p.icon_key} className="h-5 w-5 stroke-violet-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-sm font-semibold text-ink-100">{p.name}</h3>
                  {p.description && <p className="text-xs text-ink-500 mt-0.5 truncate">{p.description}</p>}
                </div>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="h-4 w-4 stroke-ink-500 shrink-0">
                  <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
