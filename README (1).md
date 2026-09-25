# Maxi Trades — landing page

Plain HTML/CSS/JS. No build step, no framework — works as static files, ready for GitHub Pages.

## Files

| File | What it is |
|---|---|
| `index.html` | Page markup (~21 KB) |
| `style.css` | All styles |
| `script.js` | Quiz interactivity + the Chart Lab (real chart) logic |
| `config.js` | Your API key + symbol — the only file you should need to edit |
| `assets/story.jpg` | The one photo the page uses, as a real file (~140 KB) |

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

## 2. (Optional) Turn on Google Analytics

1. Create a GA4 property at [analytics.google.com](https://analytics.google.com) (free).
2. Go to **Admin → Data Streams → your web stream**, copy the **Measurement ID** (looks like `G-XXXXXXXXXX`).
3. Paste it into `config.js`:

```js
window.MAXI_CONFIG = {
  TWELVE_DATA_API_KEY: "your_real_key_here",
  SYMBOL: "XAU/USD",
  GA_MEASUREMENT_ID: "G-XXXXXXXXXX"
};
```

Analytics stays off until you put in a real ID, so there's no rush — nothing breaks either way.

## 3. Preview locally

Because the page uses `fetch()`, some browsers are happier serving it over `http://` than `file://`. Either works, but if you see anything odd, run a tiny local server from this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## 4. Deploy on GitHub Pages

1. Create a new GitHub repo and push these files — including the `assets/` folder — to the root, or to a `docs/` folder if you'd rather keep them alongside other code.
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, pick `main` and the folder you used (`/root` or `/docs`).
3. Save. GitHub gives you a URL like `https://yourname.github.io/your-repo/` within a minute or two.

## A word on API keys

Everything in `config.js` is publicly visible to anyone who views the page source — that's true of any static site with no backend. That's fine for the Twelve Data key (its free tier is designed to be used this way, and worst case someone burns your daily quota) and fine for the GA4 Measurement ID (it's meant to be public). It is **not** fine for anything more sensitive — payment provider secret keys, admin passwords, or keys for services billed per request (like most AI APIs) should never go in this file or anywhere else in this repo.

## Notes / honest caveats

- The chart's Demand/Supply/FVG zones are **computed from the real candles** (recent swing high, recent swing low, most recent 3-candle imbalance) — they are not hand-placed, but they're a simple teaching heuristic, not a trading signal.
- Twelve Data's free tier is rate-limited. If you get a lot of traffic, requests can start failing — the offline fallback handles that gracefully, but for a high-traffic production site you'd eventually want your own small backend/cache instead of calling the API straight from every visitor's browser.
- All images now live as real files under `assets/` instead of being embedded as base64 text, which is what was making `index.html` too big to upload — the whole repo is now well under 200 KB.
