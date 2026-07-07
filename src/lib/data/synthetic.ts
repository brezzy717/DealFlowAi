import { Business, SignalEvent, SignalId } from "@/lib/types";

/**
 * Deterministic synthetic dataset for Phase 1.
 * Same seed → same businesses on every render, so the UI is stable.
 * Swapped out for real Dewey/UniCourt/ATTOM ingestion in Phase 2.
 */

// mulberry32 — small deterministic PRNG
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const METROS = [
  { city: "Phoenix", state: "AZ", zip: "85004", lat: 33.4484, lng: -112.074 },
  { city: "Scottsdale", state: "AZ", zip: "85251", lat: 33.4942, lng: -111.9261 },
  { city: "Mesa", state: "AZ", zip: "85201", lat: 33.4152, lng: -111.8315 },
  { city: "Tempe", state: "AZ", zip: "85281", lat: 33.4255, lng: -111.94 },
  { city: "Tucson", state: "AZ", zip: "85701", lat: 32.2226, lng: -110.9747 },
  { city: "Las Vegas", state: "NV", zip: "89101", lat: 36.1699, lng: -115.1398 },
  { city: "Henderson", state: "NV", zip: "89011", lat: 36.0395, lng: -114.9817 },
  { city: "San Diego", state: "CA", zip: "92101", lat: 32.7157, lng: -117.1611 },
  { city: "Denver", state: "CO", zip: "80202", lat: 39.7392, lng: -104.9903 },
  { city: "Salt Lake City", state: "UT", zip: "84101", lat: 40.7608, lng: -111.891 },
  { city: "Albuquerque", state: "NM", zip: "87102", lat: 35.0844, lng: -106.6504 },
  { city: "Dallas", state: "TX", zip: "75201", lat: 32.7767, lng: -96.797 },
];

const INDUSTRIES: [string, string][] = [
  ["HVAC Services", "238220"],
  ["Plumbing Contractors", "238220"],
  ["Precision Manufacturing", "332710"],
  ["Commercial Landscaping", "561730"],
  ["Auto Repair", "811111"],
  ["Dental Practice", "621210"],
  ["Trucking & Logistics", "484110"],
  ["Restaurant Group", "722511"],
  ["Print & Signage", "323111"],
  ["Electrical Contractors", "238210"],
  ["Property Management", "531311"],
  ["Machine Shop", "332710"],
  ["Pest Control", "561710"],
  ["Medical Billing Services", "541219"],
  ["Custom Cabinetry", "337110"],
  ["Fitness Centers", "713940"],
  ["Distribution & Wholesale", "424990"],
  ["Roofing Contractors", "238160"],
];

const NAME_A = ["Summit", "Desert", "Canyon", "Ironwood", "Redrock", "Pinnacle", "Cactus", "Sunbelt", "Copper", "Mesa", "Sierra", "Legacy", "Frontier", "Vertex", "Saguaro", "Silverline", "Northstar", "Bluesky", "Granite", "Heritage"];
const NAME_B: Record<string, string> = {
  "HVAC Services": "Air & Heating", "Plumbing Contractors": "Plumbing Co.", "Precision Manufacturing": "Precision Mfg.",
  "Commercial Landscaping": "Landscape Group", "Auto Repair": "Auto Works", "Dental Practice": "Dental Associates",
  "Trucking & Logistics": "Freight Lines", "Restaurant Group": "Hospitality Group", "Print & Signage": "Print & Sign",
  "Electrical Contractors": "Electric Inc.", "Property Management": "Property Partners", "Machine Shop": "Machine & Tool",
  "Pest Control": "Pest Solutions", "Medical Billing Services": "Billing Solutions", "Custom Cabinetry": "Cabinet Works",
  "Fitness Centers": "Fitness Co.", "Distribution & Wholesale": "Distribution Co.", "Roofing Contractors": "Roofing Systems",
};

const FIRST = ["Frank", "Linda", "Robert", "Carol", "James", "Diane", "Bill", "Nancy", "Tom", "Susan", "Rick", "Patricia", "Dave", "Barbara", "Steve", "Karen", "Paul", "Donna", "Mike", "Sandra", "Gary", "Janet", "Ken", "Cheryl"];
const LAST = ["Kowalski", "Trujillo", "Hendricks", "Marino", "Osborne", "Delgado", "Whitfield", "Barnes", "Castellano", "Pruitt", "Lindqvist", "Herrera", "McAllister", "Yoder", "Franks", "Duval", "Ogawa", "Bratton", "Salazar", "Kirkpatrick"];

