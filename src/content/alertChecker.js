// FlipChecker Alert Checker
// Checks extracted listing data against user's active alerts

import { API_BASE_URL } from './config.js';
import { getAuthToken } from './state.js';

// Cache alerts locally to avoid fetching on every check
let cachedAlerts = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch user's active alerts from API (with caching)
 * @returns {Promise<Array>} - Array of active alerts
 */
async function fetchAlerts() {
  const now = Date.now();

  // Return cached if fresh
  if (cachedAlerts && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedAlerts;
  }

  const authToken = getAuthToken();
  if (!authToken) return [];

  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: 'apiRequest',
      url: `${API_BASE_URL}/api/alerts`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }, (response) => {
      if (chrome.runtime.lastError || !response?.ok) {
        console.warn('[FlipChecker] Failed to fetch alerts');
        resolve(cachedAlerts || []);
        return;
      }

      cachedAlerts = response.data?.alerts || [];
      cacheTimestamp = now;
      resolve(cachedAlerts);
    });
  });
}

/**
 * Check if a title fuzzy-matches a search query
 * Uses word overlap (same approach as getStoredSoldData)
 * @param {string} title - Listing title
 * @param {string} query - Alert search query
 * @returns {boolean}
 */
function titleMatches(title, query) {
  if (!title || !query) return false;

  const titleLower = title.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact substring match
  if (titleLower.includes(queryLower)) return true;

  // Word overlap match
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  const titleWords = titleLower.split(/\s+/).filter(w => w.length > 2);

  if (queryWords.length === 0) return false;

  const matched = queryWords.filter(qw =>
    titleWords.some(tw => tw.includes(qw) || qw.includes(tw))
  );

  // Require at least 60% of query words to match
  return matched.length / queryWords.length >= 0.6;
}

/**
 * Save an alert match to the API
 * @param {object} alert - The matched alert
 * @param {object} data - Listing data
 */
function saveAlertMatch(alert, data) {
  const authToken = getAuthToken();
  if (!authToken) return;

  chrome.runtime.sendMessage({
    type: 'apiRequest',
    url: `${API_BASE_URL}/api/alerts/match`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: {
      alert_id: alert.id,
      listing_title: data.title,
      listing_price: data.price,
      source_url: window.location.href
    }
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('[FlipChecker] Failed to save alert match');
    }
  });
}

/**
 * Check extracted listing data against user's active alerts
 * @param {object} data - Extracted listing data (title, price, etc.)
 * @returns {Promise<Array>} - Array of matched alerts
 */
export async function checkAlerts(data) {
  if (!data?.title) return [];

  const alerts = await fetchAlerts();
  if (!alerts.length) return [];

  const matches = [];

  for (const alert of alerts) {
    const queryMatch = titleMatches(data.title, alert.search_query);
    const priceMatch = !alert.max_price || (data.price && data.price <= alert.max_price);

    if (queryMatch && priceMatch) {
      matches.push(alert);
      // Save match to API (fire-and-forget)
      saveAlertMatch(alert, data);
    }
  }

  if (matches.length > 0) {
    console.log('[FlipChecker] Alert matches found:', matches.length);
  }

  return matches;
}
