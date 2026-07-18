import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { Card, Button, Pill } from "../components/ui.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import { formatCredits, formatDate, billingLabel } from "../lib/format.js";

export default function Services() {
  const { session, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [catalog, setCatalog] = useState([]);
  const [mySubs, setMySubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    const [{ data: services }, { data: subs }] = await Promise.all([
      supabase.from("services").select("*").eq("is_active", true).order("category"),
      supabase.from("subscriptions_view").select("*").eq("user_id", session.user.id).order("started_at", { ascending: false }),
    ]);
    setCatalog(services || []);
    setMySubs(subs || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function activeSubFor(serviceId) {
    return mySubs.find(
      (s) => s.service_id === serviceId && s.status === "active" &&
        (!s.current_period_end || new Date(s.current_period_end) > new Date())
    );
  }

  function renewableSubFor(serviceId) {
    return mySubs.find(
      (s) => s.service_id === serviceId && s.status === "active" &&
        s.current_period_end && new Date(s.current_period_end) <= new Date()
    );
  }

  async function handleSubscribe(serviceId) {
    setBusyId(serviceId);
    const { error } = await supabase.rpc("purchase_service", { p_service_id: serviceId });
    setBusyId(null);
    if (error) { toast(error.message, "error"); return; }
    toast("Subscription activated!", "success");
    refreshProfile();
    load();
  }

  async function handleCancel(subId) {
    setBusyId(subId);
    const { error } = await supabase.rpc("cancel_subscription", { p_subscription_id: subId });
    setBusyId(null);
    if (error) { toast(error.message, "error"); return; }
    toast("Subscription cancelled.", "info");
    load();
  }

  // Group catalog by category
  const categories = catalog.reduce((acc, svc) => {
    if (!acc[svc.category]) acc[svc.category] = [];
    acc[svc.category].push(svc);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-100">Vyeta Services</h1>
        <p className="text-sm text-ink-500 mt-1">Pay for Vyeta services directly from your credit balance.</p>
      </div>

      {loading ? <SkeletonCard rows={3} /> : catalog.length === 0 ? (
        <Card><p className="text-sm text-ink-500 text-center py-4">No services available yet.</p></Card>
      ) : (
        Object.entries(categories).map(([category, services]) => (
          <div key={category}>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-3">{category}</p>
            <div className="space-y-3">
              {services.map((svc) => {
                const active = activeSubFor(svc.id);
                const renewable = renewableSubFor(svc.id);
                const insufficient = profile && profile.balance < svc.price;

                return (
                  <Card key={svc.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-sm font-semibold text-ink-100">{svc.name}</h3>
                        {svc.description && <p className="text-xs text-ink-500 mt-1">{svc.description}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-lg font-semibold text-ink-100">{formatCredits(svc.price)}</p>
                        <p className="text-[11px] text-ink-500">{billingLabel(svc.billing_interval)}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      {active ? (
                        <div className="flex items-center justify-between">
                          <Pill tone="mint">
                            Active{svc.billing_interval !== "one_time" && active.current_period_end
                              ? ` · renews ${formatDate(active.current_period_end)}` : ""}
                          </Pill>
                          <button
                            onClick={() => handleCancel(active.id)}
                            disabled={busyId === active.id}
                            className="text-xs text-flame-400 font-medium disabled:opacity-40"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <Button
                          disabled={busyId === svc.id || insufficient}
                          onClick={() => handleSubscribe(svc.id)}
                          variant={renewable ? "secondary" : "primary"}
                        >
                          {busyId === svc.id
                            ? "Processing…"
                            : renewable
                            ? `Renew · ${formatCredits(svc.price)} CR`
                            : `Subscribe · ${formatCredits(svc.price)} CR`}
                        </Button>
                      )}
                      {insufficient && !active && (
                        <p className="text-[11px] text-flame-400 mt-2">
                          Insufficient balance — you need {formatCredits(svc.price)} CR.
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