type Profile = "estate" | "stale_listing" | "critical" | "elevated" | "early" | "healthy";

function isoMonthsAgo(now: Date, months: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - Math.round(months * 30.44));
  return d.toISOString().slice(0, 10);
}

export function generateBusinesses(count = 240, seed = 20260706, now = new Date("2026-07-06")): Business[] {
  const r = rng(seed);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(r() * arr.length)];
  const range = (lo: number, hi: number) => lo + r() * (hi - lo);
  const irange = (lo: number, hi: number) => Math.floor(range(lo, hi + 1));
  const chance = (p: number) => r() < p;

  const businesses: Business[] = [];

  for (let i = 0; i < count; i++) {
    const roll = r();
    const profile: Profile =
      roll < 0.03 ? "estate" :
      roll < 0.08 ? "stale_listing" :
      roll < 0.17 ? "critical" :
      roll < 0.36 ? "elevated" :
      roll < 0.66 ? "early" : "healthy";

    const [industry, naics] = pick(INDUSTRIES);
    const metro = pick(METROS);
    const ownerAge =
      profile === "estate" ? irange(62, 84) :
      profile === "stale_listing" ? irange(55, 72) :
      profile === "critical" ? irange(58, 74) :
      profile === "elevated" ? irange(52, 70) :
      profile === "early" ? irange(48, 66) : irange(34, 58);
    const yearsOwnership = Math.min(ownerAge - 24, profile === "healthy" ? irange(2, 14) : irange(8, 34));
    const foundedYear = now.getFullYear() - yearsOwnership - irange(0, 6);
    const employees =
      industry === "Dental Practice" || industry === "Medical Billing Services" ? irange(4, 30) : irange(5, 120);

    const signals: SignalEvent[] = [];
    const add = (id: SignalId, monthsAgo: number, detail: string, value?: number) =>
      signals.push({ id, date: isoMonthsAgo(now, monthsAgo), detail, value });

    // Event signals by profile
    if (profile === "estate") {
      add("owner_death", range(1, 8), `Owner's obituary published ${Math.round(range(1, 8))} months ago — business passed to family`);
      if (chance(0.7)) add("probate_filing", range(0.5, 6), "Estate opened in probate court, business among listed assets");
      if (chance(0.5)) add("gbp_temporarily_closed", range(0.5, 4), "Google profile flipped to 'temporarily closed'");
      if (chance(0.4)) add("social_abandoned", range(2, 6), "All business social accounts gone silent");
    } else if (profile === "stale_listing") {
      add("stale_competitor_listing", range(6, 14), `Listed on BizBuySell ${Math.round(range(6, 14))} months ago with a competing broker — still unsold`);
      if (chance(0.35)) add("fsbo_listing", range(1, 6), "Owner also posted a quiet FSBO listing on DealStream");
      if (chance(0.4)) add("selling_intent_search", range(0.5, 5), "Owner flagged researching business valuation calculators");
      if (chance(0.3)) {
        const amt = irange(10, 80) * 1000;
        add("owner_tax_lien", range(4, 18), `State tax lien — $${(amt / 1000).toFixed(0)}K`, amt);
      }
    } else if (profile === "critical") {
      if (chance(0.5)) add("divorce", range(1, 10), `Divorce filed ${Math.round(range(1, 10))} months ago in ${metro.city} county court`);
      if (chance(0.3)) add("spouse_death", range(2, 12), "Spouse's obituary published in local paper");
      if (chance(0.45)) add("pre_foreclosure", range(0.5, 6), "Notice of default recorded on business property");
      if (chance(0.4)) add("personal_bankruptcy", range(1, 12), "Chapter 13 petition filed by owner");
      if (chance(0.5)) {
        const amt = irange(20, 250) * 1000;
        add("owner_tax_lien", range(1, 14), `Active IRS tax lien — $${(amt / 1000).toFixed(0)}K`, amt);
      }
      if (chance(0.35)) add("business_bankruptcy", range(1, 8), "Chapter 11 filing for operating entity");
      if (chance(0.3)) add("partnership_dissolution", range(2, 14), "Partnership dissolution filed with Secretary of State");
      if (chance(0.4)) add("exec_departure", range(1, 8), "Long-time general manager departed");
      if (chance(0.35)) add("property_tax_delinquent", range(3, 15), "Property taxes 12+ months delinquent");
      if (chance(0.3)) add("selling_intent_search", range(0.5, 5), "Owner flagged searching 'how much is my business worth'");
      if (chance(0.25)) add("gbp_hours_reduced", range(0.5, 6), "Cut Saturday hours on Google Business Profile");
      if (chance(0.25)) add("sba_loan_distress", range(1, 10), "SBA 7(a) loan flagged past due in BrightQuery");
      if (chance(0.2)) add("commercial_property_listed", range(0.5, 6), "Business property surfaced on REsimplifi commercial listings");
      if (chance(0.15)) add("property_listed_for_rent", range(0.5, 6), "Building quietly listed for lease on rental marketplaces");
    } else if (profile === "elevated") {
      if (chance(0.3)) add("divorce", range(4, 20), "Divorce proceedings in county records");
      if (chance(0.25)) {
        const amt = irange(10, 90) * 1000;
        add("owner_tax_lien", range(3, 20), `State tax lien — $${(amt / 1000).toFixed(0)}K`, amt);
      }
      if (chance(0.2)) add("owner_judgment", range(3, 18), "Civil judgment against owner (unsatisfied)");
      if (chance(0.2)) add("property_tax_delinquent", range(4, 20), "Property taxes 6–12 months delinquent");
      if (chance(0.25)) add("exec_departure", range(2, 12), "Operations VP left for a competitor");
      if (chance(0.2)) add("ucc_spike", range(2, 10), "3 new UCC filings by secured creditors in 12mo");
      if (chance(0.2)) add("partnership_dissolution", range(6, 24), "Co-owner exited the partnership");
      if (chance(0.15)) add("negative_review_spike", range(0.5, 4), "Cluster of 1-star reviews in the last 30 days");
      if (chance(0.15)) add("lease_expiring", range(0.5, 8), "Commercial lease expires within 12 months");
      if (chance(0.12)) add("loan_maturity", range(0.5, 8), "SBA balloon payment due within 12 months");
      if (chance(0.15)) add("selling_intent_search", range(1, 6), "Owner flagged browsing broker directories");
      if (chance(0.12)) add("competitor_surge", range(1, 10), "3 new competitors opened within 3 miles this year");
      if (chance(0.1)) add("gbp_hours_reduced", range(1, 6), "Reduced weekday hours on Google Business Profile");
      if (chance(0.12)) add("sba_loan_distress", range(2, 14), "SBA loan payments trending late");
      if (chance(0.1)) add("property_listed_for_rent", range(1, 8), "Suite listed for sublease on RentHub-tracked marketplaces");
      if (chance(0.08)) add("insider_selling", range(1, 8), "Form 4 cluster: officers selling shares of parent entity");
    } else if (profile === "early") {
      if (chance(0.12)) add("owner_judgment", range(8, 30), "Older civil judgment on record");
      if (chance(0.12)) add("ucc_spike", range(6, 20), "Uptick in UCC filings");
      if (chance(0.15)) add("lease_expiring", range(1, 10), "Lease renewal window approaching");
      if (chance(0.1)) add("negative_review_spike", range(1, 5), "Recent negative review cluster");
      if (chance(0.1)) add("health_event_proxy", range(2, 12), "Repeated court postponements + 4 months of social silence");
      if (chance(0.08)) add("zoning_change", range(2, 18), "Rezoning approved two parcels away");
      if (chance(0.08)) add("competitor_surge", range(2, 14), "New franchise competitor opened nearby");
    }

    const metricsBase = {
      estate: { paydex: irange(30, 60), failure: irange(1400, 1900), emp: irange(-40, -10), rev: irange(-40, -15), traffic: irange(-60, -20), postings: irange(-90, -40), ratingD: -(irange(0, 4) / 10), social: irange(90, 300), socialDrop: irange(-95, -60), permit: irange(3, 9) },
      stale_listing: { paydex: irange(45, 70), failure: irange(1200, 1700), emp: irange(-18, 0), rev: irange(-15, 2), traffic: irange(-20, 0), postings: irange(-50, -5), ratingD: -(irange(0, 4) / 10), social: irange(30, 180), socialDrop: irange(-60, -10), permit: irange(2, 7) },
      critical: { paydex: irange(18, 42), failure: irange(1550, 2050), emp: irange(-38, -12), rev: irange(-35, -10), traffic: irange(-45, -15), postings: irange(-80, -30), ratingD: -(irange(3, 9) / 10), social: irange(120, 400), socialDrop: irange(-80, -35), permit: irange(4, 9) },
      elevated: { paydex: irange(35, 62), failure: irange(1350, 1800), emp: irange(-22, -4), rev: irange(-18, -2), traffic: irange(-28, -5), postings: irange(-60, -10), ratingD: -(irange(0, 6) / 10), social: irange(60, 240), socialDrop: irange(-55, -15), permit: irange(2, 7) },
      early: { paydex: irange(52, 78), failure: irange(1100, 1600), emp: irange(-12, 4), rev: irange(-10, 5), traffic: irange(-15, 5), postings: irange(-35, 10), ratingD: -(irange(0, 4) / 10), social: irange(20, 150), socialDrop: irange(-35, 5), permit: irange(1, 6) },
      healthy: { paydex: irange(70, 95), failure: irange(700, 1300), emp: irange(-3, 18), rev: irange(-2, 22), traffic: irange(-5, 20), postings: irange(-10, 40), ratingD: irange(-1, 3) / 10, social: irange(2, 45), socialDrop: irange(-10, 30), permit: irange(0, 3) },
    }[profile];

    const first = pick(FIRST);
    const last = pick(LAST);
    const name = `${pick(NAME_A)} ${NAME_B[industry]}`;

    businesses.push({
      id: `biz_${(seed + i).toString(36)}_${i}`,
      name,
      industry,
      naics,
      city: metro.city,
      state: metro.state,
      zip: metro.zip,
      lat: metro.lat + range(-0.12, 0.12),
      lng: metro.lng + range(-0.12, 0.12),
      foundedYear,
      employeeCount: employees,
      revenueEstimate: Math.round(range(0.8, 14) * 1_000_000),
      owner: {
        name: `${first} ${last}`,
        age: ownerAge,
        yearsOwnership,
        hasSuccessor: profile === "healthy" ? chance(0.5) : chance(0.18),
        email: `${first.toLowerCase()}.${last.toLowerCase()}@${name.toLowerCase().replace(/[^a-z]+/g, "")}.com`,
        phone: `(${irange(480, 928)}) 555-0${irange(100, 199)}`,
        homeCity: metro.city,
        contactVerified: chance(profile === "healthy" ? 0.5 : 0.72),
        homeDistanceMiles:
          profile !== "healthy" && chance(0.18) ? range(60, 900) : range(2, 35),
        retirementInterestSignals: ownerAge >= 55 ? irange(0, 4) : irange(0, 1),
        otherBusinessCount: chance(0.12) ? irange(2, 4) : irange(0, 1),
      },
      signals,
      metrics: {
        paydex: metricsBase.paydex,
        failureScore: metricsBase.failure,
        employeeChangePct12mo: metricsBase.emp,
        revenueTrendPct12mo: metricsBase.rev,
        footTrafficYoYPct: metricsBase.traffic,
        jobPostingsYoYPct: metricsBase.postings,
        rating: Math.round(range(2.8, 4.9) * 10) / 10,
        ratingDelta6mo: metricsBase.ratingD,
        daysSinceLastSocialPost: metricsBase.social,
        socialPostingDropPct: metricsBase.socialDrop,
        yearsSinceLastPermit: metricsBase.permit,
        seniorBenchCount: profile === "healthy" ? irange(1, 4) : irange(0, 2),
        propertyValueTrendPct:
          profile === "critical" || profile === "estate" ? irange(-22, -2) : irange(-10, 12),
        loanToValue: profile === "critical" ? irange(70, 115) : irange(30, 92),
        propertyCondition: profile === "healthy" ? irange(3, 5) : irange(1, 4),
        industryTrendPct: irange(-14, 10),
        sectorTrendPct: irange(-14, 12),
        twitterSentiment: profile === "critical" ? range(-0.8, 0.1) : range(-0.4, 0.7),
        climateRiskScore: irange(10, 95),
        dataCoverage: Math.round(range(profile === "healthy" ? 0.35 : 0.55, 0.98) * 100) / 100,
      },
    });
  }

  return businesses;
}
