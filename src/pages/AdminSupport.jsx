import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { Card, Button, Input } from "../components/ui.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import { formatDate, initials, avatarColor } from "../lib/format.js";

export default function AdminSupport() {
  const { toast } = useToast();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  async function loadThreads() {
    const { data } = await supabase
      .from("support_messages")
      .select("*, profile:profiles!support_messages_user_id_fkey(full_name, email)")
      .order("created_at", { ascending: false });

    const byUser = {};
    (data || []).forEach((m) => {
      if (!byUser[m.user_id]) {
        byUser[m.user_id] = {
          user_id: m.user_id,
          full_name: m.profile?.full_name || "Unknown",
          email: m.profile?.email || "",
          last_message: m,
          unread_from_user: 0,
        };
      }
    });
    // count trailing user messages since last admin reply, per thread
    const grouped = {};
    (data || []).forEach((m) => {
      if (!grouped[m.user_id]) grouped[m.user_id] = [];
      grouped[m.user_id].push(m);
    });
    Object.entries(grouped).forEach(([uid, msgs]) => {
      let count = 0;
      for (const m of msgs) { // already newest-first
        if (m.sender === "admin") break;
        if (m.sender === "user") count++;
      }
      if (byUser[uid]) byUser[uid].unread_from_user = count;
    });

    setThreads(Object.values(byUser).sort(
      (a, b) => new Date(b.last_message.created_at) - new Date(a.last_message.created_at)
    ));
    setLoading(false);
  }

  useEffect(() => {
    loadThreads();
    const ch = supabase
      .channel("admin-support")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, loadThreads)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-ink-100">Support inbox</h1>
        <Link to="/admin" className="text-xs text-mint-400 font-medium">← Admin</Link>
      </div>

      {loading ? <SkeletonCard rows={4} /> : threads.length === 0 ? (
        <Card><p className="text-sm text-ink-500 text-center py-6">No support messages yet.</p></Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          {threads.map((t) => (
            <button
              key={t.user_id}
              onClick={() => setSelected(t)}
              className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-base-700/60 last:border-0 hover:bg-base-800/50 transition-colors text-left"
            >
              <div className={`h-9 w-9 rounded-full flex items-center justify-center font-display text-[11px] shrink-0 ${avatarColor(t.full_name)}`}>
                {initials(t.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-100 truncate">{t.full_name}</p>
                <p className="text-xs text-ink-500 truncate">{t.last_message.body}</p>
              </div>
              {t.unread_from_user > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold bg-flame-500 text-white shrink-0">
                  {t.unread_from_user}
                </span>
              )}
            </button>
          ))}
        </Card>
      )}

      {selected && (
        <ThreadModal
          thread={selected}
          onClose={() => { setSelected(null); loadThreads(); }}
        />
      )}
    </div>
  );
}

function ThreadModal({ thread, onClose }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("user_id", thread.user_id)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-thread-" + thread.user_id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [thread.user_id]);

  async function handleReply(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    const { error } = await supabase.rpc("admin_reply_support_message", {
      p_user_id: thread.user_id,
      p_body: body.trim(),
    });
    setSending(false);
    if (error) { toast(error.message, "error"); return; }
    setBody("");
    load();
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
      <Card className="w-full max-w-md animate-riseIn max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h3 className="font-display text-base font-semibold text-ink-100">{thread.full_name}</h3>
            <p className="text-xs text-ink-500">{thread.email}</p>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-300 text-sm">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {loading ? <p className="text-sm text-ink-500 text-center py-4">Loading…</p> : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${m.sender === "admin" ? "bg-violet-500/15 border border-violet-500/25" : "bg-base-800 border border-base-700"}`}>
                  <p className="text-sm text-ink-100 whitespace-pre-wrap">{m.body}</p>
                  <p className="text-[10px] text-ink-700 mt-1">
                    {m.sender === "admin" ? "You (admin)" : thread.full_name} · {formatDate(m.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleReply} className="flex gap-3 shrink-0">
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Reply…"
            className="flex-1"
          />
          <Button type="submit" className="!w-auto px-5" disabled={sending || !body.trim()}>
            {sending ? "…" : "Reply"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
