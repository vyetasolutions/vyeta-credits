import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Card, Button, Input, Pill } from "../components/ui.jsx";
import { formatCredits, formatDate, initials, avatarColor, formatRate } from "../lib/format.js";

export default function Admin() {
  const { zmwRate, rateUpdatedAt } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ totalCredits: 0, totalUsers: 0 });
  const [treasury, setTreasury] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  const [treasuryBusy, setTreasuryBusy] = useState(false);

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

  async function loadTreasury() {
    const { data } = await supabase.rpc("admin_treasury_summary");
    setTreasury(data?.[0] || null);
    const { data: al } = await supabase.from("profiles").select("id, full_name").eq("role", "admin");
    setAdmins(al || []);
  }

  async function loadPendingPaymentsCount() {
    const { count } = await supabase
      .from("pending_manual_payments")
      .select("*", { count: "exact", head: true });
    setPendingPaymentsCount(count || 0);
  }

  useEffect(() => {
    loadUsers();
    loadLogs();
    loadTreasury();
    loadPendingPaymentsCount();
  }, [query]);

  async function setTreasuryAccount(userId) {
    setTreasuryBusy(true);
    const { error } = await supabase.rpc("admin_set_treasury", { p_user_id: userId });
    setTreasuryBusy(false);
    if (error) { toast(error.message, "error"); return; }
    toast("Treasury account updated.", "success");
    loadTreasury();
    loadUsers();
  }

  const { forward, inverse } = formatRate(zmwRate);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink-100">Admin panel</h1>
        <div className="flex items-center gap-4">
          <Link to="/admin/payments" className="text-xs text-mint-400 font-medium flex items-center gap-1.5">
            Payments
            {pendingPaymentsCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold bg-flame-500 text-white">
                {pendingPaymentsCount}
              </span>
            )}
            {" →"}
          </Link>
          <Link to="/admin/services" className="text-xs text-violet-400 font-medium">
            Services →
          </Link>
        </div>
      </div>

      {/* Circulation stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-4">
          <p className="text-xs text-ink-500">Credits in circulation</p>
          <p className="font-mono text-xl font-semibold text-ink-100 mt-1">{formatCredits(stats.totalCredits)}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-ink-500">Total users</p>
          <p className="font-mono text-xl font-semibold text-ink-100 mt-1">{stats.totalUsers}</p>
        </Card>
      </div>

      {/* Exchange rate — fixed, no longer admin-editable */}
      <Card>
        <p className="text-xs text-ink-500 uppercase tracking-widest mb-3">Exchange rate</p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-mono text-2xl font-semibold text-ink-100">1 CR = K{forward}</span>
        </div>
        <p className="text-xs text-ink-500 mb-1">K1 = {inverse} CR</p>
        <p className="text-[11px] text-ink-700 mt-2">Fixed at 1 CR = 1 ZMW. No longer adjustable, now that credits are cash-backed and redeemable.</p>
      </Card>

      {/* Treasury */}
      <Card>
        <p className="text-xs text-ink-500 uppercase tracking-widest mb-3">Treasury account</p>
        {treasury ? (
          <>
            <p className="text-sm font-semibold text-ink-100">{treasury.treasury_name}</p>
            <p className="text-xs text-ink-500 mt-1">
              Balance: <span className="font-mono text-ink-100">{formatCredits(treasury.treasury_balance)} CR</span>
              {" · "}Lifetime revenue: <span className="font-mono text-mint-400">{formatCredits(treasury.total_revenue)} CR</span>
            </p>
          </>
        ) : (
          <p className="text-xs text-flame-400 mb-2">No treasury account set. Pick one below.</p>
        )}
        <div className="flex gap-2 mt-3 flex-wrap">
          {admins.map((a) => (
            <button
              key={a.id}
              disabled={treasuryBusy || treasury?.treasury_user_id === a.id}
              onClick={() => setTreasuryAccount(a.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40 ${treasury?.treasury_user_id === a.id ? "bg-mint-500/15 border-mint-500/30 text-mint-400" : "bg-base-800 border-base-600 text-ink-300 hover:border-violet-500/40"}`}
            >
              {treasury?.treasury_user_id === a.id ? "✓ " : ""}{a.full_name}
            </button>
          ))}
        </div>
      </Card>

      {/* User search */}
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users…" />

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <p className="text-sm text-ink-500 p-5">Loading…</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-base-700/60 last:border-0">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center font-display text-[11px] shrink-0 ${avatarColor(u.full_name)}`}>
                {initials(u.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-medium text-ink-100 truncate">{u.full_name}</p>
                  {!u.is_active && <Pill tone="flame">Frozen</Pill>}
                  {u.role === "admin" && <Pill tone="violet">Admin</Pill>}
                  {u.is_treasury && <Pill tone="mint">Treasury</Pill>}
                </div>
                <p className="text-xs text-ink-500 truncate">{u.email}</p>
              </div>
              <div className="text-right shrink-0 mr-3">
                <p className="font-mono text-sm text-ink-100">{formatCredits(u.balance)}</p>
              </div>
              <button onClick={() => setSelected(u)} className="text-xs text-mint-400 font-medium shrink-0">
                Manage
              </button>
            </div>
          ))
        )}
      </Card>

      {/* Audit log */}
      <div>
        <h2 className="font-display text-sm font-semibold text-ink-100 mb-3">Recent adjustments</h2>
        <Card className="!p-0 overflow-hidden">
          {logs.length === 0 ? (
            <p className="text-sm text-ink-500 py-6 text-center">No adjustments yet.</p>
          ) : (
            logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between px-5 py-3 border-b border-base-700/60 last:border-0">
                <div>
                  <p className="text-xs font-medium text-ink-300">{l.target?.full_name || "Unknown"}</p>
                  <p className="text-[11px] text-ink-700">{l.reason || "No reason"} · {formatDate(l.created_at)}</p>
                </div>
                <span className={`font-mono text-sm font-semibold ${l.amount >= 0 ? "text-mint-400" : "text-flame-400"}`}>
                  {l.amount >= 0 ? "+" : ""}{formatCredits(l.amount)}
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
          onDone={() => { setSelected(null); loadUsers(); loadLogs(); loadTreasury(); }}
        />
      )}
    </div>
  );
}

