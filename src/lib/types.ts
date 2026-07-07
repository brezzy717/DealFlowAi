export type Tier = "platinum" | "gold" | "silver" | "black";

export type SignalId =
  // A — Succession & Owner Readiness
  | "owner_age"
  | "years_ownership"
  | "no_successor"
  | "owner_moved_away"
  | "owner_interest_shift"
  | "thin_management_bench"
  | "owner_multiple_businesses"
  | "entity_age_high"
  | "age_tenure_compound"
  // B — Owner Life Events & Estate
  | "divorce"
  | "spouse_death"
  | "owner_death"
  | "probate_filing"
  | "partnership_dissolution"
  | "health_event_proxy"
  // C — Owner Financial Distress
  | "personal_bankruptcy"
  | "owner_tax_lien"
  | "owner_judgment"
  | "lien_pattern"
  // D — Business Financial Distress
  | "business_bankruptcy"
  | "pre_foreclosure"
  | "property_tax_delinquent"
  | "ucc_spike"
  | "days_beyond_terms"
  | "sba_loan_distress"
  | "underwater_mortgage"
  | "property_value_declining"
  | "sec_going_concern"
  // E — Business Trajectory
  | "employee_decline"
  | "exec_departure"
  | "paydex_low"
  | "failure_score_high"
  | "revenue_proxy_decline"
  | "insider_selling"
  // F — Operational Decay
  | "foot_traffic_decline"
  | "no_permits"
  | "job_postings_decline"
  | "social_abandoned"
  | "social_decline"
  | "gbp_temporarily_closed"
  | "gbp_hours_reduced"
  | "property_condition_poor"
  // G — Reputation & Market
  | "rating_decline"
  | "negative_review_spike"
  | "review_velocity_collapse"
  | "competitor_surge"
  | "industry_decline"
  | "sector_financial_decline"
  | "twitter_sentiment_negative"
  // H — Timing Triggers
  | "lease_expiring"
  | "loan_maturity"
  | "zoning_change"
  | "climate_risk_high"
  // I — Listing & Sale Intent
  | "stale_competitor_listing"
  | "fsbo_listing"
  | "selling_intent_search"
  | "commercial_property_listed"
  | "property_listed_for_rent";

export type CategoryId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";

/** How this lead should be worked — derived from which signals fired */
export type SourceTag = "stale_listing" | "estate" | "distress" | "succession" | "intent";

/** A dated event-type signal attached to a business (court filing, notice, etc.) */
export interface SignalEvent {
  id: SignalId;
  /** ISO date the underlying event occurred/was filed */
  date: string;
  /** Optional magnitude (e.g. lien amount, % decline) */
  value?: number;
  /** Human-readable detail used in explanations */
  detail: string;
}

export interface Owner {
  name: string;
  age: number;
  yearsOwnership: number;
  hasSuccessor: boolean;
  email: string;
  phone: string;
  homeCity: string;
  contactVerified: boolean;
  /** PDL Location Name: miles between owner's current home and the business */
  homeDistanceMiles?: number;
  /** PDL Interests: retirement/lifestyle interest signals (golf, travel, RV...) */
  retirementInterestSignals?: number;
  /** PDL Company Insights: other businesses this owner holds */
  otherBusinessCount?: number;
}

export interface BusinessMetrics {
  paydex?: number; // 1-100, lower = worse
  failureScore?: number; // D&B, higher = worse (>1500 elevated, >1800 danger)
  employeeChangePct12mo?: number; // negative = shrinking
  revenueTrendPct12mo?: number; // proxy from spend data
  footTrafficYoYPct?: number;
  jobPostingsYoYPct?: number;
  /** PDL Job Title/Experience Level: senior (director+) employees besides the owner */
  seniorBenchCount?: number;
  /** ATTOM Assessor History + AVM: property value trend YoY */
  propertyValueTrendPct?: number;
  /** ATTOM Recorder + AVM: loan-to-value on business property */
  loanToValue?: number;
  /** Verisk: property condition 1 (poor) – 5 (excellent) */
  propertyCondition?: number;
  /** NASDAQ benchmarks: industry revenue trend YoY */
  industryTrendPct?: number;
  /** BrightQuery Sector: sector financial/employment trend YoY */
  sectorTrendPct?: number;
  /** Context Analytics: Twitter/X sentiment -1..1 */
  twitterSentiment?: number;
  /** ClimateCheck: 0-100 hazard rating for the property */
  climateRiskScore?: number;
  rating?: number; // blended Google/Yelp 1-5
  ratingDelta6mo?: number; // negative = declining
  daysSinceLastSocialPost?: number;
  socialPostingDropPct?: number; // FB/IG/LinkedIn posting frequency change, negative = slowing
  yearsSinceLastPermit?: number;
  /** 0-1: fraction of data source groups with fresh (<90d) coverage */
  dataCoverage: number;
}

export interface Business {
  id: string;
  name: string;
  industry: string;
  naics: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  foundedYear: number;
  employeeCount: number;
  revenueEstimate: number;
  owner: Owner;
  signals: SignalEvent[];
  metrics: BusinessMetrics;
}

export interface FiredSignal {
  id: SignalId;
  category: CategoryId;
  label: string;
  source: string;
  points: number; // after decay
  rawPoints: number; // before decay
  detail: string;
}

export interface CategoryScore {
  id: CategoryId;
  label: string;
  points: number; // capped
  cap: number;
}

/** Named cross-category combination that compounds beyond additive scoring */
export interface InteractionBonus {
  name: string;
  points: number;
  detail: string;
}

export type LeadStatus =
  | "new"
  | "contacted"
  | "meeting_scheduled"
  | "needs_action"
  | "in_pipeline";

export interface ScoredLead {
  business: Business;
  /** Final 0-100 after stacking multiplier */
  score: number;
  baseScore: number;
  stackMultiplier: number;
  interactions: InteractionBonus[];
  /** 0-1 data confidence; gates Platinum assignment */
  confidence: number;
  confidenceFlag?: "needs_verification";
  tier: Tier;
  saleWindow: string;
  sourceTags: SourceTag[];
  categories: CategoryScore[];
  topSignals: FiredSignal[];
  allSignals: FiredSignal[];
  explanation: string;
  scoredAt: string;
  status: LeadStatus;
  /** Which weekly drop this lead arrived in (0 = this week) */
  dropWeeksAgo: number;
}
