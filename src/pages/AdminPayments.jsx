
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";
import { useToast } from "../context/ToastContext.jsx";
import { Card, Button, Input, Pill } from "../components/ui.jsx";
import { formatDate } from "../lib/format.js";

export default function AdminPayments() {
  const { toast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  async function loadPayments() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pending_manual_payments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast(error.message, "error");
    } else {
      setPayments(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPayments();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-ink-100">Pending payments</h1>
        <Link to="/admin" className="text-xs text-mint-400 font-medium">← Admin</Link>
      </div>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <p className="text-sm text-ink-500 p-5">Loading…</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-ink-500 py-8 text-center">No pending payments.</p>
        ) : (
          payments.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-base-700/60 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-medium text-ink-100 truncate">{p.payer_full_name || "Unknown payer"}</p>
                  {p.platform && <Pill tone="violet">{p.platform}</Pill>}
                </div>
                <p className="text-xs text-ink-500 truncate">{p.payer_email}</p>
                <p className="text-[11px] text-ink-700 truncate">{p.purpose} · ref {p.tx_ref} · {formatDate(p.created_at)}</p>
              </div>
              <div className="text-right shrink-0 mr-3">
                <p className="font-mono text-sm text-ink-100">K{Number(p.amount_zmw).toFixed(2)}</p>
              </div>
              <button onClick={() => setSelected(p)} className="text-xs text-mint-400 font-medium shrink-0">
                Review
              </button>
            </div>
          ))
        )}
      </Card>

      {selected && (
        <ReviewPaymentModal
          payment={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); loadPayments(); }}
        />
      )}
    </div>
  );
}

function ReviewPaymentModal({ payment, onClose, onDone }) {
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function verify(approve) {
    setBusy(true);
    const { error } = await supabase.rpc("admin_verify_manual_payment", {
      p_tx_ref: payment.tx_ref,
      p_approve: approve,
      p_admin_note: note || null,
    });
    setBusy(false);
    if (error) { toast(error.message, "error"); return; }
    toast(`Payment ${approve ? "approved" : "rejected"}.`, approve ? "success" : "info");
    onDone();
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-riseIn">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-ink-100">{payment.payer_full_name || "Unknown payer"}</h3>
            <p className="text-xs text-ink-500">{payment.payer_email}</p>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-300 text-sm">✕</button>
        </div>

        <div className="space-y-2 mb-4 text-xs text-ink-500">
          <p>Amount: <span className="font-mono text-ink-100">K{Number(payment.amount_zmw).toFixed(2)}</span></p>
          <p>Platform: <span className="text-ink-300">{payment.platform || "—"}</span></p>
          <p>Purpose: <span className="text-ink-300">{payment.purpose || "—"}</span></p>
          <p>Tx ref: <span className="font-mono text-ink-300">{payment.tx_ref}</span></p>
          {payment.external_ref && <p>External ref: <span className="font-mono text-ink-300">{payment.external_ref}</span></p>}
          {payment.proof_url && (
            <p>
              Proof: <a href={payment.proof_url} target="_blank" rel="noreferrer" className="text-mint-400 underline">View</a>
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Input label="Admin note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Confirmed via bank statement" />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="danger" disabled={busy} onClick={() => verify(false)}>Reject</Button>
            <Button disabled={busy} onClick={() => verify(true)}>Approve</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

