# DealFlow AI — Data & Model Lifecycle (the most important part of the build)

How the system goes from empty database → ~38M scored SMBs → daily-refreshed, self-improving lead machine.
Companion to [INGESTION-PIPELINE.md](INGESTION-PIPELINE.md) (per-source endpoints) and
[SOURCE-FEATURE-MATRIX.md](SOURCE-FEATURE-MATRIX.md) (proof every source is wired).

## Stage 0 — Universe build (one-time bulk, ~2 weeks of pipeline runtime)

1. **Seed universe from PDL Company Insights (72M):** filter to brokerable SMBs —
   US-based, active, 3–500 employees, est. revenue $250K–$50M, excluding non-brokerable NAICS
   (government, religious orgs, holding shells). Expected result: **~35–40M businesses.**
2. **Entity spine:** assign `pdl_company_id` as primary key; crosswalk DUNS (D&B), Placekey (SafeGraph),
   APN (ATTOM), Google place_id, Yelp id. Every later source joins through this spine.
3. **Owner resolution:** PDL Person Demographics + Job Title Level → primary owner(s) per business;
   Apollo/Whitepages enrichment deferred until a lead reaches distribution (cost control).
4. **Bulk signal backfill:** run every connector's historical pull (ATTOM pre-foreclosure history, UniCourt
   party sweeps for Silver+ candidates, permits, employee trends, reviews snapshot, listings crawl).
5. **Initial scoring pass:** batch-score all ~38M with DealScore v3. Distribution lands roughly:
   ~0.5–1% Platinum/Gold (the sellable inventory), ~5–8% Silver, rest Black monitor pool.

## Stage 1 — Daily delta ingestion → same-day rescore

Every day at 02:00 (per-source cadence in the pipeline doc), connectors pull **only new/changed records**
(source cursors + dedupe hashes). The delta flow:

```
new records → raw_* landing → entity match → signal upsert → emit signal/created{business_id, priority}
   → CRITICAL: rescore immediately (owner death, BK, pre-foreclosure, stale listing)
   → HIGH:     rescore within the hour (divorce, probate, FSBO, intent flags, C-suite exit)
   → MED/LOW:  nightly batch rescore of touched businesses only
```

- **Only touched businesses rescore daily** (~50–200K/day, not 38M). Full-universe refresh runs monthly.
- Every rescore writes a `scoring_events` row (previous/new score + trigger) — the audit trail the admin
  dashboard and drift monitors read.
- **Tier promotions pull leads into distribution:** a Black-pool business crossing 35+ enters the color pool
  for the next Tuesday drop; crossing 75 with confidence ≥0.6 flags for priority assignment.
- Your Thursday example is literally this path: Thursday's UniCourt delta lands a divorce for a 70-year-old
  owner with no successor whose business has declined all year and who just filed personal BK →
  signal upserts fire → immediate rescore → Retirement Cliff + Death Spiral interactions fire →
  Platinum → next drop (or same-day alert to the assigned broker if already distributed).

## Stage 2 — Training from day one

No waiting for feedback data. Three label sources, in order of arrival:

| Phase | Labels | Used for |
|---|---|---|
| Day 1 | **Proxy labels:** businesses that appeared on BizBuySell/broker listings within 12mo of a historical snapshot; SOS dissolutions (negative-ish); actual recorded business sales from ATTOM Recorder deed transfers with business-entity grantors | Train ensemble v0 (XGBoost 42% / RF 33% / NN 25%) to shadow-score alongside rules |
| Month 1+ | **Stage-1 feedback:** outreach outcomes (booked 0.8, future interest 0.6, not interested 0.2, no answer 0.1, DNC 0.0) | Weekly incremental retrain; calibrates "will they take the meeting" |
| Month 3+ | **Stage-2/3 feedback:** meetings → listings → closed deals with days-to-sale | The real target; ensemble transitions from proxy to outcome labels |

**Promotion rule:** the ensemble takes over primary scoring when its precision@Platinum beats the rules
engine over a rolling 90-day window on held-out outcomes. The rules score stays forever as the
explainability layer and sanity check (>25-point disagreement → admin review queue).

## Stage 3 — Drift monitoring & retraining

- **Feature drift:** weekly PSI (population stability index) per feature vs. training baseline; PSI >0.2 alerts,
  >0.3 blocks auto-retrain and pages admin.
- **Score drift:** daily tier-distribution monitor (e.g., Platinum share doubling overnight = upstream data
  problem, not a selling wave).
- **Data freshness SLAs:** per-source `last_successful_run` monitors; a stale source (>2× cadence) marks its
  features "degraded" and lowers confidence scores for affected businesses rather than silently scoring on
  old data.
- **Outcome monitoring:** rolling precision/recall per tier, days-to-sale calibration vs. predicted windows,
  broker-reported prediction-accuracy notes fed to the training set.
- **Retraining cadence:** weekly incremental (new labels), monthly full retrain with hyperparameter sweep,
  every model versioned in `model_versions` with automatic rollback if validation RMSE regresses >10%.

## Stage 4 — Distribution, clawback & data ops

- **Tuesday 06:00 drops** (Inngest cron): match scored inventory against each tenant's parameters
  (geo, revenue, employees, industry excludes), 5 per tier per broker, no duplicate assignment,
  leads assigned for life while the broker stays active.
- **Clawback:** admin dashboard can revoke/reassign any lead (mis-assignment); automatic clawback when a
  broker churns with zero contact logged — lead returns to the color pool for the next drop. Every
  clawback writes an audit row.
- **Rescore vs. assigned leads:** if an assigned lead's score jumps ≥10 or tier changes, the broker gets a
  dashboard alert + the new explanation ("New signal: owner filed for divorce Tuesday").

## Security (day one, not later)

- Supabase Postgres with **RLS on every tenant-scoped table** — a broker can only ever read their own leads,
  feedback, documents, and recordings.
- PII segregation: owner contact data in a restricted schema, service-role access only via the API layer;
  encrypted at rest (AES-256) and in transit; no PII in logs.
- Audit logging on all admin actions (clawbacks, reassignments, parameter overrides) and all data exports.
- Secrets in Vercel/Supabase vault; per-connector least-privilege API keys with rotation.
- Scraped-source data retention limits + DNC/compliance records retained separately (legal basis).
- SOC 2 readiness path: access reviews, backup/restore drills, incident runbook.
