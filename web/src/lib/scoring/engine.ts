import {
  Business,
  CategoryId,
  CategoryScore,
  FiredSignal,
  ScoredLead,
  SignalEvent,
  SignalId,
  SourceTag,
  Tier,
} from "@/lib/types";

/**
 * DealScore v2 — transparent rules engine (Phase 1).
 *
 * Overhaul vs. the original 55-feature sheet:
 *  - Removed double counting (owner_age vs retirement_proximity were collinear).
 *  - Every dated event decays exponentially by a per-signal half-life instead of
 *    hard cliffs at 12/24/36 months.
 *  - Category caps rebalanced toward the strongest exit predictors
 *    (succession + hard financial distress) and away from weak proxies.
 *  - Signal stacking across independent categories applies a multiplier —
 *    co-occurring distress is superlinear, not additive.
 *  - A separate data-confidence score gates Platinum: thin data can't produce
 *    a "call them today" lead.
 *
 * Full rationale in docs/SCORING-V2.md. The ML ensemble shadow-trains on
 * feedback-loop outcomes and replaces this engine when it wins.
 */

export const CATEGORIES: Record<CategoryId, { label: string; cap: number }> = {
  A: { label: "Succession & Owner Readiness", cap: 16 },
  B: { label: "Life Events & Estate", cap: 16 },
  C: { label: "Owner Financial Distress", cap: 12 },
  D: { label: "Business Financial Distress", cap: 16 },
  E: { label: "Business Trajectory", cap: 11 },
  F: { label: "Operational Decay", cap: 8 },
  G: { label: "Reputation & Market", cap: 7 },
  H: { label: "Timing Triggers", cap: 4 },
  I: { label: "Listing & Sale Intent", cap: 10 },
};

interface EventRule {
  kind: "event";
  category: CategoryId;
  label: string;
  source: string;
  basePoints: number;
  halfLifeMonths: number; // decay half-life from event date
  floorMonths: number; // older than this → signal ignored
}

interface DerivedRule {
  kind: "derived";
  category: CategoryId;
  label: string;
  source: string;
  evaluate: (b: Business) => { points: number; detail: string } | null;
}

type Rule = EventRule | DerivedRule;

