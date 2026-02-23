// FlipChecker DOM Scraper
// Extracts listing data from Facebook Marketplace DOM

import {
  TITLE_SELECTORS,
  PRICE_SELECTORS,
  LOCATION_SELECTORS,
  SELLER_SELECTORS,
  IMAGE_SELECTORS,
  getAllSelectors,
  PRICE_REGEX,
  LOCATION_PATTERNS,
  TIME_LISTED_PATTERNS
} from './selectors.js';

import {
  MIN_WAIT_MS,
  CONTENT_WAIT_TIMEOUT_MS,
  TITLE_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  PRICE_MIN_VALUE,
  PRICE_MIN_FONT_SIZE
} from './config.js';

import { getLastExtractedData, isJobCurrent } from './state.js';
import { isGenericTitle, isValidProductTitle } from './utils/filters.js';
import { getFontSize, getMainContent } from './utils/dom.js';
import { parsePrice } from './utils/pricing.js';

/**
 * Extract item ID from current URL
 * @returns {string|null}
 */
export function getItemId() {
  const match = window.location.href.match(/\/marketplace\/item\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Check if current page is a marketplace item page
 * @returns {boolean}
 */
export function isMarketplaceItemPage() {
  return window.location.href.includes('/marketplace/item/');
}

/**
 * Wait for new content to appear in DOM
 * Used to detect when Facebook has finished rendering new item data after SPA navigation
 *
 * @param {string|null} previousTitle - Previous item's title (for comparison)
 * @param {string} currentItemId - Current item ID from URL
 * @param {number} timeout - Maximum wait time in ms
 * @param {string|null} jobId - Job ID for cancellation (if provided, polling stops when job is no longer current)
 * @returns {Promise<boolean>} - True if new content detected, false if timeout or cancelled
 */
export function waitForNewContent(previousTitle, currentItemId, timeout = CONTENT_WAIT_TIMEOUT_MS, jobId = null) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const lastData = getLastExtractedData();

    // If re-clicking same item with cached data, skip wait
    if (lastData?.itemId === currentItemId && lastData?.title) {
      console.log('[FlipChecker] Same item, using cached title:', lastData.title);
      resolve(true);
      return;
    }

    const check = () => {
      // Self-cancel if the job is no longer current
      if (jobId && !isJobCurrent(jobId)) {
        console.log('[FlipChecker] waitForNewContent cancelled — job no longer current');
        resolve(false);
        return;
      }

      const currentTitle = extractTitle();
      const elapsed = Date.now() - startTime;
      const isGeneric = isGenericTitle(currentTitle);

      // Check if document.title has changed
      const titleReady = currentTitle && !isGeneric && currentTitle !== previousTitle && elapsed >= MIN_WAIT_MS;
      const firstLoad = !previousTitle && currentTitle && !isGeneric && elapsed >= MIN_WAIT_MS;

      if (titleReady || firstLoad) {
        // Also verify the actual DOM has re-rendered (not just document.title).
        // Facebook updates document.title before re-rendering DOM elements,
        // so we check that a DOM heading matches the new document.title content.
        const domTitle = getDomRenderedTitle();
        // DOM is settled when the rendered heading matches the new item's title
        // (from document.title), not just when it differs from the old one.
        const domMatchesNew = domTitle && titlesMatch(currentTitle, domTitle);

        if (domMatchesNew) {
          console.log('[FlipChecker] Content changed, new title:', currentTitle, 'DOM title:', domTitle);
          resolve(true);
          return;
        }

        // DOM hasn't caught up yet — keep polling (unless timeout)
        console.log('[FlipChecker] document.title updated but DOM not settled yet. docTitle:', currentTitle, 'domTitle:', domTitle);
      }

      // Timeout reached
      if (elapsed > timeout) {
        console.log('[FlipChecker] Timeout waiting for content change, current title:', currentTitle);
        resolve('timeout');
        return;
      }

      // Check again in 200ms
      setTimeout(check, 200);
    };

    check();
  });
}

/**
 * Get the title as rendered in the actual DOM (not document.title).
 * Used to verify the DOM has re-rendered after SPA navigation.
 * @returns {string|null}
 */
function getDomRenderedTitle() {
  // Check h1 elements
  const headings = document.querySelectorAll('h1, [role="heading"][aria-level="1"]');
  for (const h of headings) {
    const text = h.textContent.trim();
    if (text.length > 10 && text.length < 200 &&
        !text.startsWith('$') && !/^\d+$/.test(text) &&
        !isGenericTitle(text)) {
      return text;
    }
  }

  // Check prominent spans in main content
  const mainContent = getMainContent();
  if (mainContent) {
    const spans = mainContent.querySelectorAll('span[dir="auto"]');
    for (const span of spans) {
      const text = span.textContent.trim();
      const fontSize = getFontSize(span);
      if (text.length > 10 && text.length < 200 && fontSize >= 20 &&
          !text.startsWith('$') && !/^\d+$/.test(text) &&
          !isGenericTitle(text)) {
        return text;
      }
    }
  }

  return null;
}

