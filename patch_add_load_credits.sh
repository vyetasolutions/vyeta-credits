#!/usr/bin/env bash
set -euo pipefail

APP_FILE="src/App.jsx"
DASH_FILE="src/pages/Dashboard.jsx"

for f in "$APP_FILE" "$DASH_FILE"; do
  if [ ! -f "$f" ]; then
    echo "ERROR: $f not found. Are you in the repo root?"
    exit 1
  fi
  cp "$f" "$f.bak"
  echo "Backed up $f"
done

python3 << 'PYEOF'
app_path = "src/App.jsx"
dash_path = "src/pages/Dashboard.jsx"

# ---- App.jsx: add import + route ----
with open(app_path, "r") as f:
    app = f.read()
app_original = app

old_import = 'import AdminPayments from "./pages/AdminPayments.jsx";'
new_import = 'import AdminPayments from "./pages/AdminPayments.jsx";\nimport LoadCredits from "./pages/LoadCredits.jsx";'
if new_import in app:
    print("App.jsx import already patched, skipping.")
elif old_import not in app:
    raise SystemExit("ERROR: AdminPayments import line not found in App.jsx — aborting.")
else:
    app = app.replace(old_import, new_import)

old_route = '      <Route path="/services" element={<Protected><Services /></Protected>} />'
new_route = '      <Route path="/services" element={<Protected><Services /></Protected>} />\n      <Route path="/load-credits" element={<Protected><LoadCredits /></Protected>} />'
if new_route in app:
    print("App.jsx route already patched, skipping.")
elif old_route not in app:
    raise SystemExit("ERROR: /services route line not found in App.jsx — aborting.")
else:
    app = app.replace(old_route, new_route)

if app == app_original:
    print("App.jsx unchanged (already fully patched).")
else:
    with open(app_path, "w") as f:
        f.write(app)
    print("App.jsx patched.")

# ---- Dashboard.jsx: add a third quick-action button ----
with open(dash_path, "r") as f:
    dash = f.read()
dash_original = dash

old_buttons = '''            <div className="flex gap-3 mt-5">
              <Link to="/send" className="flex-1">
                <Button size="md">
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 stroke-current" strokeWidth="2">
                    <path d="M3 10 17 3l-5 14-2.5-5.5L3 10Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Send credits
                </Button>
              </Link>
              <Link to="/services" className="flex-1">
                <Button variant="secondary" size="md">Services</Button>
              </Link>
          </div>'''

new_buttons = '''            <div className="flex gap-3 mt-5">
              <Link to="/send" className="flex-1">
                <Button size="md">
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 stroke-current" strokeWidth="2">
                    <path d="M3 10 17 3l-5 14-2.5-5.5L3 10Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Send credits
                </Button>
              </Link>
              <Link to="/load-credits" className="flex-1">
                <Button variant="secondary" size="md">Load credits</Button>
              </Link>
              <Link to="/services" className="flex-1">
                <Button variant="secondary" size="md">Services</Button>
              </Link>
          </div>'''

if old_buttons not in dash:
    raise SystemExit("ERROR: balance-card button block not found in Dashboard.jsx — aborting.")
dash = dash.replace(old_buttons, new_buttons)

if dash == dash_original:
    raise SystemExit("ERROR: no changes made to Dashboard.jsx.")
with open(dash_path, "w") as f:
    f.write(dash)
print("Dashboard.jsx patched.")
PYEOF

echo ""
echo "Diff (App.jsx):"
diff "$APP_FILE.bak" "$APP_FILE" || true
echo ""
echo "Diff (Dashboard.jsx):"
diff "$DASH_FILE.bak" "$DASH_FILE" || true

echo ""
echo "If both look right:"
echo "  git add src/App.jsx src/pages/Dashboard.jsx src/pages/LoadCredits.jsx"
echo "  git commit -m 'Add Load Credits page, route, and dashboard entry point'"
echo "  git push"
