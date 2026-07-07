-- DealFlow AI — initial schema (Phase 1b)
-- Consolidates the spec's schema with the v3 scoring engine's needs.
-- Apply with: supabase db push  (or the Supabase MCP apply_migration)

create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm; -- fuzzy entity matching

-- ============ TENANCY & USERS ============
create table tenants (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  tier smallint not null default 1 check (tier in (1, 2, 3)),
  status text not null default 'active' check (status in ('active','past_due','paused','churned')),
  ai_calling_concierge_enabled boolean not null default false,
  monthly_lead_quota int not null default 60,          -- admin-adjustable per spec
  pause_drops_until date,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  auth_user_id uuid not null unique,                   -- supabase auth.users
  full_name text,
  email text not null,
  role text not null default 'broker' check (role in ('broker','admin')),
  created_at timestamptz default now()
);

create table tenant_parameters (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  geo_states text[] default '{}',
  geo_cities text[] default '{}',
  geo_zips text[] default '{}',
  revenue_min numeric, revenue_max numeric,
  employees_min int, employees_max int,
  min_years_in_business int,
  industries_include text[] default '{}',
  industries_exclude text[] default '{}',
  updated_at timestamptz default now(),
  unique (tenant_id)
);

create table onboarding_progress (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  payment_complete boolean default false,
  parameters_configured boolean default false,
  ai_concierge_decision_made boolean default false,
  agreement_signed_at timestamptz,
  agreement_signature text,
  onboarding_complete boolean default false,
  dashboard_tour_completed boolean default false,
  updated_at timestamptz default now()
);

-- ============ BUSINESS UNIVERSE (spec Part 2, condensed) ============
create table businesses (
  id uuid primary key default gen_random_uuid(),
  pdl_company_id text unique,
  duns_number varchar(9),
  placekey text,
  google_place_id text,
  legal_name text not null,
  dba_name text,
  naics_code varchar(6),
  industry_category text,
  street_address text, city text, state varchar(2), zip_code varchar(10), county text,
  latitude numeric(10,7), longitude numeric(10,7),
  founded_date date,
  employee_count int,
  revenue_estimate numeric(15,2),
  main_phone text, website text,
  entity_status text default 'active',
  data_quality_score numeric(3,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_enriched_at timestamptz
);
create index idx_businesses_location on businesses(state, city);
create index idx_businesses_industry on businesses(naics_code);
create index idx_businesses_name_trgm on businesses using gin (legal_name gin_trgm_ops);

create table business_owners (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  pdl_person_id text,
  full_name text,
  date_of_birth date,
  age int,
  role text,
  is_primary_owner boolean default false,
  ownership_start_date date,
  home_street text, home_city text, home_state varchar(2), home_zip varchar(10),
  home_distance_miles numeric,                          -- PDL Location Name signal
  retirement_interest_signals int default 0,            -- PDL Interests signal
  other_business_count int default 0,
  has_successor boolean,
  created_at timestamptz default now(),
  unique (business_id, pdl_person_id)
);

-- PII vault: contact data segregated for least-privilege access
create table owner_contact_enrichment (
  owner_id uuid primary key references business_owners(id) on delete cascade,
  work_email text, personal_email text,
  work_phone text, mobile_phone text, linkedin_url text,
  email_verified boolean, email_deliverability text,
  phone_verified boolean, phone_type text,
  apollo_id text,
  data_freshness_date date,
  updated_at timestamptz default now()
);

-- ============ SIGNAL TABLES ============
create table owner_life_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references business_owners(id) on delete cascade,
  event_type text not null,        -- divorce, spouse_death, owner_death, probate_filing, partnership_dissolution, health_event_proxy
  event_date date, event_status text,
  case_number text, court_name text, jurisdiction text,
  event_source text, raw_record jsonb,
  created_at timestamptz default now(),
  unique (owner_id, event_type, event_date)
);

create table owner_financial_distress (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references business_owners(id) on delete cascade,
  distress_type text not null,     -- bankruptcy_ch7/13, tax_lien, judgment, mechanics_lien
  filing_date date, case_number text, amount numeric(15,2),
  status text, discharge_date date,
  data_source text, raw_record jsonb,
  created_at timestamptz default now(),
  unique (owner_id, distress_type, case_number)
);

create table business_financial_distress (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  distress_type text not null,     -- pre_foreclosure, tax_delinquent, bankruptcy_ch11/7, ucc_filing, judgment_lien, sba_loan_distress, going_concern
  property_apn text, filing_date date, notice_date date, auction_date date,
  case_number text, amount_owed numeric(15,2), status text, creditor_name text,
  data_source text, raw_record jsonb,
  created_at timestamptz default now(),
  unique (business_id, distress_type, case_number)
);

