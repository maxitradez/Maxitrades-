# Maxi Trades — landing page

Plain HTML/CSS/JS. No build step, no framework — works as static files, ready for GitHub Pages.

## Files

| File | What it is |
|---|---|
| `index.html` | Page markup |
| `style.css` | All styles |
| `script.js` | Quiz interactivity + the Chart Lab (real chart) logic |
| `config.js` | Your API key + symbol — the only file you should need to edit |

The Chart Lab loads [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) from a CDN (`cdn.jsdelivr.net`), so it needs no install.

## 1. Add your free API key

The chart pulls real XAU/USD candles from [Twelve Data](https://twelvedata.com/register) (free tier, no card, 800 requests/day). The shared `demo` key that ships in `config.js` does **not** reliably return gold data — get your own key (takes under a minute) and drop it in:

```js
// config.js
window.MAXI_CONFIG = {
  TWELVE_DATA_API_KEY: "your_real_key_here",
  SYMBOL: "XAU/USD"
};
```

If the live fetch ever fails (bad key, rate limit, offline), the chart automatically falls back to a clearly-labelled **"Offline example"** so the page never breaks or shows a blank chart. There's also a manual **"🎓 Textbook example"** button visitors can use to see a clean, idealized version of the pattern for teaching purposes.

## 2. Preview locally

Because the page uses `fetch()`, some browsers are happier serving it over `http://` than `file://`. Either works, but if you see anything odd, run a tiny local server from this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## 3. Deploy on GitHub Pages

1. Create a new GitHub repo and push these four files (plus this README) to the root — or to a `docs/` folder if you'd rather keep them alongside other code.
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, pick `main` and the folder you used (`/root` or `/docs`).
3. Save. GitHub gives you a URL like `https://yourname.github.io/your-repo/` within a minute or two.

## Notes / honest caveats

- The chart's Demand/Supply/FVG zones are **computed from the real candles** (recent swing high, recent swing low, most recent 3-candle imbalance) — they are not hand-placed, but they're a simple teaching heuristic, not a trading signal.
- Twelve Data's free tier is rate-limited. If you get a lot of traffic, requests can start failing — the offline fallback handles that gracefully, but for a high-traffic production site you'd eventually want your own small backend/cache instead of calling the API straight from every visitor's browser.
- The page's other images are still embedded as base64 inside `index.html`, which is why that file is a few MB. That's fine for GitHub Pages, but if you ever want a leaner repo, those can be pulled out into a real `/assets` folder — say the word and I'll do that split too.
