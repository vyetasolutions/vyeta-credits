import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";
import { useToast } from "../context/ToastContext.jsx";
import { Card, Button, Pill } from "../components/ui.jsx";
import { formatCredits, formatDate } from "../lib/format.js";

const PLATFORM_LABELS = {
  swiftrade: "SwiftTrade",
  business_suite: "Business Suite",
};

function platformLabel(p) {
  return PLATFORM_LABELS[p] || p;
}

export default function AdminPayments() {
  const { toast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyTxRef, setBusyTxRef] = useState(null);
  const [rejectingTxRef, setRejectingTxRef] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pending_manual_payments")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      toast(error.message, "error");
      setLoading(false);
      return;
    }
    setPayments(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // light polling so new submissions show up without a manual refresh
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  async function approve(txRef) {
    setBusyTxRef(txRef);
    const { error } = await supabase.rpc("admin_verify_manual_payment", {
      p_tx_ref: txRef,
      p_approve: true,
      p_admin_note: "Approved via admin panel",
    });
    setBusyTxRef(null);
    if (error) { toast(error.message, "error"); return; }
    toast("Payment approved — platform notified.", "success");
    load();
  }

  async function reject(txRef) {
    setBusyTxRef(txRef);
    const { error } = await supabase.rpc("admin_verify_manual_payment", {
      p_tx_ref: txRef,
      p_approve: false,
      p_admin_note: rejectNote || "Rejected via admin panel",
    });
    setBusyTxRef(null);
    setRejectingTxRef(null);
    setRejectNote("");
    if (error) { toast(error.message, "error"); return; }
    toast("Payment rejected.", "info");
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink-100">Pending payments</h1>
        <Link to="/admin" className="text-xs text-violet-400 font-medium">
          ← Admin
        </Link>
      </div>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <p className="text-sm text-ink-500 p-5">Loading…</p>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 px-5">
            <p className="text-sm text-ink-500">No payments waiting for verification.</p>
          </div>
        ) : (
          payments.map((p) => {
            const meta = p.metadata || {};
            const label =
              meta.type === "subscription" || p.purpose?.includes("subscription")
                ? `${meta.tier || meta.plan || ""} subscription`.trim()
                : meta.points_to_add
                ? `${Number(meta.points_to_add).toLocaleString()} points top-up`
                : p.purpose;

            return (
              <div key={p.tx_ref} className="px-5 py-4 border-b border-base-700/60 last:border-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Pill tone="violet">{platformLabel(p.platform)}</Pill>
                      <p className="text-sm font-semibold text-ink-100 truncate">
                        {meta.business_name || meta.organization_name || p.external_ref}
                      </p>
                    </div>
                    <p className="text-xs text-ink-500 capitalize">{label}</p>
                    <p className="text-[11px] text-ink-700 mt-1">
                      {p.tx_ref} · {formatDate(p.created_at)}
                    </p>
                    {(meta.supplier_transaction_ref || meta.manual_reference) && (
                      <p className="text-[11px] text-mint-400 mt-1 font-mono">
                        Ref: {meta.supplier_transaction_ref || meta.manual_reference}
                      </p>
                    )}
                  </div>
                  <p className="font-mono text-base font-semibold text-ink-100 shrink-0">
                    K{Number(p.amount_zmw).toLocaleString()}
                  </p>
                </div>

                {rejectingTxRef === p.tx_ref ? (
                  <div className="mt-3 space-y-2">
                    <input
                      autoFocus
                      className="w-full bg-base-800 border border-base-600 rounded-xl px-3 py-2 text-xs text-ink-100 placeholder:text-ink-700 outline-none focus:border-flame-500"
                      placeholder="Reason for rejection (optional)"
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setRejectingTxRef(null); setRejectNote(""); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busyTxRef === p.tx_ref}
                        onClick={() => reject(p.tx_ref)}
                      >
                        {busyTxRef === p.tx_ref ? "…" : "Confirm reject"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busyTxRef === p.tx_ref}
                      onClick={() => setRejectingTxRef(p.tx_ref)}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={busyTxRef === p.tx_ref}
                      onClick={() => approve(p.tx_ref)}
                    >
                      {busyTxRef === p.tx_ref ? "…" : "Approve"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}

