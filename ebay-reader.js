// FlipChecker - eBay Sold Price Reader
// Reads sold listing prices when user visits eBay sold search pages
(function() {
  'use strict';

  // Constants
  const FLIPCHECKER_BADGE_ID = 'flipchecker-ebay-badge';
  const MAX_REASONABLE_PRICE = 100000;
  const BADGE_AUTO_HIDE_MS = 30000;
  const PAGE_LOAD_DELAY_MS = 1500;

  // Only run on sold listings pages (LH_Sold=1 or LH_Complete=1)
  function isSoldListingsPage() {
    const url = window.location.href;
    return url.includes('LH_Sold=1') || url.includes('LH_Complete=1');
  }

  // Extract search query from URL
  function getSearchQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('_nkw') || '';
  }

  // Parse price string to number
  function parsePrice(priceStr) {
    if (!priceStr) return null;
    // Handle ranges like "$50.00 to $75.00" - take the first price
    const match = priceStr.match(/\$[\d,]+\.?\d*/);
    if (!match) return null;
    const cleaned = match[0].replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  // Extract sold items from the page
  function extractSoldItems() {
    const items = [];
    const soldElements = document.querySelectorAll('.s-item');

    soldElements.forEach((item, index) => {
      // Skip the first item (often a header/ad)
      if (index === 0) return;

      const titleEl = item.querySelector('.s-item__title');
      const priceEl = item.querySelector('.s-item__price');
      const dateEl = item.querySelector('.s-item__endedDate') ||
                     item.querySelector('.s-item__ended-date') ||
                     item.querySelector('.POSITIVE');
      const linkEl = item.querySelector('.s-item__link');

      if (titleEl && priceEl) {
        const price = parsePrice(priceEl.textContent);
        if (price && price > 0 && price < MAX_REASONABLE_PRICE) { // Sanity check
          items.push({
            title: titleEl.textContent.trim().substring(0, 100),
            price: price,
            soldDate: dateEl ? dateEl.textContent.trim() : null,
            url: linkEl ? linkEl.href : null
          });
        }
      }
    });

    return items;
  }

  // Calculate statistics from sold items
  function calculateStats(items) {
    if (items.length === 0) {
      return { count: 0, low: null, high: null, avg: null, median: null };
    }

    const prices = items.map(i => i.price).sort((a, b) => a - b);
    const sum = prices.reduce((a, b) => a + b, 0);

    // Calculate median
    const mid = Math.floor(prices.length / 2);
    const median = prices.length % 2 !== 0
      ? prices[mid]
      : (prices[mid - 1] + prices[mid]) / 2;

    return {
      count: prices.length,
      low: prices[0],
      high: prices[prices.length - 1],
      avg: Math.round(sum / prices.length),
      median: Math.round(median),
      prices: prices.slice(0, 20) // Keep first 20 for reference
    };
  }

  // Store sold data for the current search
  function storeSoldData(query, stats, items) {
    const data = {
      query: query.toLowerCase().trim(),
      stats: stats,
      samples: items.slice(0, 10), // Store top 10 samples
      timestamp: Date.now(),
      url: window.location.href
    };

    // Store with query as part of key for easy lookup
    const storageKey = `flipchecker_sold_${query.toLowerCase().replace(/\s+/g, '_').substring(0, 50)}`;

    chrome.storage.local.set({
      [storageKey]: data,
      flipchecker_last_sold: data // Also store as "last lookup" for easy access
    }, () => {
      console.log('[FlipChecker] Sold data stored:', stats);
    });

    // Notify any open FB Marketplace tabs
    chrome.runtime.sendMessage({
      type: 'soldDataCaptured',
      data: data
    });
  }

  // Format price for display
  function formatPrice(p) {
    return p ? `$${p.toLocaleString()}` : 'N/A';
  }

  // Create and show the FlipChecker badge/overlay
  function showBadge(stats, query) {
    // Remove existing badge
    const existing = document.getElementById(FLIPCHECKER_BADGE_ID);
    if (existing) existing.remove();

    const badge = document.createElement('div');
    badge.id = FLIPCHECKER_BADGE_ID;

    badge.innerHTML = `
      <style>
        #${FLIPCHECKER_BADGE_ID} {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .flipchecker-badge-container {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #ffffff;
          padding: 16px;
          border-radius: 12px;
          width: 260px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          border: 1px solid #2d2d44;
        }
        .flipchecker-badge-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #2d2d44;
        }
        .flipchecker-badge-logo {
          font-weight: 700;
          font-size: 14px;
          color: #4ade80;
        }
        .flipchecker-badge-close {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          line-height: 1;
        }
        .flipchecker-badge-close:hover { color: #fff; }
        .flipchecker-badge-title {
          font-size: 11px;
          color: #888;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .flipchecker-badge-query {
          font-size: 12px;
          color: #fff;
          margin-bottom: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .flipchecker-badge-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 12px;
        }
        .flipchecker-badge-stat {
          background: #1a1a2e;
          padding: 8px;
          border-radius: 6px;
          text-align: center;
        }
        .flipchecker-badge-stat-value {
          font-size: 16px;
          font-weight: 700;
          color: #4ade80;
        }
        .flipchecker-badge-stat-label {
          font-size: 9px;
          color: #888;
          text-transform: uppercase;
        }
        .flipchecker-badge-range {
          background: #1a1a2e;
          padding: 10px;
          border-radius: 6px;
          text-align: center;
          margin-bottom: 12px;
        }
        .flipchecker-badge-range-value {
          font-size: 18px;
          font-weight: 600;
          color: #4ade80;
        }
        .flipchecker-badge-range-label {
          font-size: 10px;
          color: #888;
        }
        .flipchecker-badge-footer {
          font-size: 10px;
          color: #666;
          text-align: center;
        }
        .flipchecker-badge-check {
          color: #4ade80;
          margin-right: 4px;
        }
      </style>
      <div class="flipchecker-badge-container">
        <div class="flipchecker-badge-header">
          <span class="flipchecker-badge-logo">FlipChecker</span>
          <button class="flipchecker-badge-close" id="flipchecker-close-badge">&times;</button>
        </div>

        <div class="flipchecker-badge-title">Sold Prices Captured</div>
        <div class="flipchecker-badge-query" title="${query}">"${query}"</div>

        <div class="flipchecker-badge-range">
          <div class="flipchecker-badge-range-value">${formatPrice(stats.low)} - ${formatPrice(stats.high)}</div>
          <div class="flipchecker-badge-range-label">Sold Price Range</div>
        </div>

        <div class="flipchecker-badge-stats">
          <div class="flipchecker-badge-stat">
            <div class="flipchecker-badge-stat-value">${formatPrice(stats.median)}</div>
            <div class="flipchecker-badge-stat-label">Median</div>
          </div>
          <div class="flipchecker-badge-stat">
            <div class="flipchecker-badge-stat-value">${formatPrice(stats.avg)}</div>
            <div class="flipchecker-badge-stat-label">Average</div>
          </div>
          <div class="flipchecker-badge-stat">
            <div class="flipchecker-badge-stat-value">${stats.count}</div>
            <div class="flipchecker-badge-stat-label">Listings</div>
          </div>
          <div class="flipchecker-badge-stat">
            <div class="flipchecker-badge-stat-value">&#10003;</div>
            <div class="flipchecker-badge-stat-label">Saved</div>
          </div>
        </div>

        <div class="flipchecker-badge-footer">
          <span class="flipchecker-badge-check">&#10003;</span> Data saved - return to FB Marketplace to see profit
        </div>
      </div>
    `;

    document.body.appendChild(badge);

    // Close button handler
    document.getElementById('flipchecker-close-badge').addEventListener('click', () => {
      badge.remove();
    });

    // Auto-hide after timeout
    setTimeout(() => {
      if (document.getElementById(FLIPCHECKER_BADGE_ID)) {
        badge.style.transition = 'opacity 0.5s';
        badge.style.opacity = '0';
        setTimeout(() => badge.remove(), 500);
      }
    }, BADGE_AUTO_HIDE_MS);
  }

  // Main initialization
  function init() {
    if (!isSoldListingsPage()) {
      console.log('[FlipChecker] Not a sold listings page, skipping');
      return;
    }

    // Wait for eBay page to fully render
    setTimeout(() => {
      const query = getSearchQuery();
      if (!query) {
        console.log('[FlipChecker] No search query found');
        return;
      }

      const items = extractSoldItems();
      console.log(`[FlipChecker] Found ${items.length} sold items`);

      if (items.length === 0) {
        console.log('[FlipChecker] No sold items found on page');
        return;
      }

      const stats = calculateStats(items);
      console.log('[FlipChecker] Stats:', stats);

      // Store the data
      storeSoldData(query, stats, items);

      // Show the badge
      showBadge(stats, query);

    }, PAGE_LOAD_DELAY_MS);
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also run when URL changes (eBay uses client-side navigation)
  let lastUrl = window.location.href;
  let debounceTimeout = null;
  const DEBOUNCE_MS = 100;

  const observer = new MutationObserver(() => {
    // Debounce URL change checks
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    debounceTimeout = setTimeout(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(init, PAGE_LOAD_DELAY_MS);
      }
    }, DEBOUNCE_MS);
  });
  observer.observe(document.body, { childList: true, subtree: true });

})();
