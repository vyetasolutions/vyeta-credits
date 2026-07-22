import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { Card, Button, Input } from "../components/ui.jsx";
import { calculateFee, formatCredits, creditsToZmw, initials, avatarColor } from "../lib/format.js";

export default function Send() {
  const { profile, session, refreshProfile, zmwRate } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("send"); // "send" | "request"
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [recipient, setRecipient] = useState(location.state?.recipient || null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!query.trim() || recipient) { setResults([]); return; }
    const h = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .neq("id", session.user.id)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(6);
      setResults(data || []);
    }, 250);
    return () => clearTimeout(h);
  }, [query, recipient, session.user.id]);

  const numericAmount = Number(amount) || 0;
  const { rate, fee, total } = calculateFee(numericAmount);
  const insufficient = mode === "send" && profile && total > profile.balance;

  function switchMode(next) {
    setMode(next);
    setAmount("");
    setNote("");
  }

  function handleReview(e) {
    e.preventDefault();
    if (!recipient) { toast("Choose a recipient first.", "warning"); return; }
    if (numericAmount <= 0) { toast("Enter an amount greater than 0.", "warning"); return; }
    if (mode === "send" && insufficient) { toast("Insufficient balance including fee.", "error"); return; }

    if (mode === "request") {
      handleRequest();
    } else {
      setShowConfirm(true);
    }
  }

  async function handleRequest() {
    setSubmitting(true);
    const { error } = await supabase.rpc("create_payment_request", {
      p_target_id: recipient.id,
      p_amount: numericAmount,
      p_note: note.trim() || null,
    });
    setSubmitting(false);

    if (error) { toast(error.message, "error"); return; }

    toast(`Requested ${formatCredits(numericAmount)} CR from ${recipient.full_name || recipient.name}`, "success");
    navigate("/history");
  }

  async function handleConfirmSend() {
    setSubmitting(true);
    const { error } = await supabase.rpc("send_credits", {
      p_receiver_id: recipient.id,
      p_amount: numericAmount,
      p_note: note.trim() || null,
    });
    setSubmitting(false);
    setShowConfirm(false);

    if (error) {
      toast(error.message.replace("Insufficient", "Not enough credits"), "error");
      return;
    }

    refreshProfile();
    toast(`${formatCredits(numericAmount)} CR sent to ${recipient.full_name || recipient.name}`, "success");
    navigate("/history");
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold text-ink-100">
        {mode === "send" ? "Send credits" : "Request credits"}
      </h1>

      {/* Mode toggle */}
      <div className="flex gap-2">
        {[
          { key: "send", label: "Send" },
          { key: "request", label: "Request" },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => switchMode(m.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${mode === m.key ? "bg-mint-500 text-base-950" : "bg-base-800 text-ink-500 hover:text-ink-300"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Step 1: Choose recipient */}
      {!recipient ? (
        <Card>
          <p className="text-xs font-medium text-ink-500 uppercase tracking-widest mb-3">
            {mode === "send" ? "Find recipient" : "Request from"}
          </p>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            autoFocus
          />
          <div className="mt-3 space-y-1 max-h-64 overflow-y-auto scrollbar-hide">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => setRecipient(r)}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-base-800 transition-colors flex items-center gap-3"
              >
                <div className={`h-9 w-9 rounded-full flex items-center justify-center font-display text-xs shrink-0 ${avatarColor(r.full_name)}`}>
                  {initials(r.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-100">{r.full_name}</p>
                  <p className="text-xs text-ink-500 truncate">{r.email}</p>
                </div>
                <span className="text-xs text-violet-400">Select</span>
              </button>
            ))}
            {query.trim() && results.length === 0 && (
              <p className="text-xs text-ink-500 px-3 py-3 text-center">No users found for "{query}"</p>
            )}
          </div>
        </Card>
      ) : (
        <form onSubmit={handleReview} className="space-y-4">
          {/* Recipient chip */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-base-800 border border-base-700">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center font-display text-xs shrink-0 ${avatarColor(recipient.full_name || recipient.name)}`}>
                {initials(recipient.full_name || recipient.name)}
              </div>
              <div>
                <p className="text-sm font-medium text-ink-100">{recipient.full_name || recipient.name}</p>
                <p className="text-xs text-ink-500">{mode === "send" ? "Recipient" : "Requesting from"}</p>
              </div>
            </div>
            <button type="button" onClick={() => { setRecipient(null); setQuery(""); setAmount(""); setNote(""); }} className="text-xs text-violet-400">Change</button>
          </div>

          {/* Big amount input */}
          <Card>
            <p className="text-xs font-medium text-ink-500 uppercase tracking-widest mb-4">Amount</p>
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <span className="font-mono text-5xl font-semibold text-ink-100 tracking-tight">
                {numericAmount > 0 ? formatCredits(numericAmount) : "0.00"}
              </span>
              <span className="text-lg text-ink-500">CR</span>
            </div>
            {numericAmount > 0 && (
              <p className="text-center text-xs text-ink-500 mb-4">
                ≈ K{creditsToZmw(numericAmount, zmwRate)} ZMW
              </p>
            )}
            <Input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="text-center text-lg"
            />

            {/* Quick amount chips */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {[50, 100, 250, 500].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${amount === String(v) ? "bg-violet-500/20 border-violet-500/50 text-violet-300" : "bg-base-800 border-base-700 text-ink-500 hover:border-base-600"}`}
                >
                  {v} CR
                </button>
              ))}
            </div>
          </Card>

          {/* Optional note */}
          <Card>
            <p className="text-xs font-medium text-ink-500 uppercase tracking-widest mb-3">Note (optional)</p>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's this for?"
              maxLength={140}
            />
          </Card>

          {/* Fee breakdown — only relevant for actual sends */}
          {mode === "send" && numericAmount > 0 && (
            <Card className="!p-4 space-y-2">
              <Row label="Amount" value={`${formatCredits(numericAmount)} CR`} />
              <Row label={`Network fee (${(rate * 100).toFixed(1)}%)`} value={`${formatCredits(fee)} CR`} />
              <div className="h-px bg-base-700" />
              <Row label="Total deducted" value={`${formatCredits(total)} CR`} bold />
              {insufficient && <p className="text-xs text-flame-400 pt-1">Your balance of {formatCredits(profile.balance)} CR is insufficient.</p>}
            </Card>
          )}

          {mode === "request" && numericAmount > 0 && (
            <Card className="!p-4">
              <p className="text-xs text-ink-500">
                {recipient.full_name || recipient.name} will see this request and can pay or decline it. No credits move until they approve.
              </p>
            </Card>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={submitting || numericAmount <= 0 || insufficient}
          >
            {mode === "send"
              ? `Review send ${numericAmount > 0 ? formatCredits(numericAmount) + " CR" : ""}`
              : submitting
              ? "Requesting…"
              : `Request ${numericAmount > 0 ? formatCredits(numericAmount) + " CR" : ""}`}
          </Button>
        </form>
      )}

      {showConfirm && (
        <ConfirmSendModal
          recipient={recipient}
          amount={numericAmount}
          fee={fee}
          total={total}
          note={note}
          submitting={submitting}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirmSend}
        />
      )}
    </div>
  );
}

function ConfirmSendModal({ recipient, amount, fee, total, note, submitting, onCancel, onConfirm }) {
  const name = recipient.full_name || recipient.name;
  const maskedEmail = recipient.email
    ? recipient.email.replace(/^(.{1,2}).*(@.*)$/, (_, a, b) => `${a}***${b}`)
    : null;

  return (
    <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-riseIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold text-ink-100">Confirm send</h3>
          <button onClick={onCancel} className="text-ink-500 hover:text-ink-300 text-sm">✕</button>
        </div>

        <div className="flex items-center gap-3 mb-4 px-3 py-3 rounded-xl bg-base-800 border border-base-700">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-display text-xs shrink-0 ${avatarColor(name)}`}>
            {initials(name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-100 truncate">{name}</p>
            {maskedEmail && <p className="text-xs text-ink-500 truncate">{maskedEmail}</p>}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <Row label="Amount" value={`${formatCredits(amount)} CR`} />
          <Row label="Network fee" value={`${formatCredits(fee)} CR`} />
          <div className="h-px bg-base-700" />
          <Row label="Total deducted" value={`${formatCredits(total)} CR`} bold />
          {note && <Row label="Note" value={note} />}
        </div>

        <p className="text-[11px] text-flame-400 mb-4">
          Please confirm this is the right recipient. Vyeta Credit transfers are final and cannot be reversed.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" disabled={submitting} onClick={onCancel}>Cancel</Button>
          <Button disabled={submitting} onClick={onConfirm}>
            {submitting ? "Sending…" : "Confirm send"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-ink-500">{label}</span>
      <span className={`font-mono text-sm ${bold ? "text-ink-100 font-semibold" : "text-ink-300"}`}>{value}</span>
    </div>
  );
}
