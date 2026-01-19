// FlipRadar DOM Utilities

import { PAGE_TEXT_MAX_LENGTH } from '../config.js';

/**
 * Query element with multiple fallback selectors
 * Tries each selector in order and returns the first match
 * @param {string[]} selectors - Array of CSS selectors to try
 * @param {Element} context - Optional context element (defaults to document)
 * @returns {{ element: Element|null, selector: string|null }}
 */
export function queryWithFallback(selectors, context = document) {
  for (const selector of selectors) {
    try {
      const el = context.querySelector(selector);
      if (el) {
        return { element: el, selector };
      }
    } catch (e) {
      // Invalid selector, continue to next
    }
  }
  return { element: null, selector: null };
}

/**
 * Query all elements with multiple fallback selectors
 * Returns elements from the first selector that has matches
 * @param {string[]} selectors - Array of CSS selectors to try
 * @param {Element} context - Optional context element (defaults to document)
 * @returns {{ elements: Element[], selector: string|null }}
 */
export function queryAllWithFallback(selectors, context = document) {
  for (const selector of selectors) {
    try {
      const els = context.querySelectorAll(selector);
      if (els.length > 0) {
        return { elements: Array.from(els), selector };
      }
    } catch (e) {
      // Invalid selector, continue to next
    }
  }
  return { elements: [], selector: null };
}

/**
 * Get computed font size of an element
 * @param {Element} element
 * @returns {number} - Font size in pixels
 */
export function getFontSize(element) {
  const style = window.getComputedStyle(element);
  return parseFloat(style.fontSize) || 0;
}

/**
 * Get main content area of the page
 * @returns {Element|null}
 */
export function getMainContent() {
  return document.querySelector('div[role="main"]');
}

/**
 * Extract text content from page for AI extraction
 * @param {number} maxLength - Maximum length of text to return
 * @returns {string}
 */
export function getPageText(maxLength = PAGE_TEXT_MAX_LENGTH) {
  const mainContent = getMainContent();
  if (mainContent) {
    return mainContent.innerText.substring(0, maxLength);
  }
  return document.body.innerText.substring(0, maxLength);
}

/**
 * Wait for an element matching any of the selectors to appear
 * Uses MutationObserver for efficient DOM watching
 * @param {string[]} selectors - Selectors to wait for
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Element|null>}
 */
export function waitForSelector(selectors, timeout = 8000) {
  return new Promise((resolve) => {
    // Check if element already exists
    const { element } = queryWithFallback(selectors);
    if (element) {
      resolve(element);
      return;
    }

    // Set up observer
    const observer = new MutationObserver(() => {
      const { element } = queryWithFallback(selectors);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Timeout
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize URL to prevent javascript: and data: XSS attacks
 * @param {string} url
 * @returns {string}
 */
export function sanitizeUrl(url) {
  if (!url) return '#';
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) ? url : '#';
  } catch {
    return '#';
  }
}
