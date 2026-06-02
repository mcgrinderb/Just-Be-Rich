// GET /api/quote?symbol=AAPL
// Proxies Finnhub quote endpoint. The API key lives in an environment
// variable (FINNHUB_KEY) so it is NEVER exposed to the browser.
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const symbol = (url.searchParams.get("symbol") || "").toUpperCase().replace(/[^A-Z.]/g, "");

  if (!symbol) {
    return json({ error: "missing symbol" }, 400);
  }
  if (!env.FINNHUB_KEY) {
    return json({ error: "server not configured: FINNHUB_KEY missing" }, 500);
  }

  const api = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${env.FINNHUB_KEY}`;
  try {
    const r = await fetch(api, { cf: { cacheTtl: 10, cacheEverything: true } });
    if (!r.ok) return json({ error: "upstream " + r.status }, 502);
    const data = await r.json();
    return json(data, 200, 10); // tell browser it can cache 10s
  } catch (e) {
    return json({ error: "fetch failed" }, 502);
  }
}

function json(obj, status = 200, cacheSeconds = 0) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cacheSeconds ? `public, max-age=${cacheSeconds}` : "no-store",
    },
  });
}