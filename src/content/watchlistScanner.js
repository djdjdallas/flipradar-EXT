// FlipChecker Watchlist Scanner
// Passive scanning orchestrator: filter matching, price lookups, badge injection, alert storage

import {
  API_BASE_URL,
  WATCHLIST_SCAN_DELAY_MS,
  WATCHLIST_SCANNED_TTL_MS,
  WATCHLIST_MAX_SCANS_PER_PAGE,
  EBAY_FEE_MULTIPLIER
} from './config.js';
import { extractListingCards } from './searchScraper.js';
import { fetchPriceData } from './api.js';
import { isLoggedIn } from './auth.js';

// Module state
let isScanning = false;
let scannedIds = new Map(); // id -> timestamp
let badgedListings = new Map(); // id -> { profit, filterId }
let contentObserver = null;
let cancelled = false;
let loadingIndicator = null;
let debounceTimer = null;

/**
 * Initialize the watchlist scanner on a search results page
 * Loads filters from storage and sets up DOM observation for infinite scroll
 */
export function initWatchlistScanner() {
  cancelled = false;

  if (!isLoggedIn()) {
    console.log('[FlipChecker] Watchlist: not logged in, skipping');
    return;
  }

  chrome.storage.local.get(['watchlistFilters'], (result) => {
    const filters = result.watchlistFilters;
    if (!filters || filters.length === 0) {
      console.log('[FlipChecker] Watchlist: no filters configured, skipping');
      return;
    }

    const activeFilters = filters.filter(f => f.is_active !== false);
    if (activeFilters.length === 0) {
      console.log('[FlipChecker] Watchlist: no active filters, skipping');
      return;
    }

    console.log('[FlipChecker] Watchlist: initializing scanner with', activeFilters.length, 'active filters');

    // Delay initial scan to let FB DOM settle
    setTimeout(() => {
      if (!cancelled) {
        scanPage(activeFilters);
      }
    }, 1000);

    // Set up MutationObserver for infinite scroll detection
    setupContentObserver(activeFilters);
  });
}

/**
 * Set up MutationObserver to detect new listings from infinite scroll
 * @param {Array} filters
 */
function setupContentObserver(filters) {
  if (contentObserver) {
    contentObserver.disconnect();
  }

  const mainContainer = document.querySelector('div[role="main"]') || document.body;

  contentObserver = new MutationObserver(() => {
    if (cancelled) return;

    // Debounce re-scans
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!cancelled && !isScanning) {
        // Re-inject badges for already-scanned listings (FB may re-render)
        reinjectBadges();
        scanPage(filters);
      }
    }, 500);
  });

  contentObserver.observe(mainContainer, {
    childList: true,
    subtree: true
  });
}

/**
 * Main scan function - extract listings, match against filters, price-check matches
 * @param {Array} filters - Active watchlist filters
 */
