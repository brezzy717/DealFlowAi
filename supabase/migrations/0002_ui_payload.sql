-- Bridge column while ingestion is synthetic: the full lead object the UI
-- renders (business, owner, signals, categories, explanation). Goes away when
-- the real ingestion pipeline populates the normalized signal tables.
alter table scored_leads add column if not exists ui_payload jsonb;
alter table businesses add column if not exists is_demo boolean not null default false;

-- One current score row per business (history lives in scoring_events);
-- also required for upsert-on-business_id.
create unique index if not exists uq_scored_leads_business on scored_leads(business_id);
