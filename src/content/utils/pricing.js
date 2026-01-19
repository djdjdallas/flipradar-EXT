// FlipRadar Price Utilities

import { EBAY_FEE_MULTIPLIER } from '../config.js';

/**
 * Parse price string to number
 * Handles formats like "$1,234.56", "$100", "Free", etc.
 * @param {string} priceStr - Price string to parse
 * @returns {number|null} - Parsed price or null if invalid
 */
export function parsePrice(priceStr) {
  if (!priceStr) return null;

  // Handle "Free" listings
  if (priceStr.toLowerCase() === 'free') return 0;

  // Remove everything except digits and decimal point
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);

  return isNaN(num) ? null : num;
}

/**
 * Format price for display
 * @param {number} price - Price to format
 * @returns {string} - Formatted price string
 */
export function formatPrice(price) {
  if (price === null || price === undefined) return 'N/A';
  if (price === 0) return 'Free';

  return '$' + price.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Generate eBay search URL for sold listings
 * @param {string} title - Item title to search for
 * @returns {string|null} - eBay search URL or null
 */
export function getEbayUrl(title) {
  if (!title) return null;

  // Clean and truncate title for search
  const cleanTitle = title
    .replace(/[^\w\s-]/g, ' ')  // Remove special chars
    .replace(/\s+/g, ' ')        // Collapse whitespace
    .trim()
    .substring(0, 100);          // Limit length

  const encoded = encodeURIComponent(cleanTitle);

  // Sort by ending soonest (_sop=13) for most relevant recent sales
  return `https://www.ebay.com/sch/i.html?_nkw=${encoded}&LH_Complete=1&LH_Sold=1&_sop=13`;
}

/**
 * Calculate estimated profit range after eBay fees
 * @param {number} askingPrice - Facebook Marketplace asking price
 * @param {number} ebayLow - Low end of eBay sold price range
 * @param {number} ebayHigh - High end of eBay sold price range
 * @param {number} feeMultiplier - After-fee multiplier (default 0.84 for ~16% fees)
 * @returns {{ low: number, high: number }}
 */
export function calculateProfit(askingPrice, ebayLow, ebayHigh, feeMultiplier = EBAY_FEE_MULTIPLIER) {
  return {
    low: Math.round((ebayLow * feeMultiplier) - askingPrice),
    high: Math.round((ebayHigh * feeMultiplier) - askingPrice)
  };
}

/**
 * Determine CSS class for profit display based on profit range
 * @param {number} profitLow - Low end of profit range
 * @param {number} profitHigh - High end of profit range
 * @returns {string} - CSS class name
 */
export function getProfitClass(profitLow, profitHigh) {
  if (profitHigh < 0) {
    return 'profit-negative';
  } else if (profitLow < 0) {
    return 'profit-mixed';
  }
  return 'profit-positive';
}

/**
 * Check if stored sold data is still fresh (within TTL)
 * @param {number} timestamp - Timestamp when data was stored
 * @param {number} ttlMs - Time-to-live in milliseconds
 * @returns {boolean}
 */
export function isDataFresh(timestamp, ttlMs = 24 * 60 * 60 * 1000) {
  if (!timestamp) return false;
  const age = Date.now() - timestamp;
  return age < ttlMs;
}
