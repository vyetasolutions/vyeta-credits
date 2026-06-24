import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { Card, Input } from "../components/ui.jsx";
import { initials } from "../lib/format.js";

export default function Contacts() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      let req = supabase.from("profiles").select("id, full_name, email").neq("id", session.user.id);
      if (query.trim()) {
        req = req.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
      }
      const { data } = await req.order("full_name").limit(50);
      if (active) {
        setPeople(data || []);
        setLoading(false);
      }
    }
    const handle = setTimeout(load, 200);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query, session.user.id]);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold text-ink-100">Contacts</h1>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search people…"
      />

      <Card>
        {loading ? (
          <p className="text-sm text-ink-500 py-2">Loading…</p>
        ) : people.length === 0 ? (
          <p className="text-sm text-ink-500 py-4 text-center">No users found.</p>
        ) : (
          people.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate("/send", { state: { recipient: p } })}
              className="w-full flex items-center gap-3 py-2.5 border-b border-base-700 last:border-0 text-left"
            >
              <div className="h-10 w-10 rounded-full bg-violet-500/15 text-violet-300 flex items-center justify-center font-display text-xs shrink-0">
                {initials(p.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-100 truncate">{p.full_name}</p>
                <p className="text-xs text-ink-500 truncate">{p.email}</p>
              </div>
              <span className="text-xs text-mint-400 font-medium">Send</span>
            </button>
          ))
        )}
      </Card>
    </div>
  );
}
