// FlipRadar DOM Scraper
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

import { getLastExtractedData } from './state.js';
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
 * @returns {Promise<boolean>} - True if new content detected, false if timeout
 */
export function waitForNewContent(previousTitle, currentItemId, timeout = CONTENT_WAIT_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const lastData = getLastExtractedData();

    // If re-clicking same item with cached data, skip wait
    if (lastData?.itemId === currentItemId && lastData?.title) {
      console.log('[FlipRadar] Same item, using cached title:', lastData.title);
      resolve(true);
      return;
    }

    const check = () => {
      const currentTitle = extractTitle();
      const elapsed = Date.now() - startTime;
      const isGeneric = isGenericTitle(currentTitle);

      // Content changed to a real title (different from previous)
      if (currentTitle && !isGeneric && currentTitle !== previousTitle && elapsed >= MIN_WAIT_MS) {
        console.log('[FlipRadar] Content changed, new title:', currentTitle);
        resolve(true);
        return;
      }

      // First load - wait for any real title after minimum wait
      if (!previousTitle && currentTitle && !isGeneric && elapsed >= MIN_WAIT_MS) {
        console.log('[FlipRadar] First load, found title:', currentTitle);
        resolve(true);
        return;
      }

      // Timeout reached
      if (elapsed > timeout) {
        console.log('[FlipRadar] Timeout waiting for content change, current title:', currentTitle);
        resolve(false);
        return;
      }

      // Check again in 200ms
      setTimeout(check, 200);
    };

    check();
  });
}

/**
 * Extract title using tiered selectors and prominence scoring
 * @returns {string|null}
 */
export function extractTitle() {
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
          console.log('[FlipRadar] Found title via selector:', text);
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
      console.log('[FlipRadar] Found title by prominence:', candidates[0].text);
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
      console.log('[FlipRadar] Found title in heading:', text);
      return text;
    }
  }

  console.log('[FlipRadar] Could not extract title');
  return null;
}

/**
 * Extract price using tiered selectors and prominence scoring
 * @returns {number|null}
 */
export function extractPrice() {
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
          console.log('[FlipRadar] Found price near title:', price);
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
      console.log('[FlipRadar] Found prominent price:', mainPrice.price, 'fontSize:', mainPrice.fontSize);
      return mainPrice.price;
    }

    // Fall back to largest font price
    console.log('[FlipRadar] Using largest price:', priceElements[0].price);
    return priceElements[0].price;
  }

  // Strategy 3: Look in main content area text
  const mainContent = getMainContent();
  if (mainContent) {
    const text = mainContent.innerText;
    const priceMatch = text.match(/\$[\d,]+(\.\d{2})?/);
    if (priceMatch) {
      const price = parsePrice(priceMatch[0]);
      console.log('[FlipRadar] Found price in main content:', price);
      return price;
    }
  }

  console.log('[FlipRadar] Could not extract price');
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
 * @returns {string|null}
 */
export function extractImageUrl() {
  const selectors = getAllSelectors(IMAGE_SELECTORS);

  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el && el.src) {
        return el.src;
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
