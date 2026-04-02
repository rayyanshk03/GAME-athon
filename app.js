// ============================================================
//  MarketPulse — App Logic  (app.js)  [Finnhub-powered + LIVE mode]
// ============================================================

'use strict';

// ── State ──────────────────────────────────────────────────
let selectedTicker = 'AAPL';
let selectedRange  = '1D';
window.mainChart   = null;   // exposed globally for predict.js
let mainChart      = null;
let isLiveMode     = false;
let liveInterval   = null;       // 60-sec poller
let liveBuffer     = {};         // { ticker: { labels:[], data:[] } }
const LIVE_MAX_PTS = 120;        // max data points on live chart (2h @ 1/min)

// ── DOM refs ───────────────────────────────────────────────
const stockListEl   = document.getElementById('stock-list');
const headerTicker  = document.getElementById('header-ticker');
const headerName    = document.getElementById('header-name');
const headerMeta    = document.getElementById('header-meta');
const headerPrice   = document.getElementById('header-price');
const headerChange  = document.getElementById('header-change');
const chartCanvas   = document.getElementById('main-chart');
const tooltip       = document.getElementById('chart-tooltip');
const tooltipTime   = document.getElementById('tooltip-time');
const tooltipPrice  = document.getElementById('tooltip-price');
const newsGridEl    = document.getElementById('news-grid');
const newsTitleEl   = document.getElementById('news-title');
const searchInput   = document.getElementById('search-input');
const chartWrapper  = document.getElementById('chart-wrapper');
const liveBadge     = document.getElementById('live-badge');

// Stats
const statOpen   = document.getElementById('stat-open');
const statHigh   = document.getElementById('stat-high');
const statLow    = document.getElementById('stat-low');
const statVol    = document.getElementById('stat-vol');
const statPe     = document.getElementById('stat-pe');
const statMktcap = document.getElementById('stat-mktcap');
const stat52h    = document.getElementById('stat-52h');
const stat52l    = document.getElementById('stat-52l');
const statAvgvol = document.getElementById('stat-avgvol');
const statYield  = document.getElementById('stat-yield');
const statBeta   = document.getElementById('stat-beta');
const statEps    = document.getElementById('stat-eps');

// ────────────────────────────────────────────────────────────
//  LIVE CHART ENGINE
// ────────────────────────────────────────────────────────────

function nowLabel() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function initLiveBuffer(ticker) {
  if (!liveBuffer[ticker]) {
    liveBuffer[ticker] = { labels: [], data: [] };
  }
}

// Seed the live buffer with N historical minute-prices from mock sparkline
function seedLiveBuffer(ticker) {
  initLiveBuffer(ticker);
  const s = STOCKS.find(x => x.ticker === ticker);
  if (!s || !s.sparkline) return;

  liveBuffer[ticker].labels = [];
  liveBuffer[ticker].data   = [];

  const now = Date.now();
  const spark = s.sparkline.slice(-30); // use last 30 sparkline pts as seed
  spark.forEach((price, i) => {
    const ts = new Date(now - (spark.length - 1 - i) * 60000);
    const label = ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    liveBuffer[ticker].labels.push(label);
    liveBuffer[ticker].data.push(+(s.price * (price / spark[spark.length - 1])).toFixed(2));
  });
}

// Append a new minute-price point to the live buffer and update chart
function appendLivePoint(ticker, price) {
  initLiveBuffer(ticker);
  const buf = liveBuffer[ticker];
  const label = nowLabel();

  buf.labels.push(label);
  buf.data.push(+price.toFixed(2));

  // Rolling window
  if (buf.labels.length > LIVE_MAX_PTS) {
    buf.labels.shift();
    buf.data.shift();
  }

  // Only update chart if this is the current ticker AND we're in LIVE mode
  if (ticker === selectedTicker && isLiveMode && mainChart) {
    mainChart.data.labels = buf.labels;
    mainChart.data.datasets[0].data = buf.data;

    // Recalculate colors based on buffer trend
    const first = buf.data[0];
    const last  = buf.data[buf.data.length - 1];
    const color = last >= first ? '#4f8ef7' : '#ef5350';
    mainChart.data.datasets[0].borderColor = color;
    mainChart.data.datasets[0].backgroundColor = makeGradient(color);
    mainChart.update('active'); // smooth update
  }
}