async function scanPage(filters) {
  if (isScanning || cancelled || !isLoggedIn() || !filters.length) return;

  isScanning = true;
  showLoadingIndicator();

  try {
    const cards = extractListingCards();

    // Prune old entries from scannedIds
    const now = Date.now();
    for (const [id, timestamp] of scannedIds) {
      if (now - timestamp > WATCHLIST_SCANNED_TTL_MS) {
        scannedIds.delete(id);
      }
    }

    // Filter out already-scanned listings
    const newCards = cards.filter(card => !scannedIds.has(card.id));

    if (newCards.length === 0) {
      console.log('[FlipChecker] Watchlist: no new listings to scan');
      hideLoadingIndicator();
      isScanning = false;
      return;
    }

    // Match cards against filters
    const matches = [];
    for (const card of newCards) {
      for (const filter of filters) {
        if (matchesFilter(card, filter)) {
          matches.push({ listing: card, filter });
          break; // One match per listing is enough
        }
      }
      // Mark as scanned regardless of match
      scannedIds.set(card.id, now);
    }

    console.log('[FlipChecker] Watchlist:', newCards.length, 'new listings,', matches.length, 'matches');

    // Cap matches per scan cycle
    const toProcess = matches.slice(0, WATCHLIST_MAX_SCANS_PER_PAGE);

    // Process matches sequentially with delay between API calls
    for (const { listing, filter } of toProcess) {
      if (cancelled) break;

      const priceData = await fetchPriceData(listing.title);

      if (cancelled) break;

      // Check for errors that should stop scanning
      if (priceData?.error) {
        if (priceData.error === 'limit_reached' || priceData.error === 'auth_required') {
          console.log('[FlipChecker] Watchlist: stopping scan -', priceData.error);
          break;
        }
        if (priceData.error === 'network_error') {
          console.log('[FlipChecker] Watchlist: network error, stopping');
          break;
        }
        // Other errors: skip this listing but continue
        continue;
      }

      // Calculate profit
      const ebayAvg = priceData?.prices?.avg || priceData?.avg;
      if (!ebayAvg) continue;

      const profit = Math.round((ebayAvg * EBAY_FEE_MULTIPLIER) - listing.price);

      if (profit >= filter.min_profit) {
        injectBadge(listing.cardElement, listing.id, profit);
        storeAlert(listing, filter, priceData, profit);
      }

      // Delay between API calls to be respectful
      if (!cancelled) {
        await new Promise(resolve => setTimeout(resolve, WATCHLIST_SCAN_DELAY_MS));
      }
    }
  } catch (error) {
    console.error('[FlipChecker] Watchlist scan error:', error);
  } finally {
    hideLoadingIndicator();
    isScanning = false;
  }
}

/**
 * Check if a listing matches a watchlist filter
 * @param {object} listing - { id, title, price }
 * @param {object} filter - { keywords, max_buy_price, min_profit }
 * @returns {boolean}
 */
function matchesFilter(listing, filter) {
  // Skip free items
  if (!listing.price || listing.price <= 0) return false;

  // Price must be within budget
  if (listing.price > filter.max_buy_price) return false;

  // ALL keywords must appear in title (case-insensitive)
  const titleLower = listing.title.toLowerCase();
  const keywords = filter.keywords.toLowerCase().split(/\s+/).filter(k => k.length > 0);

  return keywords.every(keyword => titleLower.includes(keyword));
}

/**
 * Inject a profit badge on a listing card
 * @param {Element} cardElement - The card's DOM element
 * @param {string} listingId - Listing ID
 * @param {number} profit - Estimated profit
 */
function injectBadge(cardElement, listingId, profit) {
  if (!cardElement) return;

  // Check if badge already exists
  if (cardElement.querySelector('[data-flipchecker-badge]')) return;

  // Find image container for positioning
  const img = cardElement.querySelector('img');
  const imageContainer = img?.closest('div') || cardElement;

  // Ensure parent has relative positioning
  const computedStyle = window.getComputedStyle(imageContainer);
  if (computedStyle.position === 'static') {
    imageContainer.style.position = 'relative';
  }

  // Create badge
  const badge = document.createElement('div');
  badge.setAttribute('data-flipchecker-badge', listingId);
  badge.style.cssText = `
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 10;
    background: #16a34a;
    color: #fff;
    border-radius: 9999px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    align-items: center;
    gap: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    pointer-events: auto;
  `;

  const text = document.createElement('span');
  text.textContent = `\u{1F525} +$${profit} profit`;

  const dismissBtn = document.createElement('span');
  dismissBtn.textContent = '\u00D7';
  dismissBtn.style.cssText = `
    cursor: pointer;
    margin-left: 4px;
    font-size: 14px;
    opacity: 0.7;
  `;
  dismissBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    badge.remove();
    badgedListings.delete(listingId);
  });

  badge.appendChild(text);
  badge.appendChild(dismissBtn);
  imageContainer.appendChild(badge);

  // Store for re-injection
  badgedListings.set(listingId, { profit });
}

/**
 * Re-inject badges for listings that FB may have re-rendered
 */
