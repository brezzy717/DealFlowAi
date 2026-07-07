# DealScore v3 — Scoring System Overhaul

> **v3 (Jul 6, later that day):** EVERY source in the spec's inventory now feeds weighted features — all 26 Dewey
> datasets, all subscriptions, all scrapers. Audit table: [SOURCE-FEATURE-MATRIX.md](SOURCE-FEATURE-MATRIX.md).
> Added **compound interactions** (Retirement Cliff, Death Spiral, Exit Prep, Walking Away — up to +9 before the
> stacking multiplier) so co-occurring signals like "70, divorced, no successor, failing business, personal BK"
> score superlinearly. Data & model lifecycle (universe build → daily deltas → drift → retraining → clawback):
> [ML-LIFECYCLE.md](ML-LIFECYCLE.md).

You asked for a full overhaul of the original 55-feature weight sheet. This is it. The engine implementing this
spec lives at `web/src/lib/scoring/engine.ts` and is what scores every lead in the app today.

> **v2.1 (Jul 6):** Added the signals only YOUR data access can capture — obituary/death-notice monitoring
> (owner death → estate leads), probate dockets, FB/IG/LinkedIn scraper decay, Google API behavioral signals
> (selling-intent search flags, Business Profile "temporarily closed" / reduced hours), competitor listing
> intelligence (stale 6+ month listings, FSBO detection), and competitor surge. New Category I gives listing/intent
> signals dedicated weight, and leads now carry **source tags** (Estate, Stale Listing, Sale Intent, Distress,
> Succession) that change the outreach playbook and the explanation language.

## What was wrong with v1

1. **Double counting.** `owner_age` and `owner_retirement_proximity` were the same signal counted twice (a 67-year-old
   scored on both "is 65+" and "is past 65"). Same with `paydex_score_low` appearing conceptually inside both
   business distress and performance decline.
2. **Hard time cliffs.** A divorce at 11 months scored 6 points; at 13 months it scored 4. Real predictive power
   fades smoothly, not in steps.
3. **Flat addition.** v1 treated an owner with a divorce AND a tax lien AND pre-foreclosure as the simple sum of
   three signals. Empirically, independent co-occurring distress is *superlinear* — those owners exit far more often
   than the sum implies.
4. **No data-quality guardrail.** A business with one scraped signal and nothing else could hit Platinum and burn a
   broker's trust on a bad call. Score confidence and data coverage are different things and must be tracked separately.
5. **Weight drift from evidence.** v1 gave Reputation 5pts but Operational Decay 8pts while underweighting succession
   (15pts) — yet broker industry data consistently shows retirement/succession is the #1 stated reason for SMB sales
   (~50% of exits), with distress second.

## v2 architecture

```
FinalScore  = min(100, (BaseScore + InteractionBonus) × StackMultiplier)
BaseScore   = Σ category points (each capped)
Interaction = named cross-category combos, capped at +9
Confidence  = 0.8 × data_coverage + 0.2 × contact_verified   (0–1, gates Platinum)
```

### Category caps (Σ = 100)

| Cat | Name | Cap | Rationale |
|---|---|---|---|
| A | Succession & Owner Readiness | 16 | Age curve to 70+ (9), tenure, no successor, **owner moved away (PDL Location), retirement-interest shift (PDL Interests/Skills), thin management bench (PDL Title/Experience Levels), multiple businesses, legacy entity age, age×tenure compound**. |
| B | Life Events & Estate | 16 | Divorce/spouse death/dissolution/health + **owner death (10) and probate filings (8)** from obituary + court-docket scrapers. |
| C | Owner Financial Distress | 12 | Personal BK, tax liens, judgments + lien-pattern bonus (UniCourt + county recorders). |
| D | Business Financial Distress | 16 | Business BK, pre-foreclosure, tax delinquency, UCC spikes, severe DBT + **SBA loan distress (BrightQuery), underwater mortgage (Recorder+AVM), property value erosion (Assessor History), going-concern (SEC)**. |
| E | Business Trajectory | 11 | Headcount (PDL monthly), PAYDEX/failure (D&B), exec departures, revenue proxy (SafeGraph+ConsumerEdge), **insider selling (Form 4)**. |
| F | Operational Decay | 8 | Foot traffic (Advan), permits (Builty), hiring freeze (WageScape), social abandonment + posting collapse (FB/IG/LinkedIn scrapers), GBP closed/hours, **property condition (Verisk)**. |
| G | Reputation & Market | 7 | Ratings/reviews (Google+Yelp), competitor surge (Places+POI), **industry decline (NASDAQ), sector financials (BrightQuery), Twitter sentiment (Context Analytics)**. |
| H | Timing Triggers | 4 | Lease expiration, loan maturity, zoning, **climate risk (ClimateCheck)**. |
| I | **Listing & Sale Intent** | 10 | Stale competitor listings 6+ mo (9), FSBO (8), selling-intent search flags (7), **building listed commercially (REsimplifi, 7) or for lease (RentHub, 6)** — proven intent; floor = Gold. |

