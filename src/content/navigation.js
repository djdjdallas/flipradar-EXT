// FlipRadar SPA Navigation Detection
// Handles Facebook's single-page app navigation using History API patching
// and MutationObserver as a backup

import { DEBOUNCE_MS, OVERLAY_ID, TRIGGER_BUTTON_ID } from './config.js';
import { clearLastExtractedData, getLastExtractedData } from './state.js';

// Track current URL for change detection
let lastUrl = typeof window !== 'undefined' ? window.location.href : '';
let debounceTimeout = null;

// Registered navigation callbacks
const navigationCallbacks = [];

/**
 * Register a callback for navigation events
 * @param {Function} callback - Called with (newUrl, itemId) when navigation occurs
 */
export function onNavigation(callback) {
  navigationCallbacks.push(callback);
}

/**
 * Extract item ID from URL
 * @param {string} url - URL to extract from (defaults to current URL)
 * @returns {string|null}
 */
export function getItemIdFromUrl(url = window.location.href) {
  const match = url.match(/\/marketplace\/item\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Check if a URL is a marketplace item page
 * @param {string} url
 * @returns {boolean}
 */
export function isMarketplaceItemUrl(url = window.location.href) {
  return url.includes('/marketplace/item/');
}

/**
 * Remove overlay and trigger button elements
 */
function removeOverlayElements() {
  const btn = document.getElementById(TRIGGER_BUTTON_ID);
  const overlay = document.getElementById(OVERLAY_ID);
  if (btn) btn.remove();
  if (overlay) overlay.remove();
}

/**
 * Notify all registered callbacks of navigation
 * @param {string} url
 * @param {string|null} itemId
 */
function notifyCallbacks(url, itemId) {
  navigationCallbacks.forEach(cb => {
    try {
      cb(url, itemId);
    } catch (e) {
      console.error('[FlipRadar] Navigation callback error:', e);
    }
  });
}

/**
 * Handle navigation event (called when URL changes)
 * Clears cached data when navigating to a different item
 */
export function handleNavigation() {
  const currentUrl = window.location.href;
  console.log('[FlipRadar] Navigation detected:', currentUrl);

  if (isMarketplaceItemUrl(currentUrl)) {
    const newItemId = getItemIdFromUrl(currentUrl);
    const previousData = getLastExtractedData();
    const previousItemId = previousData?.itemId;

    // If navigating to a DIFFERENT item, clear cached data
    // This ensures waitForNewContent waits for any valid title on new items
    if (newItemId !== previousItemId) {
      console.log('[FlipRadar] New item detected, clearing cache. Previous:', previousItemId, 'New:', newItemId);
      clearLastExtractedData();
    }

    notifyCallbacks(currentUrl, newItemId);
  } else {
    // Clean up when leaving marketplace item page
    removeOverlayElements();
  }
}

/**
 * Set up History API interception for reliable SPA navigation detection
 * Patches pushState and replaceState to detect programmatic navigation
 */
export function setupHistoryListener() {
  // Store original methods
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  // Override pushState
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    handleNavigation();
  };

  // Override replaceState
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    handleNavigation();
  };

  // Also listen for popstate (back/forward buttons)
  window.addEventListener('popstate', handleNavigation);

  console.log('[FlipRadar] History API listeners installed');
}

/**
 * Set up MutationObserver as backup navigation detection
 * This catches navigation changes that might not trigger History API
 * @returns {MutationObserver}
 */
export function setupNavigationObserver() {
  const observer = new MutationObserver(() => {
    // Debounce navigation checks to avoid excessive processing
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    debounceTimeout = setTimeout(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        handleNavigation();
      }
    }, DEBOUNCE_MS);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('[FlipRadar] MutationObserver backup installed');
  return observer;
}

/**
 * Initialize all navigation detection mechanisms
 */
export function initNavigation() {
  lastUrl = window.location.href;
  setupHistoryListener();
  setupNavigationObserver();
}
