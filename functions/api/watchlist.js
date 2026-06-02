// /api/watchlist
//   GET  -> { tickers: [...] }   the shared list for the whole group
//   POST { tickers: [...] }      replaces the shared list
//
// Backed by a Cloudflare KV namespace bound as WATCHLIST_KV.
// One key ("shared") holds the single list everyone reads and writes,
// so when one friend adds a ticker, everyone sees it.

const KEY = "shared";
const DEFAULTS = ["AAPL", "NVDA", "MSFT", "TSLA", "AMZN"];
const MAX_TICKERS = 40;

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.WATCHLIST_KV) return json({ tickers: DEFAULTS, note: "KV not bound" });
  try {
    const raw = await env.WATCHLIST_KV.get(KEY);
    const tickers = raw ? JSON.parse(raw) : DEFAULTS;
    return json({ tickers });
  } catch (e) {
    return json({ tickers: DEFAULTS });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.WATCHLIST_KV) return json({ error: "KV not bound" }, 500);
  try {
    const body = await request.json();
    let tickers = Array.isArray(body.tickers) ? body.tickers : [];
    // sanitize: uppercase, strip junk, dedupe, cap length
    tickers = [...new Set(
      tickers
        .map((t) => String(t).toUpperCase().replace(/[^A-Z.]/g, ""))
        .filter(Boolean)
    )].slice(0, MAX_TICKERS);
    await env.WATCHLIST_KV.put(KEY, JSON.stringify(tickers));
    return json({ tickers });
  } catch (e) {
    return json({ error: "bad request" }, 400);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}