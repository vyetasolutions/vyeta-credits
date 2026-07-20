import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { Card, Button, Pill } from "../components/ui.jsx";
import TransactionRow from "../components/TransactionRow.jsx";
import { SkeletonBalance, SkeletonCard } from "../components/Skeleton.jsx";
import { formatCredits, formatDate } from "../lib/format.js";

export default function Dashboard() {
  const { profile, session } = useAuth();
  const navigate = useNavigate();
  const [recent, setRecent] = useState([]);
  const [activeSubs, setActiveSubs] = useState([]);
  const [topContacts, setTopContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    let active = true;

    async function load() {
      const [{ data: txs }, { data: subs }] = await Promise.all([
        supabase
          .from("transactions_view")
          .select("*")
          .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("subscriptions_view")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("status", "active")
          .order("started_at", { ascending: false }),
      ]);

      if (!active) return;
      const txData = txs || [];
      setRecent(txData);
      setActiveSubs(subs || []);

      // Build top contacts from recent sends
      const contactMap = {};
      txData.filter(t => t.sender_id === session.user.id).forEach(t => {
        const k = t.receiver_id;
        if (!contactMap[k]) contactMap[k] = { id: k, name: t.receiver_name };
      });
      setTopContacts(Object.values(contactMap).slice(0, 3));
      setLoading(false);
    }

    load();

    const ch = supabase
      .channel("dashboard-" + session.user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, load)
      .subscribe();

    return () => { active = false; supabase.removeChannel(ch); };
  }, [session?.user?.id]);

  return (
    <div className="space-y-5">
      {/* Balance card */}
      {!profile ? <SkeletonBalance /> : (
        <div className="rounded-xl2 border border-base-700 bg-gradient-to-br from-base-850 via-base-800 to-base-850 shadow-card p-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 h-36 w-36 rounded-full bg-mint-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

          <p className="text-xs font-medium text-ink-500 uppercase tracking-widest">Available balance</p>
          <p className="font-mono text-4xl font-semibold text-ink-100 mt-2 tracking-tight">
            {formatCredits(profile.balance)}
            <span className="text-base text-ink-500 ml-2 font-normal">CR</span>
          </p>

          {/* 1 CR = 1 ZMW, structurally - just show the split between
              spendable-only bonus CR and real-money top-up CR */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-ink-500">
              K{formatCredits(profile.cashable_balance ?? 0)} available to load out
            </span>
          </div>
          {Number(profile.balance) > Number(profile.cashable_balance ?? 0) && (
            <p className="text-[11px] text-ink-700 mt-0.5">
              Remaining {formatCredits(Number(profile.balance) - Number(profile.cashable_balance ?? 0))} CR is bonus/promotional — spendable across Vyeta, not withdrawable.
            </p>
          )}

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
          <div className="mt-3">
            <Link to="/services" className="block">
              <Button variant="ghost" size="sm">Browse Services</Button>
            </Link>
          </div>
        </div>
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

      {/* Active services */}
      {activeSubs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-ink-500 uppercase tracking-widest">Active services</p>
            <Link to="/services" className="text-xs text-violet-400">Manage</Link>
          </div>
          <Card className="!p-0 overflow-hidden">
            {activeSubs.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 border-b border-base-700/60 last:border-0">
                <div>
                  <p className="text-sm font-medium text-ink-100">{s.service_name}</p>
                  <p className="text-xs text-ink-500">
                    {s.current_period_end ? `Renews ${formatDate(s.current_period_end)}` : "One-time"}
                  </p>
                </div>
                <Pill tone="mint">Active</Pill>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-ink-500 uppercase tracking-widest">Recent activity</p>
          <Link to="/history" className="text-xs text-violet-400">See all</Link>
        </div>
        {loading ? <SkeletonCard rows={3} /> : (
          <Card className="!p-0 overflow-hidden">
            {recent.length === 0 ? (
              <div className="text-center py-8 px-5">
                <p className="text-sm font-medium text-ink-300">No transactions yet</p>
                <p className="text-xs text-ink-500 mt-1">Send credits to someone to see activity here.</p>
              </div>
            ) : (
              <div className="px-5">
                {recent.map((tx) => <TransactionRow key={tx.id} tx={tx} myId={session.user.id} />)}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

