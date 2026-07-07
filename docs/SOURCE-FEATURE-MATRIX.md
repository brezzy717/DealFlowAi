# Source → Feature Matrix (Complete Audit)

Every data source from the July 6 spec, mapped to the DealScore v3 feature(s) it feeds. **Nothing is skipped.**
If a row says "entity/enrichment," the source doesn't produce a distress signal by nature — it builds the business
record, resolves identities, or verifies contacts (which feeds the confidence score instead).

## Dewey Data Platform (all 26 datasets)

| # | Dataset | Records | Feature(s) fed | Cat |
|---|---|---|---|---|
| 1 | PDL Company Insights | 72M | Base entity record (name, NAICS, address, revenue, employees, founded) + `owner_multiple_businesses` + universe filter for the ~38M SMB build | — / A |
| 2 | PDL Employee Count by Month | 72M | `employee_decline` | E |
| 3 | PDL Recent Executive Departures | — | `exec_departure` | E |
| 4 | PDL Person Demographics | 2.4B | `owner_age`, `age_tenure_compound`, owner record | A |
| 5 | PDL Skills | 2.4B | `owner_interest_shift` corroborator (skill staleness) | A |
| 6 | PDL Interest | 308M | `owner_interest_shift` (retirement-lifestyle markers) | A |
| 7 | PDL Job Title Level | 132M | `thin_management_bench`, `no_successor` corroborator | A |
| 8 | PDL Experience Title Level | 420M | `thin_management_bench` | A |
| 9 | PDL Location Name | 748M | `owner_moved_away` (home vs. business distance) | A |
| 10 | ATTOM Pre-Foreclosure History | 27M | `pre_foreclosure` | D |
| 11 | ATTOM Tax Assessor | 158M | `property_tax_delinquent` | D |
| 12 | ATTOM Assessor History | 2.7B | `property_value_declining` (YoY assessed trend) | D |
| 13 | ATTOM Recorder | 578M | `ucc_spike`, `loan_maturity`, `underwater_mortgage` (mortgage side) | D/H |
| 14 | ATTOM AVM | 98M | `property_value_declining`, `underwater_mortgage` (value side) | D |
| 15 | Builty Building Permits | 178M | `no_permits` | F |
| 16 | SafeGraph Spend Patterns | 82M | `revenue_proxy_decline` | E |
| 17 | SafeGraph Global Places + Geometry | 60M | Placekey entity resolution + `competitor_surge` | — / G |
| 18 | Advan Foot Traffic | 1B | `foot_traffic_decline` | F |
| 19 | Verisk Property Data | 84M | `property_condition_poor` | F |
| 20 | BrightQuery Sector | 300 | `sba_loan_distress`, `sector_financial_decline` | D/G |
| 21 | WageScape Job Postings | 423M | `job_postings_decline` | F |
| 22 | RentHub Rental Data | 408M | `property_listed_for_rent` (owner quietly listing the building) | I |
| 23 | ConsumerEdge Daily Spend | 400M | `revenue_proxy_decline` (brand/state corroborator) | E |
| 24 | REsimplifi Commercial Listings | — | `commercial_property_listed` (building on the market = exit prep) | I |
| 25 | ClimateCheck U.S. Climate Risk | 33K | `climate_risk_high` | H |
| 26 | Context Analytics Twitter Sentiment | 9.8M | `twitter_sentiment_negative` | G |

## Subscriptions / free APIs

| Source | Feature(s) fed | Cat |
|---|---|---|
| Apollo.io (18.2M, via Dewey) | Contact enrichment (emails, dials, LinkedIn, age/DOB, relatives) → **confidence score**, outreach deliverability | conf |
| UniCourt API | `divorce`, `personal_bankruptcy`, `business_bankruptcy`, `owner_tax_lien`, `owner_judgment`, `lien_pattern`, `partnership_dissolution`, `probate_filing`, `health_event_proxy` (postponement pattern) | B/C/D |
| D&B scraper | `paydex_low`, `failure_score_high`, `days_beyond_terms` | E/D |
| SEC EDGAR | `sec_going_concern`, `insider_selling` | D/E |
| Google APIs (full dev access) | `rating_decline`, `negative_review_spike`, `review_velocity_collapse`, `gbp_temporarily_closed`, `gbp_hours_reduced`, `competitor_surge`, `selling_intent_search` (Custom Search behavioral sweep) | G/F/I |
| NASDAQ Data Link | `industry_decline` + valuation multiples on lead cards | G |
| Yelp Fusion | `rating_decline`, `negative_review_spike` (co-platform corroborator) | G |

## Custom scrapers

| Source | Feature(s) fed | Cat |
|---|---|---|
| Facebook scraper | `social_abandoned`, `social_decline` | F |
| Instagram scraper | `social_abandoned`, `social_decline` | F |
| LinkedIn scraper | `social_decline`, `job_postings_decline` corroborator, `exec_departure` corroborator | F/E |
| State SOS databases | `entity_age_high`, entity-status rescore triggers, `partnership_dissolution` corroborator | A/B |
| County recorder + obituaries/death notices | `owner_death`, `spouse_death`, `probate_filing` corroborator, `ucc_spike`/liens freshness | B/C/D |
| Competitor listing scrapers (BizBuySell, BizQuest, LoopNet, DealStream, broker sites) | `stale_competitor_listing` (6+ mo unsold — "your broker has had six months"), `fsbo_listing` | I |

## Compound interactions (cross-source)

| Interaction | Fires when | Bonus |
|---|---|---|
| **Retirement Cliff** | Age ≥63 + no successor + (divorce OR spouse death OR health event) | +5 |
| **Death Spiral** | (Personal OR business BK) + (employee OR revenue decline) + age ≥58 | +5 |
| **Exit Prep** | Age ≥55 + (property listed commercial/lease OR selling-intent flags) | +4 |
| **Walking Away** | Owner moved away + operational decay (social/hours/traffic) | +3 |

Interaction bonuses cap at +9, apply before the stacking multiplier (3/4/5+ strong categories → ×1.10/×1.18/×1.25).
Your example scores like this: **70yo + divorce + no successor + failing business + personal BK** →
A≈16 (age 9, tenure, no-successor, compound) + B≈8 (divorce) + C≈9 (BK) + E≈9 (decline) = base ~42…
plus Retirement Cliff +5 and Death Spiral +5 = 52, ×1.25 stacking (4-5 strong categories) → **~65–85+
depending on signal freshness** — exactly the Platinum/Gold territory it should be, with recency decay
deciding urgency.