create table business_credit (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  paydex_score int, failure_score int, delinquency_score int,
  days_beyond_terms int, payment_trend text,
  snapshot_date date not null, data_source text default 'dnb_scraper', raw_record jsonb,
  unique (business_id, snapshot_date)
);

create table employee_trends (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  snapshot_month date not null, employee_count int,
  mom_change_pct numeric(6,2), yoy_change_pct numeric(6,2),
  unique (business_id, snapshot_month)
);

create table executive_departures (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  executive_name text, title text, seniority_level text,
  departure_date date, raw_record jsonb,
  unique (business_id, executive_name, departure_date)
);

create table property_records (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  apn text unique, property_address text, county text,
  owner_type text, property_type text, year_built int, building_sqft int,
  assessed_value numeric(15,2), avm_value numeric(15,2), avm_confidence numeric(3,2),
  value_trend_yoy_pct numeric(6,2),                     -- ATTOM Assessor History signal
  property_condition smallint,                          -- Verisk signal (1-5)
  climate_risk_score smallint,                          -- ClimateCheck signal
  tax_delinquent boolean default false, tax_amount_due numeric(12,2),
  mortgage_amount numeric(15,2), mortgage_date date, loan_to_value numeric(5,2),
  lease_expiration_date date, monthly_rent numeric(12,2),
  data_source text, raw_record jsonb,
  updated_at timestamptz default now()
);

create table building_permits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  permit_number text, permit_type text, issue_date date,
  estimated_cost numeric(12,2), jurisdiction text, raw_record jsonb,
  unique (permit_number, jurisdiction)
);

create table foot_traffic (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  placekey text, period_start date not null, period_type text,
  raw_visit_count int, yoy_change_pct numeric(6,2),
  data_source text, raw_record jsonb,
  unique (business_id, period_start, period_type)
);

create table online_reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  platform text not null, snapshot_date date not null,
  current_rating numeric(2,1), total_review_count int,
  rating_delta_6mo numeric(3,1), reviews_last_30_days int,
  negative_spike boolean default false,
  business_status text,                                  -- Google: OPERATIONAL / CLOSED_TEMPORARILY
  hours_reduced boolean default false,
  raw_record jsonb,
  unique (business_id, platform, snapshot_date)
);

create table social_media_presence (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  platform text not null, snapshot_date date not null,
  follower_count int, posts_last_30_days int, posts_last_90_days int,
  last_post_date date, posting_drop_pct numeric(6,2),
  raw_record jsonb,
  unique (business_id, platform, snapshot_date)
);

create table job_postings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  snapshot_month date not null, active_postings_count int,
  yoy_posting_change_pct numeric(6,2), raw_record jsonb,
  unique (business_id, snapshot_month)
);

create table sec_filings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  cik text, filing_type text not null, filing_date date not null,
  accession_number text unique,
  going_concern_warning boolean default false,
  insider_transaction_type text, transaction_value numeric(15,2),
  raw_record jsonb
);

create table market_listings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete set null, -- matched later if anonymized
  source text not null,             -- bizbuysell, bizquest, loopnet, dealstream, broker_site, resimplifi, renthub
  listing_kind text not null,       -- business_for_sale, fsbo, commercial_property, property_for_rent
  url_hash text unique,
  first_seen date not null, last_seen date not null,
  asking_price numeric(15,2), price_history jsonb default '[]',
  broker_name text, seller_type text, status text default 'live',
  raw_record jsonb
);
create index idx_listings_stale on market_listings(first_seen) where status = 'live';

create table intent_flags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references business_owners(id) on delete cascade,
  business_id uuid references businesses(id) on delete cascade,
  flag_type text not null,          -- selling_intent_search, valuation_research, broker_directory_browse
  detected_at date not null,
  evidence jsonb,                   -- search result URLs / snippets from Custom Search sweep
  created_at timestamptz default now()
);

-- ============ RAW LANDING (one per connector; verbatim payloads) ============
create table raw_ingestion (
  id uuid primary key default gen_random_uuid(),
  source text not null,             -- 'attom_preforeclosure', 'unicourt', 'obituary', ...
  dedupe_hash text not null,
  source_cursor text,
  payload jsonb not null,
  fetched_at timestamptz default now(),
  processed_at timestamptz,
  match_status text default 'pending',  -- pending / matched / unmatched / discarded
  unique (source, dedupe_hash)
);
create index idx_raw_pending on raw_ingestion(source, match_status) where match_status = 'pending';

