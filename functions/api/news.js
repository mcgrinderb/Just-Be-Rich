// GET /api/news?symbol=AAPL
// Proxies Finnhub company-news for the last 5 days. Key stays server-side.
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const symbol = (url.searchParams.get("symbol") || "").toUpperCase().replace(/[^A-Z.]/g, "");

  if (!symbol) return json({ error: "missing symbol" }, 400);
  if (!env.FINNHUB_KEY) return json({ error: "server not configured" }, 500);

  const fmt = (d) => d.toISOString().slice(0, 10);
  const to = new Date();
  const from = new Date(Date.now() - 5 * 86400000);
  const api = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fmt(from)}&to=${fmt(to)}&token=${env.FINNHUB_KEY}`;

  try {
    const r = await fetch(api, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (!r.ok) return json([], 200, 300);
    const data = await r.json();
    // trim payload to what the frontend needs
    const slim = (Array.isArray(data) ? data : []).slice(0, 5).map((n) => ({
      headline: n.headline,
      source: n.source,
      url: n.url,
      datetime: n.datetime,
      image: n.image || "",
    }));
    return json(slim, 200, 300);
  } catch (e) {
    return json([], 200, 60);
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