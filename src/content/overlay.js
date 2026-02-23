// FlipChecker Overlay UI
// Renders the flip analysis overlay with Shadow DOM isolation

import { OVERLAY_ID, TRIGGER_BUTTON_ID, EBAY_FEE_MULTIPLIER } from './config.js';
import { getCurrentUser } from './state.js';
import { formatPrice, getEbayUrl, calculateProfit, getProfitClass } from './utils/pricing.js';
import { escapeHtml, sanitizeUrl } from './utils/dom.js';
import { isSuspiciousListing } from './utils/filters.js';
import { saveDealToApi, getStoredSoldData } from './api.js';
import { isLoggedIn, openLogin, openUpgrade } from './auth.js';
import { getItemId, extractImageUrl } from './scraper.js';

/**
 * Get the overlay styles (embedded in Shadow DOM)
 * Neo-Brutalism design system
 * @returns {string} - CSS styles
 */
function getOverlayStyles() {
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Space+Grotesk:wght@400;500;600;700&display=swap');

      * {
        box-sizing: border-box;
        font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .container {
        background: #F8F4E8;
        color: #09090B;
        padding: 0;
        width: 310px;
        border: 2px solid #09090B;
        box-shadow: 4px 4px 0px #09090B;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 2px solid #09090B;
        background: #09090B;
      }
      .logo {
        font-family: 'Dela Gothic One', cursive;
        font-weight: 400;
        font-size: 14px;
        color: #D2E823;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .tier-badge {
        font-size: 9px;
        padding: 2px 6px;
        background: #D2E823;
        color: #09090B;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border: 1px solid #09090B;
      }
      .tier-flipper { background: #D2E823; color: #09090B; }
      .tier-pro { background: #D2E823; color: #09090B; }
      .close-btn {
        background: none;
        border: none;
        color: #ffffff50;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        line-height: 1;
      }
      .close-btn:hover { color: #fff; }
      .price-section {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-bottom: 2px solid #09090B;
      }
      .listing-image {
        width: 64px;
        height: 64px;
        object-fit: cover;
        border: 2px solid #09090B;
        flex-shrink: 0;
      }
      .price-info {
        flex: 1;
        min-width: 0;
        text-align: center;
      }
      .current-price {
        font-family: 'Dela Gothic One', cursive;
        font-size: 32px;
        font-weight: 400;
        color: #09090B;
      }
      .title {
        font-size: 12px;
        color: #09090B99;
        margin-top: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .alert-match {
        background: #D2E82340;
        color: #09090B;
        padding: 8px 16px;
        font-size: 12px;
        font-weight: 700;
        border-bottom: 2px solid #09090B;
        text-align: center;
        border-left: 4px solid #D2E823;
      }
      .alert-match-icon {
        margin-right: 4px;
      }
      .warning {
        background: #fef2f2;
        color: #dc2626;
        padding: 8px 16px;
        font-size: 12px;
        font-weight: 600;
        border-bottom: 2px solid #09090B;
        text-align: center;
      }
      .login-prompt {
        background: #fff;
        color: #09090B;
        padding: 12px 16px;
        font-size: 12px;
        border-bottom: 2px solid #09090B;
        text-align: center;
      }
      .login-btn {
        background: #09090B;
        color: #D2E823;
        border: 2px solid #09090B;
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: transform 0.1s, box-shadow 0.1s;
        box-shadow: 2px 2px 0px #09090B;
      }
      .login-btn:hover {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0px #09090B;
      }
      .upgrade-prompt {
        background: #fff;
        color: #09090B;
        padding: 12px 16px;
        font-size: 12px;
        border-bottom: 2px solid #09090B;
        text-align: center;
      }
      .upgrade-btn {
        background: #D2E823;
        color: #09090B;
        border: 2px solid #09090B;
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: transform 0.1s, box-shadow 0.1s;
        box-shadow: 2px 2px 0px #09090B;
      }
      .upgrade-btn:hover {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0px #09090B;
      }
      .ebay-section {
        background: #fff;
        padding: 12px 16px;
        border-bottom: 2px solid #09090B;
      }
      .ebay-label {
        font-size: 10px;
        color: #09090B80;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .ebay-range {
        font-family: 'Dela Gothic One', cursive;
        font-size: 18px;
        font-weight: 400;
        color: #09090B;
      }
      .source-tag {
        font-size: 10px;
        color: #09090B60;
        margin-top: 4px;
        font-weight: 600;
      }
      .profit-section {
        background: #fff;
        padding: 12px 16px;
        border-bottom: 2px solid #09090B;
      }
      .profit-label {
        font-size: 10px;
        color: #09090B80;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .profit-range {
        font-family: 'Dela Gothic One', cursive;
        font-size: 18px;
        font-weight: 400;
      }
      .profit-positive { color: #16a34a; }
      .profit-negative { color: #dc2626; }
      .profit-mixed { color: #ca8a04; }
      .meta {
        font-size: 11px;
        color: #09090B80;
        padding: 8px 16px;
        border-bottom: 2px solid #09090B;
      }
      .meta-item { margin-bottom: 2px; font-weight: 500; }
      .buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 16px;
      }
      .btn {
        padding: 10px 16px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        text-align: center;
        text-decoration: none;
        display: block;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border: 2px solid #09090B;
        transition: transform 0.1s, box-shadow 0.1s;
        box-shadow: 2px 2px 0px #09090B;
      }
      .btn:hover {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0px #09090B;
      }
      .btn-primary {
        background: #09090B;
        color: #D2E823;
      }
      .btn-secondary {
        background: #fff;
        color: #09090B;
      }
      .btn-success {
        background: #D2E823;
        color: #09090B;
      }
      .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .saved-msg {
        text-align: center;
        font-size: 12px;
        font-weight: 700;
        padding: 0 16px;
        display: none;
      }
      .saved-msg.success { color: #16a34a; }
      .saved-msg.local { color: #ca8a04; }
      .saved-msg.error { color: #dc2626; }
      .footer {
        padding: 8px 16px;
        border-top: 2px solid #09090B;
        font-size: 10px;
        color: #09090B60;
        text-align: center;
        font-weight: 600;
      }
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        color: #09090B80;
        font-weight: 600;
      }
      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #09090B20;
        border-top-color: #D2E823;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 8px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .samples {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 2px solid #09090B20;
      }
      .sample-item {
        font-size: 11px;
        color: #09090B80;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
        font-weight: 500;
      }
      .sample-price { color: #09090B; font-weight: 700; }
      .ebay-section.real-data {
        background: #D2E82320;
        border-left: 4px solid #D2E823;
      }
      .real-badge {
        background: #D2E823;
        color: #09090B;
        padding: 2px 6px;
        font-size: 9px;
        font-weight: 700;
        margin-right: 4px;
        border: 1px solid #09090B;
      }
      .ebay-stats-row {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #09090B80;
        margin-top: 4px;
        font-weight: 600;
      }
      .get-real-data {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 2px solid #09090B20;
        font-size: 11px;
        color: #09090B80;
        text-align: center;
        font-weight: 600;
      }
    </style>
  `;
}

/**
 * Get tier badge HTML based on user tier
 * @returns {string}
 */
function getTierBadge() {
  const currentUser = getCurrentUser();
  if (!currentUser) return '';

  const tier = currentUser.tier || 'free';
  if (tier === 'flipper') {
    return '<span class="tier-badge tier-flipper">Flipper</span>';
  } else if (tier === 'pro') {
    return '<span class="tier-badge tier-pro">Pro</span>';
  }
  return '<span class="tier-badge">Free</span>';
}

/**
 * Create and display the main overlay
 * @param {object} data - Listing data (title, price, location, etc.)
 * @param {object} priceData - eBay price lookup data (or null)
 */
export async function createOverlay(data, priceData = null, alertMatches = []) {
  // Verify we're still on the same item before showing overlay
  const currentItemId = getItemId();
  if (data.itemId && data.itemId !== currentItemId) {
    console.log('[FlipChecker] Data item ID mismatch, aborting overlay. Expected:', data.itemId, 'Current:', currentItemId);
    return;
  }

  // Remove existing overlay
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  const shadow = overlay.attachShadow({ mode: 'open' });

  const hasApiData = priceData && !priceData.error;
  const loggedIn = isLoggedIn();
  const needsUpgrade = priceData?.error === 'limit_reached';

  // Determine if API returned actual price data (not just a successful empty response)
  const hasEbayPrices = hasApiData && priceData.ebay_low != null && priceData.ebay_high != null;

  // Calculate profit
  let profitLow = null;
  let profitHigh = null;
  let profitClass = 'profit-positive';

  if (hasEbayPrices && data.price) {
    const profit = calculateProfit(data.price, priceData.ebay_low, priceData.ebay_high);
    profitLow = profit.low;
    profitHigh = profit.high;
    profitClass = getProfitClass(profitLow, profitHigh);
  }

  // Check for suspicious listing
  const suspicious = isSuspiciousListing(data.price, data.title);

  const ebayUrl = priceData?.ebay_url || getEbayUrl(data.title);
  const tierBadge = getTierBadge();

  // Prefer GraphQL image (keyed by itemId), then data.imageUrl, then DOM fallback
  const graphqlImage = data.images && data.images[0];
  const imageUrl = graphqlImage || data.imageUrl || extractImageUrl() || null;

  // Build HTML
  let html = `
    ${getOverlayStyles()}
    <div class="container">
      <div class="header">
        <span class="logo">FLIPCHECKER ${tierBadge}</span>
        <button class="close-btn" id="close-overlay">&times;</button>
      </div>

      <div class="price-section">
        ${imageUrl ? `<img class="listing-image" src="${sanitizeUrl(imageUrl)}" alt="" />` : ''}
        <div class="price-info">
          <div class="current-price">${formatPrice(data.price)}</div>
          <div class="title" title="${escapeHtml(data.title || '')}">${escapeHtml(data.title) || 'Unknown Item'}</div>
        </div>
      </div>

      ${alertMatches.length > 0 ? alertMatches.map(a =>
        `<div class="alert-match"><span class="alert-match-icon">🔔</span> ALERT MATCH: ${escapeHtml(a.search_query)}${a.max_price ? ` — under $${a.max_price}` : ''}!</div>`
      ).join('') : ''}
      ${suspicious ? '<div class="warning">Warning: Price seems suspiciously low</div>' : ''}
  `;

  // Login prompt
  if (!loggedIn) {
    html += `
      <div class="login-prompt">
        <div style="font-weight: 700;">Sign in for real eBay price data</div>
        <button class="login-btn" id="login-btn">Sign In Free</button>
      </div>
    `;
  }

  // Upgrade prompt
  if (needsUpgrade) {
    html += `
      <div class="upgrade-prompt">
        <div style="font-weight: 700;">Daily lookup limit reached</div>
        <button class="upgrade-btn" id="upgrade-btn">Upgrade for More</button>
      </div>
    `;
  }

  // Check for real sold data from eBay page reader
  const soldData = await getStoredSoldData(data.title);
  const hasRealSoldData = soldData && soldData.stats && soldData.stats.count > 0;

  // eBay price section
  if (hasRealSoldData) {
    // Show REAL sold data from eBay page reader
    const stats = soldData.stats;

    // Recalculate profit with real sold data
    if (data.price) {
      const profit = calculateProfit(data.price, stats.low, stats.high);
      profitLow = profit.low;
      profitHigh = profit.high;
      profitClass = getProfitClass(profitLow, profitHigh);
    }

    html += `
      <div class="ebay-section real-data">
        <div class="ebay-label">
          <span class="real-badge">REAL</span> eBay Sold Prices
        </div>
        <div class="ebay-range">${formatPrice(stats.low)} - ${formatPrice(stats.high)}</div>
        <div class="ebay-stats-row">
          <span>Median: ${formatPrice(stats.median)}</span>
          <span>Avg: ${formatPrice(stats.avg)}</span>
        </div>
        <div class="source-tag">${stats.count} sold listings analyzed</div>
        ${soldData.samples && soldData.samples.length > 0 ? `
          <div class="samples">
            ${soldData.samples.slice(0, 3).map(s => `
              <div class="sample-item">
                <span>${escapeHtml(s.title.substring(0, 25))}...</span>
                <span class="sample-price">$${Number(s.price) || 0}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    // Profit section with real data
    if (profitLow !== null) {
      const roiLow = data.price ? Math.round((profitLow / data.price) * 100) : null;
      const roiHigh = data.price ? Math.round((profitHigh / data.price) * 100) : null;
      html += `
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${profitClass}">
            ${profitLow >= 0 ? '+' : ''}$${profitLow} to ${profitHigh >= 0 ? '+' : ''}$${profitHigh}
          </div>
          ${roiLow !== null ? `<div class="source-tag">ROI: ${roiLow}% – ${roiHigh}%</div>` : ''}
        </div>
      `;
    }
  } else if (hasApiData && hasEbayPrices) {
    // Show API estimate data with actual prices
    const sourceLabels = {
      estimate: 'Basic estimate',
      ebay_active: 'eBay active listings',
      ebay_sold: 'eBay sold data'
    };
    const sourceLabel = sourceLabels[priceData.source] || priceData.source;

    html += `
      <div class="ebay-section">
        <div class="ebay-label">Est. eBay Value</div>
        <div class="ebay-range">${formatPrice(priceData.ebay_low)} - ${formatPrice(priceData.ebay_high)}</div>
        <div class="source-tag">Source: ${escapeHtml(sourceLabel)}</div>
        ${priceData.samples && priceData.samples.length > 0 ? `
          <div class="samples">
            ${priceData.samples.slice(0, 3).map(s => `
              <div class="sample-item">
                <span>${escapeHtml(s.title.substring(0, 30))}...</span>
                <span class="sample-price">$${Number(s.price) || 0}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <div class="get-real-data">
          Click "Check eBay Sold Prices" below for real prices
        </div>
      </div>
    `;

    // Profit section
    if (profitLow !== null) {
      const roiLow = data.price ? Math.round((profitLow / data.price) * 100) : null;
      const roiHigh = data.price ? Math.round((profitHigh / data.price) * 100) : null;
      html += `
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${profitClass}">
            ${profitLow >= 0 ? '+' : ''}$${profitLow} to ${profitHigh >= 0 ? '+' : ''}$${profitHigh}
          </div>
          ${roiLow !== null ? `<div class="source-tag">ROI: ${roiLow}% – ${roiHigh}%</div>` : ''}
        </div>
      `;
    }
  } else if (hasApiData && !hasEbayPrices) {
    // API returned successfully but no eBay listings found
    html += `
      <div class="ebay-section">
        <div class="ebay-label">Est. eBay Value</div>
        <div class="ebay-range" style="font-size: 14px; color: #09090B80;">No eBay data found</div>
        <div class="source-tag">Try searching eBay manually below</div>
      </div>
    `;
  } else if (!loggedIn || needsUpgrade) {
    // Show basic estimate for non-logged-in users
    const basicLow = data.price ? Math.round(data.price * 0.7) : null;
    const basicHigh = data.price ? Math.round(data.price * 1.5) : null;
    if (basicLow && basicHigh) {
      html += `
        <div class="ebay-section">
          <div class="ebay-label">Est. eBay Value (rough)</div>
          <div class="ebay-range">${formatPrice(basicLow)} - ${formatPrice(basicHigh)}</div>
          <div class="source-tag">Sign in for better data</div>
        </div>
      `;
    }
  }

  // Meta info
  html += `
    <div class="meta">
      ${data.location ? `<div class="meta-item">Location: ${escapeHtml(data.location)}</div>` : ''}
      ${data.seller ? `<div class="meta-item">Seller: ${escapeHtml(data.seller)}</div>` : ''}
      ${data.daysListed ? `<div class="meta-item">${escapeHtml(data.daysListed)}</div>` : ''}
    </div>

    <div class="buttons">
      ${ebayUrl ? `<a href="${sanitizeUrl(ebayUrl)}" target="_blank" rel="noopener" class="btn btn-primary">Check eBay Sold Prices</a>` : ''}
      <button class="btn btn-success" id="save-deal">Save Deal</button>
    </div>

    <div class="saved-msg" id="saved-msg"></div>
  `;

  // Footer with usage
  if (priceData?.usage) {
    html += `
      <div class="footer">
        ${priceData.usage.used}/${priceData.usage.limit} lookups used today
      </div>
    `;
  }

  // eBay attribution footer
  html += `
    <div class="footer">
      Pricing data powered by eBay. eBay and the eBay logo are trademarks of eBay Inc.
    </div>
  `;

  html += `</div>`;

  shadow.innerHTML = html;

  // Event listeners
  shadow.getElementById('close-overlay').addEventListener('click', () => {
    overlay.remove();
  });

  const loginBtn = shadow.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      openLogin();
    });
  }

  const upgradeBtn = shadow.getElementById('upgrade-btn');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => {
      openUpgrade();
    });
  }

  shadow.getElementById('save-deal').addEventListener('click', async () => {
    const saveBtn = shadow.getElementById('save-deal');
    const msg = shadow.getElementById('saved-msg');

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const result = await saveDealToApi(data, priceData);

    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Deal';

    if (result.success && !result.local) {
      msg.textContent = 'Deal saved!';
      msg.className = 'saved-msg success';
    } else if (result.success && result.local) {
      msg.textContent = 'Saved locally (sign in to sync)';
      msg.className = 'saved-msg local';
    } else {
      msg.textContent = result.error || 'Failed to save';
      msg.className = 'saved-msg error';
    }
    msg.style.display = 'block';

    setTimeout(() => {
      msg.style.display = 'none';
    }, 3000);
  });

  document.body.appendChild(overlay);
}

/**
 * Create loading overlay while fetching data
 * @param {object} data - Partial listing data
 */
export function createLoadingOverlay(data) {
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  const shadow = overlay.attachShadow({ mode: 'open' });

  shadow.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Space+Grotesk:wght@400;500;600;700&display=swap');

      * {
        box-sizing: border-box;
        font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .container {
        background: #F8F4E8;
        color: #09090B;
        padding: 0;
        width: 310px;
        border: 2px solid #09090B;
        box-shadow: 4px 4px 0px #09090B;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 2px solid #09090B;
        background: #09090B;
      }
      .logo {
        font-family: 'Dela Gothic One', cursive;
        font-weight: 400;
        font-size: 14px;
        color: #D2E823;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: #09090B80;
        font-weight: 600;
      }
      .spinner {
        width: 24px;
        height: 24px;
        border: 2px solid #09090B20;
        border-top-color: #D2E823;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 12px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
    <div class="container">
      <div class="header">
        <span class="logo">FLIPCHECKER</span>
      </div>
      <div class="loading">
        <div class="spinner"></div>
        <span>Fetching prices...</span>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  return overlay;
}

/**
 * Show the trigger button that initiates the overlay
 * @param {Function} onClick - Callback when button is clicked
 */
export function showTriggerButton(onClick) {
  console.log('[FlipChecker] showTriggerButton called for URL:', window.location.href);

  // Always remove existing overlay when showing button for a new item
  const existingOverlay = document.getElementById(OVERLAY_ID);
  if (existingOverlay) {
    console.log('[FlipChecker] Removing old overlay');
    existingOverlay.remove();
  }

  const existingBtn = document.getElementById(TRIGGER_BUTTON_ID);
  if (existingBtn) {
    console.log('[FlipChecker] Removing old button');
    existingBtn.remove();
  }

  const btn = document.createElement('button');
  btn.id = TRIGGER_BUTTON_ID;
  btn.innerHTML = '💰 CHECK FLIP';
  btn.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 2147483646;
    background: #D2E823;
    color: #09090B;
    border: 2px solid #09090B;
    padding: 10px 18px;
    font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 3px 3px 0px #09090B;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: transform 0.1s, box-shadow 0.1s;
  `;

  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'translate(1px, 1px)';
    btn.style.boxShadow = '2px 2px 0px #09090B';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translate(0, 0)';
    btn.style.boxShadow = '3px 3px 0px #09090B';
  });

  btn.addEventListener('click', () => {
    btn.remove();
    onClick();
  });

  document.body.appendChild(btn);
  console.log('[FlipChecker] Button added to page');
}
