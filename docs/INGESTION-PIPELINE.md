# DealFlow AI — Data Ingestion Pipeline

Every source you have secured access to, the exact API surface we hit, how often, where it lands, and which
DealScore signals it feeds. This is the Phase 4 build map; the scoring engine already consumes every signal
listed here (synthetic today, real when each connector turns on).

## Architecture

```
 ┌────────────┐   ┌──────────────┐   ┌───────────────┐   ┌──────────────┐   ┌─────────────┐
 │  CONNECTORS │──▶│ RAW LANDING  │──▶│ NORMALIZE +   │──▶│   SIGNAL     │──▶│  SCORING /  │
 │ (per source)│   │ raw_* tables │   │ ENTITY MATCH  │   │  EXTRACTION  │   │  RESCORING  │
 └────────────┘   │   (JSONB)    │   │ (match keys)  │   │ signal tables│   │  (Inngest)  │
                  └──────────────┘   └───────────────┘   └──────────────┘   └─────────────┘
```

- **Connectors** run as Inngest scheduled functions (cron) or webhook receivers. Each writes verbatim payloads to
  a `raw_<source>` JSONB table with `fetched_at`, `source_cursor`, and `dedupe_hash` — we never lose original data.
- **Entity resolution** matches records to `businesses` / `business_owners` using, in priority order:
  `pdl_company_id` → `duns_number` → APN → normalized name + address (Placekey) → owner full name + DOB/age + city.
  Unmatched records park in `unmatched_records` for weekly fuzzy re-match.
- **Signal extraction** upserts into the spec's schema tables (`owner_life_events`, `business_financial_distress`,
  `online_reviews`, etc.) and emits an Inngest event (`signal/created`) carrying `{business_id, signal_id, priority}`.
- **Event-driven rescoring** subscribes to `signal/created`: `critical` priority rescores immediately,
  `high` within the hour, everything else batches into the nightly rescore. Tier changes emit `lead/tier-changed`
  which can pull a Black-pool business into the next Tuesday drop.

## Source-by-source connector map

### 1. Dewey Data Platform (bulk files, weekly/monthly)

Dewey delivers as downloadable file products via their API. One connector, many datasets.

| Dataset | Endpoint pattern | Cadence | Lands in | Signals fed |
|---|---|---|---|---|
| PDL Company Insights | `GET https://app.deweydata.io/external-api/v3/products/{product_id}/files` (S3 presigned) | Monthly | `businesses` | base entity, revenue/employee ranges |
| PDL Employee Count by Month | same, product-scoped | Monthly | `employee_trends` | `employee_decline` |
| PDL Recent Exec Departures | same | Weekly | `executive_departures` | `exec_departure` |
| PDL Person Demographics | same | Monthly | `business_owners` | `owner_age`, `years_ownership`, `no_successor` |
| ATTOM Pre-Foreclosure History | same | **Daily file diff** | `business_financial_distress` | `pre_foreclosure` (critical rescore) |
| ATTOM Tax Assessor + History | same | Monthly | `property_records` | `property_tax_delinquent` |
| ATTOM Recorder | same | Weekly | `business_financial_distress`, `property_records` | `ucc_spike`, `loan_maturity` |
| ATTOM AVM | same | Monthly | `property_records` | property value trend (bonus) |
| Builty Building Permits | same | Monthly | `building_permits` | `no_permits` |
| SafeGraph Spend / Advan Foot Traffic | same | Monthly | `foot_traffic` | `foot_traffic_decline`, `revenue_proxy_decline` |
| WageScape Job Postings | same | Monthly | `job_postings` | `job_postings_decline` |
| ConsumerEdge Daily Spend | same | Weekly | `foot_traffic` (spend series) | `revenue_proxy_decline` |

### 2. ATTOM direct API (targeted, on-demand re-checks)

For event-driven verification of a specific property (cheaper than waiting for the next bulk file):

- `GET https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?address1=...&address2=...`
- `GET https://api.gateway.attomdata.com/propertyapi/v1.0.0/saleshistory/detail?apn=...`
- `GET https://api.gateway.attomdata.com/propertyapi/v1.0.0/assessment/detail?apn=...`
- Auth: `apikey` header. Cadence: on `signal/created` verification + weekly for flagged (Silver+) properties.

### 3. UniCourt API — court filings (the big one)

