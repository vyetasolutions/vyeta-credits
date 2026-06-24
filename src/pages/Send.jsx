import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { Card, Button, Input, Pill } from "../components/ui.jsx";
import { calculateFee, formatCredits, creditsToZmw } from "../lib/format.js";

export default function Send() {
  const { profile, session, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [recipient, setRecipient] = useState(location.state?.recipient || null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!query.trim() || recipient) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .neq("id", session.user.id)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(6);
      setResults(data || []);
    }, 250);
    return () => clearTimeout(handle);
  }, [query, recipient, session.user.id]);

  const numericAmount = Number(amount) || 0;
  const { rate, fee, total } = calculateFee(numericAmount);
  const insufficient = profile && total > profile.balance;

  async function handleSend(e) {
    e.preventDefault();
    setError("");
    setSuccess(null);

    if (!recipient) return setError("Choose a recipient first.");
    if (numericAmount <= 0) return setError("Enter an amount greater than 0.");
    if (insufficient) return setError("Insufficient balance for this amount plus fee.");

    setSubmitting(true);
    const { data, error } = await supabase.rpc("send_credits", {
      p_receiver_id: recipient.id,
      p_amount: numericAmount,
    });
    setSubmitting(false);

    if (error) {
      setError(error.message.replace("Insufficient", "Not enough credits"));
      return;
    }

    setSuccess({ amount: numericAmount, fee, recipient });
    refreshProfile();
    setAmount("");
  }

  if (success) {
    return (
      <div className="space-y-5">
        <Card className="text-center">
          <div className="h-14 w-14 rounded-full bg-mint-500/15 mx-auto flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 stroke-mint-400" strokeWidth="2">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-semibold text-ink-100">Credits sent</h2>
          <p className="text-sm text-ink-500 mt-1">
            {formatCredits(success.amount)} CR to {success.recipient.full_name}
          </p>
          <p className="text-xs text-ink-700 mt-1">Fee charged: {formatCredits(success.fee)} CR</p>
          <div className="flex gap-3 mt-6">
            <Button variant="secondary" onClick={() => setSuccess(null)}>
              Send again
            </Button>
            <Button onClick={() => navigate("/history")}>View activity</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold text-ink-100">Send credits</h1>

      {!recipient ? (
        <Card>
          <Input
            label="Search by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Phoebe or phoebe@email.com"
            autoFocus
          />
          <div className="mt-3 space-y-1 max-h-64 overflow-y-auto scrollbar-hide">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => setRecipient(r)}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-base-800 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-ink-100">{r.full_name}</p>
                  <p className="text-xs text-ink-500">{r.email}</p>
                </div>
                <span className="text-xs text-violet-400">Select</span>
              </button>
            ))}
            {query && results.length === 0 && (
              <p className="text-xs text-ink-500 px-3 py-2">No matching users found.</p>
            )}
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSend} className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-ink-500">Sending to</p>
                <p className="text-sm font-medium text-ink-100">{recipient.full_name}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRecipient(null);
                  setQuery("");
                }}
                className="text-xs text-violet-400"
              >
                Change
              </button>
            </div>

            <Input
              label="Amount (CR)"
              type="number"
              min="1"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />

            {numericAmount > 0 && (
              <div className="mt-4 rounded-xl bg-base-800 border border-base-700 p-4 space-y-2 text-sm">
                <Row label="Amount" value={`${formatCredits(numericAmount)} CR`} />
                <Row label={`Fee (${(rate * 100).toFixed(1)}%)`} value={`${formatCredits(fee)} CR`} />
                <div className="h-px bg-base-700 my-1" />
                <Row label="Total deducted" value={`${formatCredits(total)} CR`} bold />
                <Row label="≈ ZMW value" value={`K${creditsToZmw(numericAmount)}`} muted />
              </div>
            )}

            {insufficient && (
              <p className="text-xs text-flame-400 mt-3">Insufficient balance, including fee.</p>
            )}
            {error && <p className="text-xs text-flame-400 mt-3">{error}</p>}
          </Card>

          <Button type="submit" disabled={submitting || numericAmount <= 0 || insufficient}>
            {submitting ? "Sending…" : "Confirm & send"}
          </Button>
        </form>
      )}
    </div>
  );
}

function Row({ label, value, bold, muted }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${muted ? "text-ink-700" : "text-ink-500"}`}>{label}</span>
      <span className={`font-mono ${bold ? "text-ink-100 font-semibold" : "text-ink-300"}`}>{value}</span>
    </div>
  );
}
