// FlipChecker — Popup Script (Neo-Brutalism UI)

const API_BASE_URL = 'https://flipchecker.io';
const EBAY_FEE_MULTIPLIER = 0.87; // 13% eBay + PayPal fees

// ── DOM refs ──
const els = {};

// ── State ──
let authToken = null;
let ebayUrl = null;
let currentTitle = null;
let currentPrice = null;

// ── Init ──
document.addEventListener('DOMContentLoaded', init);

async function init() {
  cacheDomRefs();
  setupEventListeners();
  await loadAuth();

  const tab = await getActiveTab();
  const onListing = isMarketplaceUrl(tab?.url);

  setStatusBadge(onListing);

  if (onListing) {
    await populateListing(tab);
  } else {
    showEmpty();
  }
}

function cacheDomRefs() {
  els.badge = document.getElementById('status-badge');
  els.detected = document.getElementById('item-detected');
  els.cta = document.getElementById('cta-section');
  els.empty = document.getElementById('empty-state');
  els.itemName = document.getElementById('item-name');
  els.ebayAvg = document.getElementById('ebay-avg');
  els.demand = document.getElementById('demand-indicator');
  els.profitCol = document.getElementById('profit-col');
  els.estProfit = document.getElementById('est-profit');
  els.priceGrid = document.getElementById('price-grid');
  els.listedPrice = document.getElementById('listed-price');
  els.soldCount = document.getElementById('sold-count');
  els.btnEbay = document.getElementById('btn-view-ebay');
  els.btnSave = document.getElementById('btn-save-deal');
  els.linkDeals = document.getElementById('link-deals');
  els.linkSettings = document.getElementById('link-settings');
}

// ── Auth ──
function loadAuth() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'getAuthToken' }, (res) => {
      if (chrome.runtime.lastError) {
        resolve();
        return;
      }
      if (res) {
        authToken = res.token;
      }
      resolve();
    });
  });
}

// ── Tab helpers ──
function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs?.[0] || null);
    });
  });
}

function isMarketplaceUrl(url) {
  if (!url) return false;
  return /facebook\.com\/marketplace\/item\//.test(url);
}

// ── Status badge ──
function setStatusBadge(active) {
  if (active) {
    els.badge.className = 'status-badge active';
    els.badge.innerHTML = '&#9679; LIVE';
  } else {
    els.badge.className = 'status-badge inactive';
    els.badge.innerHTML = '&#9675; INACTIVE';
  }
}

// ── Populate listing data ──
async function populateListing(tab) {
  // Parse item title from the browser tab title
  // FB tab titles typically look like: "Item Name - price | Facebook"
  const tabTitle = tab?.title || '';
  const title = parseTabTitle(tabTitle);

  // Read eBay sold data from storage (populated by ebay-reader or API cache)
  const storage = await getStorage(['flipchecker_last_sold']);
  const sold = storage.flipchecker_last_sold;

  // Determine best title: tab title or sold query
  currentTitle = title || sold?.query || 'Unknown Item';
  els.itemName.textContent = currentTitle;

  if (sold?.stats) {
    const avg = sold.stats.avg;
    const count = sold.stats.count || 0;

    // eBay avg
    els.ebayAvg.textContent = avg ? `$${Math.round(avg)}` : '—';

    // Demand indicator
    if (count >= 10) {
      els.demand.textContent = '\u2191 HIGH DEMAND';
    } else if (count >= 5) {
      els.demand.textContent = '\u2192 MODERATE';
    } else if (count > 0) {
      els.demand.textContent = '\u2193 LOW DEMAND';
    }

    // Sold count
    if (count > 0) {
      els.soldCount.textContent = `${count} SOLD RECENTLY`;
    }

    // Try to get FB listing price from tab title
    currentPrice = parsePriceFromTitle(tabTitle);
    if (currentPrice && avg) {
      // Show listed price
      els.listedPrice.textContent = `LISTED AT $${currentPrice.toLocaleString()}`;

      // Calculate and show profit
      const profit = Math.round((avg * EBAY_FEE_MULTIPLIER) - currentPrice);
      els.profitCol.style.display = '';
      els.estProfit.textContent = `${profit >= 0 ? '+' : ''}$${profit}`;
      els.priceGrid.classList.remove('single-col');
    } else {
      // No FB price — single column layout
      els.profitCol.style.display = 'none';
      els.priceGrid.classList.add('single-col');
    }

    // Store eBay URL for the CTA button
    ebayUrl = sold.url || buildEbaySearchUrl(currentTitle);
  } else {
    // No eBay data available yet
    els.ebayAvg.textContent = '—';
    els.demand.textContent = '';
    els.priceGrid.classList.add('single-col');
    els.profitCol.style.display = 'none';
    ebayUrl = buildEbaySearchUrl(currentTitle);
  }

  showDetected();
}

