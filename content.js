// FlipRadar - Content Script for Facebook Marketplace
(function() {
  'use strict';

  // Constants
  const OVERLAY_ID = 'flipradar-overlay';
  const API_BASE_URL = 'https://flipradar-iaxg.vercel.app';
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  const MAX_LOCAL_DEALS = 100;
  const EBAY_FEE_MULTIPLIER = 0.84; // 13% eBay + 3% payment fees

  let currentUrl = window.location.href;
  let authToken = null;
  let currentUser = null;
  let lastExtractedData = null; // Track previous item's data to detect changes

  // Extract item ID from Facebook Marketplace URL
  function getItemId() {
    const match = window.location.href.match(/\/marketplace\/item\/(\d+)/);
    return match ? match[1] : null;
  }

  // Wait for the DOM to actually show new item content
  function waitForNewContent(previousTitle, timeout = 5000) {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const check = () => {
        const currentTitle = extractors.getTitle();

        // Content has changed (different title) or we found a title when there wasn't one
        if (currentTitle && currentTitle !== previousTitle) {
          console.log('[FlipRadar] Content changed, new title:', currentTitle);
          resolve(true);
          return;
        }

        // Timeout reached
        if (Date.now() - startTime > timeout) {
          console.log('[FlipRadar] Timeout waiting for content change');
          resolve(false);
          return;
        }

        // Check again in 200ms
        setTimeout(check, 200);
      };

      check();
    });
  }

  // Initialize auth state
  async function initAuth() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'getAuthToken' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[FlipRadar] Error loading auth state:', chrome.runtime.lastError);
          resolve();
          return;
        }
        if (response) {
          authToken = response.token;
          currentUser = response.user;
        }
        resolve();
      });
    });
  }

  // DOM Extraction with multiple fallback strategies
  const extractors = {
    // Extract listing title
    getTitle: function() {
      // Strategy 1: Get the h1 element directly (most reliable)
      const h1 = document.querySelector('h1');
      if (h1) {
        // Get the text content, but try to get the most specific text
        // Sometimes h1 contains nested spans
        const spans = h1.querySelectorAll('span');
        if (spans.length > 0) {
          // Find the span with actual product title text
          for (const span of spans) {
            const text = span.textContent.trim();
            // Product titles are usually longer and don't contain just prices
            if (text.length > 10 && !text.startsWith('$') && !/^\d+$/.test(text)) {
              console.log('[FlipRadar] Found title in h1 span:', text);
              return text;
            }
          }
        }
        // Fall back to full h1 text
        const h1Text = h1.textContent.trim();
        if (h1Text.length > 5 && h1Text.length < 300) {
          console.log('[FlipRadar] Found title in h1:', h1Text);
          return h1Text;
        }
      }

      // Strategy 2: Look for marketplace-specific elements
      const selectors = [
        '[data-testid="marketplace_pdp_component"] h1',
        'div[role="main"] h1',
        '[role="heading"][aria-level="1"]'
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent.trim()) {
          const text = el.textContent.trim();
          if (text.length > 5 && text.length < 300) {
            console.log('[FlipRadar] Found title via selector:', text);
            return text;
          }
        }
      }

      // Strategy 3: Look for any prominent heading
      const headings = document.querySelectorAll('h1, h2, [role="heading"]');
      for (const h of headings) {
        const text = h.textContent.trim();
        // Product titles are usually descriptive (longer than 10 chars)
        // and don't start with $ or common UI text
        if (text.length > 10 && text.length < 300 &&
            !text.startsWith('$') &&
            !text.toLowerCase().includes('marketplace') &&
            !text.toLowerCase().includes('facebook')) {
          console.log('[FlipRadar] Found title in heading:', text);
          return text;
        }
      }

      console.log('[FlipRadar] Could not extract title');
      return null;
    },

    // Extract price
    getPrice: function() {
      const priceRegex = /^\$[\d,]+(\.\d{2})?$/;

      // Strategy 1: Look for price near the title (h1)
      // The listing price is usually displayed prominently near the title
      const h1 = document.querySelector('h1');
      if (h1) {
        // Look at siblings and nearby elements
        const parent = h1.closest('div');
        if (parent) {
          const nearbySpans = parent.parentElement?.querySelectorAll('span') || [];
          for (const span of nearbySpans) {
            const text = span.textContent.trim();
            if (priceRegex.test(text)) {
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
        if (priceRegex.test(text)) {
          const style = window.getComputedStyle(span);
          const fontSize = parseFloat(style.fontSize) || 0;
          const price = parsePrice(text);
          priceElements.push({ element: span, price, fontSize });
        }
      }

      // Sort by font size (larger = more prominent = likely the listing price)
      priceElements.sort((a, b) => b.fontSize - a.fontSize);

      if (priceElements.length > 0) {
        // Filter out very small prices (likely shipping costs or other items)
        // The listing price is usually > $5 and shown in larger font
        const mainPrice = priceElements.find(p => p.price >= 5 && p.fontSize >= 14);
        if (mainPrice) {
          console.log('[FlipRadar] Found prominent price:', mainPrice.price, 'fontSize:', mainPrice.fontSize);
          return mainPrice.price;
        }

        // Fall back to largest font price
        console.log('[FlipRadar] Using largest price:', priceElements[0].price);
        return priceElements[0].price;
      }

      // Strategy 3: Look in main content area
      const mainContent = document.querySelector('div[role="main"]');
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
    },

    // Extract location
    getLocation: function() {
      const locationPatterns = [
        /Listed in (.+)/i,
        /Location: (.+)/i,
        /in ([A-Z][a-z]+,?\s*[A-Z]{2})/
      ];

      const selectors = [
        'span[dir="auto"]',
        'div[role="main"] span',
        'a[href*="/marketplace/"]'
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent.trim();
          for (const pattern of locationPatterns) {
            const match = text.match(pattern);
            if (match) {
              return match[1] || text;
            }
          }
          if (/^[A-Z][a-z]+,?\s*[A-Z]{2}$/.test(text)) {
            return text;
          }
        }
      }

      return null;
    },

    // Extract seller name
    getSeller: function() {
      const selectors = [
        'a[href*="/marketplace/profile/"] span',
        '[data-testid="marketplace_pdp_seller_name"]',
        'a[role="link"][href*="/profile.php"] span',
        'a[role="link"][href*="facebook.com/"][href*="/"]'
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent.trim() && el.textContent.trim().length < 50) {
          return el.textContent.trim();
        }
      }

      return null;
    },

    // Extract days listed
    getDaysListed: function() {
      const patterns = [
        /Listed (\d+) (day|week|hour|minute)s? ago/i,
        /(\d+) (day|week|hour|minute)s? ago/i
      ];

      const spans = document.querySelectorAll('span');
      for (const span of spans) {
        const text = span.textContent.trim();
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            return text;
          }
        }
      }

      return null;
    },

    // Extract image URL
    getImageUrl: function() {
      const selectors = [
        'img[data-testid="marketplace_pdp_image"]',
        'div[role="main"] img',
        'img[src*="scontent"]'
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.src) {
          return el.src;
        }
      }

      return null;
    }
  };

  // Parse price string to number
  function parsePrice(priceStr) {
    if (!priceStr) return null;
    const cleaned = priceStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  // Format price for display
  function formatPrice(price) {
    if (price === null || price === undefined) return 'N/A';
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Sanitize URL to prevent javascript: and data: XSS attacks
  function sanitizeUrl(url) {
    if (!url) return '#';
    try {
      const parsed = new URL(url);
      return ['https:', 'http:'].includes(parsed.protocol) ? url : '#';
    } catch {
      return '#';
    }
  }

  // Generate eBay search URL
  function getEbayUrl(title) {
    if (!title) return null;
    const cleanTitle = title
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);

    const encoded = encodeURIComponent(cleanTitle);
    return `https://www.ebay.com/sch/i.html?_nkw=${encoded}&LH_Complete=1&LH_Sold=1&_sop=13`;
  }

  // Fetch price data from API
  async function fetchPriceData(title) {
    if (!authToken) {
      return { error: 'auth_required' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/price-lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ title })
      });

      if (response.status === 401) {
        return { error: 'auth_required' };
      }

      if (response.status === 429) {
        const data = await response.json();
        return { error: 'limit_reached', message: data.error };
      }

      if (!response.ok) {
        return { error: 'api_error' };
      }

      return await response.json();
    } catch (error) {
      // Network error - will show overlay without API data
      return { error: 'network_error' };
    }
  }

  // Extract listing data using AI (backend)
  // Note: This requires the /api/extract endpoint to be implemented on the backend
  // If not available, falls back to DOM extraction silently
  async function extractWithAI() {
    if (!authToken) {
      // No auth token - skip AI extraction silently
      return null;
    }

    try {
      // Get page text content (limit to avoid huge payloads)
      const pageText = document.body.innerText.substring(0, 8000);

      const response = await fetch(`${API_BASE_URL}/api/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          pageText,
          url: window.location.href
        })
      });

      if (!response.ok) {
        // Endpoint may not exist yet - this is expected, fall back silently
        return null;
      }

      const data = await response.json();
      console.log('[FlipRadar] AI extracted data:', data);
      return data;
    } catch (error) {
      // Network error or endpoint not available - fall back to DOM extraction silently
      return null;
    }
  }

  // Check if stored data is fresh (less than 24 hours old)
  function isDataFresh(timestamp) {
    if (!timestamp) return false;
    const age = Date.now() - timestamp;
    return age < CACHE_TTL_MS;
  }

  // Check for stored sold data that matches the current item
  async function getStoredSoldData(title) {
    return new Promise((resolve) => {
      if (!title) {
        resolve(null);
        return;
      }

      // Create a simplified key from the title
      const queryKey = title
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, '_')
        .substring(0, 50);

      const storageKey = `flipradar_sold_${queryKey}`;

      // Try exact match first, then fall back to last lookup
      chrome.storage.local.get([storageKey, 'flipradar_last_sold'], (result) => {
        // Check if we have an exact match
        if (result[storageKey] && isDataFresh(result[storageKey].timestamp)) {
          resolve(result[storageKey]);
          return;
        }

        // Check if last lookup is relevant (fuzzy match on query)
        // Only use if there's very strong overlap to avoid showing wrong data
        if (result.flipradar_last_sold && isDataFresh(result.flipradar_last_sold.timestamp)) {
          const lastQuery = result.flipradar_last_sold.query.toLowerCase();
          const currentTitle = title.toLowerCase();

          // Check if there's meaningful overlap - require stronger match
          const lastWords = lastQuery.split(/\s+/).filter(w => w.length > 3);
          const titleWords = currentTitle.split(/\s+/).filter(w => w.length > 3);
          const overlap = lastWords.filter(w => titleWords.some(tw => tw.includes(w) || w.includes(tw)));

          // Require at least 50% word overlap for fuzzy match
          const overlapRatio = titleWords.length > 0 ? overlap.length / titleWords.length : 0;
          console.log('[FlipRadar] Fuzzy match check - overlap:', overlap.length, 'ratio:', overlapRatio);

          if (overlapRatio >= 0.5 && overlap.length >= 2) {
            console.log('[FlipRadar] Using fuzzy matched sold data');
            resolve(result.flipradar_last_sold);
            return;
          }
        }

        resolve(null);
      });
    });
  }

  // Save deal to API
  async function saveDealToApi(data, priceData) {
    if (!authToken) {
      // Fall back to local storage
      saveDealLocally(data);
      return { success: true, local: true };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          source_url: window.location.href,
          user_title: data.title,
          user_asking_price: data.price,
          ebay_estimate_low: priceData?.ebay_low,
          ebay_estimate_high: priceData?.ebay_high,
          ebay_search_url: priceData?.ebay_url || getEbayUrl(data.title)
        })
      });

      if (response.status === 401) {
        saveDealLocally(data);
        return { success: true, local: true };
      }

      if (response.status === 429) {
        return { success: false, error: 'Deal limit reached. Upgrade to save more.' };
      }

      if (!response.ok) {
        saveDealLocally(data);
        return { success: true, local: true };
      }

      return { success: true };
    } catch (error) {
      // Network error - fall back to local storage silently
      saveDealLocally(data);
      return { success: true, local: true };
    }
  }

  // Save deal to local storage (fallback)
  function saveDealLocally(data) {
    const deal = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: data.title || 'Unknown Item',
      price: data.price,
      url: window.location.href,
      ebayUrl: getEbayUrl(data.title),
      savedAt: new Date().toISOString()
    };

    chrome.storage.local.get(['savedDeals'], (result) => {
      const deals = result.savedDeals || [];
      deals.unshift(deal);
      if (deals.length > MAX_LOCAL_DEALS) {
        deals.pop();
      }
      chrome.storage.local.set({ savedDeals: deals });
    });
  }

  // Create and inject overlay
  async function createOverlay(data, priceData = null) {
    // Verify we're still on the same item before showing overlay
    const currentItemId = getItemId();
    if (data.itemId && data.itemId !== currentItemId) {
      console.log('[FlipRadar] Data item ID mismatch, aborting overlay. Expected:', data.itemId, 'Current:', currentItemId);
      return;
    }

    const existing = document.getElementById(OVERLAY_ID);
    if (existing) {
      existing.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;

    const shadow = overlay.attachShadow({ mode: 'open' });

    const hasApiData = priceData && !priceData.error;
    const isLoggedIn = !!authToken;
    const needsUpgrade = priceData?.error === 'limit_reached';

    // Calculate profit
    let profitLow = null;
    let profitHigh = null;
    if (hasApiData && data.price) {
      const feeMultiplier = EBAY_FEE_MULTIPLIER;
      profitLow = Math.round((priceData.ebay_low * feeMultiplier) - data.price);
      profitHigh = Math.round((priceData.ebay_high * feeMultiplier) - data.price);
    }

    // Suspicion check
    const suspicious = data.price && data.price < 10 && data.title &&
      /iphone|ipad|macbook|playstation|ps5|xbox|nintendo|airpods/i.test(data.title);

    const styles = `
      <style>
        * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .container {
          background: #1a1a2e;
          color: #ffffff;
          padding: 16px;
          border-radius: 12px;
          width: 300px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          border: 1px solid #2d2d44;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #2d2d44;
        }
        .logo {
          font-weight: 700;
          font-size: 14px;
          color: #4ade80;
        }
        .tier-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          background: #374151;
          color: #9ca3af;
        }
        .tier-flipper { background: #1e40af; color: #93c5fd; }
        .tier-pro { background: #7c3aed; color: #c4b5fd; }
        .close-btn {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          line-height: 1;
        }
        .close-btn:hover { color: #fff; }
        .price-section {
          text-align: center;
          margin-bottom: 12px;
        }
        .current-price {
          font-size: 32px;
          font-weight: 700;
          color: #fff;
        }
        .title {
          font-size: 12px;
          color: #888;
          margin-top: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .warning {
          background: #7f1d1d;
          color: #fca5a5;
          padding: 8px;
          border-radius: 6px;
          font-size: 12px;
          margin-bottom: 12px;
          text-align: center;
        }
        .login-prompt {
          background: #1e3a5f;
          color: #93c5fd;
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          margin-bottom: 12px;
          text-align: center;
        }
        .login-btn {
          background: #3b82f6;
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
        }
        .login-btn:hover { background: #2563eb; }
        .upgrade-prompt {
          background: #3d1f5c;
          color: #c4b5fd;
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          margin-bottom: 12px;
          text-align: center;
        }
        .upgrade-btn {
          background: #7c3aed;
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
        }
        .upgrade-btn:hover { background: #6d28d9; }
        .ebay-section {
          background: #16213e;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 12px;
        }
        .ebay-label {
          font-size: 11px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .ebay-range {
          font-size: 18px;
          font-weight: 600;
          color: #4ade80;
        }
        .source-tag {
          font-size: 10px;
          color: #666;
          margin-top: 4px;
        }
        .profit-section {
          background: #16213e;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 12px;
        }
        .profit-label {
          font-size: 11px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .profit-range {
          font-size: 18px;
          font-weight: 600;
        }
        .profit-positive { color: #4ade80; }
        .profit-negative { color: #f87171; }
        .profit-mixed { color: #fbbf24; }
        .meta {
          font-size: 11px;
          color: #666;
          margin-bottom: 12px;
        }
        .meta-item { margin-bottom: 2px; }
        .buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .btn {
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          text-align: center;
          text-decoration: none;
          display: block;
        }
        .btn-primary { background: #3b82f6; color: #fff; }
        .btn-primary:hover { background: #2563eb; }
        .btn-secondary { background: #374151; color: #fff; }
        .btn-secondary:hover { background: #4b5563; }
        .btn-success { background: #16a34a; color: #fff; }
        .btn-success:hover { background: #15803d; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .saved-msg {
          text-align: center;
          font-size: 12px;
          margin-top: 8px;
          display: none;
        }
        .saved-msg.success { color: #4ade80; }
        .saved-msg.error { color: #f87171; }
        .footer {
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px solid #2d2d44;
          font-size: 10px;
          color: #666;
          text-align: center;
        }
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          color: #888;
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #374151;
          border-top-color: #4ade80;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .samples {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #2d2d44;
        }
        .sample-item {
          font-size: 11px;
          color: #888;
          margin-bottom: 4px;
          display: flex;
          justify-content: space-between;
        }
        .sample-price { color: #4ade80; }
        .ebay-section.real-data {
          background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
          border: 1px solid #10b981;
        }
        .real-badge {
          background: #10b981;
          color: #fff;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 700;
          margin-right: 4px;
        }
        .ebay-stats-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #a7f3d0;
          margin-top: 4px;
        }
        .get-real-data {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #2d2d44;
          font-size: 11px;
          color: #fbbf24;
          text-align: center;
        }
      </style>
    `;

    // Determine profit color class
    let profitClass = 'profit-positive';
    if (profitHigh !== null) {
      if (profitHigh < 0) {
        profitClass = 'profit-negative';
      } else if (profitLow < 0) {
        profitClass = 'profit-mixed';
      }
    }

    // Get tier badge
    let tierBadge = '';
    if (currentUser) {
      const tier = currentUser.tier || 'free';
      if (tier === 'flipper') {
        tierBadge = '<span class="tier-badge tier-flipper">Flipper</span>';
      } else if (tier === 'pro') {
        tierBadge = '<span class="tier-badge tier-pro">Pro</span>';
      } else {
        tierBadge = '<span class="tier-badge">Free</span>';
      }
    }

    const ebayUrl = priceData?.ebay_url || getEbayUrl(data.title);

    let html = `
      ${styles}
      <div class="container">
        <div class="header">
          <span class="logo">FlipRadar ${tierBadge}</span>
          <button class="close-btn" id="close-overlay">&times;</button>
        </div>

        <div class="price-section">
          <div class="current-price">${formatPrice(data.price)}</div>
          <div class="title" title="${escapeHtml(data.title || '')}">${escapeHtml(data.title) || 'Unknown Item'}</div>
        </div>

        ${suspicious ? '<div class="warning">Warning: Price seems suspiciously low</div>' : ''}
    `;

    // Login prompt
    if (!isLoggedIn) {
      html += `
        <div class="login-prompt">
          <div>Sign in for real eBay price data</div>
          <button class="login-btn" id="login-btn">Sign In Free</button>
        </div>
      `;
    }

    // Upgrade prompt
    if (needsUpgrade) {
      html += `
        <div class="upgrade-prompt">
          <div>Daily lookup limit reached</div>
          <button class="upgrade-btn" id="upgrade-btn">Upgrade for More</button>
        </div>
      `;
    }

    // Check for real sold data from eBay page reader
    const soldData = await getStoredSoldData(data.title);
    const hasRealSoldData = soldData && soldData.stats && soldData.stats.count > 0;

    // eBay price section
    if (hasRealSoldData) {
      // Show REAL sold data from eBay page reader
      const stats = soldData.stats;

      // Recalculate profit with real sold data
      if (data.price) {
        const feeMultiplier = 0.84;
        profitLow = Math.round((stats.low * feeMultiplier) - data.price);
        profitHigh = Math.round((stats.high * feeMultiplier) - data.price);

        // Update profit class
        if (profitHigh < 0) {
          profitClass = 'profit-negative';
        } else if (profitLow < 0) {
          profitClass = 'profit-mixed';
        } else {
          profitClass = 'profit-positive';
        }
      }

      html += `
        <div class="ebay-section real-data">
          <div class="ebay-label">
            <span class="real-badge">REAL</span> eBay Sold Prices
          </div>
          <div class="ebay-range">${formatPrice(stats.low)} - ${formatPrice(stats.high)}</div>
          <div class="ebay-stats-row">
            <span>Median: ${formatPrice(stats.median)}</span>
            <span>Avg: ${formatPrice(stats.avg)}</span>
          </div>
          <div class="source-tag">${stats.count} sold listings analyzed</div>
          ${soldData.samples && soldData.samples.length > 0 ? `
            <div class="samples">
              ${soldData.samples.slice(0, 3).map(s => `
                <div class="sample-item">
                  <span>${s.title.substring(0, 25)}...</span>
                  <span class="sample-price">$${s.price}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;

      // Profit section with real data
      if (profitLow !== null) {
        html += `
          <div class="profit-section">
            <div class="profit-label">Est. Profit (after fees)</div>
            <div class="profit-range ${profitClass}">
              ${profitLow >= 0 ? '+' : ''}$${profitLow} to ${profitHigh >= 0 ? '+' : ''}$${profitHigh}
            </div>
          </div>
        `;
      }
    } else if (hasApiData) {
      // Show API estimate data
      const sourceLabels = {
        estimate: 'Basic estimate',
        ebay_active: 'eBay active listings',
        ebay_sold: 'eBay sold data'
      };
      const sourceLabel = sourceLabels[priceData.source] || priceData.source;

      html += `
        <div class="ebay-section">
          <div class="ebay-label">Est. eBay Value</div>
          <div class="ebay-range">${formatPrice(priceData.ebay_low)} - ${formatPrice(priceData.ebay_high)}</div>
          <div class="source-tag">Source: ${sourceLabel}</div>
          ${priceData.samples && priceData.samples.length > 0 ? `
            <div class="samples">
              ${priceData.samples.slice(0, 3).map(s => `
                <div class="sample-item">
                  <span>${s.title.substring(0, 30)}...</span>
                  <span class="sample-price">$${s.price}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <div class="get-real-data">
            Click "Check eBay Sold Prices" below for real prices
          </div>
        </div>
      `;

      // Profit section
      if (profitLow !== null) {
        html += `
          <div class="profit-section">
            <div class="profit-label">Est. Profit (after fees)</div>
            <div class="profit-range ${profitClass}">
              ${profitLow >= 0 ? '+' : ''}$${profitLow} to ${profitHigh >= 0 ? '+' : ''}$${profitHigh}
            </div>
          </div>
        `;
      }
    } else if (!isLoggedIn || needsUpgrade) {
      // Show basic estimate for non-logged-in users
      const basicLow = data.price ? Math.round(data.price * 0.7) : null;
      const basicHigh = data.price ? Math.round(data.price * 1.5) : null;
      if (basicLow && basicHigh) {
        html += `
          <div class="ebay-section">
            <div class="ebay-label">Est. eBay Value (rough)</div>
            <div class="ebay-range">${formatPrice(basicLow)} - ${formatPrice(basicHigh)}</div>
            <div class="source-tag">Sign in for better data</div>
          </div>
        `;
      }
    }

    // Meta info
    html += `
      <div class="meta">
        ${data.location ? `<div class="meta-item">Location: ${escapeHtml(data.location)}</div>` : ''}
        ${data.seller ? `<div class="meta-item">Seller: ${escapeHtml(data.seller)}</div>` : ''}
        ${data.daysListed ? `<div class="meta-item">${escapeHtml(data.daysListed)}</div>` : ''}
      </div>

      <div class="buttons">
        ${ebayUrl ? `<a href="${sanitizeUrl(ebayUrl)}" target="_blank" rel="noopener" class="btn btn-primary">Check eBay Sold Prices</a>` : ''}
        <button class="btn btn-success" id="save-deal">Save Deal</button>
      </div>

      <div class="saved-msg" id="saved-msg"></div>
    `;

    // Footer with usage
    if (priceData?.usage) {
      html += `
        <div class="footer">
          ${priceData.usage.used}/${priceData.usage.limit} lookups used today
        </div>
      `;
    }

    // eBay attribution footer
    html += `
      <div class="footer" style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #2d2d44; font-size: 10px; color: #666; text-align: center;">
        Pricing data powered by eBay. eBay and the eBay logo are trademarks of eBay Inc.
      </div>
    `;

    html += `</div>`;

    shadow.innerHTML = html;

    // Event listeners
    shadow.getElementById('close-overlay').addEventListener('click', () => {
      overlay.remove();
    });

    const loginBtn = shadow.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'openLogin' });
      });
    }

    const upgradeBtn = shadow.getElementById('upgrade-btn');
    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'openUpgrade' });
      });
    }

    shadow.getElementById('save-deal').addEventListener('click', async () => {
      const saveBtn = shadow.getElementById('save-deal');
      const msg = shadow.getElementById('saved-msg');

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      const result = await saveDealToApi(data, priceData);

      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Deal';

      if (result.success) {
        msg.textContent = result.local ? 'Saved locally!' : 'Deal saved!';
        msg.className = 'saved-msg success';
      } else {
        msg.textContent = result.error || 'Failed to save';
        msg.className = 'saved-msg error';
      }
      msg.style.display = 'block';

      setTimeout(() => {
        msg.style.display = 'none';
      }, 3000);
    });

    document.body.appendChild(overlay);
  }

  // Create loading overlay
  function createLoadingOverlay(data) {
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) {
      existing.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    const shadow = overlay.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .container {
          background: #1a1a2e;
          color: #ffffff;
          padding: 16px;
          border-radius: 12px;
          width: 300px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          border: 1px solid #2d2d44;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .logo { font-weight: 700; font-size: 14px; color: #4ade80; }
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: #888;
        }
        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #374151;
          border-top-color: #4ade80;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 12px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
      <div class="container">
        <div class="header">
          <span class="logo">FlipRadar</span>
        </div>
        <div class="loading">
          <div class="spinner"></div>
          <span>Fetching prices...</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  // Extract all data and create overlay
  async function initOverlay() {
    await initAuth();

    // Store current URL and item ID to verify we're extracting data for the right page
    const currentPageUrl = window.location.href;
    const itemId = getItemId();
    console.log('[FlipRadar] initOverlay called for:', currentPageUrl, 'itemId:', itemId);

    // Get the previous title to detect when content changes
    const previousTitle = lastExtractedData?.title || null;

    // Wait for content to actually change (or timeout after 5s)
    await waitForNewContent(previousTitle, 5000);

    // Verify URL hasn't changed during wait
    if (window.location.href !== currentPageUrl) {
      console.log('[FlipRadar] URL changed during wait, aborting');
      return;
    }

    let data;

    // Try AI extraction first (more reliable)
    const aiData = await extractWithAI();
    if (aiData && (aiData.title || aiData.price)) {
      console.log('[FlipRadar] Using AI extracted data');
      data = {
        title: aiData.title || null,
        price: aiData.price || null,
        location: aiData.location || null,
        seller: aiData.seller || null,
        daysListed: aiData.daysListed || null,
        imageUrl: extractors.getImageUrl(),
        itemId: itemId
      };
    } else {
      // Fall back to DOM extraction
      console.log('[FlipRadar] Falling back to DOM extraction');
      data = {
        title: extractors.getTitle(),
        price: extractors.getPrice(),
        location: extractors.getLocation(),
        seller: extractors.getSeller(),
        daysListed: extractors.getDaysListed(),
        imageUrl: extractors.getImageUrl(),
        itemId: itemId
      };
    }

    // Store for next comparison
    lastExtractedData = data;

    console.log('[FlipRadar] Final extracted data for', currentPageUrl, ':', data);

    if (!data.title && !data.price) {
      console.log('[FlipRadar] Could not extract listing data');
      return;
    }

    // Show loading overlay if logged in
    if (authToken && data.title) {
      createLoadingOverlay(data);
      const priceData = await fetchPriceData(data.title);
      await createOverlay(data, priceData);
    } else {
      // Show overlay without API data
      await createOverlay(data, null);
    }
  }

  // Check if we're on a marketplace item page
  function isMarketplaceItemPage() {
    return window.location.href.includes('/marketplace/item/');
  }

  // Handle navigation (Facebook is a SPA)
  function setupNavigationObserver() {
    let lastUrl = window.location.href;
    let debounceTimeout = null;
    const DEBOUNCE_MS = 100;

    const observer = new MutationObserver(() => {
      // Debounce navigation checks to avoid excessive processing
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      debounceTimeout = setTimeout(() => {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;

          if (isMarketplaceItemPage()) {
            showTriggerButton();
          } else {
            // Remove trigger button and overlay when navigating away
            const triggerBtn = document.getElementById('flipradar-trigger');
            if (triggerBtn) {
              triggerBtn.remove();
            }
            const overlay = document.getElementById(OVERLAY_ID);
            if (overlay) {
              overlay.remove();
            }
          }
        }
      }, DEBOUNCE_MS);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Listen for auth success message
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'authSuccess') {
      authToken = null;
      currentUser = message.user;
      initAuth().then(() => {
        if (isMarketplaceItemPage()) {
          initOverlay();
        }
      });
    }

    // Listen for sold data captured from eBay tabs
    if (message.type === 'soldDataAvailable') {
      console.log('[FlipRadar] Received sold data from eBay:', message.data);

      // If overlay is open, refresh it to show new sold data
      if (document.getElementById(OVERLAY_ID) && isMarketplaceItemPage()) {
        // Re-initialize overlay to pick up new sold data
        initOverlay();
      }
    }
  });

  // Show trigger button (user must click to activate)
  function showTriggerButton() {
    console.log('[FlipRadar] showTriggerButton called for URL:', window.location.href);

    // Clear previous extracted data to force fresh extraction
    lastExtractedData = null;

    // Always remove existing overlay when showing button for a new item
    const existingOverlay = document.getElementById(OVERLAY_ID);
    if (existingOverlay) {
      console.log('[FlipRadar] Removing old overlay');
      existingOverlay.remove();
    }

    const existingBtn = document.getElementById('flipradar-trigger');
    if (existingBtn) {
      console.log('[FlipRadar] Removing old button');
      existingBtn.remove();
    }

    const btn = document.createElement('button');
    btn.id = 'flipradar-trigger';
    btn.innerHTML = '💰 Check Flip';
    btn.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 2147483646;
      background: #4ade80;
      color: #1a1a2e;
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    btn.addEventListener('click', () => {
      btn.remove();
      initOverlay();
    });
    document.body.appendChild(btn);
    console.log('[FlipRadar] Button added to page:', btn);
  }

  // Initialize
  function init() {
    console.log('[FlipRadar] Content script loaded on:', window.location.href);
    console.log('[FlipRadar] Is marketplace item page:', isMarketplaceItemPage());

    if (isMarketplaceItemPage()) {
      console.log('[FlipRadar] Showing trigger button...');
      showTriggerButton();
    }
    setupNavigationObserver();
  }

  if (document.readyState === 'loading') {
    console.log('[FlipRadar] Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', init);
  } else {
    console.log('[FlipRadar] Document ready, initializing...');
    init();
  }
})();
