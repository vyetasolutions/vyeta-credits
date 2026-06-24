# Kwacha Credits

A premium dark-mode fintech wallet simulation: signup, balance, send credits, transaction history, fees, mock ZMW conversion, reliability score, and insights. Built with React (Vite) + Tailwind + Supabase. Deploys to GitHub Pages.

This is a **closed-loop simulation** — no real money moves.

---

## PHASE 1 — Get it running on your computer

**1. Install Node.js** (skip if already installed): https://nodejs.org → download the LTS version → install.

**2. Open this folder in a terminal** (the folder containing this README), then run:

```
npm install
```

**3. Create your `.env` file** — copy the example and fill it in (you'll get the real values in Phase 2):

```
cp .env.example .env
```

**4. Run it locally:**

```
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). It will look broken/blank until Phase 2 is done — that's expected, it has no database yet.

---

## PHASE 2 — Set up Supabase (your backend)

**1. Create a project**
- Go to https://supabase.com → sign up → **New project**.
- Pick any name/password/region. Wait ~2 minutes for it to provision.

**2. Run the database schema**
- In your Supabase project, open **SQL Editor** (left sidebar) → **New query**.
- Open `supabase/schema.sql` from this project, copy **all of it**, paste into the SQL editor.
- Click **Run**. You should see "Success. No rows returned."
- This creates: `profiles` table, `transactions` table, the `transactions_view`, the `send_credits()` function (the only way credits ever move), and starts everyone at 1000 credits on signup.

**3. Turn off "confirm email" for faster testing (optional but recommended while building)**
- Go to **Authentication → Providers → Email**.
- Turn **off** "Confirm email" so you can sign up and log in instantly without checking an inbox.
- (Turn it back on later if you want real email verification.)

**4. Get your API keys**
- Go to **Project Settings → API**.
- Copy the **Project URL** and the **anon public** key.

**5. Paste them into your `.env` file:**

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

**6. Restart the dev server** (stop it with Ctrl+C, run `npm run dev` again).

**7. Test it:**
- Go to the app → **Create an account** → sign up with any email/password.
- You should land on the Dashboard with a balance of **1000.00 CR**.
- Sign up a second account (use a different email, or an incognito window) so you have someone to send credits to.
- Go to **Send** → search the second user → enter an amount → confirm. Balance updates instantly on both accounts (Supabase Realtime).

---

## PHASE 3 — Push to GitHub

**1. Create a new repository** on https://github.com/new
- Name it anything, e.g. `kwacha-credits`. Keep it **Public** (required for free GitHub Pages). Don't add a README/gitignore (you already have them).

**2. IMPORTANT — match the repo name in `vite.config.js`**

Open `vite.config.js` and make sure `base` matches your exact repo name:

```js
base: "/kwacha-credits/",
```

If your repo is named differently, e.g. `my-app`, change it to `base: "/my-app/"`. This is the #1 cause of a blank white page on GitHub Pages.

**3. Push your code** (run these in the project folder, replacing the URL with your repo's URL):

```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/kwacha-credits.git
git push -u origin main
```

---

## PHASE 4 — Deploy to GitHub Pages (automatic)

This project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys automatically every time you push to `main`. You just need to give it your Supabase keys and turn Pages on.

**1. Add your Supabase keys as GitHub Secrets** (so they get baked into the build safely):
- In your repo on GitHub: **Settings → Secrets and variables → Actions → New repository secret**.
- Add secret `VITE_SUPABASE_URL` = your project URL.
- Add secret `VITE_SUPABASE_ANON_KEY` = your anon public key.

**2. Turn on GitHub Pages with "GitHub Actions" as the source**
- In your repo: **Settings → Pages**.
- Under **Build and deployment → Source**, choose **GitHub Actions**.

**3. Trigger the deploy**
- Go to the **Actions** tab in your repo → you should see "Deploy to GitHub Pages" already running (it ran on your last push). If not, push any small change to trigger it, or click **Run workflow**.
- Wait for it to finish (green checkmark).

**4. Visit your live site**
- Still in **Settings → Pages**, you'll see your live URL, something like:
  `https://YOUR-USERNAME.github.io/kwacha-credits/`

That's it — sign up, send credits, and watch it update live.

---

## PHASE 5 — Admin panel (optional)

An admin panel is included: view every user's balance, manually credit/debit anyone with a logged reason, freeze/unfreeze accounts, and see a global audit log.

**1. Run the second SQL file**
- SQL Editor → New query → paste all of `supabase/02_admin.sql` → Run.

**2. Make yourself an admin**
- At the bottom of `02_admin.sql` there's a commented line:
  ```sql
  update public.profiles set role = 'admin' where email = 'you@example.com';
  ```
- Open a new SQL Editor query, paste that one line with your real signup email, and run it.

**3. Refresh the app**
- Log out and back in (or just refresh). You'll see a new **Admin** tab in the bottom nav.
- Only accounts with `role = 'admin'` can see `/admin` or call the admin functions — everyone else is redirected, and the database rejects the admin RPC calls even if someone tries to call them directly.



This app uses `HashRouter` (URLs look like `.../#/send` instead of `.../send`). That means every page works correctly on GitHub Pages even on refresh or direct link — no 404 redirect tricks needed.

---

## How money safety works (no negative balances)

All transfers go through one Postgres function, `send_credits()`, defined in `supabase/schema.sql`:
- It locks the sender's row, checks `balance >= amount + fee`, and rejects the transfer with an error if there isn't enough.
- It updates both balances and inserts the ledger row in the same transaction — either all of it happens, or none of it does.
- Nothing else is allowed to write to `profiles.balance` or insert into `transactions` directly (Row Level Security blocks it) — only this function can, because client code never touches balances directly.

## Where each feature lives

| Feature | File |
|---|---|
| Login / Signup | `src/pages/Login.jsx`, `src/pages/Signup.jsx` |
| Dashboard + balance | `src/pages/Dashboard.jsx` |
| Send + fee breakdown | `src/pages/Send.jsx` |
| Transaction history | `src/pages/History.jsx` |
| User search/contacts | `src/pages/Contacts.jsx` |
| Analytics (totals, top contacts) | `src/pages/Analytics.jsx` |
| Fee %, ZMW rate, reliability score | `src/lib/format.js` |
| Database schema + transfer logic | `supabase/schema.sql` |

## Customizing

- **Starting balance**: change `1000.00` in `handle_new_user()` inside `supabase/schema.sql` (re-run that part in SQL Editor — existing users won't retroactively change).
- **Fee tiers**: edit `calculateFee()` in `src/lib/format.js` AND `calculate_fee()` in `supabase/schema.sql` (keep both in sync — the frontend one is for preview, the SQL one is the source of truth that actually charges the fee).
- **Mock ZMW rate**: `ZMW_RATE` in `src/lib/format.js`.
- **Colors/fonts**: `tailwind.config.js`.
