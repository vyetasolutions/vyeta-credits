import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { useToast } from "../context/ToastContext.jsx";
import { Card, Button, Input } from "../components/ui.jsx";
import { formatCredits } from "../lib/format.js";

export default function LoadCredits() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingIntent, setPendingIntent] = useState(null); // { intent_id, tx_ref, amount }

  async function submit() {
    const val = Number(amount);
    if (!val || val <= 0) {
      toast("Enter an amount greater than 0.", "warning");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.rpc("create_wallet_topup_intent", {
      p_amount_zmw: val,
      p_payment_method: "manual",
    });
    setBusy(false);
    if (error) {
      toast(error.message, "error");
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    setPendingIntent({ ...row, amount: val });
    setAmount("");
  }

  function startOver() {
    setPendingIntent(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink-100">Load credits</h1>
        <Link to="/" className="text-xs text-violet-400 font-medium">
          ← Dashboard
        </Link>
      </div>

      <Card className="!p-4">
        <p className="text-xs text-ink-500">Available balance</p>
        <p className="font-mono text-xl font-semibold text-ink-100 mt-1">
          {profile ? formatCredits(profile.balance) : "—"} <span className="text-sm text-ink-500 font-normal">CR</span>
        </p>
        <p className="text-[11px] text-ink-700 mt-1">
          Cashable: {profile ? formatCredits(profile.cashable_balance) : "—"} CR
        </p>
      </Card>

      {!pendingIntent ? (
        <Card>
          <p className="text-xs text-ink-500 uppercase tracking-widest mb-3">Load credits</p>
          <p className="text-xs text-ink-500 mb-4">
            1 CR = K1. Credits loaded this way are cashable — unlike bonus credits, they can be
            redeemed for real Kwacha in the future.
          </p>
          <Input
            label="Amount (K)"
            type="number"
            min="1"
            step="1"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button className="mt-4" disabled={busy || !amount} onClick={submit}>
            {busy ? "…" : "Continue"}
          </Button>
        </Card>
      ) : (
        <Card>
          <p className="text-xs text-ink-500 uppercase tracking-widest mb-3">Complete your payment</p>
          <p className="text-sm text-ink-100 font-semibold mb-1">
            K{Number(pendingIntent.amount).toLocaleString()}
          </p>
          <p className="text-xs text-ink-500 mb-4">
            Send this amount via mobile money or bank transfer, then quote the reference below. An
            admin will verify your payment and credit your account — this isn't instant.
          </p>

          <div className="rounded-xl bg-base-800 border border-base-600 px-4 py-3 mb-4">
            <p className="text-[11px] text-ink-500 uppercase tracking-widest mb-1">Payment reference</p>
            <p className="font-mono text-sm text-mint-400 break-all">{pendingIntent.tx_ref}</p>
          </div>

          <div className="rounded-xl bg-base-800 border border-base-600 px-4 py-3 mb-4">
            <p className="text-[11px] text-ink-500 uppercase tracking-widest mb-1">Send to</p>
            <p className="text-xs text-ink-300">Contact support for current payment details.</p>
          </div>

          <p className="text-[11px] text-ink-700 mb-4">
            Once sent, your balance updates as soon as it's verified — check back on your dashboard.
          </p>

          <Button variant="secondary" onClick={startOver}>
            Load a different amount
          </Button>
        </Card>
      )}
    </div>
  );
}