-- ============ SCORING & ML ============
create table scored_leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  final_score numeric(5,2) not null,
  base_score numeric(5,2) not null,
  stack_multiplier numeric(4,3) not null default 1.0,
  interaction_bonus numeric(4,1) not null default 0,
  interactions jsonb default '[]',
  confidence numeric(4,3) not null,
  tier text not null check (tier in ('platinum','gold','silver','black')),
  needs_verification boolean default false,
  source_tags text[] default '{}',
  predicted_sale_window text,
  feature_vector jsonb not null,
  top_signals jsonb not null,
  llm_explanation text,
  engine text not null default 'rules_v3',   -- rules_v3 | ensemble_vN (shadow scores keep both)
  shadow_ensemble_score numeric(5,2),
  score_version int default 1,
  scored_at timestamptz default now(),
  last_rescored_at timestamptz
);
create index idx_scored_tier_score on scored_leads(tier, final_score desc);
create index idx_scored_business on scored_leads(business_id);

create table lead_assignments (
  id uuid primary key default gen_random_uuid(),
  scored_lead_id uuid not null references scored_leads(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  assigned_at timestamptz default now(),
  drop_date date not null,
  status text not null default 'new',   -- new, contacted, meeting_scheduled, in_pipeline, inactive, dnc, clawed_back
  first_contact_at timestamptz,
  deactivated_at timestamptz,
  clawback_reason text,
  unique (scored_lead_id)               -- a lead is never assigned to two brokers
);
create index idx_assignments_tenant on lead_assignments(tenant_id, status);

create table scoring_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id),
  scored_lead_id uuid references scored_leads(id),
  event_type text not null, trigger_reason text, priority text,
  previous_score numeric(5,2), new_score numeric(5,2),
  previous_tier text, new_tier text,
  created_at timestamptz default now()
);
create index idx_scoring_events_date on scoring_events(created_at desc);

create table model_versions (
  id uuid primary key default gen_random_uuid(),
  model_type text not null, version int not null,
  model_path text, training_samples int, label_source text, -- proxy | feedback_stage1 | feedback_full
  validation_rmse numeric(6,4), precision_platinum numeric(5,4), recall_platinum numeric(5,4),
  is_active boolean default false, ensemble_weight numeric(4,3),
  training_date timestamptz default now(),
  unique (model_type, version)
);

create table ml_training_data (
  id uuid primary key default gen_random_uuid(),
  scored_lead_id uuid references scored_leads(id),
  feature_vector jsonb not null, feature_version int not null,
  predicted_score numeric(5,2), actual_outcome text, actual_score numeric(5,2),
  outcome_quality_score numeric(3,2),   -- 1.0 closed-won ... 0.0 DNC (per spec)
  days_to_outcome int, confidence_level text,
  created_at timestamptz default now()
);

create table drift_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null,
  feature_name text not null,
  psi numeric(6,4),
  alert_level text default 'ok',  -- ok / warn (>0.2) / block (>0.3)
  unique (metric_date, feature_name)
);

-- ============ FEEDBACK LOOP (3 stages, per spec) ============
create table outreach_feedback (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references lead_assignments(id) on delete cascade,
  outcome text not null,          -- booked, no_answer, not_interested, dnc, future_interest
  outcome_reason text not null,
  contact_method text, contact_attempts int, contact_date timestamptz,
  callback_date date,             -- future_interest scheduling
  feedback_source text not null,  -- ai_agent | broker
  created_at timestamptz default now()
);

create table meeting_feedback (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references lead_assignments(id) on delete cascade,
  outreach_id uuid references outreach_feedback(id),
  meeting_date timestamptz, meeting_type text,
  outcome text not null,          -- listing_signed, needs_follow_up, not_ready_now, declined
  outcome_reason text not null,
  seller_motivation_level smallint, estimated_timeline text,
  prediction_accuracy_notes text,
  created_at timestamptz default now()
);

create table deal_feedback (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references lead_assignments(id) on delete cascade,
  meeting_id uuid references meeting_feedback(id),
  listing_date date, sale_date date, days_to_close int,
  outcome text not null,          -- sold, listing_expired, withdrawn, still_active
  asking_price numeric(15,2), sale_price numeric(15,2),
  commission_amount numeric(12,2),
  why_they_sold text, primary_motivation text,
  created_at timestamptz default now()
);

