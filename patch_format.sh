#!/usr/bin/env bash
set -euo pipefail

FILE="src/lib/format.js"

if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE not found. Are you in the repo root?"
  exit 1
fi

cp "$FILE" "$FILE.bak"
echo "Backed up to $FILE.bak"

python3 << 'PYEOF'
path = "src/lib/format.js"
with open(path, "r") as f:
    content = f.read()

original = content

old = '''export function formatRate(rate) {
  const r = Number(rate);
  const inverse = r > 0 ? (1 / r).toFixed(4) : "—";
  return { forward: r.toFixed(4), inverse };
}'''

new = '''export function formatRate(rate) {
  const r = Number(rate);
  const inverse = r > 0 ? (1 / r).toFixed(2) : "—";
  return { forward: r.toFixed(2), inverse };
}'''

if old not in content:
    raise SystemExit("ERROR: formatRate block not found verbatim — aborting without changes.")

content = content.replace(old, new)

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
echo "  git add src/lib/format.js"
echo "  git commit -m 'Display rate/inverse to 2 decimal places, not 4'"
echo "  git push"