/**
 * Check if two titles refer to the same item.
 * Handles the prefix difference: document.title may include "Marketplace - " prefix
 * while DOM headings may not, and vice versa.
 * @param {string} a - First title
 * @param {string} b - Second title
 * @returns {boolean}
 */
function titlesMatch(a, b) {
  if (!a || !b) return false;
  // Strip "Marketplace - " prefix from both
  const cleanA = a.replace(/^Marketplace\s*[-–]\s*/i, '').trim().toLowerCase();
  const cleanB = b.replace(/^Marketplace\s*[-–]\s*/i, '').trim().toLowerCase();
  // Exact match after cleaning
  if (cleanA === cleanB) return true;
  // One contains the other (handles truncation)
  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;
  // Check first N significant characters match (FB can truncate differently)
  const minLen = Math.min(cleanA.length, cleanB.length, 30);
  if (minLen >= 15 && cleanA.substring(0, minLen) === cleanB.substring(0, minLen)) return true;
  return false;
}

/**
 * Parse item title from document.title (most reliable source)
 * Facebook sets document.title to: "Item Name - $100 | Facebook Marketplace"
 * @returns {string|null}
 */
function parseTitleFromDocumentTitle() {
  const docTitle = document.title || '';
  if (!docTitle) return null;

  // Strip FB suffixes: " | Facebook", " | Marketplace", " - Facebook Marketplace"
  let parsed = docTitle
    .replace(/\s*[\|\-]\s*(Facebook|Marketplace).*$/i, '')
    .trim();

  if (!parsed || parsed.length < 5) return null;

  // Strip trailing price (e.g., "Soldano 2x12 cabinet - $100")
  const titleOnly = parsed.replace(/\s*[-–]\s*\$[\d,]+.*$/, '').trim();
  if (titleOnly && titleOnly.length >= 5) {
    parsed = titleOnly;
  }

  // Reject if it's a generic/non-product title
  if (isGenericTitle(parsed) || parsed.startsWith('$') || /^\d+$/.test(parsed)) {
    return null;
  }

  return parsed;
}

/**
 * Parse price from document.title
 * @returns {number|null}
 */
function parsePriceFromDocumentTitle() {
  const docTitle = document.title || '';
  const match = docTitle.match(/\$[\d,]+/);
  if (match) {
    const price = parsePrice(match[0]);
    if (price >= PRICE_MIN_VALUE) {
      return price;
    }
  }
  return null;
}

/**
 * Extract title using tiered selectors and prominence scoring
 * @returns {string|null}
 */
export function extractTitle() {
  // Tier 0: Parse from document.title (most reliable — same source as popup)
  // Facebook always updates document.title on SPA navigation
  const docTitleResult = parseTitleFromDocumentTitle();
  if (docTitleResult) {
    console.log('[FlipChecker] Found title via document.title:', docTitleResult);
    return docTitleResult;
  }

  // Tier 1 & 2: Try specific selectors first
  const selectors = getAllSelectors(TITLE_SELECTORS);

  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const text = el.textContent.trim();
        // Product titles are descriptive (longer), not prices, not generic
        if (text.length > 15 && text.length < TITLE_MAX_LENGTH &&
            !text.startsWith('$') &&
            !/^\d+$/.test(text) &&
            !isGenericTitle(text)) {
          console.log('[FlipChecker] Found title via selector:', text);
          return text;
        }
      }
    } catch (e) {
      // Invalid selector, continue
    }
  }

  // Tier 3: Look for prominent text in main content area
  // The title is usually the largest text block that's not a price
  const mainContent = getMainContent();
  if (mainContent) {
    const spans = mainContent.querySelectorAll('span[dir="auto"]');
    const candidates = [];

    for (const span of spans) {
      const text = span.textContent.trim();
      if (text.length > 15 && text.length < 200 &&
          !text.startsWith('$') &&
          !isGenericTitle(text) &&
          !/^\d+$/.test(text)) {
        const fontSize = getFontSize(span);
        candidates.push({ text, fontSize, element: span });
      }
    }

    // Sort by font size (larger = more prominent = likely title)
    candidates.sort((a, b) => b.fontSize - a.fontSize);

    if (candidates.length > 0) {
      console.log('[FlipChecker] Found title by prominence:', candidates[0].text);
      return candidates[0].text;
    }
  }

  // Tier 4: Fallback to h1/headings (but filter generic titles)
  const headings = document.querySelectorAll('h1, h2, [role="heading"]');
  for (const h of headings) {
    const text = h.textContent.trim();
    if (text.length > 10 && text.length < TITLE_MAX_LENGTH &&
        !isGenericTitle(text) &&
        !text.startsWith('$')) {
      console.log('[FlipChecker] Found title in heading:', text);
      return text;
    }
  }

  console.log('[FlipChecker] Could not extract title');
  return null;
}

/**
 * Extract price using tiered selectors and prominence scoring
 * @returns {number|null}
 */