// ── Show / hide states ──
function showDetected() {
  els.detected.classList.add('visible');
  els.cta.classList.add('visible');
  els.empty.classList.remove('visible');
}

function showEmpty() {
  els.empty.classList.add('visible');
  els.detected.classList.remove('visible');
  els.cta.classList.remove('visible');
}

// ── Event listeners ──
function setupEventListeners() {
  els.btnEbay.addEventListener('click', () => {
    if (ebayUrl) {
      chrome.tabs.create({ url: ebayUrl });
    }
  });

  els.btnSave.addEventListener('click', handleSaveDeal);

  els.linkDeals.addEventListener('click', () => {
    chrome.tabs.create({ url: `${API_BASE_URL}/dashboard` });
  });

  els.linkSettings.addEventListener('click', () => {
    chrome.tabs.create({ url: `${API_BASE_URL}/dashboard/settings` });
  });
}

// ── Save deal ──
async function handleSaveDeal() {
  if (!currentTitle) return;

  const tab = await getActiveTab();
  const sourceUrl = tab?.url || '';

  // Disable button immediately
  els.btnSave.textContent = 'SAVING...';
  els.btnSave.disabled = true;

  if (authToken) {
    // Save via API through background proxy
    chrome.runtime.sendMessage({
      type: 'apiRequest',
      url: `${API_BASE_URL}/api/deals`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: {
        source_url: sourceUrl,
        user_title: currentTitle,
        user_asking_price: currentPrice || 0,
        ebay_search_url: ebayUrl || ''
      }
    }, (response) => {
      if (response?.ok) {
        markSaved();
      } else {
        // Fallback to local
        saveLocally(sourceUrl);
      }
    });
  } else {
    saveLocally(sourceUrl);
  }
}

function saveLocally(sourceUrl) {
  const deal = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    title: currentTitle || 'Unknown Item',
    price: currentPrice,
    url: sourceUrl,
    ebayUrl: ebayUrl,
    savedAt: new Date().toISOString()
  };

  chrome.storage.local.get(['savedDeals'], (result) => {
    const deals = result.savedDeals || [];
    deals.unshift(deal);
    if (deals.length > 100) deals.pop();
    chrome.storage.local.set({ savedDeals: deals }, () => {
      markSaved();
    });
  });
}

function markSaved() {
  els.btnSave.textContent = '\u2713 DEAL SAVED';
  els.btnSave.classList.add('saved');
  els.btnSave.disabled = true;
}

// ── Utilities ──
function getStorage(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => resolve(result || {}));
  });
}

function parseTabTitle(title) {
  if (!title) return '';
  // Strip common FB suffixes: " | Facebook", " | Marketplace", " - Facebook Marketplace"
  return title
    .replace(/\s*[\|\-]\s*(Facebook|Marketplace).*$/i, '')
    .trim();
}

function parsePriceFromTitle(title) {
  if (!title) return null;
  // Look for dollar amounts like "$200" or "$1,500"
  const match = title.match(/\$[\d,]+/);
  if (match) {
    const num = Number(match[0].replace(/[$,]/g, ''));
    return num > 0 ? num : null;
  }
  return null;
}

function buildEbaySearchUrl(query) {
  if (!query) return '';
  const encoded = encodeURIComponent(query);
  return `https://www.ebay.com/sch/i.html?_nkw=${encoded}&LH_Complete=1&LH_Sold=1`;
}
