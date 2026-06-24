import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { Card, Button, Pill } from "../components/ui.jsx";
import TransactionRow from "../components/TransactionRow.jsx";
import { formatCredits, creditsToZmw } from "../lib/format.js";

export default function Dashboard() {
  const { profile, session } = useAuth();
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("transactions_view")
        .select("*")
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order("created_at", { ascending: false })
        .limit(5);
      if (active) {
        setRecent(data || []);
        setLoading(false);
      }
    }
    load();

    const channel = supabase
      .channel("dashboard-tx-" + session.user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-base-850 to-base-800 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-mint-500/10 blur-3xl" />
        <p className="text-xs font-medium text-ink-500 uppercase tracking-wider">Available balance</p>
        <p className="font-mono text-4xl font-semibold text-ink-100 mt-2 tracking-tight">
          {profile ? formatCredits(profile.balance) : "—"}
          <span className="text-base text-ink-500 ml-1.5">CR</span>
        </p>
        <p className="text-sm text-ink-500 mt-1">
          ≈ K{profile ? creditsToZmw(profile.balance) : "0.00"}{" "}
          <span className="text-ink-700">(mock rate)</span>
        </p>

        <div className="flex gap-3 mt-5">
          <Link to="/send" className="flex-1">
            <Button>Send credits</Button>
          </Link>
          <Link to="/contacts" className="flex-1">
            <Button variant="secondary">Find people</Button>
          </Link>
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-semibold text-ink-100">Recent activity</h2>
          <Link to="/history" className="text-xs text-violet-400 font-medium">
            See all
          </Link>
        </div>
        <Card>
          {loading ? (
            <p className="text-sm text-ink-500 py-2">Loading…</p>
          ) : recent.length === 0 ? (
            <EmptyState />
          ) : (
            recent.map((tx) => <TransactionRow key={tx.id} tx={tx} myId={session.user.id} />)
          )}
        </Card>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-6">
      <p className="text-sm font-medium text-ink-300">No transactions yet</p>
      <p className="text-xs text-ink-500 mt-1">Send your first credits to see activity here.</p>
    </div>
  );
}