// Update ONLY the last point (WebSocket tick between minute marks)
function updateLastLivePoint(ticker, price) {
  if (!liveBuffer[ticker] || !liveBuffer[ticker].data.length) return;
  const buf = liveBuffer[ticker];
  buf.data[buf.data.length - 1] = +price.toFixed(2);
  buf.labels[buf.labels.length - 1] = nowLabel();

  if (ticker === selectedTicker && isLiveMode && mainChart) {
    mainChart.data.datasets[0].data = [...buf.data];
    mainChart.data.labels = [...buf.labels];
    mainChart.update('none'); // no animation for sub-second ticks
  }
}

// Start LIVE mode for a ticker
async function startLiveMode(ticker) {
  stopLiveMode(); // clear any previous interval
  isLiveMode = true;

  // Show LIVE badge
  if (liveBadge) liveBadge.style.display = 'flex';

  // Seed with historical data
  seedLiveBuffer(ticker);

  // Render chart immediately from buffer
  renderLiveChart(ticker);

  // Add current price as first real point
  const s = STOCKS.find(x => x.ticker === ticker);
  if (s) appendLivePoint(ticker, s.price);

  // Poll every 60 seconds for a new confirmed price
  liveInterval = setInterval(async () => {
    if (!isLiveMode || selectedTicker !== ticker) return;
    try {
      const q = await window.fetchQuoteForLive(ticker);
      if (q && q.c) {
        appendLivePoint(ticker, q.c);
        // Update stat prices too
        const stock = STOCKS.find(x => x.ticker === ticker);
        if (stock && q.c) {
          stock.price     = +q.c.toFixed(2);
          stock.change    = +q.d.toFixed(2);
          stock.changePct = +q.dp.toFixed(2);
          updateHeader(stock);
        }
      }
    } catch(e) {
      console.warn('Live poll error:', e.message);
      // Fallback: append last known price with small random walk
      const stock = STOCKS.find(x => x.ticker === ticker);
      if (stock) appendLivePoint(ticker, stock.price + (Math.random() - 0.5) * 0.1);
    }
  }, 60000); // every 60 seconds

  console.info(`▶ LIVE mode started for ${ticker} (60s polling)`);
}

function stopLiveMode() {
  if (liveInterval) { clearInterval(liveInterval); liveInterval = null; }
  isLiveMode = false;
  if (liveBadge) liveBadge.style.display = 'none';
  console.info('⏹ LIVE mode stopped');
}

function renderLiveChart(ticker) {
  const buf = liveBuffer[ticker];
  if (!buf || !buf.data.length) return;

  const first = buf.data[0];
  const last  = buf.data[buf.data.length - 1];
  const color = last >= first ? '#4f8ef7' : '#ef5350';

  if (mainChart) {
    mainChart.data.labels = [...buf.labels];
    mainChart.data.datasets[0].data = [...buf.data];
    mainChart.data.datasets[0].borderColor = color;
    mainChart.data.datasets[0].backgroundColor = makeGradient(color);
    mainChart.update('none');
    return;
  }
  renderChart(buf.labels, buf.data);
}

// WebSocket live price updates → update last chart point in LIVE mode
window.addEventListener('livePriceUpdate', (e) => {
  const { ticker, price, oldPrice } = e.detail;

  // Update sidebar price with flash effect
  const priceEl = document.getElementById(`price-${ticker}`);
  if (priceEl) {
    priceEl.textContent = '$' + price.toFixed(2);
    const flash = price >= oldPrice ? 'flash-green' : 'flash-red';
    priceEl.classList.add(flash);
    setTimeout(() => priceEl.classList.remove(flash), 600);
  }

  // Update header for selected stock
  if (ticker === selectedTicker) {
    const s = STOCKS.find(x => x.ticker === ticker);
    if (s) {
      headerPrice.textContent = '$' + s.price.toFixed(2);
      const positive = s.changePct >= 0;
      headerChange.textContent = positive
        ? `+${s.change.toFixed(2)} (+${s.changePct.toFixed(2)}%)`
        : `${s.change.toFixed(2)} (${s.changePct.toFixed(2)}%)`;
      headerChange.className = 'header-change ' + (positive ? 'positive' : 'negative');
    }
    // In LIVE mode, update the last chart point with WebSocket price
    if (isLiveMode) {
      updateLastLivePoint(ticker, price);
    }
  }
});

