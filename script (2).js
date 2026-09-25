/* Maxi Trades — script.js
   1) Quiz interactivity (unchanged from the original page)
   2) Chart Lab: a real XAU/USD candlestick chart (Lightweight Charts) fed by
      the Twelve Data API, with Demand/Supply/FVG zones detected from the
      actual candles — plus a clearly-labelled offline "textbook" mode that
      is used automatically if live data can't load, or manually on request.
*/

function quizAnswer(btn, correct) {
  var result = document.getElementById('quiz-result');
  if (!result) return;
  if (correct) {
    result.textContent = '✓ Correct. No context + no location + no confirmation = no trade. A moving candle is not a setup.';
  } else {
    result.textContent = 'Not quite. Price moving is not enough. Go back to context → location → confirmation.';
  }
}

(function () {
  var CFG = window.MAXI_CONFIG || { TWELVE_DATA_API_KEY: 'demo', SYMBOL: 'XAU/USD' };

  var chart, series, container;
  var currentInterval = '1day';
  var mode = 'live'; // 'live' | 'textbook'

  function setStatus(text, cls) {
    var el = document.getElementById('chartStatus');
    if (!el) return;
    el.textContent = text;
    el.className = 'chart-status ' + (cls || '');
  }

  function setSubtitle(text) {
    var el = document.getElementById('chartSubtitle');
    if (el) el.textContent = ' • ' + text;
  }

  function toUnixTime(dateStr) {
    // Twelve Data returns "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS" (exchange-local, treated as UTC here)
    var iso = dateStr.indexOf(' ') > -1 ? dateStr.replace(' ', 'T') + 'Z' : dateStr + 'T00:00:00Z';
    return Math.floor(new Date(iso).getTime() / 1000);
  }

  // ---------------- Zone detection on real candle data ----------------

  function detectPivots(candles, span) {
    var highs = [], lows = [];
    for (var i = span; i < candles.length - span; i++) {
      var isHigh = true, isLow = true;
      for (var k = 1; k <= span; k++) {
        if (candles[i].high < candles[i - k].high || candles[i].high < candles[i + k].high) isHigh = false;
        if (candles[i].low > candles[i - k].low || candles[i].low > candles[i + k].low) isLow = false;
      }
      if (isHigh) highs.push(i);
      if (isLow) lows.push(i);
    }
    return { highs: highs, lows: lows };
  }

  // Classic 3-candle imbalance (ICT-style Fair Value Gap): a gap between
  // candle[i-1] and candle[i+1] that candle[i] doesn't fill.
  function detectFVG(candles) {
    for (var i = candles.length - 2; i >= 2; i--) {
      var a = candles[i - 1], b = candles[i + 1];
      if (a.high < b.low) return { top: b.low, bottom: a.high, bullish: true, index: i };
      if (a.low > b.high) return { top: a.low, bottom: b.high, bullish: false, index: i };
    }
    return null;
  }

  function applyZones(candles) {
    if (!series || candles.length < 12) return;

    var pivots = detectPivots(candles, 2);
    var lastHigh = pivots.highs.length ? candles[pivots.highs[pivots.highs.length - 1]] : null;
    var lastLow = pivots.lows.length ? candles[pivots.lows[pivots.lows.length - 1]] : null;
    var fvg = detectFVG(candles);

    if (lastHigh) {
      series.createPriceLine({
        price: lastHigh.high, color: '#f07874', lineWidth: 1, lineStyle: 2,
        axisLabelVisible: true, title: 'Supply / Resistance'
      });
    }
    if (lastLow) {
      series.createPriceLine({
        price: lastLow.low, color: '#8bd64c', lineWidth: 1, lineStyle: 2,
        axisLabelVisible: true, title: 'Demand / Support'
      });
    }
    if (fvg) {
      series.createPriceLine({ price: fvg.top, color: '#b59cff', lineWidth: 1, lineStyle: 3, axisLabelVisible: true, title: 'FVG' });
      series.createPriceLine({ price: fvg.bottom, color: '#b59cff', lineWidth: 1, lineStyle: 3, axisLabelVisible: false, title: '' });
    }

    var markers = [];
    if (lastLow) markers.push({ time: lastLow.time, position: 'belowBar', color: '#8bd64c', shape: 'arrowUp', text: 'Demand' });
    if (lastHigh) markers.push({ time: lastHigh.time, position: 'aboveBar', color: '#f07874', shape: 'arrowDown', text: 'Supply' });
    if (fvg) markers.push({ time: candles[fvg.index].time, position: 'inBar', color: '#b59cff', shape: 'circle', text: 'FVG' });
    markers.sort(function (a, b) { return a.time - b.time; });
    series.setMarkers(markers);
  }

  // ---------------- Offline / textbook example (clearly labelled) ----------------

  function buildTextbookCandles() {
    var n = 90;
    var base = 2600 + Math.random() * 300;
    var candles = [];
    var t = Math.floor(Date.now() / 1000) - n * 86400;
    var price = base;
    var trend = (Math.random() < 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.25);
    for (var i = 0; i < n; i++) {
      var open = price;
      var drift = trend + (Math.random() - 0.5) * 2.2;
      var close = open + drift;
      var high = Math.max(open, close) + Math.random() * 1.4;
      var low = Math.min(open, close) - Math.random() * 1.4;
      candles.push({ time: t, open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2) });
      price = close;
      t += 86400;
    }
    return candles;
  }

  function showTextbookExample(label) {
    mode = 'textbook';
    var candles = buildTextbookCandles();
    series.setData(candles);
    applyZones(candles);
    chart.timeScale().fitContent();
    setStatus('TEXTBOOK EXAMPLE', 'textbook');
    setSubtitle(label || 'Illustrative example — not real price data');
    var btn = document.getElementById('chartModeBtn');
    if (btn) btn.textContent = '📡 Back to live data';
  }

  // ---------------- Live data loading ----------------

  function loadLive(interval) {
    mode = 'live';
    currentInterval = interval;
    setStatus('LOADING…', '');
    setSubtitle('Fetching real price data…');
    var btn = document.getElementById('chartModeBtn');
    if (btn) btn.textContent = '🎓 Textbook example';

    var url = 'https://api.twelvedata.com/time_series'
      + '?symbol=' + encodeURIComponent(CFG.SYMBOL)
      + '&interval=' + encodeURIComponent(interval)
      + '&outputsize=150'
      + '&apikey=' + encodeURIComponent(CFG.TWELVE_DATA_API_KEY);

    fetch(url).then(function (r) { return r.json(); }).then(function (data) {
      if (!data || data.status === 'error' || !data.values || !data.values.length) {
        throw new Error((data && data.message) || 'No data returned');
      }
      var candles = data.values.map(function (v) {
        return { time: toUnixTime(v.datetime), open: +v.open, high: +v.high, low: +v.low, close: +v.close };
      }).sort(function (a, b) { return a.time - b.time; });

      series.setData(candles);
      applyZones(candles);
      chart.timeScale().fitContent();
      setStatus('LIVE DATA', 'live');
      setSubtitle('Real ' + CFG.SYMBOL + ' price action — ' + interval + ' candles');
    }).catch(function (err) {
      console.warn('Chart Lab: live fetch failed, showing offline example —', err.message);
      showTextbookExample('Live data unavailable right now — showing an illustrative example');
      setStatus('OFFLINE EXAMPLE', 'offline');
    });
  }

  // ---------------- Wiring ----------------

  function initChart() {
    container = document.getElementById('chartContainer');
    if (!container || !window.LightweightCharts) return;

    chart = LightweightCharts.createChart(container, {
      layout: { background: { color: '#090b0c' }, textColor: '#9a9da1' },
      grid: {
        vertLines: { color: 'rgba(255,255,255,.04)' },
        horzLines: { color: 'rgba(255,255,255,.04)' }
      },
      rightPriceScale: { borderColor: '#25282b' },
      timeScale: { borderColor: '#25282b' },
      crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
      autoSize: true
    });

    series = chart.addCandlestickSeries({
      upColor: '#35d07f',
      downColor: '#ef5350',
      wickUpColor: '#35d07f',
      wickDownColor: '#ef5350',
      borderVisible: false
    });

    loadLive(currentInterval);

    var tf = document.getElementById('chartTf');
    if (tf) {
      tf.addEventListener('click', function (e) {
        var t = e.target.closest ? e.target.closest('span[data-interval]') : null;
        if (!t) return;
        var spans = tf.querySelectorAll('span');
        for (var i = 0; i < spans.length; i++) spans[i].classList.remove('active');
        t.classList.add('active');
        loadLive(t.getAttribute('data-interval'));
      });
    }

    var refresh = document.getElementById('chartRefresh');
    if (refresh) {
      refresh.addEventListener('click', function () {
        if (mode === 'textbook') showTextbookExample();
        else loadLive(currentInterval);
      });
    }

    var modeBtn = document.getElementById('chartModeBtn');
    if (modeBtn) {
      modeBtn.addEventListener('click', function () {
        if (mode === 'textbook') loadLive(currentInterval);
        else showTextbookExample();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initChart);
})();
