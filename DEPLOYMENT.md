# Just Be Rich — Cloudflare Pages Cool

This project is deployed on Cloudflare Pages with KV storage for the shared watchlist.

## Deployment Setup

**Environment Variables (in Cloudflare Pages):**
- `FINNHUB_KEY`: Your Finnhub API key

**KV Namespace Binding (in Cloudflare Pages):**
- Binding name: `WATCHLIST_KV`

## Local Development

To test locally with Wrangler:

```bash
wrangler pages dev public --kv WATCHLIST_KV=watchlist
```

Or deploy directly:

```bash
wrangler pages deploy public --kv WATCHLIST_KV=watchlist
```

## Architecture

- `public/index.html` - Frontend (served directly)
- `functions/api/` - Cloudflare Pages Functions (serverless API endpoints)
  - `quote.js` - Stock quote proxy
  - `news.js` - Company news proxy
  - `sectors.js` - Sector ETF performance
  - `watchlist.js` - Shared watchlist storage

The frontend calls `/api/*` endpoints which proxy to Finnhub while keeping your API key secret on the server.
