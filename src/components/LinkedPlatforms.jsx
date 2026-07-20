import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { Card, Pill } from "../components/ui.jsx";
import { formatDate } from "../lib/format.js";

const PLATFORM_LABELS = {
  swiftrade: "SwiftTrade",
  business_suite: "Business Suite",
};

export default function LinkedPlatforms() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("my_linked_platform_activity")
        .select("*")
        .order("completed_at", { ascending: false });

      if (error) {
        console.error("LinkedPlatforms load error:", error);
      }

      const latestByPlatform = {};
      for (const row of data || []) {
        if (!latestByPlatform[row.platform]) latestByPlatform[row.platform] = row;
      }
      setActivity(Object.values(latestByPlatform));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return null;
  if (activity.length === 0) return null;

  return (
    <div>
      <h2 className="font-display text-sm font-semibold text-ink-100 mb-3">Your platforms</h2>
      <Card className="!p-0 overflow-hidden">
        {activity.map((a) => (
          <div key={a.platform} className="flex items-center gap-3 px-5 py-3.5 border-b border-base-700/60 last:border-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-medium text-ink-100">{PLATFORM_LABELS[a.platform] || a.platform}</p>
                {a.metadata?.plan && <Pill tone="violet">{a.metadata.plan}</Pill>}
              </div>
              <p className="text-xs text-ink-500">
                Last activity: {formatDate(a.completed_at || a.created_at)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono text-sm text-ink-100">K{Number(a.amount_zmw).toFixed(2)}</p>
              <p className="text-[11px] text-ink-700 capitalize">{a.status}</p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