- Search: `POST https://enterpriseapi.unicourt.com/caseSearch` with query DSL (party name + jurisdiction + case type)
- Case detail: `GET https://enterpriseapi.unicourt.com/case/{caseId}` · Parties/dockets/attorneys sub-resources
- Case types monitored per owner/business: **bankruptcy (Ch 7/11/13), divorce/dissolution of marriage, civil
  judgments, tax liens, mechanic liens, partnership dissolution, PROBATE dockets**, business litigation
- Cadence: nightly sweep over all owners of Silver+ leads and the full Black monitor pool on weekly rotation;
  webhook-style tracking via UniCourt case-tracking API for open cases
- Lands in: `owner_life_events`, `owner_financial_distress`, `business_financial_distress`
- Signals: `divorce`, `personal_bankruptcy`, `business_bankruptcy`, `owner_tax_lien`, `owner_judgment`,
  `partnership_dissolution`, `probate_filing` — all **critical/high rescore priority**

### 4. Obituary & death-notice scrapers (owner death → estate leads)

- Sources: Legacy.com (`https://www.legacy.com/api/_frontend/search?...` public search), local funeral home sites
  (Batesville/CFS/FrontRunner-hosted templates share predictable DOM), newspapers' online obit sections per metro
- Matching: name + age band + city against `business_owners`; require ≥2 corroborators (age, city, relative name)
  before firing — false-positive owner deaths are unacceptable. Ambiguous matches go to admin review queue.
- Cadence: daily per covered metro
- Lands in: `owner_life_events (event_type='owner_death'|'spouse_death')`
- Signals: `owner_death` (critical — immediate rescore, Estate tag), `spouse_death`

### 5. Competitor listing intelligence (stale listings + FSBO)

- Targets: BizBuySell, BizQuest, LoopNet businesses-for-sale, DealStream, BusinessBroker.net + major brokerage
  sites (Sunbelt, Transworld, Murphy, FCBB) + Craigslist business-for-sale per metro
- Method: headless scrape of listing indexes; store `first_seen`, `last_seen`, price changes; listing fingerprint =
  normalized title + revenue/cash-flow figures + geography (listings are anonymized — we match to real businesses
  via industry + revenue band + geography + broker, and enrich at contact time)
- Detection rules: `first_seen > 180 days ago AND still live` → `stale_competitor_listing`;
  `seller_type = owner` → `fsbo_listing`; price reduction events boost recency (reset decay clock 50%)
- Cadence: weekly full crawl, daily diff on tracked listings
- Lands in: new table `market_listings (id, business_id NULLABLE, source, url_hash, first_seen, last_seen, asking_price, price_history JSONB, broker_name, seller_type, status)`
- Signals: `stale_competitor_listing`, `fsbo_listing` — Stale Listing tag drives the
  "your broker has had six months" outreach track (separate email/call scripts in the concierge)

### 6. Google APIs (your dev access)

| API | Endpoint | What we extract | Signals |
|---|---|---|---|
| Places API (New) | `POST https://places.googleapis.com/v1/places:searchText` · `GET /v1/places/{place_id}` | rating, userRatingCount, businessStatus (**CLOSED_TEMPORARILY**), currentOpeningHours, reviews | `rating_decline`, `negative_review_spike`, `review_velocity_collapse`, `gbp_temporarily_closed`, `gbp_hours_reduced` (hours snapshot diffing), `competitor_surge` (nearby search by category) |
| Custom Search JSON | `GET https://www.googleapis.com/customsearch/v1?key=...&cx=...&q="<owner name>" ("selling" OR "retirement" OR "for sale")` | public selling-behavior footprint: forum posts, marketplace listings, "closing" announcements | `selling_intent_search` |
| Maps Geocoding | `GET https://maps.googleapis.com/maps/api/geocode/json` | canonical address + Placekey bridge | entity resolution |
| Google Trends (unofficial) | pytrends batch by metro | industry demand context | industry factor (bonus) |

Cadence: rating/hours snapshots weekly for the active book, monthly for the monitor pool; custom-search
intent sweeps weekly per owner (rate-limit aware, 10k queries/day quota).
Note: Business Profile *owner* APIs only cover profiles you manage — public signals come via Places, which is
exactly what we need.

### 7. Social scrapers (FB / IG / LinkedIn)

- Facebook/Instagram: public business pages via rotating headless sessions (Playwright + residential proxies) —
  post dates, counts, engagement; **ToS-sensitive: run through a scraping vendor (Apify/Bright Data actors) to
  keep risk off our infra**
