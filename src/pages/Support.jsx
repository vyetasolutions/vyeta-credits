import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { Card, Button, Input } from "../components/ui.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import { formatDate } from "../lib/format.js";

export default function Support() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  async function load() {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (!session?.user?.id) return;
    load();

    const ch = supabase
      .channel("support-" + session.user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, load)
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [session?.user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    const { error } = await supabase.rpc("send_support_message", { p_body: body.trim() });
    setSending(false);
    if (error) { toast(error.message, "error"); return; }
    setBody("");
    load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-100">Support</h1>
        <p className="text-sm text-ink-500 mt-1">Message the Vyeta team directly.</p>
      </div>

      {loading ? <SkeletonCard rows={4} /> : (
        <Card className="!p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-ink-500 text-center py-6">
              No messages yet. Send us something below and we'll get back to you.
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${m.sender === "user" ? "bg-mint-500/15 border border-mint-500/25" : "bg-base-800 border border-base-700"}`}>
                    <p className="text-sm text-ink-100 whitespace-pre-wrap">{m.body}</p>
                    <p className="text-[10px] text-ink-700 mt-1">
                      {m.sender === "user" ? "You" : "Vyeta Support"} · {formatDate(m.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </Card>
      )}

      <form onSubmit={handleSend} className="flex gap-3">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          className="flex-1"
        />
        <Button type="submit" className="!w-auto px-5" disabled={sending || !body.trim()}>
          {sending ? "…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
