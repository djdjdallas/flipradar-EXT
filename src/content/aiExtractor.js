// FlipRadar AI Extraction
// Uses backend AI service to extract listing data from page text
// More resilient to DOM changes than direct scraping

import { API_BASE_URL, PAGE_TEXT_MAX_LENGTH } from './config.js';
import { getAuthToken } from './state.js';
import { getPageText } from './utils/dom.js';
import { parsePrice } from './utils/pricing.js';
import { extractImageUrl } from './scraper.js';

/**
 * Extract listing data using the backend AI service
 * This is more reliable than DOM scraping as it understands context
 *
 * @returns {Promise<object|null>} - Extracted data or null if failed
 */
export async function extractWithAI() {
  const authToken = getAuthToken();

  if (!authToken) {
    console.log('[FlipRadar] AI extraction skipped - not logged in');
    return null;
  }

  return new Promise((resolve) => {
    // Get page text content for AI analysis
    const pageText = getPageText(PAGE_TEXT_MAX_LENGTH);
    console.log('[FlipRadar] Sending page text to AI extraction (' + pageText.length + ' chars)');

    chrome.runtime.sendMessage({
      type: 'apiRequest',
      url: `${API_BASE_URL}/api/extract`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: {
        pageText,
        url: window.location.href
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('[FlipRadar] AI extraction message error:', chrome.runtime.lastError);
        resolve(null);
        return;
      }

      if (!response) {
        console.log('[FlipRadar] AI extraction - no response');
        resolve(null);
        return;
      }

      if (!response.ok) {
        console.log('[FlipRadar] AI extraction failed:', response.status, response.error || response.data?.error);
        resolve(null);
        return;
      }

      console.log('[FlipRadar] AI extraction successful:', response.data);
      resolve(response.data);
    });
  });
}

/**
 * Transform AI extraction result to standard data format
 * Normalizes the AI response to match our internal data structure
 *
 * @param {object} aiData - Raw AI extraction result
 * @param {string} itemId - Current item ID
 * @returns {object} - Normalized listing data
 */
export function transformAIData(aiData, itemId) {
  return {
    title: aiData.title || null,
    price: typeof aiData.price === 'number' ? aiData.price : parsePrice(aiData.price),
    location: aiData.location || null,
    seller: aiData.seller || null,
    daysListed: aiData.daysListed || null,
    imageUrl: extractImageUrl(), // AI doesn't extract images, get from DOM
    itemId: itemId,
    source: 'ai'
  };
}
