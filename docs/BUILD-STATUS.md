# DealFlow AI — Build Status

Snapshot of what's live, what's demo-mode, and what's left. Updated 2026-07-07.

## Infrastructure (all green)
- **GitHub**: github.com/brezzy717/DealFlowAi (Next.js at repo root)
- **Vercel**: auto-deploys from main; www.dealflowtech.io
- **Supabase**: project kofrkxvoqmofxzghihcy — 43 tables, RLS on tenant data, 4 migrations applied
- **Resend**: verified domain updates.dealflowtech.io (emails reach real addresses)
- **Anthropic**: Ava live
- **Inngest**: connected to Vercel (crons run on deploy sync)
- **Retell**: number +16029054435 wired; agent config in progress (needs RETELL_AGENT_ID)

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

## Demo-mode (works, not yet wired to live tables)
- Pipeline (Kanban) — drag/drop persists to localStorage; needs deals-table persistence
- Clients page — synthetic list (getLiveClients exists, page not yet swapped)
- Task Manager — localStorage; could pull live needs-action
- Reports — synthetic metrics; needs aggregation queries
- Admin dashboard — synthetic tenants list; pool/drift panels illustrative
- Document Vault — static list; needs Supabase Storage
- Concierge call log — synthetic; real logs land when Retell agent runs

## Not started
- Real data ingestion (Dewey/UniCourt/ATTOM/D&B/Google/scrapers) — Phase 4
- ML ensemble training (service skeleton exists; needs labels + hosting)
- USPS postcards (Lob adapter ready; needs LOB_API_KEY)
- Mapbox prospect map (graceful placeholder; needs NEXT_PUBLIC_MAPBOX_TOKEN)
- Google Calendar sync option
- Stripe live checkout (onboarding uses a stand-in form)

## Test account
demo@dealflow.ai / DealflowDemo!2026 (Demo Brokerage, Tier 2, live assignments)

## Env vars needed in Vercel (production parity)
All the keys in .env.example. Confirmed set by user; NEXT_PUBLIC_APP_URL=https://www.dealflowtech.io.
