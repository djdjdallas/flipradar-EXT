// FlipRadar Network Interception
// Intercepts fetch/XHR requests to capture GraphQL responses containing listing data
// This provides data faster and more reliably than DOM scraping when available

// Cache for intercepted data, keyed by item ID
const interceptedData = new Map();

// Registered callbacks for data interception events
const dataCallbacks = [];

/**
 * Register callback for intercepted data events
 * @param {Function} callback - Called with (itemId, data) when data is captured
 */
export function onDataIntercepted(callback) {
  dataCallbacks.push(callback);
}

/**
 * Get intercepted data for a specific item
 * @param {string} itemId
 * @returns {object|null}
 */
export function getInterceptedData(itemId) {
  return interceptedData.get(itemId) || null;
}

/**
 * Clear all intercepted data
 */
export function clearInterceptedData() {
  interceptedData.clear();
}

/**
 * Clear intercepted data for a specific item
 * @param {string} itemId
 */
export function clearItemData(itemId) {
  interceptedData.delete(itemId);
}

/**
 * Parse GraphQL response for marketplace listing data
 * Facebook uses various GraphQL response structures, so we check multiple patterns
 * @param {object} response - GraphQL response object
 * @returns {object|null} - Normalized listing data or null
 */
function parseGraphQLResponse(response) {
  try {
    const data = typeof response === 'string' ? JSON.parse(response) : response;

    // Pattern 1: Direct marketplace_product_details_page query
    if (data?.data?.marketplace_product_details_page) {
      const listing = data.data.marketplace_product_details_page;
      return {
        itemId: listing.id,
        title: listing.marketplace_listing_title,
        price: listing.listing_price?.amount,
        priceFormatted: listing.listing_price?.formatted_amount,
        currency: listing.listing_price?.currency,
        location: listing.location?.reverse_geocode?.city || listing.location_text?.text,
        seller: listing.marketplace_listing_seller?.name,
        description: listing.redacted_description?.text,
        images: listing.listing_photos?.map(p => p.image?.uri).filter(Boolean),
        condition: listing.condition,
        category: listing.marketplace_listing_category_id,
        source: 'graphql'
      };
    }

    // Pattern 2: CometMarketplaceProductDetailPage (node query)
    if (data?.data?.node?.__typename === 'MarketplaceListing') {
      const listing = data.data.node;
      return {
        itemId: listing.id,
        title: listing.marketplace_listing_title,
        price: listing.listing_price?.amount,
        priceFormatted: listing.listing_price?.formatted_amount,
        location: listing.location_text?.text,
        seller: listing.story?.comet_sections?.seller?.seller?.name,
        source: 'graphql'
      };
    }

    // Pattern 3: MarketplacePDP query response
    if (data?.data?.marketplace_pdp?.product) {
      const product = data.data.marketplace_pdp.product;
      return {
        itemId: product.id,
        title: product.title || product.name,
        price: product.price?.amount,
        priceFormatted: product.price?.formatted,
        location: product.location,
        seller: product.seller?.name,
        source: 'graphql'
      };
    }

    return null;
  } catch (e) {
    // JSON parse error or structure mismatch
    return null;
  }
}

/**
 * Handle intercepted data - store it and notify callbacks
 * @param {string} itemId
 * @param {object} data
 */
function handleInterceptedData(itemId, data) {
  console.log('[FlipRadar] Intercepted GraphQL data for item:', itemId);
  interceptedData.set(itemId, data);

  dataCallbacks.forEach(cb => {
    try {
      cb(itemId, data);
    } catch (e) {
      console.error('[FlipRadar] Data callback error:', e);
    }
  });
}

/**
 * Set up network interception by injecting a script into the page context
 * The script patches fetch() and XMLHttpRequest to capture GraphQL responses
 */
export function setupNetworkInterception() {
  // Create inline script for page context injection
  // This must be inline because content scripts can't load external scripts into page context
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      // Only install once
      if (window.__flipradarInterceptorInstalled) return;
      window.__flipradarInterceptorInstalled = true;

      const originalFetch = window.fetch;
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;

      // Intercept fetch()
      window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);

        try {
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;

          // Check if this is a GraphQL request
          if (url && (url.includes('/api/graphql') || url.includes('/graphql'))) {
            const clone = response.clone();
            clone.json().then(data => {
              window.postMessage({
                type: 'FLIPRADAR_GRAPHQL_RESPONSE',
                source: 'fetch',
                url: url,
                data: data
              }, '*');
            }).catch(() => {});
          }
        } catch (e) {
          // Silently fail - don't break page functionality
        }

        return response;
      };

      // Intercept XMLHttpRequest
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._flipradarUrl = url;
        return originalXHROpen.apply(this, [method, url, ...rest]);
      };

      XMLHttpRequest.prototype.send = function(...args) {
        this.addEventListener('load', function() {
          try {
            const url = this._flipradarUrl;
            if (url && (url.includes('/api/graphql') || url.includes('/graphql'))) {
              const data = JSON.parse(this.responseText);
              window.postMessage({
                type: 'FLIPRADAR_GRAPHQL_RESPONSE',
                source: 'xhr',
                url: url,
                data: data
              }, '*');
            }
          } catch (e) {
            // Silently fail
          }
        });
        return originalXHRSend.apply(this, args);
      };

      console.log('[FlipRadar] Network interceptor installed in page context');
    })();
  `;

  // Inject script into page context
  (document.head || document.documentElement).appendChild(script);
  script.remove(); // Clean up - script has already executed

  // Listen for intercepted data messages from page context
  window.addEventListener('message', (event) => {
    // Only accept messages from same window
    if (event.source !== window) return;

    // Check for our custom message type
    if (event.data?.type === 'FLIPRADAR_GRAPHQL_RESPONSE') {
      const parsed = parseGraphQLResponse(event.data.data);
      if (parsed && parsed.itemId) {
        handleInterceptedData(parsed.itemId, parsed);
      }
    }
  });

  console.log('[FlipRadar] Network interception listener installed');
}
