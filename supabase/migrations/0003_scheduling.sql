-- Native scheduling (replaces the Cal.com plan): per-broker availability
-- windows + guest fields on appointments for public booking-page bookings.

create table broker_availability (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),  -- 0 = Sunday
  start_minute int not null check (start_minute between 0 and 1439),
  end_minute int not null check (end_minute between 1 and 1440),
  timezone text not null default 'America/Phoenix',
  created_at timestamptz default now(),
  unique (tenant_id, weekday, start_minute)
);

alter table broker_availability enable row level security;
create policy tenant_isolation_broker_availability on broker_availability for all
  using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id());

alter table appointments add column if not exists guest_name text;
alter table appointments add column if not exists guest_email text;
alter table appointments add column if not exists guest_phone text;
alter table appointments add column if not exists guest_company text;
alter table appointments add column if not exists notes text;

create index if not exists idx_appointments_tenant_time on appointments(tenant_id, starts_at);
