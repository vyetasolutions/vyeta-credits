import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { Card } from "../components/ui.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import TransactionRow from "../components/TransactionRow.jsx";
import { formatDateGroup } from "../lib/format.js";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "out", label: "Sent" },
  { key: "in", label: "Received" },
];

export default function History() {
  const { session } = useAuth();
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!session?.user?.id) return;
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("transactions_view")
        .select("*")
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order("created_at", { ascending: false })
        .limit(100);
      if (active) { setTxs(data || []); setLoading(false); }
    }
    load();

    const ch = supabase
      .channel("history-" + session.user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, load)
      .subscribe();

    return () => { active = false; supabase.removeChannel(ch); };
  }, [session?.user?.id]);

  const filtered = txs.filter((tx) => {
    if (filter === "out") return tx.sender_id === session.user.id;
    if (filter === "in") return tx.receiver_id === session.user.id;
    return true;
  });

  // Group by date label
  const groups = filtered.reduce((acc, tx) => {
    const label = formatDateGroup(tx.created_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(tx);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold text-ink-100">Activity</h1>

      <div className="flex gap-2">
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

      {loading ? <SkeletonCard rows={5} /> : filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500 py-4 text-center">No transactions in this filter.</p>
        </Card>
      ) : (
        Object.entries(groups).map(([label, items]) => (
          <div key={label}>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-2">{label}</p>
            <Card className="!p-0 overflow-hidden">
              <div className="px-5">
                {items.map((tx) => <TransactionRow key={tx.id} tx={tx} myId={session.user.id} />)}
              </div>
            </Card>
          </div>
        ))
      )}
    </div>
  );
}