const RULES: Record<SignalId, Rule> = {
  // ── A. Succession Risk ────────────────────────────────────────────────
  owner_age: {
    kind: "derived",
    category: "A",
    label: "Owner nearing retirement age",
    source: "PDL + Whitepages",
    evaluate: (b) => {
      const a = b.owner.age;
      if (a >= 70) return { points: 9, detail: `Owner is ${a}` };
      if (a >= 65) return { points: 8, detail: `Owner is ${a}` };
      if (a >= 60) return { points: 6, detail: `Owner is ${a}` };
      if (a >= 55) return { points: 3, detail: `Owner is ${a}` };
      return null;
    },
  },
  years_ownership: {
    kind: "derived",
    category: "A",
    label: "Long tenure (burnout risk)",
    source: "PDL + SOS",
    evaluate: (b) => {
      const y = b.owner.yearsOwnership;
      if (y >= 25) return { points: 5, detail: `${y} years at the helm` };
      if (y >= 20) return { points: 3, detail: `${y} years at the helm` };
      if (y >= 15) return { points: 2, detail: `${y} years at the helm` };
      return null;
    },
  },
  no_successor: {
    kind: "derived",
    category: "A",
    label: "No identified successor",
    source: "PDL (no family in exec roles)",
    evaluate: (b) =>
      // Only meaningful once the owner is in the exit window
      !b.owner.hasSuccessor && b.owner.age >= 55
        ? { points: 4, detail: "No family or internal successor identified" }
        : null,
  },
  owner_moved_away: {
    kind: "derived",
    category: "A",
    label: "Owner relocated away from the business",
    source: "PDL Location Name (748M)",
    evaluate: (b) => {
      const d = b.owner.homeDistanceMiles;
      if (d === undefined) return null;
      if (d >= 250) return { points: 3, detail: `Owner's home is now ${Math.round(d)} miles from the business — absentee drift` };
      if (d >= 60) return { points: 2, detail: `Owner lives ${Math.round(d)} miles away from the business` };
      return null;
    },
  },
  owner_interest_shift: {
    kind: "derived",
    category: "A",
    label: "Interests shifting to retirement lifestyle",
    source: "PDL Interests (308M) + Skills",
    evaluate: (b) => {
      const n = b.owner.retirementInterestSignals ?? 0;
      if (n >= 3 && b.owner.age >= 55) return { points: 2, detail: "Profile interests shifted to golf/travel/RV-style retirement markers" };
      if (n >= 2 && b.owner.age >= 55) return { points: 1, detail: "Early retirement-lifestyle interest markers on profile" };
      return null;
    },
  },
  thin_management_bench: {
    kind: "derived",
    category: "A",
    label: "No senior bench beneath the owner",
    source: "PDL Job Title Level (132M) + Experience Title Level (420M)",
    evaluate: (b) => {
      const bench = b.metrics.seniorBenchCount;
      if (bench === undefined) return null;
      if (bench === 0 && b.employeeCount >= 8)
        return { points: 2, detail: "Zero director-level staff besides the owner — business can't run without them" };
      return null;
    },
  },
  owner_multiple_businesses: {
    kind: "derived",
    category: "A",
    label: "Owner holds multiple businesses",
    source: "PDL Company Insights cross-reference",
    evaluate: (b) =>
      (b.owner.otherBusinessCount ?? 0) >= 2
        ? { points: 1, detail: `Owner holds ${b.owner.otherBusinessCount} other ventures — consolidation candidate` }
        : null,
  },
  entity_age_high: {
    kind: "derived",
    category: "A",
    label: "Legacy-age business",
    source: "State SOS formation records",
    evaluate: (b) => {
      const age = new Date().getFullYear() - b.foundedYear;
      if (age >= 30) return { points: 2, detail: `Business is ${age} years old` };
      if (age >= 25) return { points: 1, detail: `Business is ${age} years old` };
      return null;
    },
  },
  age_tenure_compound: {
    kind: "derived",
    category: "A",
    label: "Age × tenure burnout compound",
    source: "Calculated (PDL demographics + SOS)",
    evaluate: (b) =>
      b.owner.age >= 60 && b.owner.yearsOwnership >= 20
        ? { points: 2, detail: `${b.owner.age} years old after ${b.owner.yearsOwnership} years running it — compound burnout` }
        : null,
  },

  // ── B. Owner Life Events & Estate ─────────────────────────────────────
  divorce: {
    kind: "event", category: "B", label: "Divorce filed", source: "UniCourt",
    basePoints: 8, halfLifeMonths: 12, floorMonths: 36,
  },
  spouse_death: {
    kind: "event", category: "B", label: "Death of spouse", source: "Obituary/death-notice scrapers",
    basePoints: 8, halfLifeMonths: 12, floorMonths: 30,
  },
  owner_death: {
    kind: "event", category: "B", label: "Owner deceased — estate/beneficiary situation", source: "Obituary/death-notice scrapers + funeral home filings",
    basePoints: 10, halfLifeMonths: 12, floorMonths: 30,
  },
  probate_filing: {
    kind: "event", category: "B", label: "Estate in probate", source: "UniCourt probate dockets + county court records",
    basePoints: 8, halfLifeMonths: 15, floorMonths: 36,
  },
  partnership_dissolution: {
    kind: "event", category: "B", label: "Partnership dissolution", source: "UniCourt + SOS",
    basePoints: 6, halfLifeMonths: 12, floorMonths: 30,
  },
  health_event_proxy: {
    kind: "event", category: "B", label: "Health event indicators", source: "Court postponements + social silence",
    basePoints: 3, halfLifeMonths: 9, floorMonths: 18,
  },

  // ── C. Owner Financial Distress ───────────────────────────────────────
  personal_bankruptcy: {
    kind: "event", category: "C", label: "Personal bankruptcy (Ch. 7/13)", source: "UniCourt",
    basePoints: 9, halfLifeMonths: 18, floorMonths: 48,
  },
  owner_tax_lien: {
    kind: "event", category: "C", label: "IRS / state tax lien", source: "County recorder + UniCourt",
    basePoints: 6, halfLifeMonths: 15, floorMonths: 36,
  },
  owner_judgment: {
    kind: "event", category: "C", label: "Civil judgment against owner", source: "UniCourt",
    basePoints: 4, halfLifeMonths: 15, floorMonths: 36,
  },
  lien_pattern: {
    kind: "derived",
    category: "C",
    label: "Pattern of multiple liens",
    source: "UniCourt",
    evaluate: (b) => {
      const liens = b.signals.filter((s) => s.id === "owner_tax_lien" || s.id === "owner_judgment").length;
      if (liens >= 3) return { points: 3, detail: `${liens} liens/judgments on record` };
      if (liens === 2) return { points: 2, detail: "2 liens/judgments on record" };
      return null;
    },
  },

  // ── D. Business Financial Distress ────────────────────────────────────
  business_bankruptcy: {
    kind: "event", category: "D", label: "Business bankruptcy filed", source: "UniCourt",
    basePoints: 10, halfLifeMonths: 18, floorMonths: 48,
  },
  pre_foreclosure: {
    kind: "event", category: "D", label: "Pre-foreclosure notice", source: "ATTOM",
    basePoints: 8, halfLifeMonths: 9, floorMonths: 24,
  },
  property_tax_delinquent: {
    kind: "event", category: "D", label: "Property tax delinquency", source: "ATTOM Tax Assessor",
    basePoints: 5, halfLifeMonths: 18, floorMonths: 36,
  },
  ucc_spike: {
    kind: "event", category: "D", label: "Spike in UCC filings", source: "ATTOM Recorder",
    basePoints: 3, halfLifeMonths: 12, floorMonths: 24,
  },
  days_beyond_terms: {
    kind: "derived",
    category: "D",
    label: "Paying vendors late",
    source: "D&B",
    evaluate: (b) => {
      const p = b.metrics.paydex;
      if (p === undefined) return null;
      if (p < 30) return { points: 3, detail: `PAYDEX ${p} — severely delinquent payments` };
      return null;
    },
  },
  sba_loan_distress: {
    kind: "event", category: "D", label: "SBA loan stress", source: "BrightQuery Sector (SBA loan data)",
    basePoints: 4, halfLifeMonths: 12, floorMonths: 30,
  },
  underwater_mortgage: {
    kind: "derived",
    category: "D",
    label: "Property loan underwater",
    source: "ATTOM Recorder (578M) + ATTOM AVM (98M)",
    evaluate: (b) => {
      const ltv = b.metrics.loanToValue;
      if (ltv === undefined) return null;
      if (ltv >= 100) return { points: 3, detail: `Loan-to-value ${ltv}% — property mortgage underwater` };
      if (ltv >= 90) return { points: 2, detail: `Loan-to-value ${ltv}% — near-zero property equity` };
      return null;
    },
  },
  property_value_declining: {
    kind: "derived",
    category: "D",
    label: "Business property losing value",
    source: "ATTOM Assessor History (2.7B) + AVM",
    evaluate: (b) => {
      const t = b.metrics.propertyValueTrendPct;
      if (t === undefined) return null;
      if (t <= -15) return { points: 2, detail: `Property value down ${Math.abs(t)}% YoY — asset erosion` };
      if (t <= -8) return { points: 1, detail: `Property value down ${Math.abs(t)}% YoY` };
      return null;
    },
  },
  sec_going_concern: {
    kind: "event", category: "D", label: "Going-concern warning filed", source: "SEC EDGAR (10-K/10-Q full-text)",
    basePoints: 4, halfLifeMonths: 12, floorMonths: 24,
  },

  // ── E. Business Trajectory ────────────────────────────────────────────
  employee_decline: {
    kind: "derived",
    category: "E",
    label: "Workforce shrinking",
    source: "PDL employee trends",
    evaluate: (b) => {
      const d = b.metrics.employeeChangePct12mo;
      if (d === undefined) return null;
      if (d <= -20) return { points: 5, detail: `${Math.abs(d)}% headcount decline in 12mo` };
      if (d <= -10) return { points: 3, detail: `${Math.abs(d)}% headcount decline in 12mo` };
      return null;
    },
  },
  exec_departure: {
    kind: "event", category: "E", label: "Key executive departure", source: "PDL exec departures",
    basePoints: 3, halfLifeMonths: 9, floorMonths: 18,
  },
  paydex_low: {
    kind: "derived",
    category: "E",
    label: "Deteriorating payment behavior",
    source: "D&B",
    evaluate: (b) => {
      const p = b.metrics.paydex;
      if (p === undefined) return null;
      if (p < 40) return { points: 4, detail: `PAYDEX ${p}` };
      if (p < 50) return { points: 3, detail: `PAYDEX ${p}` };
      if (p < 60) return { points: 1, detail: `PAYDEX ${p}` };
      return null;
    },
  },
  failure_score_high: {
    kind: "derived",
    category: "E",
    label: "Elevated failure risk score",
    source: "D&B",
    evaluate: (b) => {
      const f = b.metrics.failureScore;
      if (f === undefined) return null;
      if (f > 1800) return { points: 3, detail: `D&B failure score ${f}` };
      if (f > 1500) return { points: 2, detail: `D&B failure score ${f}` };
      return null;
    },
  },
  revenue_proxy_decline: {
    kind: "derived",
    category: "E",
    label: "Revenue proxy trending down",
    source: "SafeGraph Spend (82M) + ConsumerEdge Daily Spend (400M)",
    evaluate: (b) => {
      const r = b.metrics.revenueTrendPct12mo;
      if (r === undefined) return null;
      if (r <= -20) return { points: 4, detail: `Est. revenue down ${Math.abs(r)}% YoY` };
      if (r <= -10) return { points: 2, detail: `Est. revenue down ${Math.abs(r)}% YoY` };
      return null;
    },
  },
  insider_selling: {
    kind: "event", category: "E", label: "Heavy insider selling", source: "SEC EDGAR Form 4",
    basePoints: 2, halfLifeMonths: 9, floorMonths: 18,
  },

  // ── F. Operational Decay ──────────────────────────────────────────────
  foot_traffic_decline: {
    kind: "derived",
    category: "F",
    label: "Foot traffic declining",
    source: "Advan / SafeGraph",
    evaluate: (b) => {
      const t = b.metrics.footTrafficYoYPct;
      if (t === undefined) return null;
      if (t <= -30) return { points: 4, detail: `Foot traffic down ${Math.abs(t)}% YoY` };
      if (t <= -20) return { points: 3, detail: `Foot traffic down ${Math.abs(t)}% YoY` };
      if (t <= -10) return { points: 1, detail: `Foot traffic down ${Math.abs(t)}% YoY` };
      return null;
    },
  },
  no_permits: {
    kind: "derived",
    category: "F",
    label: "No maintenance investment",
    source: "Builty permits",
    evaluate: (b) => {
      const y = b.metrics.yearsSinceLastPermit;
      if (y === undefined) return null;
      if (y >= 5) return { points: 2, detail: `No building permits in ${y}+ years` };
      if (y >= 3) return { points: 1, detail: `No building permits in ${y} years` };
      return null;
    },
  },
  job_postings_decline: {
    kind: "derived",
    category: "F",
    label: "Hiring has stopped",
    source: "WageScape",
    evaluate: (b) => {
      const j = b.metrics.jobPostingsYoYPct;
      if (j === undefined) return null;
      if (j <= -50) return { points: 2, detail: `Job postings down ${Math.abs(j)}% YoY` };
      if (j <= -25) return { points: 1, detail: `Job postings down ${Math.abs(j)}% YoY` };
      return null;
    },
  },
  social_abandoned: {
    kind: "derived",
    category: "F",
    label: "Social media abandoned",
    source: "FB/IG/LinkedIn scrapers",
    evaluate: (b) => {
      const d = b.metrics.daysSinceLastSocialPost;
      if (d === undefined) return null;
      if (d >= 180) return { points: 2, detail: `No social posts in ${Math.round(d / 30)} months` };
      if (d >= 90) return { points: 1, detail: `No social posts in ${Math.round(d / 30)} months` };
      return null;
    },
  },
  social_decline: {
    kind: "derived",
    category: "F",
    label: "Social posting frequency collapsing",
    source: "FB/IG/LinkedIn scrapers",
    evaluate: (b) => {
      const d = b.metrics.socialPostingDropPct;
      if (d === undefined) return null;
      if (d <= -50) return { points: 2, detail: `Posting frequency down ${Math.abs(d)}%` };
      if (d <= -30) return { points: 1, detail: `Posting frequency down ${Math.abs(d)}%` };
      return null;
    },
  },
  gbp_temporarily_closed: {
    kind: "event", category: "F", label: "Google Business Profile marked temporarily closed", source: "Google Places API (businessStatus)",
    basePoints: 4, halfLifeMonths: 6, floorMonths: 12,
  },
  gbp_hours_reduced: {
    kind: "event", category: "F", label: "Operating hours reduced on Google", source: "Google Places API (hours history)",
    basePoints: 2, halfLifeMonths: 6, floorMonths: 12,
  },
  property_condition_poor: {
    kind: "derived",
    category: "F",
    label: "Property condition deteriorating",
    source: "Verisk Property Data (84M)",
    evaluate: (b) => {
      const c = b.metrics.propertyCondition;
      if (c === undefined) return null;
      if (c <= 1) return { points: 2, detail: "Property condition rated poor — deferred maintenance visible" };
      if (c <= 2) return { points: 1, detail: "Property condition rated below average" };
      return null;
    },
  },

  // ── G. Reputation & Market ────────────────────────────────────────────
  rating_decline: {
    kind: "derived",
    category: "G",
    label: "Online ratings sliding",
    source: "Google + Yelp",
    evaluate: (b) => {
      const d = b.metrics.ratingDelta6mo;
      if (d === undefined) return null;
      if (d <= -0.5) return { points: 3, detail: `Rating dropped ${Math.abs(d).toFixed(1)}★ in 6mo` };
      if (d <= -0.3) return { points: 2, detail: `Rating dropped ${Math.abs(d).toFixed(1)}★ in 6mo` };
      return null;
    },
  },
  negative_review_spike: {
    kind: "event", category: "G", label: "Negative review spike", source: "Google + Yelp",
    basePoints: 2, halfLifeMonths: 3, floorMonths: 6,
  },
  review_velocity_collapse: {
    kind: "event", category: "G", label: "Review volume collapsed", source: "Google + Yelp",
    basePoints: 1, halfLifeMonths: 6, floorMonths: 12,
  },
  competitor_surge: {
    kind: "event", category: "G", label: "New competitors opened nearby", source: "Google Places + SafeGraph Global Places POI (60M)",
    basePoints: 2, halfLifeMonths: 12, floorMonths: 24,
  },
  industry_decline: {
    kind: "derived",
    category: "G",
    label: "Industry contracting",
    source: "NASDAQ Data Link benchmarks",
    evaluate: (b) => {
      const t = b.metrics.industryTrendPct;
      if (t === undefined) return null;
      if (t <= -10) return { points: 2, detail: `Industry revenue down ${Math.abs(t)}% YoY nationally` };
      if (t <= -5) return { points: 1, detail: `Industry revenue down ${Math.abs(t)}% YoY nationally` };
      return null;
    },
  },
  sector_financial_decline: {
    kind: "derived",
    category: "G",
    label: "Sector financials deteriorating",
    source: "BrightQuery Sector time series",
    evaluate: (b) => {
      const t = b.metrics.sectorTrendPct;
      if (t === undefined) return null;
      if (t <= -10) return { points: 2, detail: `Sector financials down ${Math.abs(t)}% YoY` };
      if (t <= -5) return { points: 1, detail: `Sector employment/financials softening` };
      return null;
    },
  },
  twitter_sentiment_negative: {
    kind: "derived",
    category: "G",
    label: "Negative social sentiment",
    source: "Context Analytics Twitter Sentiment (9.8M)",
    evaluate: (b) => {
      const s = b.metrics.twitterSentiment;
      if (s === undefined) return null;
      if (s <= -0.4) return { points: 1, detail: "Sustained negative social media sentiment about the business" };
      return null;
    },
  },

  // ── H. Timing Triggers ────────────────────────────────────────────────
  lease_expiring: {
    kind: "event", category: "H", label: "Lease expiring within 12mo", source: "Property records",
    basePoints: 2, halfLifeMonths: 12, floorMonths: 15,
  },
  loan_maturity: {
    kind: "event", category: "H", label: "Loan/balloon maturity approaching", source: "ATTOM Recorder",
    basePoints: 2, halfLifeMonths: 12, floorMonths: 15,
  },
  zoning_change: {
    kind: "event", category: "H", label: "Zoning change nearby", source: "County records",
    basePoints: 1, halfLifeMonths: 12, floorMonths: 24,
  },
  climate_risk_high: {
    kind: "derived",
    category: "H",
    label: "Extreme climate/insurance exposure",
    source: "ClimateCheck U.S. Climate Risk",
    evaluate: (b) => {
      const r = b.metrics.climateRiskScore;
      if (r === undefined) return null;
      if (r >= 85) return { points: 1, detail: "Extreme climate hazard rating — insurance cost pressure" };
      return null;
    },
  },

  // ── I. Listing & Sale Intent ──────────────────────────────────────────
  stale_competitor_listing: {
    kind: "event", category: "I", label: "Listed with another broker 6+ months, unsold", source: "Competitor listing scrapers (BizBuySell/BizQuest/LoopNet + broker sites)",
    basePoints: 9, halfLifeMonths: 12, floorMonths: 24,
  },
  fsbo_listing: {
    kind: "event", category: "I", label: "For-sale-by-owner listing detected", source: "Marketplace scrapers (BizBuySell FSBO, Craigslist, DealStream)",
    basePoints: 8, halfLifeMonths: 6, floorMonths: 12,
  },
  selling_intent_search: {
    kind: "event", category: "I", label: "Owner flagged researching a sale/valuation", source: "Google APIs + web-behavior flags",
    basePoints: 7, halfLifeMonths: 6, floorMonths: 12,
  },
  commercial_property_listed: {
    kind: "event", category: "I", label: "Business property listed on commercial market", source: "REsimplifi Commercial Listings",
    basePoints: 7, halfLifeMonths: 9, floorMonths: 18,
  },
  property_listed_for_rent: {
    kind: "event", category: "I", label: "Business property quietly listed for lease", source: "RentHub Rental Data (408M)",
    basePoints: 6, halfLifeMonths: 9, floorMonths: 18,
  },
};

