import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { Button } from "../components/ui.jsx";
import LinkedPlatforms from "../components/LinkedPlatforms.jsx";
import { SkeletonBalance } from "../components/Skeleton.jsx";
import { formatCredits } from "../lib/format.js";

export default function Dashboard() {
  const { profile, session } = useAuth();
  const navigate = useNavigate();
  const [topContacts, setTopContacts] = useState([]);

  useEffect(() => {
    if (!session?.user?.id) return;
    let active = true;

    async function loadContacts() {
      const { data: txs } = await supabase
        .from("transactions_view")
        .select("*")
        .eq("sender_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!active) return;
      const contactMap = {};
      (txs || []).forEach((t) => {
        const k = t.receiver_id;
        if (!contactMap[k]) contactMap[k] = { id: k, name: t.receiver_name };
      });
      setTopContacts(Object.values(contactMap).slice(0, 3));
    }

    loadContacts();
    return () => { active = false; };
  }, [session?.user?.id]);

  return (
    <div className="space-y-5">
      {/* Balance card */}
      {!profile ? (
        <SkeletonBalance />
      ) : (
        // 👇 WRAPPED IN A FRAGMENT TO FIX JSX ERROR
        <>
          {/* 👇 FIXED TYPO: changed rounded-xl2 to rounded-2xl */}
          <div className="rounded-2xl border border-base-700 bg-gradient-to-br from-base-850 via-base-800 to-base-850 shadow-card p-5 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 h-36 w-36 rounded-full bg-mint-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

            <p className="text-xs font-medium text-ink-500 uppercase tracking-widest">Available balance</p>
            <p className="font-mono text-4xl font-semibold text-ink-100 mt-2 tracking-tight">
              {formatCredits(profile.balance)}
              <span className="text-base text-ink-500 ml-2 font-normal">CR</span>
            </p>

            <p className="text-xs text-ink-500 mt-2">
              K{formatCredits(profile.cashable_balance ?? 0)} available to load out
              {Number(profile.balance) > Number(profile.cashable_balance ?? 0) && (
                <> · {formatCredits(Number(profile.balance) - Number(profile.cashable_balance ?? 0))} CR bonus (spendable only)</>
              )}
            </p>

            <div className="flex gap-3 mt-5">
              <Link to="/send" className="flex-1">
                <Button size="md">
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 stroke-current" strokeWidth="2">
                    <path d="M3 10 17 3l-5 14-2.5-5.5L3 10Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Send credits
                </Button>
              </Link>
              <Link to="/load-credits" className="flex-1">
                <Button variant="secondary" size="md">
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 stroke-current" strokeWidth="2">
                    <path d="M10 3v14M4 9l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Load credits
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="text-center">
            <Link to="/support" className="text-xs text-ink-500 hover:text-ink-300">Need help? Contact Support →</Link>
          </div>
        </>
      )}

      {/* Quick send — recent contacts */}
      {topContacts.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-500 uppercase tracking-widest mb-3">Quick send</p>
          <div className="flex gap-3">
            {topContacts.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate("/send", { state: { recipient: c } })}
                className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl bg-base-850 border border-base-700 hover:border-violet-500/40 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-violet-500/20 text-violet-300 font-display text-xs flex items-center justify-center">
                  {c.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-[11px] text-ink-300 truncate w-full text-center">{c.name?.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Linked platforms */}
      <LinkedPlatforms />
    </div>
  );
}
