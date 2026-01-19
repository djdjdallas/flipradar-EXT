// FlipRadar Selector Definitions
// Tiered fallback selectors for Facebook Marketplace scraping
//
// IMPORTANT: Facebook frequently changes their CSS classes. When scraping breaks,
// update the selectors in this file. The tiered approach ensures graceful degradation.
//
// Selector Tiers:
// - Tier 1: data-testid selectors (most reliable, but FB can remove these)
// - Tier 2: Class-based selectors (less stable, FB uses obfuscated class names)
// - Tier 3: Semantic fallbacks (role attributes, HTML structure)

/**
 * Title selectors - Extract the product listing title
 */
export const TITLE_SELECTORS = {
  // Tier 1: Specific data-testid selectors (most reliable when available)
  tier1: [
    '[data-testid="marketplace_pdp_title"]',
    '[data-testid="marketplace_pdp_component"] h1'
  ],

  // Tier 2: Facebook class-based selectors (may change with FB updates)
  // These target the actual product title span based on known class patterns
  tier2: [
    'span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6:not(.xlyipyv)',
    '[data-testid="marketplace_pdp_component"] span[dir="auto"]',
    'div[role="main"] span.x1lliihq.x6ikm8r.x10wlt62'
  ],

  // Tier 3: Semantic fallbacks (based on HTML structure)
  tier3: [
    'div[role="main"] h1',
    'h1[dir="auto"]',
    '[role="heading"][aria-level="1"]'
  ]
};

/**
 * Price selectors - Extract the listing price
 */
export const PRICE_SELECTORS = {
  tier1: [
    '[data-testid="marketplace_pdp_price"]',
    '[data-testid="marketplace_pdp-summary_price"]',
    '[data-testid="marketplace_listing_price"]'
  ],

  tier2: [
    // Will be filtered by price regex pattern
    'div[role="main"] span[dir="auto"]'
  ],

  tier3: []
};

/**
 * Location selectors - Extract listing location
 */
export const LOCATION_SELECTORS = {
  tier1: [
    '[data-testid="marketplace_pdp_location"]',
    '[data-testid="marketplace_pdp-location"]'
  ],

  tier2: [
    'span[dir="auto"]',
    'a[href*="/marketplace/"]'
  ],

  tier3: []
};

/**
 * Seller selectors - Extract seller name and profile
 */
export const SELLER_SELECTORS = {
  tier1: [
    '[data-testid="marketplace_pdp_seller_name"]',
    '[data-testid="marketplace_pdp-seller_profile_link"]',
    'a[href*="/marketplace/profile/"] span'
  ],

  tier2: [
    'a[role="link"][href*="/profile.php"] span',
    'a[role="link"][href*="facebook.com/"][href*="/"]'
  ],

  tier3: []
};

/**
 * Image selectors - Extract product images
 */
export const IMAGE_SELECTORS = {
  tier1: [
    'img[data-testid="marketplace_pdp_image"]',
    '[data-testid="marketplace_pdp-image"] img'
  ],

  tier2: [
    'div[role="main"] img[src*="scontent"]',
    'img[src*="scontent"]'
  ],

  tier3: []
};

/**
 * Feed page selectors - For scraping the marketplace feed (future use)
 */
export const FEED_SELECTORS = {
  itemCard: {
    tier1: [
      '[data-testid="marketplace_feed_story"]',
      '[data-testid="marketplace_feed_item"]',
      '[data-testid="marketplace-listing-card"]'
    ],
    tier2: [
      'div[data-pagelet*="FeedUnit"]',
      'div.x8gbvx8.x78zum5.x1q0g3np'
    ]
  },
  itemPrice: {
    tier1: [
      '[data-testid="marketplace_feed_story_price"]',
      '[data-testid="marketplace_feed_item_price"]'
    ],
    tier2: []
  },
  itemTitle: {
    tier1: [
      '[data-testid="marketplace_feed_story_title"]',
      '[data-testid="marketplace_feed_item_title"]'
    ],
    tier2: []
  }
};

/**
 * Get all selectors for a category in priority order
 * @param {object} selectorConfig - Selector config with tier1, tier2, tier3 arrays
 * @returns {string[]} - Flattened array of all selectors
 */
export function getAllSelectors(selectorConfig) {
  return [
    ...(selectorConfig.tier1 || []),
    ...(selectorConfig.tier2 || []),
    ...(selectorConfig.tier3 || [])
  ];
}

/**
 * Get only tier 1 (most reliable) selectors
 * @param {object} selectorConfig
 * @returns {string[]}
 */
export function getTier1Selectors(selectorConfig) {
  return selectorConfig.tier1 || [];
}

/**
 * Regular expression for matching price strings
 */
export const PRICE_REGEX = /^\$[\d,]+(\.\d{2})?$/;

/**
 * Location patterns for extracting location from text
 */
export const LOCATION_PATTERNS = [
  /Listed in (.+)/i,
  /Location: (.+)/i,
  /in ([A-Z][a-z]+,?\s*[A-Z]{2})/
];

/**
 * Time listed patterns
 */
export const TIME_LISTED_PATTERNS = [
  /Listed (\d+) (day|week|hour|minute)s? ago/i,
  /(\d+) (day|week|hour|minute)s? ago/i
];