-- ============ CRM / APP ============
create table deals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  assignment_id uuid references lead_assignments(id),
  stage text not null default 'Representation Signed',
  est_value numeric(15,2), commission_pct numeric(5,2) default 10,
  stage_entered_at timestamptz default now(),
  created_at timestamptz default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  assignment_id uuid references lead_assignments(id),
  full_name text not null, business_name text, email text, phone text,
  source text not null default 'converted',  -- converted | imported_csv | imported_api
  status text default 'active_deal',
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  title text not null, kind text not null default 'todo',
  assignment_id uuid references lead_assignments(id),
  due_date date, done boolean default false,
  created_at timestamptz default now()
);

create table vault_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null, storage_path text, mime_type text, size_kb int,
  builtin boolean default false, attached_to_outreach boolean default false,
  updated_at timestamptz default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  assignment_id uuid references lead_assignments(id),
  starts_at timestamptz not null, kind text, source text,  -- ai_concierge | magic_link | broker
  status text default 'confirmed',                          -- confirmed | pending | rescheduled | cancelled
  calcom_booking_id text,
  created_at timestamptz default now()
);

create table dealroom_threads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  created_at timestamptz default now()
);

create table dealroom_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references dealroom_threads(id) on delete cascade,
  sender text not null,            -- broker | owner
  body text,
  attachment_path text,
  created_at timestamptz default now()
);

create table call_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  assignment_id uuid references lead_assignments(id),
  called_at timestamptz not null, duration_sec int, attempt int,
  outcome text, recording_path text, transcript text,
  created_at timestamptz default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid,                       -- tenant_users.id or null for system
  action text not null,             -- clawback, reassign, export, parameter_override, ...
  target_type text, target_id uuid,
  detail jsonb,
  created_at timestamptz default now()
);

-- ============ ROW LEVEL SECURITY ============
-- Tenant-scoped tables: brokers only see their own rows. Admin role bypasses via service key.
alter table tenants enable row level security;
alter table tenant_users enable row level security;
alter table tenant_parameters enable row level security;
alter table onboarding_progress enable row level security;
alter table lead_assignments enable row level security;
alter table outreach_feedback enable row level security;
alter table meeting_feedback enable row level security;
alter table deal_feedback enable row level security;
alter table deals enable row level security;
alter table clients enable row level security;
alter table tasks enable row level security;
alter table vault_documents enable row level security;
alter table appointments enable row level security;
alter table dealroom_threads enable row level security;
alter table dealroom_messages enable row level security;
alter table call_logs enable row level security;

create or replace function current_tenant_id() returns uuid
language sql stable as $$
  select tenant_id from tenant_users where auth_user_id = auth.uid() limit 1
$$;

-- Same-shaped policy for tables that carry tenant_id directly
do $$
declare t text;
begin
  foreach t in array array[
    'tenant_parameters','lead_assignments','deals','clients','tasks',
    'vault_documents','appointments','dealroom_threads','call_logs'
  ] loop
    execute format(
      'create policy tenant_isolation_%1$s on %1$s for all using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id())', t);
  end loop;
end $$;

-- onboarding_progress keys on tenant_id as its PK
create policy tenant_isolation_onboarding on onboarding_progress for all
  using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id());

-- Feedback tables scope through their lead assignment
create policy tenant_isolation_outreach_feedback on outreach_feedback for all
  using (assignment_id in (select id from lead_assignments where tenant_id = current_tenant_id()))
  with check (assignment_id in (select id from lead_assignments where tenant_id = current_tenant_id()));
create policy tenant_isolation_meeting_feedback on meeting_feedback for all
  using (assignment_id in (select id from lead_assignments where tenant_id = current_tenant_id()))
  with check (assignment_id in (select id from lead_assignments where tenant_id = current_tenant_id()));
create policy tenant_isolation_deal_feedback on deal_feedback for all
  using (assignment_id in (select id from lead_assignments where tenant_id = current_tenant_id()))
  with check (assignment_id in (select id from lead_assignments where tenant_id = current_tenant_id()));

create policy tenant_self on tenants for select using (id = current_tenant_id());
create policy tenant_users_self on tenant_users for select using (tenant_id = current_tenant_id());
create policy dealroom_msgs on dealroom_messages for all
  using (thread_id in (select id from dealroom_threads where tenant_id = current_tenant_id()));

-- Universe/signal tables (businesses, scored_leads, etc.) are NOT tenant-readable directly;
-- brokers reach them only through lead_assignments joins in the API layer (service role).