function ManageUserModal({ user, onClose, onDone }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function adjust(sign) {
    const val = Number(amount);
    if (!val || val <= 0) { toast("Enter an amount greater than 0.", "warning"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("admin_adjust_balance", {
      p_user_id: user.id,
      p_amount: sign * val,
      p_reason: reason || (sign > 0 ? "Manual credit" : "Manual debit"),
    });
    setBusy(false);
    if (error) { toast(error.message, "error"); return; }
    toast(`Balance ${sign > 0 ? "credited" : "debited"} successfully.`, "success");
    onDone();
  }

  async function toggleFreeze() {
    setBusy(true);
    const { error } = await supabase.rpc("admin_set_active", { p_user_id: user.id, p_active: !user.is_active });
    setBusy(false);
    if (error) { toast(error.message, "error"); return; }
    toast(`Account ${user.is_active ? "frozen" : "unfrozen"}.`, "info");
    onDone();
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-riseIn">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-ink-100">{user.full_name}</h3>
            <p className="text-xs text-ink-500">Balance: <span className="font-mono text-ink-100">{formatCredits(user.balance)} CR</span></p>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-300 text-sm">✕</button>
        </div>

        <div className="space-y-3">
          <Input label="Amount (CR)" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          <Input label="Reason (audit log)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Promo bonus, refund" />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="danger" disabled={busy} onClick={() => adjust(-1)}>Debit</Button>
            <Button disabled={busy} onClick={() => adjust(1)}>Credit</Button>
          </div>
          <Button variant={user.is_active ? "danger" : "secondary"} disabled={busy} onClick={toggleFreeze}>
            {user.is_active ? "Freeze account" : "Unfreeze account"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