export function extractPrice() {
  // Strategy 0: Parse from document.title (most reliable)
  const docPrice = parsePriceFromDocumentTitle();
  if (docPrice) {
    console.log('[FlipChecker] Found price via document.title:', docPrice);
    return docPrice;
  }

  // Strategy 1: Look for price near the title (h1)
  // The listing price is usually displayed prominently near the title
  const h1 = document.querySelector('h1');
  if (h1) {
    const parent = h1.closest('div');
    if (parent) {
      const nearbySpans = parent.parentElement?.querySelectorAll('span') || [];
      for (const span of nearbySpans) {
        const text = span.textContent.trim();
        if (PRICE_REGEX.test(text)) {
          const price = parsePrice(text);
          console.log('[FlipChecker] Found price near title:', price);
          return price;
        }
      }
    }
  }

  // Strategy 2: Look for large/prominent price elements
  // FB usually shows the listing price in a larger font
  const allSpans = document.querySelectorAll('span');
  const priceElements = [];

  for (const span of allSpans) {
    const text = span.textContent.trim();
    if (PRICE_REGEX.test(text)) {
      const fontSize = getFontSize(span);
      const price = parsePrice(text);
      priceElements.push({ element: span, price, fontSize });
    }
  }

  // Sort by font size (larger = more prominent = likely the listing price)
  priceElements.sort((a, b) => b.fontSize - a.fontSize);

  if (priceElements.length > 0) {
    // Filter out very small prices (likely shipping costs or other items)
    // The listing price is usually >= $5 and shown in larger font
    const mainPrice = priceElements.find(p =>
      p.price >= PRICE_MIN_VALUE && p.fontSize >= PRICE_MIN_FONT_SIZE
    );
    if (mainPrice) {
      console.log('[FlipChecker] Found prominent price:', mainPrice.price, 'fontSize:', mainPrice.fontSize);
      return mainPrice.price;
    }

    // Fall back to largest font price
    console.log('[FlipChecker] Using largest price:', priceElements[0].price);
    return priceElements[0].price;
  }

  // Strategy 3: Look in main content area text
  const mainContent = getMainContent();
  if (mainContent) {
    const text = mainContent.innerText;
    const priceMatch = text.match(/\$[\d,]+(\.\d{2})?/);
    if (priceMatch) {
      const price = parsePrice(priceMatch[0]);
      console.log('[FlipChecker] Found price in main content:', price);
      return price;
    }
  }

  console.log('[FlipChecker] Could not extract price');
  return null;
}

/**
 * Extract location from listing
 * @returns {string|null}
 */
export function extractLocation() {
  const selectors = getAllSelectors(LOCATION_SELECTORS);

  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const text = el.textContent.trim();

        // Check against known location patterns
        for (const pattern of LOCATION_PATTERNS) {
          const match = text.match(pattern);
          if (match) {
            return match[1] || text;
          }
        }

        // Check for city, state format (e.g., "Boston, MA")
        if (/^[A-Z][a-z]+,?\s*[A-Z]{2}$/.test(text)) {
          return text;
        }
      }
    } catch (e) {
      // Invalid selector, continue
    }
  }

  return null;
}

/**
 * Extract seller name
 * @returns {string|null}
 */
export function extractSeller() {
  const selectors = getAllSelectors(SELLER_SELECTORS);

  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim() && el.textContent.trim().length < 50) {
        return el.textContent.trim();
      }
    } catch (e) {
      // Invalid selector, continue
    }
  }

  return null;
}

/**
 * Extract how long the item has been listed
 * @returns {string|null}
 */
export function extractDaysListed() {
  const spans = document.querySelectorAll('span');
  for (const span of spans) {
    const text = span.textContent.trim();
    for (const pattern of TIME_LISTED_PATTERNS) {
      if (pattern.test(text)) {
        return text;
      }
    }
  }

  return null;
}

/**
 * Extract primary image URL
 * Uses querySelectorAll + size filtering to skip avatars/icons/ads
 * and find the actual product listing photo.
 * @returns {string|null}
 */
export function extractImageUrl() {
  const MIN_IMAGE_SIZE = 200; // Skip icons, avatars, and thumbnails
  const selectors = getAllSelectors(IMAGE_SELECTORS);

  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      let bestCandidate = null;
      let bestSize = 0;

      for (const el of elements) {
        if (!el.src) continue;

        // Use naturalWidth/naturalHeight (actual image dimensions, not CSS)
        const w = el.naturalWidth || el.width || 0;
        const h = el.naturalHeight || el.height || 0;
        const size = Math.max(w, h);

        // Accept any image from tier1/tier2 selectors that meets minimum size
        if (size >= MIN_IMAGE_SIZE && size > bestSize) {
          bestCandidate = el.src;
          bestSize = size;
        }
      }

      if (bestCandidate) {
        console.log('[FlipChecker] Found image via selector:', selector, 'size:', bestSize);
        return bestCandidate;
      }
    } catch (e) {
      // Invalid selector, continue
    }
  }

  return null;
}

/**
 * Extract all listing data from DOM
 * @param {string} itemId - Item ID from URL
 * @returns {object} - Extracted listing data
 */
export function extractAllData(itemId) {
  return {
    title: extractTitle(),
    price: extractPrice(),
    location: extractLocation(),
    seller: extractSeller(),
    daysListed: extractDaysListed(),
    imageUrl: extractImageUrl(),
    itemId: itemId,
    source: 'dom'
  };
}