/**
 * Named cross-category interactions — the "perfect storm" combos.
 * A 70-year-old fresh divorcé with no successor, a failing business, and a
 * personal bankruptcy is not the sum of five signals; these add compound
 * points on top of base scoring (before the stacking multiplier).
 */
interface InteractionRule {
  name: string;
  points: number;
  detail: string;
  fires: (has: (id: SignalId) => boolean, b: Business) => boolean;
}

const INTERACTIONS: InteractionRule[] = [
  {
    name: "Retirement Cliff",
    points: 5,
    detail: "Retirement-age owner + no successor + a destabilizing life event",
    fires: (has, b) =>
      b.owner.age >= 63 &&
      has("no_successor") &&
      (has("divorce") || has("spouse_death") || has("health_event_proxy")),
  },
  {
    name: "Death Spiral",
    points: 5,
    detail: "Bankruptcy + a measurably declining business + owner in the exit window",
    fires: (has, b) =>
      (has("personal_bankruptcy") || has("business_bankruptcy")) &&
      (has("employee_decline") || has("revenue_proxy_decline")) &&
      b.owner.age >= 58,
  },
  {
    name: "Exit Prep",
    points: 4,
    detail: "Owner is taking concrete pre-sale actions (property/listing/intent moves)",
    fires: (has, b) =>
      b.owner.age >= 55 &&
      (has("commercial_property_listed") || has("property_listed_for_rent") || has("selling_intent_search")),
  },
  {
    name: "Walking Away",
    points: 3,
    detail: "Owner disengaging: moved away + operational decay underway",
    fires: (has) =>
      has("owner_moved_away") && (has("social_abandoned") || has("gbp_hours_reduced") || has("foot_traffic_decline")),
  },
];

