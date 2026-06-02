const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const FINNHUB_KEY = process.env.FINNHUB_KEY;
const PORT = process.env.PORT || 3000;

// ============ QUOTE ============
app.get('/api/quote', async (req, res) => {
  const symbol = (req.query.symbol || '').toUpperCase().replace(/[^A-Z.]/g, '');
  
  if (!symbol) {
    return res.status(400).json({ error: 'missing symbol' });
  }
  if (!FINNHUB_KEY) {
    return res.status(500).json({ error: 'server not configured: FINNHUB_KEY missing' });
  }

  try {
    const api = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`;
    const r = await fetch(api);
    if (!r.ok) return res.status(502).json({ error: `upstream ${r.status}` });
    const data = await r.json();
    res.set('Cache-Control', 'public, max-age=10');
    return res.json(data);
  } catch (e) {
    return res.status(502).json({ error: 'fetch failed' });
  }
});

// ============ SECTORS ============
const SECTORS = [
  { etf: 'XLK', name: 'Technology' },
  { etf: 'XLF', name: 'Financials' },
  { etf: 'XLV', name: 'Health Care' },
  { etf: 'XLE', name: 'Energy' },
  { etf: 'XLY', name: 'Consumer Disc.' },
  { etf: 'XLP', name: 'Consumer Staples' },
  { etf: 'XLI', name: 'Industrials' },
  { etf: 'XLB', name: 'Materials' },
  { etf: 'XLU', name: 'Utilities' },
  { etf: 'XLRE', name: 'Real Estate' },
  { etf: 'XLC', name: 'Comm. Services' },
];

app.get('/api/sectors', async (req, res) => {
  if (!FINNHUB_KEY) {
    return res.status(500).json({ error: 'server not configured' });
  }

  try {
    const results = await Promise.all(
      SECTORS.map(async (s) => {
        try {
          const r = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${s.etf}&token=${FINNHUB_KEY}`
          );
          if (!r.ok) return { ...s, dp: null };
          const q = await r.json();
          return { ...s, dp: typeof q.dp === 'number' ? q.dp : null, price: q.c };
        } catch (e) {
          return { ...s, dp: null };
        }
      })
    );
    const valid = results.filter((s) => s.dp !== null).sort((a, b) => b.dp - a.dp);
    res.set('Cache-Control', 'public, max-age=60');
    return res.json({ sectors: valid });
  } catch (e) {
    return res.status(502).json({ error: 'fetch failed' });
  }
});

// ============ NEWS ============
app.get('/api/news', async (req, res) => {
  const symbol = (req.query.symbol || '').toUpperCase().replace(/[^A-Z.]/g, '');
  
  if (!symbol) return res.status(400).json({ error: 'missing symbol' });
  if (!FINNHUB_KEY) return res.status(500).json({ error: 'server not configured' });

  const fmt = (d) => d.toISOString().slice(0, 10);
  const to = new Date();
  const from = new Date(Date.now() - 5 * 86400000);
  const api = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fmt(from)}&to=${fmt(to)}&token=${FINNHUB_KEY}`;

  try {
    const r = await fetch(api);
    if (!r.ok) {
      res.set('Cache-Control', 'public, max-age=300');
      return res.json([]);
    }
    const data = await r.json();
    const slim = (Array.isArray(data) ? data : []).slice(0, 5).map((n) => ({
      headline: n.headline,
      source: n.source,
      url: n.url,
      datetime: n.datetime,
      image: n.image || '',
    }));
    res.set('Cache-Control', 'public, max-age=300');
    return res.json(slim);
  } catch (e) {
    res.set('Cache-Control', 'public, max-age=60');
    return res.json([]);
  }
});

// ============ WATCHLIST (in-memory for now) ============
let watchlist = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMZN'];
const MAX_TICKERS = 40;

app.get('/api/watchlist', (req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.json({ tickers: watchlist });
});

app.post('/api/watchlist', (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    let tickers = Array.isArray(req.body.tickers) ? req.body.tickers : [];
    tickers = [...new Set(
      tickers
        .map((t) => String(t).toUpperCase().replace(/[^A-Z.]/g, ''))
        .filter(Boolean)
    )].slice(0, MAX_TICKERS);
    watchlist = tickers;
    return res.json({ tickers });
  } catch (e) {
    return res.status(400).json({ error: 'bad request' });
  }
});

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Just Be Rich API listening on port ${PORT}`);
});