// ────────────────────────────────────────────────────────────
//  LOADING OVERLAY
// ────────────────────────────────────────────────────────────
function showChartLoading(show) {
  let overlay = document.getElementById('chart-loading');
  if (show) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'chart-loading';
      overlay.innerHTML = '<div class="spinner"></div><span>Loading real data…</span>';
      chartWrapper.style.position = 'relative';
      chartWrapper.appendChild(overlay);
    }
    overlay.style.display = 'flex';
  } else if (overlay) {
    overlay.style.display = 'none';
  }
}

// ────────────────────────────────────────────────────────────
//  SPARKLINE
// ────────────────────────────────────────────────────────────
function drawSparkline(canvas, data, positive) {
  const W = canvas.width  = canvas.offsetWidth  || 52;
  const H = canvas.height = canvas.offsetHeight || 28;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const mn = Math.min(...data), mx = Math.max(...data);
  const rangeY = mx - mn || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - mn) / rangeY) * (H - 4) - 2
  }));
  const color = positive ? '#26a69a' : '#ef5350';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, H);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, H);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, color + '55');
  grad.addColorStop(1, color + '00');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin  = 'round';
  ctx.stroke();
}

// ────────────────────────────────────────────────────────────
//  SIDEBAR
// ────────────────────────────────────────────────────────────
function buildStockList(filter = '') {
  const scrollTop = stockListEl.scrollTop;
  stockListEl.innerHTML = '';
  const filtered = STOCKS.filter(s =>
    s.ticker.toLowerCase().includes(filter.toLowerCase()) ||
    s.name.toLowerCase().includes(filter.toLowerCase())
  );
  filtered.forEach(s => {
    const item = document.createElement('div');
    item.className = 'stock-item' + (s.ticker === selectedTicker ? ' active' : '');
    item.dataset.ticker = s.ticker;
    const positive = s.changePct >= 0;
    const arrow    = positive ? '▲' : '▼';
    item.innerHTML = `
      <div class="stock-item-left">
        <div class="stock-ticker">${s.ticker}</div>
        <div class="stock-name">${s.name}</div>
      </div>
      <div class="stock-item-mid">
        <canvas class="sparkline" width="52" height="28"></canvas>
      </div>
      <div class="stock-item-right">
        <div class="stock-price" id="price-${s.ticker}">$${s.price.toFixed(2)}</div>
        <div class="stock-change-pill ${positive ? 'positive' : 'negative'}" id="pill-${s.ticker}">
          ${arrow}${Math.abs(s.changePct).toFixed(2)}%
        </div>
      </div>
    `;
    item.addEventListener('click', () => selectStock(s.ticker));
    stockListEl.appendChild(item);
    requestAnimationFrame(() => drawSparkline(item.querySelector('.sparkline'), s.sparkline, positive));
  });
  stockListEl.scrollTop = scrollTop;
}

window.addEventListener('quotesRefreshed', () => {
  buildStockList(searchInput.value);
  const s = STOCKS.find(x => x.ticker === selectedTicker);
  if (s) updateHeader(s);
});

// ────────────────────────────────────────────────────────────
//  STOCK SELECTION
// ────────────────────────────────────────────────────────────
async function selectStock(ticker) {
  selectedTicker = ticker;
  const s = STOCKS.find(x => x.ticker === ticker);
  if (!s) return;

  updateHeader(s);
  updateStats(s);

  document.querySelectorAll('.stock-item').forEach(el =>
    el.classList.toggle('active', el.dataset.ticker === ticker)
  );

  // If we were in LIVE mode, stay in LIVE mode for new ticker
  if (isLiveMode) {
    await startLiveMode(ticker);
  } else {
    // Reset to 1D
    selectedRange = '1D';
    document.querySelectorAll('.time-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.range === '1D')
    );
    await loadAndRenderChart(ticker, '1D');
  }

  renderNewsSection(ticker);
}