### Recency decay (replaces cliffs)

Every dated event decays exponentially: `points = base × 2^(−age_months / half_life)`, ignored past a floor age.

| Signal | Base | Half-life | Floor |
|---|---|---|---|
| Business bankruptcy | 10 | 18 mo | 48 mo |
| **Owner deceased (obituary/death notice)** | 10 | 12 mo | 30 mo |
| Personal bankruptcy | 9 | 18 mo | 48 mo |
| **Stale competitor listing (6+ mo unsold)** | 9 | 12 mo | 24 mo |
| Divorce filed | 8 | 12 mo | 36 mo |
| Death of spouse | 8 | 12 mo | 30 mo |
| Pre-foreclosure notice | 8 | 9 mo | 24 mo |
| **Estate in probate** | 8 | 15 mo | 36 mo |
| **FSBO listing detected** | 8 | 6 mo | 12 mo |
| **Selling-intent search flagged (Google)** | 7 | 6 mo | 12 mo |
| Tax lien (owner) | 6 | 15 mo | 36 mo |
| Partnership dissolution | 6 | 12 mo | 30 mo |
| Property tax delinquency | 5 | 18 mo | 36 mo |
| Civil judgment | 4 | 15 mo | 36 mo |
| **GBP marked temporarily closed** | 4 | 6 mo | 12 mo |
| Exec departure | 3 | 9 mo | 18 mo |
| UCC spike | 3 | 12 mo | 24 mo |
| Health event proxy | 3 | 9 mo | 18 mo |
| Lease expiring / loan maturity | 2 | 12 mo | 15 mo |
| Negative review spike | 2 | 3 mo | 6 mo |
| **GBP hours reduced** | 2 | 6 mo | 12 mo |
| **Competitor surge (3+ new nearby)** | 2 | 12 mo | 24 mo |

### Source tags → outreach playbook

Signals also derive a **source tag** shown on every lead card, because these cohorts get worked differently:

| Tag | Trigger | Playbook |
|---|---|---|
| **Estate** | Owner death / probate filing | Sensitive, fast: confidential valuation offer to the estate's representative before the business simply closes. |
| **Stale Listing** | Listed with a competitor 6+ mo, unsold | "Your current broker has had six months. Let's discuss alternative strategies." Proven intent — highest-conversion cohort. |
| **Sale Intent** | Flagged selling-behavior searches / FSBO | Owner is already researching. Lead with education + valuation, not persuasion. |
| **Distress** | ≥8 pts across C+D | Speed + discretion; "confidential valuation," never "selling." |
| **Succession** | ≥10 pts in A | Long-game nurture; retirement-planning framing. |

### Stacking multiplier

Count categories firing at ≥50% of their cap: 3 categories → ×1.10, 4 → ×1.18, 5+ → ×1.25.
This is the mechanism that turns "divorced 66-year-old with a tax lien and shrinking headcount" into a Platinum
lead even though no single signal is extreme — which is exactly the profile brokers say converts.

### Confidence gate

`Confidence < 0.6` demotes a would-be Platinum to Gold with a `needs_verification` flag shown in the UI.
Nothing reaches "call them today" status on thin data.

### Intent floor

A live listing (stale competitor listing or FSBO) is *proven* intent to sell — those leads never fall below
Gold no matter what the distress math says. The question isn't whether they'll sell; it's whether they'll sell
with you.

### Tiers (unchanged thresholds, Black added explicitly)

Platinum 75–100 (0–3 mo) · Gold 55–74 (3–6 mo) · Silver 35–54 (6–12 mo) · Black <35 (monitor only, never distributed).

## Path to the ML ensemble

The rules engine is v1 of the *product*, not the end state. As the 3-stage feedback loop accumulates labeled
outcomes (booked / listed / closed with days-to-sale), the XGBoost + Random Forest + NN ensemble from the spec
shadow-scores every lead alongside the rules engine. When its precision@Platinum beats the rules engine over a
rolling 90-day window, it takes over primary scoring — and the rules score remains as the explainability layer.
The `outcome_quality_score` labels from the spec (booked 0.8, future interest 0.6, lost 0.3, not interested 0.2,
no answer 0.1, DNC 0.0) plug directly into that training set.
