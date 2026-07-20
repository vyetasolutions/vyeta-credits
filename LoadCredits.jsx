import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { Card, Button, Input } from "../components/ui.jsx";

// Same receiving numbers used for Business Suite's manual payments.
const MOBILE_MONEY = [
  { network: "MTN Mobile Money", number: "0760829950" },
  { network: "Airtel Money", number: "0777363303" },
];

export default function LoadCredits() {
  const { refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState("amount"); // amount | pay | submitted
  const [txRef, setTxRef] = useState(null);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);

  async function createIntent() {
    const val = Number(amount);
    if (!val || val <= 0) {
      toast("Enter an amount greater than 0.", "warning");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.rpc("create_wallet_topup_intent", { p_amount_zmw: val });
    setBusy(false);
    if (error) { toast(error.message, "error"); return; }
    setTxRef(data?.[0]?.tx_ref);
    setStage("pay");
  }

  async function submitProof() {
    if (!reference.trim()) {
      toast("Enter your transaction reference.", "warning");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("submit_wallet_topup_proof", {
      p_tx_ref: txRef,
      p_proof_url: reference.trim(),
    });
    setBusy(false);
    if (error) { toast(error.message, "error"); return; }
    setStage("submitted");
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold text-ink-100">Load credits</h1>

      {stage === "amount" && (
        <Card className="space-y-4">
          <p className="text-sm text-ink-500">
            Top up your Vyeta Credits balance with real money. 1 CR = K1 — credits loaded this way count
            toward your withdrawable balance, unlike bonus credits.
          </p>
          <Input
            label="Amount (ZMW)"
            type="number"
            min="1"
            step="1"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button disabled={busy || !amount} onClick={createIntent}>
            {busy ? "…" : "Continue"}
          </Button>
        </Card>
      )}

      {stage === "pay" && (
        <Card className="space-y-4">
          <p className="text-sm font-semibold text-ink-100">Pay K{Number(amount).toLocaleString()}</p>
          <div className="rounded-xl bg-mint-500/5 border border-mint-500/20 p-4 space-y-2 text-sm">
            {MOBILE_MONEY.map((m) => (
              <p key={m.network} className="text-ink-300">
                <span className="font-semibold text-ink-100">{m.network}:</span> {m.number}
              </p>
            ))}
            <p className="text-xs text-ink-500">Then enter your transaction reference below.</p>
          </div>
          <Input
            label="Transaction reference / ID"
            placeholder="e.g. MP250617.1234.ABC123"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <Button disabled={busy} onClick={submitProof}>
            {busy ? "…" : "Submit payment"}
          </Button>
        </Card>
      )}

      {stage === "submitted" && (
        <Card className="text-center space-y-3 py-8">
          <p className="text-sm font-semibold text-ink-100">Payment submitted</p>
          <p className="text-xs text-ink-500">
            Your balance will update automatically once verified — usually within a few hours.
          </p>
          <Button
            onClick={async () => { await refreshProfile(); navigate("/"); }}
          >
            Back to dashboard
          </Button>
        </Card>
      )}
    </div>
  );
}
