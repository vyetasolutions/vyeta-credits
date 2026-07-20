#!/usr/bin/env bash
set -euo pipefail

# Run from repo root in Codespaces.
# Removes the rate-editing UI (state, handler, input+button) from
# src/pages/Admin.jsx entirely, replacing it with a static "fixed" display,
# since 1 CR = 1 ZMW is now structural (admin_set_rate no longer exists in
# the DB after the SQL migration runs).

FILE="src/pages/Admin.jsx"

if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE not found. Are you in the repo root?"
  exit 1
fi

cp "$FILE" "$FILE.bak"
echo "Backed up to $FILE.bak"

python3 << 'PYEOF'
import re

path = "src/pages/Admin.jsx"
with open(path, "r") as f:
    content = f.read()

original = content

# 1. Remove rate-related state
content = content.replace(
    '  const [rateInput, setRateInput] = useState("");\n  const [rateBusy, setRateBusy] = useState(false);\n\n',
    ''
)

# 2. Remove the updateRate handler entirely
content = content.replace(
    '''  async function updateRate() {
    const val = Number(rateInput);
    if (!val || val <= 0) { toast("Enter a valid rate greater than 0.", "warning"); return; }
    setRateBusy(true);
    const { error } = await supabase.rpc("admin_set_rate", { p_rate: val });
    setRateBusy(false);
    if (error) { toast(error.message, "error"); return; }
    toast(`Exchange rate updated to ${val}`, "success");
    setRateInput("");
  }

''',
    ''
)

# 3. Replace the whole "Exchange rate" Card with a static, non-editable version
old_card = '''      {/* Exchange rate */}
      <Card>
        <p className="text-xs text-ink-500 uppercase tracking-widest mb-3">Exchange rate</p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-mono text-2xl font-semibold text-ink-100">1 CR = K{forward}</span>
        </div>
        <p className="text-xs text-ink-500 mb-1">K1 = {inverse} CR</p>
        {rateUpdatedAt && <p className="text-[11px] text-ink-700 mb-4">Last updated {formatDate(rateUpdatedAt)}</p>}
        <div className="flex gap-3">
          <Input
            type="number"
            step="0.0001"
            min="0.0001"
            placeholder={`Current: ${forward}`}
            value={rateInput}
            onChange={(e) => setRateInput(e.target.value)}
          />
          <Button className="!w-auto px-5" disabled={rateBusy || !rateInput} onClick={updateRate}>
            {rateBusy ? "…" : "Update"}
          </Button>
        </div>
        <p className="text-[11px] text-ink-700 mt-2">Updates instantly for all signed-in users via Realtime.</p>
      </Card>'''

new_card = '''      {/* Exchange rate — fixed, no longer admin-editable */}
      <Card>
        <p className="text-xs text-ink-500 uppercase tracking-widest mb-3">Exchange rate</p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-mono text-2xl font-semibold text-ink-100">1 CR = K{forward}</span>
        </div>
        <p className="text-xs text-ink-500 mb-1">K1 = {inverse} CR</p>
        <p className="text-[11px] text-ink-700 mt-2">Fixed at 1 CR = 1 ZMW. No longer adjustable, now that credits are cash-backed and redeemable.</p>
      </Card>'''

if old_card not in content:
    raise SystemExit("ERROR: exchange rate Card block not found verbatim — aborting without changes.")

content = content.replace(old_card, new_card)

if content == original:
    raise SystemExit("ERROR: no changes were made — check the file hasn't already been patched.")

with open(path, "w") as f:
    f.write(content)

print("Patched successfully.")
PYEOF

echo ""
echo "Diff:"
diff "$FILE.bak" "$FILE" || true

echo ""
echo "Review the diff above. If it looks right:"
echo "  git add $FILE"
echo "  git commit -m 'Remove admin rate-editing UI: CR frozen at 1:1'"
echo "  git push"
