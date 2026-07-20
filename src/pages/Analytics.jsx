import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { Card } from "../components/ui.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import { formatCredits, initials, avatarColor } from "../lib/format.js";
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
      .then(({ data }) => { setTxs(data || []); setLoading(false); });
  }, [session?.user?.id]);
  const stats = useMemo(() => {
    const myId = session.user.id;
    let totalSent = 0, totalReceived = 0, totalFees = 0;
    const contactMap = {};
    txs.forEach((tx) => {
      if (tx.sender_id === myId) {
        totalSent += Number(tx.amount);
        totalFees += Number(tx.fee || 0);
        const key = tx.receiver_name || "Unknown";
        contactMap[key] = (contactMap[key] || 0) + Number(tx.amount);
      } else {
        totalReceived += Number(tx.amount);
        const key = tx.sender_name || "Unknown";
        contactMap[key] = (contactMap[key] || 0) + Number(tx.amount);
      }
    });
    const topContacts = Object.entries(contactMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { totalSent, totalReceived, totalFees, topContacts, count: txs.length };
  }, [txs, session.user.id]);
  if (loading) return <div className="space-y-5"><h1 className="font-display text-xl font-semibold text-ink-100 whitespace-nowrap truncate">Insights</h1><SkeletonCard rows={3} /></div>;
  const maxContact = stats.topContacts[0]?.[1] || 1;
  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold text-ink-100 whitespace-nowrap truncate">Insights</h1>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total sent", value: stats.totalSent, color: "text-ink-100" },
          { label: "Total received", value: stats.totalReceived, color: "text-mint-400" },
          { label: "Fees paid", value: stats.totalFees, color: "text-amber-400" },
          { label: "Transactions", value: null, count: stats.count, color: "text-violet-300" },
        ].map((s) => (
          <Card key={s.label} className="!p-4">
            <p className="text-xs text-ink-500 mb-1">{s.label}</p>
            <p className={`font-mono text-xl font-semibold ${s.color}`}>
              {s.count !== undefined ? s.count : formatCredits(s.value)}
            </p>
          </Card>
        ))}
      </div>
      {stats.topContacts.length > 0 && (
        <div>
          <h2 className="font-display text-sm font-semibold text-ink-100 mb-3">Top contacts</h2>
          <Card>
            <div className="space-y-4">
              {stats.topContacts.map(([name, amount]) => (
                <div key={name} className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-display text-[10px] shrink-0 ${avatarColor(name)}`}>
                    {initials(name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-ink-100">{name}</span>
                      <span className="text-xs font-mono text-ink-500">{formatCredits(amount)} CR</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-base-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-mint-500 rounded-full transition-all duration-700"
                        style={{ width: `${(amount / maxContact) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

