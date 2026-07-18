import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";
import { useToast } from "../context/ToastContext.jsx";
import { Card, Button, Input, Pill } from "../components/ui.jsx";
import { formatCredits, formatDate, billingLabel } from "../lib/format.js";

const BLANK = { name: "", description: "", category: "General", price: "", billing_interval: "monthly" };

export default function AdminServices() {
  const { toast } = useToast();
  const [services, setServices] = useState([]);
  const [subs, setSubs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [{ data: svc }, { data: sub }] = await Promise.all([
      supabase.from("services").select("*").order("category"),
      supabase.from("subscriptions_view").select("*").eq("status", "active").order("started_at", { ascending: false }),
    ]);
    setServices(svc || []);
    setSubs(sub || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveService(form) {
    const payload = { name: form.name, description: form.description, category: form.category, price: Number(form.price), billing_interval: form.billing_interval };
    const { error } = form.id
      ? await supabase.from("services").update(payload).eq("id", form.id)
      : await supabase.from("services").insert(payload);
    if (error) { toast(error.message, "error"); return; }
    toast(form.id ? "Service updated." : "Service created.", "success");
    setEditing(null);
    load();
  }

  async function toggleActive(svc) {
    await supabase.from("services").update({ is_active: !svc.is_active }).eq("id", svc.id);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink-100">Manage services</h1>
        <Link to="/admin" className="text-xs text-violet-400">← Admin</Link>
      </div>

      <Button onClick={() => setEditing({ ...BLANK })}>
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 stroke-current" strokeWidth="2">
          <path d="M10 4v12M4 10h12" strokeLinecap="round" />
        </svg>
        Add new service
      </Button>

      {/* Service catalog */}
      <Card className="!p-0 overflow-hidden">
        {loading ? <p className="text-sm text-ink-500 p-5">Loading…</p> : services.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-base-700/60 last:border-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-ink-100 truncate">{s.name}</p>
                {!s.is_active && <Pill tone="flame">Hidden</Pill>}
              </div>
              <p className="text-xs text-ink-500 mt-0.5">
                {s.category} · <span className="font-mono">{formatCredits(s.price)} CR</span> {billingLabel(s.billing_interval)}
              </p>
            </div>
            <button onClick={() => toggleActive(s)} className="text-xs text-ink-400 hover:text-ink-200 shrink-0 mr-3">
              {s.is_active ? "Hide" : "Show"}
            </button>
            <button onClick={() => setEditing({ ...s, price: String(s.price) })} className="text-xs text-mint-400 font-medium shrink-0">
              Edit
            </button>
          </div>
        ))}
      </Card>

      {/* Active subscribers */}
      <div>
        <h2 className="font-display text-sm font-semibold text-ink-100 mb-3">
          Active subscribers <span className="text-ink-500 font-normal">({subs.length})</span>
        </h2>
        <Card className="!p-0 overflow-hidden">
          {subs.length === 0 ? (
            <p className="text-sm text-ink-500 py-6 text-center">No active subscribers yet.</p>
          ) : (
            subs.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between px-5 py-3.5 border-b border-base-700/60 last:border-0">
                <div>
                  <p className="text-sm font-medium text-ink-100">{sub.user_name}</p>
                  <p className="text-xs text-ink-500">
                    {sub.service_name} · {sub.current_period_end ? `renews ${formatDate(sub.current_period_end)}` : "one-time"}
                  </p>
                </div>
                <span className="font-mono text-xs text-ink-300">{formatCredits(sub.price)} CR</span>
              </div>
            ))
          )}
        </Card>
      </div>

      {editing && (
        <ServiceModal initial={editing} onClose={() => setEditing(null)} onSave={saveService} />
      )}
    </div>
  );
}

function ServiceModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-riseIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold text-ink-100">{form.id ? "Edit service" : "New service"}</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-300 text-sm">✕</button>
        </div>
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={set("name")} placeholder="e.g. SwifTrade Pro" />
          <Input label="Description" value={form.description || ""} onChange={set("description")} placeholder="Shown to users" />
          <Input label="Category" value={form.category} onChange={set("category")} placeholder="e.g. SwifTrade, IT Retainer" />
          <Input label="Price (CR)" type="number" min="0" step="0.01" value={form.price} onChange={set("price")} />
          <label className="block">
            <span className="block text-xs font-medium text-ink-500 mb-1.5">Billing</span>
            <select value={form.billing_interval} onChange={set("billing_interval")} className="w-full bg-base-800 border border-base-600 rounded-xl px-4 py-3 text-sm text-ink-100 outline-none focus:border-violet-500">
              <option value="one_time">One-time</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
          <Button onClick={() => onSave(form)} disabled={!form.name || !form.price}>
            {form.id ? "Save changes" : "Create service"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
