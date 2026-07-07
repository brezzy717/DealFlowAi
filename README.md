# DealFlow AI

Off-market deal intelligence for business brokers. Scores businesses on 55+ distress and succession
signals, distributes tiered leads to broker dashboards every Tuesday at 6 AM, and automates outreach.

## Repo layout

- Next.js app at the repo root (dashboard + landing). `npm run dev` → http://localhost:3000
- `docs/SCORING-V2.md` — DealScore v3 scoring spec (implemented in `src/lib/scoring/engine.ts`)
- `docs/SOURCE-FEATURE-MATRIX.md` — audit: every data source → the weighted feature(s) it feeds
- `docs/INGESTION-PIPELINE.md` — per-source API endpoints, cadences, landing tables
- `docs/ML-LIFECYCLE.md` — 38M universe build, daily delta rescoring, drift monitoring, retraining, clawback, security
- `Build Documents/` — the source-of-truth product spec (July 6, 2026)
- `ml-service/` — (Phase 4) Python FastAPI ensemble scoring service

## Locked stack

Next.js on Vercel · Supabase (Postgres/Auth/Storage/Realtime) · Stripe · Inngest · Resend ·
Cal.com platform API · Mapbox · Claude for lead explanations & Ava (Deal Assist)

## Phase plan & status

1. **1a — Core experience: ✅ BUILT.** App shell, DealScore v3 rules engine (every data source weighted + compound interactions), synthetic data, Home + Prospects.
2. **1b — CRM core: ✅ BUILT** (on synthetic store). Clients, Pipeline (drag-and-drop Kanban), Task Manager, Reports, Settings, Admin dashboard (clawback, pool health, drift monitor, source freshness). Full Supabase schema ready in `supabase/migrations/0001_init.sql` (RLS included) — **needs: Supabase project + auth wiring**.
3. **2 — Bookings & automation: ✅ BUILT** (demo mode). Onboarding flow (tier → payment → parameters → signed agreement), Calendar (30-day grid), Document Vault, Outreach Concierge (cadence timeline, script editor, call logs), Inngest workflows (Tuesday drop, cadence, rescoring — `src/inngest/`), email templates, adapters for Resend/Vapi/Lob/Cal.com — **needs: STRIPE/RESEND/CALCOM/INNGEST keys**.
4. **3 — Deal collaboration & AI: ✅ BUILT** (demo mode). Deal Room (messaging + doc checklist + signing panel), Ava assistant with live Claude route (`/api/ava`) — **needs: ANTHROPIC_API_KEY for live answers, VAPI key for voice**.
5. **4 — Real data + ML: 🔶 SCAFFOLDED.** FastAPI ensemble service (`ml-service/`), raw-landing + drift tables in schema, connector endpoint map in docs — **needs: Dewey/UniCourt/ATTOM credentials to ingest real data**.

### Env vars that light up live services
`SUPABASE_URL` `SUPABASE_ANON_KEY` `STRIPE_SECRET_KEY` `RESEND_API_KEY` `INNGEST_EVENT_KEY` `INNGEST_SIGNING_KEY` `CALCOM_API_KEY` `ANTHROPIC_API_KEY` `VAPI_API_KEY` `LOB_API_KEY` `NEXT_PUBLIC_MAPBOX_TOKEN`
