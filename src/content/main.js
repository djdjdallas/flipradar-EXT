// FlipRadar Content Script - Main Entry Point
// Orchestrates all modules for Facebook Marketplace scraping

import { DOM_SETTLE_DELAY_MS } from './config.js';
import {
  setState,
  setLastExtractedData,
  getLastExtractedData,
  startNewJob,
  isJobCurrent,
  endJob
} from './state.js';
import { initNavigation, cleanupNavigation, onNavigation, isMarketplaceItemUrl } from './navigation.js';
import { setupNetworkInterception, getInterceptedData } from './networkInterceptor.js';
import {
  getItemId,
  isMarketplaceItemPage,
  waitForNewContent,
  extractAllData
} from './scraper.js';
import { extractWithAI, transformAIData } from './aiExtractor.js';
import { fetchPriceData } from './api.js';
import { initAuth, onAuthSuccess, onSoldDataReceived, isLoggedIn } from './auth.js';
import { createOverlay, createLoadingOverlay, showTriggerButton } from './overlay.js';

/**
 * Data extraction cascade:
 * 1. GraphQL (intercepted) - fastest, most reliable when available
 * 2. AI extraction - resilient to DOM changes, uses backend AI
 * 3. DOM scraping - fallback using tiered selectors
 *
 * @param {string} jobId - Current job ID for race condition checking
 * @param {string} itemId - Facebook item ID
 * @returns {Promise<{data: object, method: string}|null>}
 */
async function extractData(jobId, itemId) {
  let data = null;
  let method = 'none';

  // Check job is still current before starting
  if (!isJobCurrent(jobId)) {
    console.log('[FlipRadar] Job cancelled before extraction, aborting');
    return null;
  }

  // Tier 1: Check for intercepted GraphQL data (fastest)
  const graphQLData = getInterceptedData(itemId);
  if (graphQLData) {
    console.log('[FlipRadar] Using intercepted GraphQL data');
    data = graphQLData;
    method = 'graphql';
  }

  // Tier 2: Try AI extraction if logged in and no GraphQL data
  if (!data && isLoggedIn()) {
    console.log('[FlipRadar] Attempting AI extraction...');
    const aiData = await extractWithAI();

    // Check job still current after async operation
    if (!isJobCurrent(jobId)) {
      console.log('[FlipRadar] Job cancelled during AI extraction');
      return null;
    }

    if (aiData && (aiData.title || aiData.price)) {
      data = transformAIData(aiData, itemId);
      method = 'ai';
      console.log('[FlipRadar] AI extraction successful:', data.title);
    } else {
      console.log('[FlipRadar] AI extraction returned no usable data');
    }
  }

  // Tier 3: DOM extraction fallback
  if (!data || (!data.title && !data.price)) {
    console.log('[FlipRadar] Using DOM extraction (fallback)...');

    // Wait for content to be ready (pass jobId for self-cancellation)
    const previousTitle = getLastExtractedData()?.title || null;
    await waitForNewContent(previousTitle, itemId, undefined, jobId);

    // Check job still current after waiting
    if (!isJobCurrent(jobId)) {
      console.log('[FlipRadar] Job cancelled during DOM wait');
      return null;
    }

    data = extractAllData(itemId);
    method = 'dom';
    console.log('[FlipRadar] DOM extraction result:', data.title);
  }

  console.log('[FlipRadar] Extraction complete (method:', method + '):', data?.title);
  return { data, method };
}

/**
 * Initialize overlay - main workflow
 * Called when user clicks "Check Flip" button
 */
