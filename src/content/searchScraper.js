// FlipChecker Search Page Scraper
// Extracts listing cards from Facebook Marketplace search results DOM

import { parsePrice } from './utils/pricing.js';

/**
 * Check if current URL is a Facebook Marketplace search/browse results page
 * (not an individual item page, profile page, or "your items" page)
 * @param {string} url
 * @returns {boolean}
 */
export function isSearchResultsPage(url) {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    const path = parsed.pathname;

    // Must be on facebook.com/marketplace
    if (!path.startsWith('/marketplace')) return false;

    // Exclude specific non-search pages
    if (path.includes('/marketplace/item/')) return false;
    if (path.includes('/marketplace/profile/')) return false;
    if (path.includes('/marketplace/you/')) return false;
    if (path.includes('/marketplace/create')) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Extract listing card data from Facebook Marketplace search results
 * @returns {Array<{id: string, title: string, price: number, url: string, cardElement: Element}>}
 */
export function extractListingCards() {
  const cards = [];
  const seenIds = new Set();

  // Find all links to marketplace items
  const links = document.querySelectorAll('a[href*="/marketplace/item/"]');

  for (const link of links) {
    // Extract item ID from href
    const match = link.href.match(/\/marketplace\/item\/(\d+)/);
    if (!match) continue;

    const id = match[1];
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    // Walk up to find the card container
    // The card is typically a parent div containing both the link and price/title text
    const cardElement = findCardContainer(link);
    if (!cardElement) continue;

    // Extract title
    const title = extractCardTitle(cardElement);
    if (!title) continue;

    // Extract price
    const price = extractCardPrice(cardElement);
    if (price === null) continue;

    const url = link.href.split('?')[0]; // Clean URL

    cards.push({ id, title, price, url, cardElement });
  }

  return cards;
}

/**
 * Find the card container element by walking up from the link
 * @param {Element} link
 * @returns {Element|null}
 */
function findCardContainer(link) {
  // Walk up to find a reasonable card container
  // FB typically nests the link inside a card div
  let el = link;
  for (let i = 0; i < 6; i++) {
    if (!el.parentElement) break;
    el = el.parentElement;

    // A card container usually has both text content and an image
    const hasImage = el.querySelector('img');
    const textContent = el.textContent || '';
    const hasPricePattern = /\$[\d,]+/.test(textContent);

    if (hasImage && hasPricePattern && textContent.length > 20) {
      return el;
    }
  }

  // Fallback: use the link's closest significant parent
  return link.closest('div[class]') || link.parentElement;
}

/**
 * Extract the listing title from a card element
 * @param {Element} card
 * @returns {string|null}
 */
function extractCardTitle(card) {
  // Look for span elements with dir="auto" that contain meaningful title text
  const spans = card.querySelectorAll('span[dir="auto"]');

  for (const span of spans) {
    const text = span.textContent?.trim();
    if (!text) continue;

    // Skip price-like text
    if (/^\$[\d,]+/.test(text)) continue;

    // Skip very short or generic text
    if (text.length < 10) continue;

    // Skip common non-title text
    if (/^(Listed|Free|Pending|Available|Sold|New|Used)$/i.test(text)) continue;

    return text;
  }

  return null;
}

/**
 * Extract the listing price from a card element
 * @param {Element} card
 * @returns {number|null}
 */
function extractCardPrice(card) {
  // Look for spans containing price patterns
  const spans = card.querySelectorAll('span');

  for (const span of spans) {
    const text = span.textContent?.trim();
    if (!text) continue;

    // Match price pattern: $X,XXX or $X
    if (/^\$[\d,]+(\.\d{2})?$/.test(text)) {
      const price = parsePrice(text);
      if (price !== null && price > 0) {
        return price;
      }
    }
  }

  return null;
}