const INTERACTION_CAP = 9;

const MS_PER_MONTH = 30.44 * 24 * 3600 * 1000;

function monthsSince(iso: string, now: Date): number {
  return Math.max(0, (now.getTime() - new Date(iso).getTime()) / MS_PER_MONTH);
}

function decayedPoints(rule: EventRule, event: SignalEvent, now: Date): number {
  const age = monthsSince(event.date, now);
  if (age > rule.floorMonths) return 0;
  return rule.basePoints * Math.pow(2, -age / rule.halfLifeMonths);
}

/** Stacking multiplier: distinct categories firing ≥50% of their cap. */
function stackMultiplier(categories: CategoryScore[]): number {
  const strong = categories.filter((c) => c.points >= c.cap * 0.5).length;
  if (strong >= 5) return 1.25;
  if (strong === 4) return 1.18;
  if (strong === 3) return 1.1;
  return 1.0;
}

function confidenceScore(b: Business): number {
  // Data coverage dominates; verified owner contact matters for actionability.
  return Math.min(1, b.metrics.dataCoverage * 0.8 + (b.owner.contactVerified ? 0.2 : 0));
}

const TIER_META: Record<Tier, { window: string }> = {
  platinum: { window: "0–3 months" },
  gold: { window: "3–6 months" },
  silver: { window: "6–12 months" },
  black: { window: "12+ months / monitor" },
};

