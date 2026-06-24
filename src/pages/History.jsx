import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { Card, Pill } from "../components/ui.jsx";
import TransactionRow from "../components/TransactionRow.jsx";

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
      if (active) {
        setTxs(data || []);
        setLoading(false);
      }
    }
    load();

    const channel = supabase
      .channel("history-tx-" + session.user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const filtered = txs.filter((tx) => {
    if (filter === "out") return tx.sender_id === session.user.id;
    if (filter === "in") return tx.receiver_id === session.user.id;
    return true;
  });

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold text-ink-100">Activity</h1>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.key ? "bg-mint-500 text-base-950" : "bg-base-800 text-ink-500"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <p className="text-sm text-ink-500 py-2">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-ink-500 py-4 text-center">No transactions in this filter.</p>
        ) : (
          filtered.map((tx) => <TransactionRow key={tx.id} tx={tx} myId={session.user.id} />)
        )}
      </Card>
    </div>
  );
}
