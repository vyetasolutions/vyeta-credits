

Admin · JSX
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Card, Button, Input, Pill } from "../components/ui.jsx";
import { formatCredits, formatDate, initials } from "../lib/format.js";
 
export default function Admin() {
  const { zmwRate } = useAuth();
  const [rateInput, setRateInput] = useState("");
  const [rateError, setRateError] = useState("");
  const [rateBusy, setRateBusy] = useState(false);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ totalCredits: 0, totalUsers: 0 });
 
  async function loadUsers() {
    let req = supabase.from("profiles").select("*");
    if (query.trim()) req = req.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
    const { data } = await req.order("created_at", { ascending: false });
    setUsers(data || []);
    setStats({
      totalCredits: (data || []).reduce((s, u) => s + Number(u.balance), 0),
      totalUsers: (data || []).length,
    });
    setLoading(false);
  }
 
  async function loadLogs() {
    const { data } = await supabase
      .from("admin_adjustments")
      .select("*, target:profiles!admin_adjustments_user_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(15);
    setLogs(data || []);
  }
 
  useEffect(() => {
    loadUsers();
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
 
  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold text-ink-100">Admin panel</h1>
 
      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-4">
          <p className="text-xs text-ink-500">Credits in circulation</p>
          <p className="font-mono text-xl font-semibold text-ink-100 mt-1">
            {formatCredits(stats.totalCredits)}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-ink-500">Total users</p>
          <p className="font-mono text-xl font-semibold text-ink-100 mt-1">{stats.totalUsers}</p>
        </Card>
      </div>
 
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users…" />
 
      <Card>
        <p className="text-xs text-ink-500 mb-1">Exchange rate (1 Credit = K___)</p>
        <p className="font-mono text-lg text-ink-100 mb-3">Current: {zmwRate}</p>
        <div className="flex gap-3">
          <Input
            type="number"
            step="0.0001"
            min="0.0001"
            placeholder="e.g. 0.42"
            value={rateInput}
            onChange={(e) => setRateInput(e.target.value)}
          />
          <Button
            className="!w-auto px-5"
            disabled={rateBusy || !rateInput}
            onClick={async () => {
              setRateError("");
              setRateBusy(true);
              const { error } = await supabase.rpc("admin_set_rate", { p_rate: Number(rateInput) });
              setRateBusy(false);
              if (error) setRateError(error.message);
              else setRateInput("");
            }}
          >
            Update
          </Button>
        </div>
        {rateError && <p className="text-xs text-flame-400 mt-2">{rateError}</p>}
        <p className="text-xs text-ink-700 mt-2">
          Updates live for every signed-in user immediately — no redeploy needed.
        </p>
      </Card>
 
      <Card>
        {loading ? (
          <p className="text-sm text-ink-500 py-2">Loading…</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2.5 border-b border-base-700 last:border-0">
              <div className="h-9 w-9 rounded-full bg-base-700 text-ink-300 flex items-center justify-center font-display text-[11px] shrink-0">
                {initials(u.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-100 truncate">{u.full_name}</p>
                <p className="text-xs text-ink-500 truncate">{u.email}</p>
              </div>
              <div className="text-right shrink-0 mr-2">
                <p className="font-mono text-sm text-ink-100">{formatCredits(u.balance)}</p>
                {!u.is_active && <Pill tone="flame">Frozen</Pill>}
                {u.role === "admin" && <Pill tone="violet">Admin</Pill>}
              </div>
              <button
                onClick={() => setSelected(u)}
                className="text-xs text-mint-400 font-medium shrink-0"
              >
                Manage
              </button>
            </div>
          ))
        )}
      </Card>
 
      <div>
        <h2 className="font-display text-sm font-semibold text-ink-100 mb-3">Recent adjustments</h2>
        <Card>
          {logs.length === 0 ? (
            <p className="text-sm text-ink-500 py-2 text-center">No adjustments yet.</p>
          ) : (
            logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-base-700 last:border-0">
                <div>
                  <p className="text-xs text-ink-300">{l.target?.full_name || "Unknown user"}</p>
                  <p className="text-[11px] text-ink-700">{l.reason || "No reason given"} · {formatDate(l.created_at)}</p>
                </div>
                <span className={`font-mono text-sm ${l.amount >= 0 ? "text-mint-400" : "text-flame-400"}`}>
                  {l.amount >= 0 ? "+" : ""}
                  {formatCredits(l.amount)}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>
 
      {selected && (
        <ManageUserModal
          user={selected}
          onClose={() => setSelected(null)}
          onDone={() => {
            setSelected(null);
            loadUsers();
            loadLogs();
          }}
        />
      )}
    </div>
  );
}
 
function ManageUserModal({ user, onClose, onDone }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
 
  async function adjust(sign) {
    setError("");
    const val = Number(amount);
    if (!val || val <= 0) return setError("Enter an amount greater than 0.");
    setBusy(true);
    const { error } = await supabase.rpc("admin_adjust_balance", {
      p_user_id: user.id,
      p_amount: sign * val,
      p_reason: reason || (sign > 0 ? "Manual credit" : "Manual debit"),
    });
    setBusy(false);
    if (error) return setError(error.message);
    onDone();
  }
 
  async function toggleFreeze() {
    setBusy(true);
    const { error } = await supabase.rpc("admin_set_active", {
      p_user_id: user.id,
      p_active: !user.is_active,
    });
    setBusy(false);
    if (error) return setError(error.message);
    onDone();
  }
 
  return (
    <div className="fixed inset-0 z-30 bg-black/60 flex items-end md:items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold text-ink-100">{user.full_name}</h3>
          <button onClick={onClose} className="text-ink-500 text-sm">
            Close
          </button>
        </div>
        <p className="text-xs text-ink-500 mb-4">
          Current balance: <span className="font-mono text-ink-100">{formatCredits(user.balance)} CR</span>
        </p>
 
        <div className="space-y-3">
          <Input
            label="Amount (CR)"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Reason (shown in audit log)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Promo bonus, support refund"
          />
          {error && <p className="text-xs text-flame-400">{error}</p>}
 
          <div className="flex gap-3">
            <Button variant="secondary" disabled={busy} onClick={() => adjust(-1)}>
              Debit
            </Button>
            <Button disabled={busy} onClick={() => adjust(1)}>
              Credit
            </Button>
          </div>
 
          <Button variant={user.is_active ? "danger" : "secondary"} disabled={busy} onClick={toggleFreeze}>
            {user.is_active ? "Freeze account" : "Unfreeze account"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
 
