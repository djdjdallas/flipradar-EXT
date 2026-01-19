// FlipRadar Generic Title Filtering
// Filters out Facebook UI elements that aren't actual product titles

import { TITLE_MIN_LENGTH, TITLE_MAX_LENGTH } from '../config.js';

// Exact matches for common generic titles (Facebook UI elements)
const EXACT_MATCHES = [
  'marketplace',
  'facebook marketplace',
  'listing',
  'item',
  'product',
  'details',
  'seller details',
  'description',
  'about this item',
  'chat history is missing',
  'message seller',
  'send message',
  'is this still available',
  'see more',
  'see less',
  'show more',
  'sponsored',
  'suggested for you',
  'similar items',
  'related items'
];

// Patterns that indicate Facebook UI elements, not product titles
const UI_PATTERNS = [
  /^(send|chat|message|call|contact)/i,
  /^(see|view|show|hide|load)\s+(more|less|all)/i,
  /facebook/i,
  /messenger/i,
  /^(listed|posted|sold)\s+(in|on|ago)/i,
  /^\d+\s+(views?|likes?|saves?|comments?)/i,
  /^(share|save|report|hide)\s*(this)?/i,
  /history is (missing|unavailable)/i,
  /^(sign|log)\s*(in|out|up)/i,
  /^(join|create|start)/i,
  /enter your pin/i,
  /restore chat/i,
  /end-to-end encrypted/i,
  /^\d+\s*(new\s*)?(message|notification)/i,
  /your (message|chat|conversation)/i,
  /turn on notifications/i,
  /^\s*•\s*/,
  /^(tap|click|press)\s+(to|here)/i,
  /learn more$/i
];

/**
 * Check if a title is generic (Facebook UI element, not an actual product title)
 * @param {string} text - The text to check
 * @returns {boolean} - True if the text is generic/invalid
 */
export function isGenericTitle(text) {
  if (!text) return true;

  const lower = text.toLowerCase().trim();

  // Check exact matches
  if (EXACT_MATCHES.includes(lower)) return true;

  // Check UI patterns
  for (const pattern of UI_PATTERNS) {
    if (pattern.test(text)) return true;
  }

  // Too short to be a real title
  return text.length < TITLE_MIN_LENGTH;
}

/**
 * Check if text is a valid product title
 * @param {string} text - The text to validate
 * @returns {boolean} - True if valid product title
 */
export function isValidProductTitle(text) {
  if (!text) return false;
  if (isGenericTitle(text)) return false;
  if (text.length < TITLE_MIN_LENGTH) return false;
  if (text.length > TITLE_MAX_LENGTH) return false;

  // Don't accept prices as titles
  if (text.startsWith('$')) return false;

  // Don't accept pure numbers
  if (/^\d+$/.test(text)) return false;

  return true;
}

/**
 * Check if a listing appears suspicious (very low price for expensive items)
 * @param {number} price - The listing price
 * @param {string} title - The listing title
 * @returns {boolean} - True if suspicious
 */
export function isSuspiciousListing(price, title) {
  if (!price || !title) return false;

  const highValueKeywords = /iphone|ipad|macbook|playstation|ps5|xbox|nintendo|airpods/i;
  return price < 10 && highValueKeywords.test(title);
}
