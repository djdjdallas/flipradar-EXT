// FlipRadar Overlay UI
// Renders the flip analysis overlay with Shadow DOM isolation

import { OVERLAY_ID, TRIGGER_BUTTON_ID, EBAY_FEE_MULTIPLIER } from './config.js';
import { getCurrentUser } from './state.js';
import { formatPrice, getEbayUrl, calculateProfit, getProfitClass } from './utils/pricing.js';
import { escapeHtml, sanitizeUrl } from './utils/dom.js';
import { isSuspiciousListing } from './utils/filters.js';
import { saveDealToApi, getStoredSoldData } from './api.js';
import { isLoggedIn, openLogin, openUpgrade } from './auth.js';
import { getItemId } from './scraper.js';

/**
 * Get the overlay styles (embedded in Shadow DOM)
 * @returns {string} - CSS styles
 */
function getOverlayStyles() {
  return `
    <style>
      * {
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .container {
        background: #1a1a2e;
        color: #ffffff;
        padding: 16px;
        border-radius: 12px;
        width: 300px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        border: 1px solid #2d2d44;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #2d2d44;
      }
      .logo {
        font-weight: 700;
        font-size: 14px;
        color: #4ade80;
      }
      .tier-badge {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        background: #374151;
        color: #9ca3af;
      }
      .tier-flipper { background: #1e40af; color: #93c5fd; }
      .tier-pro { background: #7c3aed; color: #c4b5fd; }
      .close-btn {
        background: none;
        border: none;
        color: #888;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        line-height: 1;
      }
      .close-btn:hover { color: #fff; }
      .price-section {
        text-align: center;
        margin-bottom: 12px;
      }
      .current-price {
        font-size: 32px;
        font-weight: 700;
        color: #fff;
      }
      .title {
        font-size: 12px;
        color: #888;
        margin-top: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .warning {
        background: #7f1d1d;
        color: #fca5a5;
        padding: 8px;
        border-radius: 6px;
        font-size: 12px;
        margin-bottom: 12px;
        text-align: center;
      }
      .login-prompt {
        background: #1e3a5f;
        color: #93c5fd;
        padding: 12px;
        border-radius: 8px;
        font-size: 12px;
        margin-bottom: 12px;
        text-align: center;
      }
      .login-btn {
        background: #3b82f6;
        color: #fff;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 8px;
      }
      .login-btn:hover { background: #2563eb; }
      .upgrade-prompt {
        background: #3d1f5c;
        color: #c4b5fd;
        padding: 12px;
        border-radius: 8px;
        font-size: 12px;
        margin-bottom: 12px;
        text-align: center;
      }
      .upgrade-btn {
        background: #7c3aed;
        color: #fff;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 8px;
      }
      .upgrade-btn:hover { background: #6d28d9; }
      .ebay-section {
        background: #16213e;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
      }
      .ebay-label {
        font-size: 11px;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .ebay-range {
        font-size: 18px;
        font-weight: 600;
        color: #4ade80;
      }
      .source-tag {
        font-size: 10px;
        color: #666;
        margin-top: 4px;
      }
      .profit-section {
        background: #16213e;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
      }
      .profit-label {
        font-size: 11px;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .profit-range {
        font-size: 18px;
        font-weight: 600;
      }
      .profit-positive { color: #4ade80; }
      .profit-negative { color: #f87171; }
      .profit-mixed { color: #fbbf24; }
      .meta {
        font-size: 11px;
        color: #666;
        margin-bottom: 12px;
      }
      .meta-item { margin-bottom: 2px; }
      .buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .btn {
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        text-align: center;
        text-decoration: none;
        display: block;
      }
      .btn-primary { background: #3b82f6; color: #fff; }
      .btn-primary:hover { background: #2563eb; }
      .btn-secondary { background: #374151; color: #fff; }
      .btn-secondary:hover { background: #4b5563; }
      .btn-success { background: #16a34a; color: #fff; }
      .btn-success:hover { background: #15803d; }
      .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .saved-msg {
        text-align: center;
        font-size: 12px;
        margin-top: 8px;
        display: none;
      }
      .saved-msg.success { color: #4ade80; }
      .saved-msg.error { color: #f87171; }
      .footer {
        margin-top: 12px;
        padding-top: 8px;
        border-top: 1px solid #2d2d44;
        font-size: 10px;
        color: #666;
        text-align: center;
      }
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        color: #888;
      }
      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #374151;
        border-top-color: #4ade80;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 8px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .samples {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #2d2d44;
      }
      .sample-item {
        font-size: 11px;
        color: #888;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
      }
      .sample-price { color: #4ade80; }
      .ebay-section.real-data {
        background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
        border: 1px solid #10b981;
      }
      .real-badge {
        background: #10b981;
        color: #fff;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 700;
        margin-right: 4px;
      }
      .ebay-stats-row {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #a7f3d0;
        margin-top: 4px;
      }
      .get-real-data {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #2d2d44;
        font-size: 11px;
        color: #fbbf24;
        text-align: center;
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
export async function createOverlay(data, priceData = null) {
  // Verify we're still on the same item before showing overlay
  const currentItemId = getItemId();
  if (data.itemId && data.itemId !== currentItemId) {
    console.log('[FlipRadar] Data item ID mismatch, aborting overlay. Expected:', data.itemId, 'Current:', currentItemId);
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

  // Calculate profit
  let profitLow = null;
  let profitHigh = null;
  let profitClass = 'profit-positive';

  if (hasApiData && data.price) {
    const profit = calculateProfit(data.price, priceData.ebay_low, priceData.ebay_high);
    profitLow = profit.low;
    profitHigh = profit.high;
    profitClass = getProfitClass(profitLow, profitHigh);
  }

  // Check for suspicious listing
  const suspicious = isSuspiciousListing(data.price, data.title);

  const ebayUrl = priceData?.ebay_url || getEbayUrl(data.title);
  const tierBadge = getTierBadge();

  // Build HTML
  let html = `
    ${getOverlayStyles()}
    <div class="container">
      <div class="header">
        <span class="logo">FlipRadar ${tierBadge}</span>
        <button class="close-btn" id="close-overlay">&times;</button>
      </div>

      <div class="price-section">
        <div class="current-price">${formatPrice(data.price)}</div>
        <div class="title" title="${escapeHtml(data.title || '')}">${escapeHtml(data.title) || 'Unknown Item'}</div>
      </div>

      ${suspicious ? '<div class="warning">Warning: Price seems suspiciously low</div>' : ''}
  `;

  // Login prompt
  if (!loggedIn) {
    html += `
      <div class="login-prompt">
        <div>Sign in for real eBay price data</div>
        <button class="login-btn" id="login-btn">Sign In Free</button>
      </div>
    `;
  }

  // Upgrade prompt
  if (needsUpgrade) {
    html += `
      <div class="upgrade-prompt">
        <div>Daily lookup limit reached</div>
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
      html += `
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${profitClass}">
            ${profitLow >= 0 ? '+' : ''}$${profitLow} to ${profitHigh >= 0 ? '+' : ''}$${profitHigh}
          </div>
        </div>
      `;
    }
  } else if (hasApiData) {
    // Show API estimate data
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
      html += `
        <div class="profit-section">
          <div class="profit-label">Est. Profit (after fees)</div>
          <div class="profit-range ${profitClass}">
            ${profitLow >= 0 ? '+' : ''}$${profitLow} to ${profitHigh >= 0 ? '+' : ''}$${profitHigh}
          </div>
        </div>
      `;
    }
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
    <div class="footer" style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #2d2d44; font-size: 10px; color: #666; text-align: center;">
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

    if (result.success) {
      msg.textContent = result.local ? 'Saved locally!' : 'Deal saved!';
      msg.className = 'saved-msg success';
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
      * {
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .container {
        background: #1a1a2e;
        color: #ffffff;
        padding: 16px;
        border-radius: 12px;
        width: 300px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        border: 1px solid #2d2d44;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .logo { font-weight: 700; font-size: 14px; color: #4ade80; }
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: #888;
      }
      .spinner {
        width: 24px;
        height: 24px;
        border: 2px solid #374151;
        border-top-color: #4ade80;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 12px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
    <div class="container">
      <div class="header">
        <span class="logo">FlipRadar</span>
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
  console.log('[FlipRadar] showTriggerButton called for URL:', window.location.href);

  // Always remove existing overlay when showing button for a new item
  const existingOverlay = document.getElementById(OVERLAY_ID);
  if (existingOverlay) {
    console.log('[FlipRadar] Removing old overlay');
    existingOverlay.remove();
  }

  const existingBtn = document.getElementById(TRIGGER_BUTTON_ID);
  if (existingBtn) {
    console.log('[FlipRadar] Removing old button');
    existingBtn.remove();
  }

  const btn = document.createElement('button');
  btn.id = TRIGGER_BUTTON_ID;
  btn.innerHTML = '💰 Check Flip';
  btn.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 2147483646;
    background: #4ade80;
    color: #1a1a2e;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;

  btn.addEventListener('click', () => {
    btn.remove();
    onClick();
  });

  document.body.appendChild(btn);
  console.log('[FlipRadar] Button added to page');
}