function reinjectBadges() {
  for (const [listingId, data] of badgedListings) {
    // Check if badge still exists in DOM
    if (document.querySelector(`[data-flipchecker-badge="${listingId}"]`)) continue;

    // Find the card again
    const link = document.querySelector(`a[href*="/marketplace/item/${listingId}"]`);
    if (!link) continue;

    const cardElement = link.closest('div[class]') || link.parentElement;
    if (cardElement) {
      injectBadge(cardElement, listingId, data.profit);
    }
  }
}

/**
 * Store alert in chrome.storage.local and fire-and-forget to API
 * @param {object} listing
 * @param {object} filter
 * @param {object} priceData
 * @param {number} profit
 */
function storeAlert(listing, filter, priceData, profit) {
  const ebayAvg = priceData?.prices?.avg || priceData?.avg || null;

  const alert = {
    id: `alert_${listing.id}_${Date.now()}`,
    filterId: filter.id,
    title: listing.title,
    price: listing.price,
    ebayAvg,
    profit,
    url: listing.url,
    listingId: listing.id,
    foundAt: new Date().toISOString()
  };

  chrome.storage.local.get(['watchlistAlerts'], (result) => {
    let alerts = result.watchlistAlerts || [];

    // Dedup by listingId
    if (alerts.some(a => a.listingId === listing.id)) return;

    alerts.unshift(alert);

    // Cap at 50 alerts
    if (alerts.length > 50) {
      alerts = alerts.slice(0, 50);
    }

    chrome.storage.local.set({ watchlistAlerts: alerts });
  });

  // Fire-and-forget: store alert on server
  try {
    chrome.runtime.sendMessage({
      type: 'apiRequest',
      url: `${getApiBaseUrl()}/api/watchlist/alerts`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        filter_id: filter.id,
        listing_title: listing.title,
        listing_price: listing.price,
        ebay_avg_price: ebayAvg,
        estimated_profit: profit,
        listing_url: listing.url,
        fb_listing_id: listing.id
      }
    });
  } catch (e) {
    // Fire-and-forget, ignore errors
  }
}

/**
 * Get API base URL from config
 * @returns {string}
 */
function getApiBaseUrl() {
  return API_BASE_URL;
}

/**
 * Show a subtle loading indicator at the bottom-left
 */
function showLoadingIndicator() {
  if (loadingIndicator) return;

  loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'flipchecker-scan-indicator';
  loadingIndicator.style.cssText = `
    position: fixed;
    bottom: 16px;
    left: 16px;
    z-index: 10000;
    background: rgba(22, 33, 62, 0.9);
    color: #4ade80;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;

  const spinner = document.createElement('div');
  spinner.style.cssText = `
    width: 14px;
    height: 14px;
    border: 2px solid #374151;
    border-top-color: #4ade80;
    border-radius: 50%;
    animation: flipchecker-spin 1s linear infinite;
  `;

  // Add keyframes if not already present
  if (!document.getElementById('flipchecker-scan-styles')) {
    const style = document.createElement('style');
    style.id = 'flipchecker-scan-styles';
    style.textContent = '@keyframes flipchecker-spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }

  const label = document.createElement('span');
  label.textContent = 'Scanning watchlist...';

  loadingIndicator.appendChild(spinner);
  loadingIndicator.appendChild(label);
  document.body.appendChild(loadingIndicator);
}

/**
 * Hide the loading indicator
 */
function hideLoadingIndicator() {
  if (loadingIndicator) {
    loadingIndicator.remove();
    loadingIndicator = null;
  }
}

/**
 * Clean up the watchlist scanner (called on navigation away)
 */
export function cleanupWatchlistScanner() {
  cancelled = true;

  if (contentObserver) {
    contentObserver.disconnect();
    contentObserver = null;
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  hideLoadingIndicator();

  // Remove all badges
  document.querySelectorAll('[data-flipchecker-badge]').forEach(el => el.remove());

  isScanning = false;
  scannedIds.clear();
  badgedListings.clear();
}
