create table public.external_data_providers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  provider_key text not null,
  label text not null,
  endpoint text not null,
  layer_type text not null,
  source_date date,
  last_verified_at timestamptz,
  attribution text not null,
  metadata jsonb not null default '{}',
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, provider_key)
);

create table public.property_context_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  provider_id uuid not null references public.external_data_providers(id) on delete restrict,
  external_id text,
  captured_at timestamptz not null default now(),
  source_effective_at date,
  payload jsonb not null,
  geom extensions.geometry(Geometry, 4326),
  content_hash text not null,
  unique (property_id, provider_id, content_hash)
);

create trigger external_data_providers_set_updated_at
before update on public.external_data_providers
for each row execute function public.set_updated_at();

create index property_context_snapshots_property_time_idx
on public.property_context_snapshots (property_id, captured_at desc);

create index property_context_snapshots_geom_gix
on public.property_context_snapshots using gist (geom);

alter table public.external_data_providers enable row level security;
alter table public.property_context_snapshots enable row level security;

create policy external_data_providers_read on public.external_data_providers
for select using (public.can_read_org(org_id));

create policy external_data_providers_write on public.external_data_providers
for all to authenticated
using (public.can_write_org(org_id))
with check (public.can_write_org(org_id));

create policy property_context_snapshots_read on public.property_context_snapshots
for select using (public.can_read_org(org_id));

create policy property_context_snapshots_insert on public.property_context_snapshots
for insert to authenticated
with check (public.can_write_org(org_id));

grant select on public.external_data_providers, public.property_context_snapshots
to anon, authenticated;

grant insert, update, delete on public.external_data_providers to authenticated;
grant insert on public.property_context_snapshots to authenticated;
