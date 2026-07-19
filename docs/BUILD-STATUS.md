# DealFlow AI — Build Status

Snapshot of what's live, what's demo-mode, and what's left. Updated 2026-07-07.

## Infrastructure (all green)
- **GitHub**: github.com/brezzy717/DealFlowAi (Next.js at repo root)
- **Vercel**: auto-deploys from main; www.dealflowtech.io
- **Supabase**: project kofrkxvoqmofxzghihcy — 43 tables, RLS on tenant data, 4 migrations applied
- **Resend**: verified domain updates.dealflowtech.io (emails reach real addresses)
- **Anthropic**: Ava live
- **Inngest**: connected to Vercel (crons run on deploy sync)
- **Retell**: VERIFIED — key valid, agent "Lead Qualification" live, number + LLM id wired into cadence w/ call_logs

## Working end-to-end (verified against live DB)
| Flow | Status |
|---|---|
| Sign up / sign in (Supabase Auth) | ✅ live |
| Auth gate on /dashboard, /admin, /onboarding | ✅ live |
| Onboarding → tenant + params + signed agreement + first 15 leads | ✅ live |
| Lead distribution (param-matched, no-duplicate, confidence gate) | ✅ live, tested |
| Weekly drop (Inngest cron + manual /api/admin/run-drop) | ✅ live |
| Day-1 warm email w/ booking link (Resend) | ✅ live |
| Native scheduling: /book/[tenant], slots, confirmations | ✅ live, tested |
| Feedback loop: outcome → outreach_feedback + ml_training_data | ✅ live, tested |
| One-click DNC compliance page | ✅ live |
| Deal Room realtime (Supabase) | ✅ live, tested |
| Ava assistant (Claude) | ✅ live |
| Prospects / Home / Calendar read live book | ✅ live |
| Lead pool seeded (240 scored businesses) | ✅ done |
| Mapbox prospect map (tier-colored pins + popups) | ✅ live |
| Stripe Checkout in onboarding (setup fee + subscription, sandbox) | ✅ live, verified |
| Meta Model (Claude) explanations at disbursement | ✅ live, verified |
| Real clawback + audit trail | ✅ live, verified |
| Proprietary lockdown on broker lead cards | ✅ done |

## Demo-mode fallbacks only (all tabs live for signed-in brokers)
- Every dashboard tab now reads/writes live tables; synthetic data renders only for signed-out visitors.
- Reports leaderboard + zip activity still illustrative (needs cross-tenant aggregation policy decision)
- Concierge script editor saves locally (needs per-tenant script storage — trivial add)

## Not started
- Real data ingestion (Dewey/UniCourt/ATTOM/D&B/Google/scrapers) — Phase 4
- ML ensemble training (service skeleton exists; needs labels + hosting)
- USPS postcards: LIVE key wired into Day-1 drop flow; sends automatically once leads have real street addresses (synthetic seeds have none — no accidental spend)
- Google Calendar sync option

## Test account
demo@dealflow.ai / DealflowDemo!2026 (Demo Brokerage, Tier 2, live assignments)

## Env vars needed in Vercel (production parity)
All the keys in .env.example. Confirmed set by user; NEXT_PUBLIC_APP_URL=https://www.dealflowtech.io.