function updateHeader(s) {
  headerTicker.textContent = s.ticker;
  headerName.textContent   = s.name;
  headerMeta.textContent   = `${s.exchange} · USD`;
  headerPrice.textContent  = `$${s.price.toFixed(2)}`;
  const positive = s.changePct >= 0;
  headerChange.textContent = positive
    ? `+${s.change.toFixed(2)} (+${s.changePct.toFixed(2)}%)`
    : `${s.change.toFixed(2)} (${s.changePct.toFixed(2)}%)`;
  headerChange.className = 'header-change ' + (positive ? 'positive' : 'negative');
}

function updateStats(s) {
  statOpen.textContent   = `$${s.open}`;
  statHigh.textContent   = `$${s.high}`;
  statLow.textContent    = `$${s.low}`;
  statVol.textContent    = s.vol;
  statPe.textContent     = s.pe;
  statMktcap.textContent = s.mktCap;
  stat52h.textContent    = s.w52h;
  stat52l.textContent    = s.w52l;
  statAvgvol.textContent = s.avgVol;
  statYield.textContent  = s.yield;
  statBeta.textContent   = s.beta;
  statEps.textContent    = s.eps;
}

// ────────────────────────────────────────────────────────────
//  CHART LOADING (non-live)
// ────────────────────────────────────────────────────────────
async function loadAndRenderChart(ticker, range) {
  showChartLoading(true);
  let chartData = null;
  try { chartData = await window.loadRealChartData(ticker, range); } catch(e) {}
  if (!chartData || !chartData.data || chartData.data.length === 0) {
    chartData = CHART_DATA[ticker]?.[range];
  }
  if (chartData) renderChart(chartData.labels, chartData.data);
  showChartLoading(false);
}

// ────────────────────────────────────────────────────────────
//  MAIN CHART RENDER
// ────────────────────────────────────────────────────────────
function getChartColor() {
  const s = STOCKS.find(x => x.ticker === selectedTicker);
  return s && s.changePct < 0 ? '#ef5350' : '#4f8ef7';
}

function renderChart(labels, data) {
  const color = getChartColor();
  if (mainChart) {
    mainChart.data.labels = labels;
    mainChart.data.datasets[0].data              = data;
    mainChart.data.datasets[0].borderColor        = color;
    mainChart.data.datasets[0].pointHoverBorderColor = color;
    mainChart.data.datasets[0].backgroundColor   = makeGradient(color);
    mainChart.update('none');
    return;
  }
  const ctx = chartCanvas.getContext('2d');
  mainChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor:  color,
        borderWidth:  1.8,
        backgroundColor: makeGradient(color),
        fill:    true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400, easing: 'easeInOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false, external: externalTooltip }
      },
      scales: {
        x: {
          grid:   { display: false },
          border: { display: false },
          ticks:  { color: '#535868', font: { size: 10, family: "'Inter', sans-serif" }, maxTicksLimit: 10, maxRotation: 0 }
        },
        y: {
          position: 'right',
          grid:   { color: '#21242e', drawBorder: false },
          border: { display: false },
          ticks:  { color: '#535868', font: { size: 10, family: "'Inter', sans-serif" }, callback: v => '$' + Number(v).toFixed(2) }
        }
      },
      interaction: { mode: 'index', intersect: false }
    }
  });
  window.mainChart = mainChart; // expose for predict.js
}

function makeGradient(color) {
  const ctx  = chartCanvas.getContext('2d');
  const h    = chartCanvas.offsetHeight || 260;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0,   color + 'aa');
  grad.addColorStop(0.7, color + '22');
  grad.addColorStop(1,   color + '00');
  return grad;
}