function assignTier(score: number, confidence: number): { tier: Tier; flag?: "needs_verification" } {
  let tier: Tier;
  if (score >= 75) tier = "platinum";
  else if (score >= 55) tier = "gold";
  else if (score >= 35) tier = "silver";
  else tier = "black";
  // Confidence gate: thin data can't mint a Platinum lead.
  if (tier === "platinum" && confidence < 0.6) {
    return { tier: "gold", flag: "needs_verification" };
  }
  return { tier };
}

function deriveSourceTags(fired: FiredSignal[]): SourceTag[] {
  const has = (id: SignalId) => fired.some((f) => f.id === id);
  const tags: SourceTag[] = [];
  if (has("stale_competitor_listing") || has("fsbo_listing")) tags.push("stale_listing");
  if (has("owner_death") || has("probate_filing")) tags.push("estate");
  if (has("selling_intent_search")) tags.push("intent");
  const distressPts = fired.filter((f) => f.category === "C" || f.category === "D").reduce((a, f) => a + f.points, 0);
  if (distressPts >= 8) tags.push("distress");
  const successionPts = fired.filter((f) => f.category === "A").reduce((a, f) => a + f.points, 0);
  if (successionPts >= 10) tags.push("succession");
  return tags;
}

function buildExplanation(b: Business, tier: Tier, top: FiredSignal[], tags: SourceTag[]): string {
  const bits = top.slice(0, 3).map((s) => s.detail.replace(/^Owner is (\d+)$/, `the owner is $1 years old`));
  const window = TIER_META[tier].window;
  const first = b.owner.name.split(" ")[0];

  // Estate leads read completely differently — the owner isn't the contact anymore.
  if (tags.includes("estate")) {
    const estateFact =
      top.find((s) => s.id === "owner_death")?.detail ?? top.find((s) => s.id === "probate_filing")?.detail ?? bits[0];
    return `${b.name} is in an estate situation — ${estateFact?.charAt(0).toLowerCase()}${estateFact?.slice(1)}. The beneficiaries rarely want to operate the business, and without broker intervention these close rather than sell. Move quickly and lead with sensitivity: a confidential valuation offer to the estate's representative. Estimated window: ${window}.`;
  }
  // Stale-listing leads have already decided to sell.
  if (tags.includes("stale_listing")) {
    const listingFact =
      top.find((s) => s.id === "stale_competitor_listing" || s.id === "fsbo_listing")?.detail ?? bits[0];
    return `${b.name} is already trying to sell — ${listingFact?.charAt(0).toLowerCase()}${listingFact?.slice(1)}. This owner has proven intent and a broker who hasn't delivered. The play: "Your current broker has had six months. Let's discuss alternative strategies." Estimated window: ${window}.`;
  }

  const opener = `${first} has run ${b.name} for ${b.owner.yearsOwnership} years`;
  if (bits.length === 0) {
    return `${opener}. No meaningful exit signals detected — healthy business, monitor only.`;
  }
  const joined =
    bits.length === 1 ? bits[0] : bits.slice(0, -1).join(", ") + (bits.length > 1 ? ", and " + bits[bits.length - 1] : "");
  const closer =
    tier === "platinum"
      ? "These signals stack the way owners look right before they quietly exit — this is a pick-up-the-phone-today lead."
      : tier === "gold"
        ? "Strong indicators of an owner warming to an exit — prioritize outreach this cycle."
        : tier === "silver"
          ? "Early-stage markers worth a relationship-building touch now, before competitors notice."
          : "Signals are weak or stale; keep monitoring for changes.";
  return `${opener}, and the file shows ${joined.charAt(0).toLowerCase()}${joined.slice(1)}. Estimated sale window: ${window}. ${closer}`;
}