async function initOverlay() {
  // Start new job for race condition handling
  const jobId = startNewJob();
  const currentPageUrl = window.location.href;
  const itemId = getItemId();

  console.log('[FlipRadar] initOverlay started, job:', jobId, 'item:', itemId);

  // Show loading overlay immediately
  createLoadingOverlay({ title: 'Loading...', itemId });

  // Brief wait for Facebook DOM to settle after SPA navigation
  await new Promise(resolve => setTimeout(resolve, DOM_SETTLE_DELAY_MS));

  // Verify URL hasn't changed during wait
  if (!isJobCurrent(jobId) || window.location.href !== currentPageUrl) {
    console.log('[FlipRadar] Navigation during init wait, aborting job:', jobId);
    endJob(jobId);
    return;
  }

  // Initialize auth state
  await initAuth();

  // Extract data using cascade
  const result = await extractData(jobId, itemId);

  if (!result || !isJobCurrent(jobId)) {
    console.log('[FlipRadar] Extraction failed or job cancelled');
    endJob(jobId);
    return;
  }

  const { data, method } = result;

  // Store for next comparison on navigation
  setLastExtractedData(data);

  console.log('[FlipRadar] Final data (method: ' + method + '):', data);

  // Check if we got usable data
  if (!data.title && !data.price) {
    console.log('[FlipRadar] Could not extract listing data');
    // Show overlay with error state
    await createOverlay({ title: null, price: null, itemId }, null);
    endJob(jobId);
    return;
  }

  // Fetch eBay price data if logged in and have title
  let priceData = null;
  if (isLoggedIn() && data.title) {
    priceData = await fetchPriceData(data.title);

    // Check job still current after price lookup
    if (!isJobCurrent(jobId)) {
      console.log('[FlipRadar] Job cancelled during price lookup');
      endJob(jobId);
      return;
    }
  }

  // Create the full overlay
  await createOverlay(data, priceData);
  endJob(jobId);
}

/**
 * Handle navigation to marketplace item page
 * Shows the trigger button for the new item
 */
function handleMarketplaceNavigation(url, itemId) {
  console.log('[FlipRadar] Handling marketplace navigation:', url);
  showTriggerButton(() => {
    initOverlay();
  });
}

// Track init state and cleanup functions
let initialized = false;
let cleanupAuthListener = null;
let cleanupSoldDataListener = null;

/**
 * Main initialization
 */
function init() {
  if (initialized) {
    console.log('[FlipRadar] Already initialized, skipping');
    return;
  }
  initialized = true;

  console.log('[FlipRadar] Content script loaded on:', window.location.href);
  console.log('[FlipRadar] Is marketplace item page:', isMarketplaceItemPage());

  // Setup network interception early (before navigation to capture initial data)
  setupNetworkInterception();

  // Setup navigation detection
  initNavigation();

  // Register navigation handler
  onNavigation((url, itemId) => {
    if (isMarketplaceItemUrl(url)) {
      handleMarketplaceNavigation(url, itemId);
    }
  });

  // Clean up previous listeners if they exist (defensive)
  if (cleanupAuthListener) {
    cleanupAuthListener();
  }
  if (cleanupSoldDataListener) {
    cleanupSoldDataListener();
  }

  // Listen for auth success - refresh overlay if on marketplace page
  cleanupAuthListener = onAuthSuccess(() => {
    console.log('[FlipRadar] Auth success, checking if should refresh overlay');
    if (isMarketplaceItemPage()) {
      initOverlay();
    }
  });

  // Listen for sold data from eBay reader - refresh overlay if visible
  cleanupSoldDataListener = onSoldDataReceived((soldData) => {
    console.log('[FlipRadar] Received sold data, checking if should refresh overlay');
    const overlay = document.getElementById('flipradar-overlay');
    if (overlay && isMarketplaceItemPage()) {
      // Re-initialize overlay to pick up new sold data
      initOverlay();
    }
  });

  // Check initial page - show button if on marketplace item
  if (isMarketplaceItemPage()) {
    console.log('[FlipRadar] Initial page is marketplace item, showing trigger button');
    showTriggerButton(() => {
      initOverlay();
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  console.log('[FlipRadar] Waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', init);
} else {
  console.log('[FlipRadar] Document ready, initializing...');
  init();
}