function externalTooltip(context) {
  const { tooltip: tip } = context;
  if (tip.opacity === 0) { tooltip.classList.add('hidden'); return; }
  const pt = tip.dataPoints[0];
  tooltipTime.textContent  = pt.label;
  tooltipPrice.textContent = '$' + Number(pt.raw).toFixed(2);
  let left = tip.caretX + 12;
  let top  = tip.caretY - 20;
  if (left + 130 > chartCanvas.offsetWidth) left = tip.caretX - 140;
  if (top < 0) top = 4;
  tooltip.style.left = left + 'px';
  tooltip.style.top  = top + 'px';
  tooltip.classList.remove('hidden');
}

chartCanvas.addEventListener('mouseleave', () => tooltip.classList.add('hidden'));

// ────────────────────────────────────────────────────────────
//  TIME RANGE TABS
// ────────────────────────────────────────────────────────────
document.querySelectorAll('.time-tab').forEach(btn => {
  btn.addEventListener('click', async () => {
    document.querySelectorAll('.time-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedRange = btn.dataset.range;

    if (selectedRange === 'LIVE') {
      await startLiveMode(selectedTicker);
    } else {
      stopLiveMode();
      await loadAndRenderChart(selectedTicker, selectedRange);
    }
  });
});

// ────────────────────────────────────────────────────────────
//  NEWS
// ────────────────────────────────────────────────────────────
async function renderNewsSection(ticker) {
  const s = STOCKS.find(x => x.ticker === ticker);
  newsTitleEl.textContent = `${s ? s.name : ticker} News`;
  newsGridEl.innerHTML = '<div class="news-loading">Fetching latest news…</div>';
  let items = null;
  try { items = await window.loadRealNews(ticker); } catch(e) {}
  if (!items || items.length === 0) {
    items = (NEWS[ticker] || NEWS['AAPL']).map(n => ({ ...n }));
  }
  newsGridEl.innerHTML = items.map(n => `
    <div class="news-card" onclick="window.open('${n.url || '#'}','_blank')">
      <div class="news-source">${n.source}</div>
      <div class="news-headline">${n.headline}</div>
      <div class="news-excerpt">${n.excerpt}</div>
      <div class="news-meta">
        <span class="news-time">${n.time}</span>
        <span class="news-sentiment ${n.sentiment}">${sentimentLabel(n.sentiment)}</span>
      </div>
    </div>
  `).join('');
}

function sentimentLabel(s) {
  if (s === 'bullish') return '🟢 Bullish';
  if (s === 'bearish') return '🔴 Bearish';
  return '🟡 Neutral';
}

// ── Search ───────────────────────────────────────────────────
searchInput.addEventListener('input', e => buildStockList(e.target.value));

// ── Init ─────────────────────────────────────────────────────
async function init() {
  buildStockList();

  const s = STOCKS.find(x => x.ticker === selectedTicker);
  if (s) { updateHeader(s); updateStats(s); }

  renderChart(CHART_DATA['AAPL']['1D'].labels, CHART_DATA['AAPL']['1D'].data);
  renderNewsSection('AAPL');

  // Start WebSocket live streaming
  window.startWebSocket(STOCKS.map(x => x.ticker));

  // Fetch live quotes in background
  console.info('🔄 Fetching live quotes from Finnhub…');
  window.refreshAllQuotes().then(() => console.info('✅ Live quotes loaded'));

  // Load real chart for initial stock
  loadAndRenderChart('AAPL', '1D');
}

if (typeof Chart !== 'undefined') { init(); }
else { window.addEventListener('load', init); }

// ══════════════════════════════════════════════════════════════
//  VIEW SWITCHER  (Home ↔ Portfolio)
// ══════════════════════════════════════════════════════════════

const PORTFOLIO_IDS = ['stock-header','time-tabs','chart-wrapper','stats-grid','.see-more-link','news-section'];

function showView(view) {
  const homePage   = document.getElementById('home-page');
  const navHome    = document.getElementById('nav-home');
  const navPortfolio = document.getElementById('nav-portfolio');

  // Collect portfolio elements by ID or class
  const portfolioEls = [
    document.getElementById('stock-header'),
    document.getElementById('time-tabs'),
    document.getElementById('chart-wrapper'),
    document.getElementById('stats-grid'),
    document.querySelector('.see-more-link'),
    document.getElementById('news-section'),
  ].filter(Boolean);

  if (view === 'home') {
    portfolioEls.forEach(el => el.style.display = 'none');
    homePage.classList.add('visible');
    navHome.classList.add('active');
    navPortfolio.classList.remove('active');
    populateHomePage();
  } else {
    portfolioEls.forEach(el => el.style.display = '');
    homePage.classList.remove('visible');
    navPortfolio.classList.add('active');
    navHome.classList.remove('active');
  }
}

// ── Avatar dropdown ──────────────────────────────────────────
function toggleAvatarDropdown() {
  const dd = document.getElementById('avatar-dropdown');
  dd.classList.toggle('open');
}
// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const wrap = document.getElementById('user-avatar-wrap');
  if (wrap && !wrap.contains(e.target)) {
    const dd = document.getElementById('avatar-dropdown');
    if (dd) dd.classList.remove('open');
  }
});

