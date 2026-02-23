// FlipChecker Vision Extraction
// Uses screenshot + Gemini Vision to extract listing data
// DOM-agnostic — resilient to Facebook layout changes

import { API_BASE_URL } from './config.js';
import { getAuthToken, setState } from './state.js';
import { parsePrice } from './utils/pricing.js';

/**
 * Capture a screenshot of the visible tab via the service worker
 * @returns {Promise<string|null>} - Base64 JPEG data (no prefix) or null on failure
 */
function captureScreenshot() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'captureScreenshot' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('[FlipChecker] Screenshot capture error:', chrome.runtime.lastError);
        resolve(null);
        return;
      }

      if (!response || !response.success) {
        console.log('[FlipChecker] Screenshot capture failed:', response?.error);
        resolve(null);
        return;
      }

      resolve(response.screenshot);
    });
  });
}

/**
 * Extract listing data using screenshot + Gemini Vision
 * Captures the visible tab and sends to the vision-extract API
 *
 * @returns {Promise<object|null>} - Extracted data or null if failed
 */
export async function extractWithVision() {
  let authToken = getAuthToken();

  // Fallback: if in-memory state has no token, try reading storage directly
  if (!authToken) {
    const result = await new Promise(r => chrome.storage.local.get(['authToken'], r));
    authToken = result?.authToken || null;
    if (authToken) {
      setState({ authToken });
      console.log('[FlipChecker] Vision: recovered auth token from storage');
    }
  }

  if (!authToken) {
    console.log('[FlipChecker] Vision extraction skipped - not logged in');
    return null;
  }

  // Capture screenshot
  const screenshot = await captureScreenshot();
  if (!screenshot) {
    console.log('[FlipChecker] Vision extraction skipped - screenshot capture failed');
    return null;
  }

  console.log('[FlipChecker] Sending screenshot to vision extraction (' + Math.round(screenshot.length / 1024) + ' KB)');

  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: 'apiRequest',
      url: `${API_BASE_URL}/api/vision-extract`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: {
        screenshot,
        url: window.location.href
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('[FlipChecker] Vision extraction message error:', chrome.runtime.lastError);
        resolve(null);
        return;
      }

      if (!response) {
        console.log('[FlipChecker] Vision extraction - no response');
        resolve(null);
        return;
      }

      if (!response.ok) {
        console.log('[FlipChecker] Vision extraction failed:', response.status, response.error || response.data?.error);
        resolve(null);
        return;
      }

      if (response.data?.error) {
        console.log('[FlipChecker] Vision extraction API error:', response.data.error);
      }
      console.log('[FlipChecker] Vision extraction successful:', response.data);
      resolve(response.data);
    });
  });
}

/**
 * Transform vision extraction result to standard data format
 * Normalizes the vision response to match our internal data structure
 *
 * @param {object} visionData - Raw vision extraction result
 * @param {string} itemId - Current item ID
 * @returns {object} - Normalized listing data
 */
export function transformVisionData(visionData, itemId) {
  return {
    title: visionData.title || null,
    price: typeof visionData.price === 'number' ? visionData.price : parsePrice(visionData.price),
    location: visionData.location || null,
    seller: visionData.seller || null,
    daysListed: visionData.daysListed || null,
    imageUrl: null, // Resolved later in createOverlay() with correct priority
    itemId: itemId,
    source: 'vision'
  };
}