export function scoreBusiness(b: Business, now: Date = new Date()): Omit<ScoredLead, "status" | "dropWeeksAgo"> {
  const fired: FiredSignal[] = [];

  for (const [id, rule] of Object.entries(RULES) as [SignalId, Rule][]) {
    if (rule.kind === "derived") {
      const res = rule.evaluate(b);
      if (res && res.points > 0.25) {
        fired.push({
          id, category: rule.category, label: rule.label, source: rule.source,
          points: round1(res.points), rawPoints: res.points, detail: res.detail,
        });
      }
    } else {
      for (const ev of b.signals.filter((s) => s.id === id)) {
        const pts = decayedPoints(rule, ev, now);
        if (pts > 0.25) {
          fired.push({
            id, category: rule.category, label: rule.label, source: rule.source,
            points: round1(pts), rawPoints: rule.basePoints, detail: ev.detail,
          });
        }
      }
    }
  }

  const categories: CategoryScore[] = (Object.entries(CATEGORIES) as [CategoryId, { label: string; cap: number }][]).map(
    ([id, meta]) => {
      const sum = fired.filter((f) => f.category === id).reduce((acc, f) => acc + f.points, 0);
      return { id, label: meta.label, points: round1(Math.min(sum, meta.cap)), cap: meta.cap };
    },
  );

  const baseScore = round1(categories.reduce((acc, c) => acc + c.points, 0));

  // Compound interactions fire on top of base category math
  const hasSignal = (id: SignalId) => fired.some((f) => f.id === id);
  const interactions = INTERACTIONS.filter((r) => r.fires(hasSignal, b)).map((r) => ({
    name: r.name,
    points: r.points,
    detail: r.detail,
  }));
  const interactionPoints = Math.min(
    INTERACTION_CAP,
    interactions.reduce((a, i) => a + i.points, 0),
  );

  const multiplier = stackMultiplier(categories);
  const score = round1(Math.min(100, (baseScore + interactionPoints) * multiplier));
  const confidence = round2(confidenceScore(b));
  const sourceTags = deriveSourceTags(fired);
  let { tier, flag } = assignTier(score, confidence);
  // Intent floor: an active listing (stale or FSBO) is proven intent to sell —
  // those leads never sink below Gold regardless of distress-signal math.
  if (sourceTags.includes("stale_listing") && (tier === "silver" || tier === "black")) {
    tier = "gold";
  }
  const topSignals = [...fired].sort((a, z) => z.points - a.points).slice(0, 5);

  return {
    business: b,
    score,
    baseScore,
    stackMultiplier: multiplier,
    interactions,
    confidence,
    confidenceFlag: flag,
    tier,
    saleWindow: TIER_META[tier].window,
    sourceTags,
    categories,
    topSignals,
    allSignals: fired,
    explanation: buildExplanation(b, tier, topSignals, sourceTags),
    scoredAt: now.toISOString(),
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