// ── Edit name dialog ─────────────────────────────────────────
function openNameDialog() {
  const current = localStorage.getItem('mp_username') || 'Rayyan Sheikh';
  const name = window.prompt('Enter your account name:', current);
  if (name && name.trim()) {
    const trimmed = name.trim();
    localStorage.setItem('mp_username', trimmed);
    applyUsername(trimmed);
  }
}

function applyUsername(name) {
  const firstLetter = name.charAt(0).toUpperCase();
  const firstName   = name.split(' ')[0];

  // Avatar circle
  const avatarEl = document.getElementById('user-avatar');
  if (avatarEl) avatarEl.textContent = firstLetter;

  // Dropdown name
  const nameEl = document.getElementById('avatar-name');
  if (nameEl) nameEl.textContent = name;

  // Home greeting
  const greetEl = document.getElementById('home-greeting-name');
  if (greetEl) greetEl.textContent = firstName;
}

// ── Populate home page ────────────────────────────────────────
function populateHomePage() {
  // Date
  const dateEl = document.getElementById('home-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  }

  // Gainers / Losers from live stock data
  const stocks = window.STOCKS || [];
  const sorted = [...stocks].sort((a, b) => (b.chgPct || 0) - (a.chgPct || 0));
  const gainers = sorted.filter(s => (s.chgPct || 0) > 0).slice(0, 5);
  const losers  = sorted.filter(s => (s.chgPct || 0) < 0).slice(0, 5);

  document.getElementById('home-gainers-count').textContent = gainers.length || '—';
  document.getElementById('home-losers-count').textContent  = losers.length  || '—';

  renderMovers('home-gainers', gainers, true);
  renderMovers('home-losers',  losers,  false);
}

function renderMovers(containerId, stocks, isGainer) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!stocks.length) {
    el.innerHTML = '<div style="padding:16px;font-size:12px;color:#535868;text-align:center">No data yet — prices updating…</div>';
    return;
  }
  el.innerHTML = stocks.map(s => {
    const pct = (s.chgPct || 0).toFixed(2);
    const price = s.price ? '$' + s.price.toFixed(2) : '—';
    const cls = isGainer ? 'pos' : 'neg';
    const arrow = isGainer ? '▲' : '▼';
    return `
      <div class="mover-row" onclick="showView('portfolio');selectStock('${s.ticker}')">
        <div>
          <div class="mover-sym">${s.ticker}</div>
          <div class="mover-name">${s.name}</div>
        </div>
        <div class="mover-right">
          <div class="mover-price">${price}</div>
          <div class="mover-pct ${cls}">${arrow} ${Math.abs(pct)}%</div>
        </div>
      </div>`;
  }).join('');
}

// ── Init username from localStorage ──────────────────────────
(function initUsername() {
  const stored = localStorage.getItem('mp_username') || 'Rayyan Sheikh';
  applyUsername(stored);
})();
