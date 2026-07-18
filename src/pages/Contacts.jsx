import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { Card, Input } from "../components/ui.jsx";
import { initials, avatarColor } from "../lib/format.js";

export default function Contacts() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      let req = supabase
        .from("profiles")
        .select("id, full_name, email")
        .neq("id", session.user.id);
      if (query.trim()) req = req.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
      const { data } = await req.order("full_name").limit(50);
      if (active) { setPeople(data || []); setLoading(false); }
    }
    const h = setTimeout(load, 200);
    return () => { active = false; clearTimeout(h); };
  }, [query, session.user.id]);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold text-ink-100">Contacts</h1>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email…"
      />
      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <p className="text-sm text-ink-500 p-5">Loading…</p>
        ) : people.length === 0 ? (
          <p className="text-sm text-ink-500 py-6 text-center">No users found.</p>
        ) : (
          people.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate("/send", { state: { recipient: p } })}
              className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-base-700/60 last:border-0 text-left hover:bg-base-800 transition-colors"
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-display text-xs shrink-0 ${avatarColor(p.full_name)}`}>
                {initials(p.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-100 truncate">{p.full_name}</p>
                <p className="text-xs text-ink-500 truncate">{p.email}</p>
              </div>
              <span className="text-xs text-mint-400 font-medium shrink-0">Send →</span>
            </button>
          ))
        )}
      </Card>
    </div>
  );
}
