// FlipRadar Configuration Constants

// IDs for DOM elements
export const OVERLAY_ID = 'flipradar-overlay';
export const TRIGGER_BUTTON_ID = 'flipradar-trigger';

// API Configuration
export const API_BASE_URL = 'https://flipradar-iaxg.vercel.app';

// Cache Configuration
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Local Storage Limits
export const MAX_LOCAL_DEALS = 100;

// eBay Fee Calculation
export const EBAY_FEE_MULTIPLIER = 0.84; // 13% eBay + 3% payment fees

// Timing Constants
export const DEBOUNCE_MS = 100;
export const MIN_WAIT_MS = 500;
export const CONTENT_WAIT_TIMEOUT_MS = 5000;
export const DOM_SETTLE_DELAY_MS = 1000;

// Extraction Limits
export const PAGE_TEXT_MAX_LENGTH = 10000;
export const TITLE_MIN_LENGTH = 5;
export const TITLE_MAX_LENGTH = 300;
export const PRICE_MIN_VALUE = 5;
export const PRICE_MIN_FONT_SIZE = 14;
