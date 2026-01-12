// FlipRadar - Content Script for Facebook Marketplace
(function() {
  'use strict';

  const OVERLAY_ID = 'flipradar-overlay';
  const API_BASE_URL = 'http://localhost:3000'; // Change to production URL when deploying
  let currentUrl = window.location.href;
  let authToken = null;
  let currentUser = null;

  // Initialize auth state
  async function initAuth() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'getAuthToken' }, (response) => {
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
      const selectors = [
        'h1 span',
        '[data-testid="marketplace_pdp_component"] h1',
        'div[role="main"] h1',
        'span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6'
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent.trim()) {
          return el.textContent.trim();
        }
      }

      const headings = document.querySelectorAll('h1, [role="heading"]');
      for (const h of headings) {
        const text = h.textContent.trim();
        if (text.length > 5 && text.length < 200) {
          return text;
        }
      }

      console.log('[FlipRadar] Could not extract title');
      return null;
    },

    // Extract price
    getPrice: function() {
      const selectors = [
        'span[dir="auto"]:not([role])',
        '[data-testid="marketplace_pdp_component"] span',
        'div[role="main"] span'
      ];

      const priceRegex = /^\$[\d,]+(\.\d{2})?$/;
      const priceWithTextRegex = /\$[\d,]+(\.\d{2})?/;

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent.trim();
          if (priceRegex.test(text)) {
            return parsePrice(text);
          }
        }
      }

      const allSpans = document.querySelectorAll('span');
      for (const span of allSpans) {
        const text = span.textContent.trim();
        if (priceRegex.test(text)) {
          return parsePrice(text);
        }
      }

      const body = document.body.innerText;
      const matches = body.match(priceWithTextRegex);
      if (matches) {
        return parsePrice(matches[0]);
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
      console.error('[FlipRadar] API error:', error);
      return { error: 'network_error' };
    }
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
          fb_url: window.location.href,
          title: data.title,
          asking_price: data.price,
          image_url: data.imageUrl,
          location: data.location,
          seller_name: data.seller,
          ebay_low: priceData?.ebay_low,
          ebay_high: priceData?.ebay_high,
          ebay_url: priceData?.ebay_url || getEbayUrl(data.title)
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
      console.error('[FlipRadar] Save deal error:', error);
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
      if (deals.length > 100) {
        deals.pop();
      }
      chrome.storage.local.set({ savedDeals: deals });
    });
  }

  // Create and inject overlay
  function createOverlay(data, priceData = null) {
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
      const feeMultiplier = 0.84; // 13% eBay + 3% payment
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
          <div class="title" title="${data.title || ''}">${data.title || 'Unknown Item'}</div>
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

    // eBay price section
    if (hasApiData) {
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
            <div class="source-tag">Sign in for real data</div>
          </div>
        `;
      }
    }

    // Meta info
    html += `
      <div class="meta">
        ${data.location ? `<div class="meta-item">Location: ${data.location}</div>` : ''}
        ${data.seller ? `<div class="meta-item">Seller: ${data.seller}</div>` : ''}
        ${data.daysListed ? `<div class="meta-item">${data.daysListed}</div>` : ''}
      </div>

      <div class="buttons">
        ${ebayUrl ? `<a href="${ebayUrl}" target="_blank" rel="noopener" class="btn btn-primary">Check eBay Sold Prices</a>` : ''}
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

    setTimeout(async () => {
      const data = {
        title: extractors.getTitle(),
        price: extractors.getPrice(),
        location: extractors.getLocation(),
        seller: extractors.getSeller(),
        daysListed: extractors.getDaysListed(),
        imageUrl: extractors.getImageUrl()
      };

      console.log('[FlipRadar] Extracted data:', data);

      if (!data.title && !data.price) {
        console.log('[FlipRadar] Could not extract listing data');
        return;
      }

      // Show loading overlay if logged in
      if (authToken && data.title) {
        createLoadingOverlay(data);
        const priceData = await fetchPriceData(data.title);
        createOverlay(data, priceData);
      } else {
        // Show overlay without API data
        createOverlay(data, null);
      }
    }, 1000);
  }

  // Check if we're on a marketplace item page
  function isMarketplaceItemPage() {
    return window.location.href.includes('/marketplace/item/');
  }

  // Handle navigation (Facebook is a SPA)
  function setupNavigationObserver() {
    let lastUrl = window.location.href;

    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;

        if (isMarketplaceItemPage()) {
          initOverlay();
        } else {
          const overlay = document.getElementById(OVERLAY_ID);
          if (overlay) {
            overlay.remove();
          }
        }
      }
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
  });

  // Initialize
  function init() {
    if (isMarketplaceItemPage()) {
      initOverlay();
    }
    setupNavigationObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
