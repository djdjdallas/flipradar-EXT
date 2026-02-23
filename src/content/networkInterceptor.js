// FlipChecker Network Interception
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
        images: listing.listing_photos?.map(p => p.image?.uri).filter(Boolean),
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
        images: product.images?.map(i => i.uri || i.url).filter(Boolean),
        source: 'graphql'
      };
    }

    return null;
  } catch (e) {
    console.warn('[FlipChecker] GraphQL parse error:', e.message);
    return null;
  }
}

/**
 * Handle intercepted data - store it and notify callbacks
 * @param {string} itemId
 * @param {object} data
 */
function handleInterceptedData(itemId, data) {
  console.log('[FlipChecker] Intercepted GraphQL data for item:', itemId, {
    title: data.title,
    images: data.images?.length || 0,
    firstImage: data.images?.[0]?.substring(0, 80) || null
  });
  interceptedData.set(itemId, data);

  dataCallbacks.forEach(cb => {
    try {
      cb(itemId, data);
    } catch (e) {
      console.error('[FlipChecker] Data callback error:', e);
    }
  });
}

/**
 * Set up network interception listener.
 * The page-context interceptor (networkInterceptorPage.js) is registered as a
 * separate content script with world: "MAIN" in manifest.json, so no inline
 * script injection is needed. This function only sets up the message listener
 * to receive intercepted GraphQL data from the page context.
 */
export function setupNetworkInterception() {
  // Listen for intercepted data messages from page context
  window.addEventListener('message', (event) => {
    // Only accept messages from same window
    if (event.source !== window) return;

    // Check for our custom message type
    if (event.data?.type === 'FLIPCHECKER_GRAPHQL_RESPONSE') {
      const parsed = parseGraphQLResponse(event.data.data);
      if (parsed && parsed.itemId) {
        handleInterceptedData(parsed.itemId, parsed);
      }
    }
  });

  console.log('[FlipChecker] Network interception listener installed');
}
