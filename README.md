# Just Be Rich — deploy guide

A live market desk for you and your friends. One hidden Finnhub key (nobody
needs their own) and one **shared watchlist** — when anyone adds a stock,
everyone sees it.

## What's in here

```
just-be-rich/
├── public/
│   └── index.html         ← the site itself
└── functions/api/
    ├── quote.js           ← live price proxy (hides your key)
    ├── news.js            ← company-news proxy w/ photos (hides your key)
    ├── sectors.js         ← sector ETF performance for hot/not board
    └── watchlist.js       ← shared watchlist read/write (KV-backed)
```

The frontend never talks to Finnhub directly — it calls `/api/*`, and the
serverless functions add the secret key. So the key is never in anything a
visitor can view.

---

## Step 1 — get a free Finnhub key (≈30 sec)

1. Go to **finnhub.io/register**, sign up with an email. No credit card.
2. Copy the API key shown on your dashboard.

Free tier = 60 calls/min, real-time US quotes + company news. Plenty here.

---

## Step 2 — get the files into GitHub

Easiest path for Cloudflare. (You can also use Cloudflare's direct upload —
see Step 5 alt.)

1. Create a new GitHub repo, e.g. `just-be-rich`.
2. Upload the **contents of this folder** so `public/` and `functions/`
   sit at the repo root.

---

## Step 3 — create the Cloudflare Pages project

1. Sign up free at **dash.cloudflare.com** (no card).
2. **Workers & Pages → Create → Pages → Connect to Git**, pick your repo.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave blank)*
   - **Build output directory:** `public`
4. Click **Save and Deploy**. You'll get a URL like
   `just-be-rich.pages.dev`. The site loads, but data/watchlist won't work
   yet — two more steps.

---

## Step 4 — add your secret key

In the Pages project: **Settings → Environment variables → Add**:

- **Variable name:** `FINNHUB_KEY`
- **Value:** *(paste your Finnhub key)*
- Encrypt it, save.

---

## Step 5 — create the shared-watchlist storage (KV)

1. **Workers & Pages → KV → Create namespace**, name it `watchlist`.
2. Back in the Pages project: **Settings → Functions → KV namespace
   bindings → Add binding**:
   - **Variable name:** `WATCHLIST_KV`  *(must match exactly)*
   - **KV namespace:** the `watchlist` one you just made.
3. **Redeploy** (Deployments → ⋯ → Retry deployment) so the new
   variable + binding take effect.

> ### Step 5 alternative — no GitHub
> Install Wrangler (`npm i -g wrangler`), then from this folder run
> `wrangler pages deploy public`. Set the key with
> `wrangler pages secret put FINNHUB_KEY` and create/bind KV via
> `wrangler kv namespace create watchlist` plus a binding entry in the
> dashboard. The Git route above is simpler if you're not a CLI person.

---

## Done

Open your `*.pages.dev` URL and share it with your friends. Adding or
removing a ticker writes to the shared list, and everyone's page picks up
the change within ~30 seconds (or on refresh).

## Notes & limits
- Free Finnhub quotes can lag a few seconds — fine for a friends' desk,
  not for execution.
- The "good/bad" tags are a rough heuristic (headline keywords + price
  direction), meant to start a conversation, not to give advice.
- Want per-person watchlists, login, or price alerts later? That's a
  natural next step on this same stack.