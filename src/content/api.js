// FlipRadar API Communication
// Handles all API calls to the FlipRadar backend via the background service worker

import { API_BASE_URL, MAX_LOCAL_DEALS, CACHE_TTL_MS } from './config.js';
import { getAuthToken } from './state.js';
import { getEbayUrl, isDataFresh } from './utils/pricing.js';

/**
 * Fetch eBay price data from API
 * @param {string} title - Item title to search for
 * @returns {Promise<object>} - Price data or error object
 */
export async function fetchPriceData(title) {
  const authToken = getAuthToken();

  if (!authToken) {
    return { error: 'auth_required' };
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: 'apiRequest',
      url: `${API_BASE_URL}/api/price-lookup`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: { title }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[FlipRadar] Price lookup message error:', chrome.runtime.lastError);
        resolve({ error: 'network_error' });
        return;
      }

      if (!response) {
        resolve({ error: 'network_error' });
        return;
      }

      if (response.status === 401) {
        resolve({ error: 'auth_required' });
        return;
      }

      if (response.status === 429) {
        resolve({ error: 'limit_reached', message: response.data?.error });
        return;
      }

      if (!response.ok) {
        resolve({ error: 'api_error' });
        return;
      }

      resolve(response.data);
    });
  });
}

/**
 * Save deal to API (cloud storage)
 * Falls back to local storage if not authenticated or on error
 *
 * @param {object} data - Listing data
 * @param {object} priceData - Price lookup data
 * @returns {Promise<object>} - Result with success status
 */
export async function saveDealToApi(data, priceData) {
  const authToken = getAuthToken();

  if (!authToken) {
    // Fall back to local storage
    saveDealLocally(data);
    return { success: true, local: true };
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: 'apiRequest',
      url: `${API_BASE_URL}/api/deals`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: {
        source_url: window.location.href,
        user_title: data.title,
        user_asking_price: data.price,
        ebay_estimate_low: priceData?.ebay_low,
        ebay_estimate_high: priceData?.ebay_high,
        ebay_search_url: priceData?.ebay_url || getEbayUrl(data.title)
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[FlipRadar] Save deal message error:', chrome.runtime.lastError);
        saveDealLocally(data);
        resolve({ success: true, local: true });
        return;
      }

      if (!response || !response.ok) {
        if (response?.status === 401) {
          saveDealLocally(data);
          resolve({ success: true, local: true });
          return;
        }

        if (response?.status === 429) {
          resolve({ success: false, error: 'Deal limit reached. Upgrade to save more.' });
          return;
        }

        console.error('[FlipRadar] API save failed:', response?.error || response?.status);
        saveDealLocally(data);
        resolve({ success: true, local: true });
        return;
      }

      console.log('[FlipRadar] Deal saved to cloud successfully');
      resolve({ success: true });
    });
  });
}

/**
 * Save deal to local Chrome storage (fallback)
 * @param {object} data - Listing data
 */
export function saveDealLocally(data) {
  const deal = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    title: data.title || 'Unknown Item',
    price: data.price,
    url: window.location.href,
    ebayUrl: getEbayUrl(data.title),
    savedAt: new Date().toISOString()
  };

  chrome.storage.local.get(['savedDeals'], (result) => {
    const deals = result.savedDeals || [];
    deals.unshift(deal);
    if (deals.length > MAX_LOCAL_DEALS) {
      deals.pop();
    }
    chrome.storage.local.set({ savedDeals: deals }, () => {
      if (chrome.runtime.lastError) {
        console.error('[FlipRadar] Failed to save deal locally:', chrome.runtime.lastError.message);
      } else {
        console.log('[FlipRadar] Deal saved locally');
      }
    });
  });
}

/**
 * Check for stored sold data from eBay page reader that matches the current item
 * @param {string} title - Item title to match against
 * @returns {Promise<object|null>} - Matched sold data or null
 */
export async function getStoredSoldData(title) {
  return new Promise((resolve) => {
    if (!title) {
      resolve(null);
      return;
    }

    // Create a simplified key from the title
    const queryKey = title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    const storageKey = `flipradar_sold_${queryKey}`;

    // Try exact match first, then fall back to last lookup
    chrome.storage.local.get([storageKey, 'flipradar_last_sold'], (result) => {
      // Check if we have an exact match
      if (result[storageKey] && isDataFresh(result[storageKey].timestamp, CACHE_TTL_MS)) {
        console.log('[FlipRadar] Found exact match for sold data');
        resolve(result[storageKey]);
        return;
      }

      // Check if last lookup is relevant (fuzzy match on query)
      // Only use if there's very strong overlap to avoid showing wrong data
      if (result.flipradar_last_sold && isDataFresh(result.flipradar_last_sold.timestamp, CACHE_TTL_MS)) {
        const lastQuery = result.flipradar_last_sold.query.toLowerCase();
        const currentTitle = title.toLowerCase();

        // Check if there's meaningful overlap - require stronger match
        const lastWords = lastQuery.split(/\s+/).filter(w => w.length > 3);
        const titleWords = currentTitle.split(/\s+/).filter(w => w.length > 3);
        const overlap = lastWords.filter(w =>
          titleWords.some(tw => tw.includes(w) || w.includes(tw))
        );

        // Require at least 60% word overlap and 3 overlapping words for fuzzy match
        const overlapRatio = titleWords.length > 0 ? overlap.length / titleWords.length : 0;
        console.log('[FlipRadar] Fuzzy match check - overlap:', overlap.length, 'ratio:', overlapRatio);

        if (overlapRatio >= 0.6 && overlap.length >= 3) {
          console.log('[FlipRadar] Using fuzzy matched sold data');
          resolve(result.flipradar_last_sold);
          return;
        }
      }

      resolve(null);
    });
  });
}
