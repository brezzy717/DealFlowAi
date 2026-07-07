-- Deal Room threads can be keyed by a stable text label (client name) during
-- the demo/CRM-bridge phase, before every owner has a clients row.
alter table dealroom_threads add column if not exists label text;
alter table dealroom_threads alter column client_id drop not null;
create unique index if not exists uq_dealroom_thread_label on dealroom_threads(tenant_id, label);

-- Realtime broadcast for the messages table
alter publication supabase_realtime add table dealroom_messages;
