// GET /api/sectors
// Returns performance for the 11 SPDR sector ETFs, ranked. The frontend
// uses this for the sector board plus the "hot / not" panels.
// Key stays server-side.

const SECTORS = [
  { etf: "XLK", name: "Technology" },
  { etf: "XLF", name: "Financials" },
  { etf: "XLV", name: "Health Care" },
  { etf: "XLE", name: "Energy" },
  { etf: "XLY", name: "Consumer Disc." },
  { etf: "XLP", name: "Consumer Staples" },
  { etf: "XLI", name: "Industrials" },
  { etf: "XLB", name: "Materials" },
  { etf: "XLU", name: "Utilities" },
  { etf: "XLRE", name: "Real Estate" },
  { etf: "XLC", name: "Comm. Services" },
];

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.FINNHUB_KEY) return json({ error: "server not configured" }, 500);

  try {
    const results = await Promise.all(
      SECTORS.map(async (s) => {
        try {
          const r = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${s.etf}&token=${env.FINNHUB_KEY}`,
            { cf: { cacheTtl: 60, cacheEverything: true } }
          );
          if (!r.ok) return { ...s, dp: null };
          const q = await r.json();
          return { ...s, dp: typeof q.dp === "number" ? q.dp : null, price: q.c };
        } catch (e) {
          return { ...s, dp: null };
        }
      })
    );
    const valid = results.filter((s) => s.dp !== null).sort((a, b) => b.dp - a.dp);
    return json({ sectors: valid }, 200, 60);
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