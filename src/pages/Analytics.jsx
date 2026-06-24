import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { Card } from "../components/ui.jsx";
import { formatCredits, initials } from "../lib/format.js";

export default function Analytics() {
  const { session } = useAuth();
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    supabase
      .from("transactions_view")
      .select("*")
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .then(({ data }) => {
        setTxs(data || []);
        setLoading(false);
      });
  }, [session?.user?.id]);

  const stats = useMemo(() => {
    const myId = session.user.id;
    let totalSent = 0;
    let totalReceived = 0;
    const contactTotals = {};

    txs.forEach((tx) => {
      if (tx.sender_id === myId) {
        totalSent += Number(tx.amount);
        const key = tx.receiver_name || "Unknown";
        contactTotals[key] = (contactTotals[key] || 0) + Number(tx.amount);
      } else {
        totalReceived += Number(tx.amount);
        const key = tx.sender_name || "Unknown";
        contactTotals[key] = (contactTotals[key] || 0) + Number(tx.amount);
      }
    });

    const topContacts = Object.entries(contactTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { totalSent, totalReceived, topContacts, count: txs.length };
  }, [txs, session.user.id]);

  if (loading) return <p className="text-sm text-ink-500">Loading insights…</p>;

  const maxContact = stats.topContacts[0]?.[1] || 1;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold text-ink-100">Insights</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-4">
          <p className="text-xs text-ink-500">Total sent</p>
          <p className="font-mono text-xl font-semibold text-ink-100 mt-1">
            {formatCredits(stats.totalSent)}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-ink-500">Total received</p>
          <p className="font-mono text-xl font-semibold text-mint-400 mt-1">
            {formatCredits(stats.totalReceived)}
          </p>
        </Card>
      </div>

      <Card>
        <p className="text-xs text-ink-500 mb-1">Lifetime transactions</p>
        <p className="font-mono text-2xl font-semibold text-ink-100">{stats.count}</p>
      </Card>

      <div>
        <h2 className="font-display text-sm font-semibold text-ink-100 mb-3">Top contacts</h2>
        <Card>
          {stats.topContacts.length === 0 ? (
            <p className="text-sm text-ink-500 py-2 text-center">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.topContacts.map(([name, amount]) => (
                <div key={name} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-base-700 text-ink-300 flex items-center justify-center font-display text-[10px] shrink-0">
                    {initials(name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-ink-100">{name}</span>
                      <span className="text-xs font-mono text-ink-500">{formatCredits(amount)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-base-700 overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${(amount / maxContact) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
