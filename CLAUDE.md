# FlipRadar Web - Project Overview (for Extension Context)

This is a reference document describing the FlipRadar web app, to be used as context in the companion Chrome extension project.

---

## What FlipRadar Is

FlipRadar is a SaaS platform + Chrome extension for Facebook Marketplace flippers. Users browse FB Marketplace, and the extension overlays real-time eBay pricing data so they can instantly see profit potential. The web app provides a dashboard to track deals, manage subscriptions, and configure alerts.

**Stack:** Next.js 16 (App Router) · React 19 · Supabase (auth + Postgres) · Stripe (subscriptions) · Tailwind CSS + shadcn/ui · Anthropic Claude (AI extraction) · eBay Browse API

---

## API Endpoints the Extension Calls

All endpoints require auth via `Authorization: Bearer <jwt>` or `X-API-Key: fr_XXXX` header.

### `POST /api/extract` — AI-Powered Data Extraction
- **Input:** `{ content: string }` (page text/HTML)
- **Output:** `{ title, price, originalPrice, location, seller, daysListed, condition, extractionMethod: 'ai' }`
- Uses Claude Sonnet to parse FB listing data from raw page content
- Detects price drops (strikethrough prices)

### `POST /api/price-lookup` — eBay Price Estimates
- **Input:** `{ query: string, category?: string, dealId?: string }`
- **Output:** `{ low, high, avg, median, sample_count, samples[], source, isCached }`
- Fetches active eBay listings via Browse API, removes outliers (10th-90th percentile)
- Caches results for 24 hours in `price_cache` table
- If `dealId` provided, auto-updates the deal with price data
- **Tier-based discount factor:** free=20%, flipper=15%, pro=10% (applied to active listing prices to estimate actual sale prices)

### `POST /api/deals` — Save a Deal
- **Supports two payload formats:**
  - **New format (camelCase, preferred):** `{ url, title, price, itemId, extractionMethod, location, seller, condition, priceData: { ebayLow, ebayHigh, ebayAvg, ebaySearchUrl } }`
  - **Legacy format (snake_case):** `{ source_url, user_title, user_asking_price, ebay_estimate_low, ... }`
- Auto-detects format via presence of `itemId`/`extractionMethod`/camelCase fields
- **Upsert:** If `fb_listing_id` (from `itemId`) matches existing deal for user, updates instead of duplicating
- **Deal limits:** free=25, flipper=500, pro=unlimited
- **Profit calculation:** `estimated_profit = (ebayEstimate * 0.87) - askingPrice`

### `GET /api/deals` — List Deals
- **Query params:** `limit`, `offset`, `status`
- **Output:** `{ deals[], total }`

### `PATCH /api/deals` — Update Deal
- **Input:** `{ id, status?, purchase_price?, sold_price?, notes? }`
- Status options: `watching`, `contacted`, `purchased`, `sold`, `passed`, `expired`
- On "sold": calculates `actual_profit = (sold_price * 0.84) - purchase_price`

### `DELETE /api/deals` — Remove Deal
- **Input:** `{ id }`

### `GET /api/usage` — Check Limits
- **Output:** `{ tier, lookupsUsed, lookupsLimit, lookupsRemaining, dealsSaved, dealsLimit }`

### `POST /api/api-key` — Generate API Key
### `GET /api/api-key` — Get Masked Key Status
### `DELETE /api/api-key` — Revoke Key

---

## Authentication

The extension can authenticate two ways:

### 1. JWT Token (Session-Based)
- User logs in via `/auth/extension` page in the web app
- Page captures Supabase session, redirects to `/auth/extension/callback?token=...&refresh_token=...`
- Extension captures tokens from the redirect URL
- Sent as: `Authorization: Bearer <access_token>`

### 2. API Key
- User generates key in dashboard settings (`/dashboard/settings`)
- Keys are prefixed with `fr_` (e.g., `fr_abc123xyz`)
- Sent as: `X-API-Key: fr_XXXX` or `Authorization: Bearer fr_XXXX`
- Auth layer auto-detects `fr_` prefix to route to API key lookup

### Auth Resolution Order (in `lib/auth.js`)
1. Check for `X-API-Key` header → look up in `profiles.api_key`
2. Check `Authorization: Bearer` header → if starts with `fr_`, treat as API key; otherwise treat as JWT
3. Fall back to Supabase session cookies

---

## Database Schema (Key Tables)

### `profiles`
- `id` (UUID, matches auth.users), `email`, `tier` (free/flipper/pro)
- `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`
- `lookups_used_today`, `lookups_reset_at`, `deals_saved_count`
- `api_key` (unique, indexed)

### `deals`
- `user_id`, `fb_listing_id` (unique per user for dedup)
- `extraction_method` (graphql/ai/dom/meta)
- `source_url`, `listing_title`, `user_asking_price`
- `location`, `seller_name`, `condition`, `description`, `images` (JSONB)
- `ebay_estimate_low/high/avg`, `ebay_search_url`, `estimated_profit_low/high`
- `status` (watching/contacted/purchased/sold/passed/expired)
- `purchase_price`, `sold_price`, `actual_profit`, `notes`

### `price_cache`
- `search_query`, `source`, `price_low/high/avg/median`, `sample_count`
- `expires_at` (24h TTL), shared across all users

### `alerts` / `alert_matches`
- Price alert definitions and triggered match notifications

---

## Tier System

| | Free | Flipper ($19/mo) | Pro ($39/mo) |
|---|---|---|---|
| Price lookups/day | 10 | 100 | 500 |
| Saved deals | 25 | 500 | Unlimited |
| Price alerts | 1 | 10 | 50 |
| eBay data | Active listings (20% discount) | Active listings (15% discount) | Active listings (10% discount) |

---

## Key Business Logic

- **Profit estimation:** `(ebayPrice * 0.87) - askingPrice` (13% eBay+PayPal fees)
- **Actual profit (on sale):** `(soldPrice * 0.84) - purchasePrice` (16% total fees)
- **eBay price calculation:** Fetches active listings, strips outliers at 10th/90th percentile, calculates low/high/avg/median
- **Usage tracking:** RPC function `increment_usage()` checks tier limits before allowing lookups
- **Daily reset:** `reset_daily_usage()` resets counters (cron-triggered)

---

## Environment Variables (Web App)

```
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
EBAY_APP_ID / EBAY_CERT_ID
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / STRIPE_PRICE_FLIPPER / STRIPE_PRICE_PRO
NEXT_PUBLIC_APP_URL
```