- LinkedIn: company page activity + job postings via PhantomBuster agents (per your stack notes)
- Extract: `posts_last_30/90_days`, `last_post_date`, follower deltas, engagement rate
- Cadence: weekly active book, monthly monitor pool
- Lands in: `social_media_presence`
- Signals: `social_abandoned`, `social_decline`

### 8. D&B (PAYDEX / Failure Score)

- Primary: your scraper against public D&B business directory pages (free tier data)
- Upgrade path: D&B Direct+ `GET https://plus.dnb.com/v1/data/duns/{duns}?blockIDs=paymentinsight_L2_v1`
- Cadence: monthly snapshot per business (rate-limited queue)
- Lands in: `business_credit`
- Signals: `paydex_low`, `failure_score_high`, `days_beyond_terms`

### 9. SEC EDGAR (free)

- Full-text search: `GET https://efts.sec.gov/LATEST/search-index?q=%22going%20concern%22&dateRange=custom`
- Company filings: `GET https://data.sec.gov/submissions/CIK{cik10}.json`
- Form 4 insider transactions: `GET https://data.sec.gov/api/xbrl/...` + daily index files
- Cadence: daily index sweep (only relevant for the enterprise/public-adjacent slice)
- Lands in: `sec_filings` · Signals: going-concern, insider-selling (bonus features)

### 10. Yelp Fusion (free tier)

- `GET https://api.yelp.com/v3/businesses/matches` (entity match) → `GET /v3/businesses/{id}` → `GET /v3/businesses/{id}/reviews`
- Cadence: weekly active book / monthly pool (500 calls/day free budget → prioritize by tier)
- Lands in: `online_reviews` · Signals: `rating_decline`, `negative_review_spike`

### 11. State SOS + county recorders

- AZ eCorp, NV SilverFlume, CA bizfile, CO SOS business search, UT/NM/TX equivalents — mix of APIs and scrape
- Entity status (active/dissolved/suspended), registered-agent changes, amendment filings
- County recorder portals (e.g., Maricopa `https://recorder.maricopa.gov/recording/document-search` API) for
  deeds, liens, UCC — supplements ATTOM Recorder with same-week freshness
- Cadence: weekly per state for the active book; monthly full pool
- Signals: entity-status changes (rescore trigger), `ucc_spike`, ownership-transfer filings

### 12. Apollo.io + Whitepages (contact enrichment, not scoring)

- `POST https://api.apollo.io/api/v1/people/match` (email/phone/LinkedIn for owners)
- Whitepages Pro `GET https://proapi.whitepages.com/3.0/person` (age verification, relatives, addresses)
- Runs at lead-qualification time (only Silver+ that will actually be distributed — keeps enrichment spend down)
- Feeds `owner_contact_enrichment` and the **confidence score** (contact_verified)

### 13. NASDAQ Data Link (industry benchmarks)

- `GET https://data.nasdaq.com/api/v3/datatables/{vendor}/{table}?naics=...` — revenue multiples, margins by sector
- Monthly · feeds valuation context in lead cards + industry factor

## Compliance guardrails (build these in from day 1)

- **Scrapers** (social, D&B, obits, listings): respect robots.txt where feasible, vendor-proxy the ToS-risky ones,
  and never store scraped personal data beyond what feeds a signal.
- **Selling-intent flags**: only from public web footprint via Custom Search — no purchased browsing histories.
- **Death/probate data**: human-review queue before any outreach fires; estate outreach uses the dedicated
  sensitivity template and a 30-day post-death quiet period.
- **Outreach**: TCPA calling windows + DNC scrubbing before every AI call batch; CAN-SPAM footer + one-click DNC
  in every email (already in the outreach spec).

## Rescore priority matrix

| Priority | Signals | SLA |
|---|---|---|
| Critical | `owner_death`, `business_bankruptcy`, `personal_bankruptcy`, `pre_foreclosure`, `stale_competitor_listing` (new) | immediate |
| High | `divorce`, `probate_filing`, `fsbo_listing`, `selling_intent_search`, `exec_departure` (C-suite), `gbp_temporarily_closed` | < 1 hour |
| Medium | tax delinquency, judgments, UCC spike, rating crash, hours reduced | nightly batch |
| Low | trend metrics (employees, traffic, social, postings) | weekly batch |
