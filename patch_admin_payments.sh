#!/usr/bin/env bash
set -euo pipefail

FILE="src/pages/AdminPayments.jsx"

if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE not found. Are you in the repo root?"
  exit 1
fi

cp "$FILE" "$FILE.bak"
echo "Backed up to $FILE.bak"

python3 << 'PYEOF'
path = "src/pages/AdminPayments.jsx"
with open(path, "r") as f:
    content = f.read()

original = content

# 1. platformLabel: handle wallet_topup (no platform) gracefully
old_platform_label = '''function platformLabel(p) {
  return PLATFORM_LABELS[p] || p;
}'''

new_platform_label = '''function platformLabel(p) {
  if (!p) return "Wallet top-up";
  return PLATFORM_LABELS[p] || p;
}'''

if old_platform_label not in content:
    raise SystemExit("ERROR: platformLabel block not found verbatim — aborting.")
content = content.replace(old_platform_label, new_platform_label)

# 2. label logic: add a wallet_topup branch ahead of the existing checks
old_label_logic = '''            const meta = p.metadata || {};
            const label =
              meta.type === "subscription" || p.purpose?.includes("subscription")
                ? `${meta.tier || meta.plan || ""} subscription`.trim()
                : meta.points_to_add
                ? `${Number(meta.points_to_add).toLocaleString()} points top-up`
                : p.purpose;'''

new_label_logic = '''            const meta = p.metadata || {};
            const label =
              p.purpose === "wallet_topup"
                ? "Wallet credit load"
                : meta.type === "subscription" || p.purpose?.includes("subscription")
                ? `${meta.tier || meta.plan || ""} subscription`.trim()
                : meta.points_to_add
                ? `${Number(meta.points_to_add).toLocaleString()} points top-up`
                : p.purpose;'''

if old_label_logic not in content:
    raise SystemExit("ERROR: label logic block not found verbatim — aborting.")
content = content.replace(old_label_logic, new_label_logic)

# 3. display name: fall back to payer_full_name / payer_email for wallet top-ups
old_name_display = '''                      <p className="text-sm font-semibold text-ink-100 truncate">
                        {meta.business_name || meta.organization_name || p.external_ref}
                      </p>'''

new_name_display = '''                      <p className="text-sm font-semibold text-ink-100 truncate">
                        {meta.business_name || meta.organization_name || p.payer_full_name || p.payer_email || p.external_ref}
                      </p>'''

if old_name_display not in content:
    raise SystemExit("ERROR: name display block not found verbatim — aborting.")
content = content.replace(old_name_display, new_name_display)

if content == original:
    raise SystemExit("ERROR: no changes made.")

with open(path, "w") as f:
    f.write(content)

print("Patched successfully.")
PYEOF

echo ""
echo "Diff:"
diff "$FILE.bak" "$FILE" || true

echo ""
echo "If it looks right:"
echo "  git add src/pages/AdminPayments.jsx"
echo "  git commit -m 'Show wallet top-ups sensibly in the admin payments queue'"
echo "  git push"
