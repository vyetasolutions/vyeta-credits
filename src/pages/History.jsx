import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { Card, Pill } from "../components/ui.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import TransactionRow from "../components/TransactionRow.jsx";
import { formatDateGroup, formatCredits, formatDate, billingLabel } from "../lib/format.js";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "out", label: "Sent" },
  { key: "in", label: "Received" },
  { key: "services", label: "Services" },
];

function ServiceActivityRow({ sub, onCancel, busy }) {
  const isActive = sub.status === "active" &&
    (!sub.current_period_end || new Date(sub.current_period_end) > new Date());

  const daysUntilRenewal = sub.current_period_end
    ? Math.ceil((new Date(sub.current_period_end) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const renewsSoon = isActive && daysUntilRenewal !== null && daysUntilRenewal <= 3;

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-base-700/60 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-100 truncate">{sub.service_name}</p>
        <p className={`text-xs mt-0.5 ${renewsSoon ? "text-flame-400" : "text-ink-500"}`}>
          {formatCredits(sub.price)} CR · {billingLabel(sub.billing_interval)}
          {sub.current_period_end && ` · renews ${formatDate(sub.current_period_end)}`}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Pill tone={!isActive ? "flame" : renewsSoon ? "flame" : "mint"}>
          {!isActive ? "Cancelled" : renewsSoon ? "Renews soon" : "Active"}
        </Pill>
        {isActive && (
          <button
            onClick={() => onCancel(sub.id)}
            disabled={busy === sub.id}
            className="text-xs text-flame-400 font-medium disabled:opacity-40"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function History() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [txs, setTxs] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(null);

  async function loadAll() {
    const [{ data: txData }, { data: subData }] = await Promise.all([
      supabase
        .from("transactions_view")
        .select("*")
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("subscriptions_view")
        .select("*")
        .eq("user_id", session.user.id)
        .order("started_at", { ascending: false }),
    ]);
    setTxs(txData || []);
    setSubs(subData || []);
    setLoading(false);
  }

  useEffect(() => {
    if (!session?.user?.id) return;
    let active = true;

    async function load() {
      if (!active) return;
      await loadAll();
    }
    load();

    const ch = supabase
      .channel("history-" + session.user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, load)
      .subscribe();

    return () => { active = false; supabase.removeChannel(ch); };
  }, [session?.user?.id]);

  async function handleCancel(subId) {
    setBusy(subId);
    const { error } = await supabase.rpc("cancel_subscription", { p_subscription_id: subId });
    setBusy(null);
    if (error) { toast(error.message, "error"); return; }
    toast("Subscription cancelled.", "info");
    loadAll();
  }

  const filteredTxs = filter === "services" ? [] : txs.filter((tx) => {
    if (filter === "out") return tx.sender_id === session.user.id;
    if (filter === "in") return tx.receiver_id === session.user.id;
    return true;
  });

  const showSubs = filter === "all" || filter === "services";

  const txGroups = filteredTxs.reduce((acc, tx) => {
    const label = formatDateGroup(tx.created_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(tx);
    return acc;
  }, {});

  const isEmpty = filteredTxs.length === 0 && (!showSubs || subs.length === 0);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold text-ink-100">Activity</h1>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${filter === f.key ? "bg-mint-500 text-base-950" : "bg-base-800 text-ink-500 hover:text-ink-300"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <SkeletonCard rows={5} /> : isEmpty ? (
        <Card>
          <p className="text-sm text-ink-500 py-4 text-center">No activity in this filter.</p>
        </Card>
     ) : (
        <>
          {showSubs && subs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-2">Services</p>
              <Card className="!p-0 overflow-hidden">
                {subs.map((s) => (
                  <ServiceActivityRow key={s.id} sub={s} onCancel={handleCancel} busy={busy} />
                ))}
              </Card>
            </div>
          )}

          {filter !== "services" && Object.entries(txGroups).map(([label, items]) => (
            <div key={label}>
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-2">{label}</p>
              <Card className="!p-0 overflow-hidden">
                <div className="px-5">
                  {items.map((tx) => <TransactionRow key={tx.id} tx={tx} myId={session.user.id} />)}
                </div>
              </Card>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
