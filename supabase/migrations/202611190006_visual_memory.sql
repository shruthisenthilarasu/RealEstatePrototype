alter table public.imagery_assets
add column provider_id uuid references public.external_data_providers(id) on delete restrict,
add column external_item_id text,
add column preview_uri text,
add column resolution_m numeric(8, 3),
add column content_hash text,
add column ingested_at timestamptz not null default now();

create unique index imagery_assets_provider_item_idx
on public.imagery_assets (provider_id, external_item_id)
where provider_id is not null and external_item_id is not null;

create table public.vision_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  job_type text not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  priority smallint not null default 50 check (priority between 0 and 100),
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  attempts smallint not null default 0,
  configuration jsonb not null default '{}',
  error jsonb,
  created_by uuid references auth.users(id)
);

create table public.imagery_comparisons (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  before_asset_id uuid not null references public.imagery_assets(id) on delete restrict,
  after_asset_id uuid not null references public.imagery_assets(id) on delete restrict,
  vision_job_id uuid references public.vision_jobs(id) on delete set null,
  algorithm text not null,
  model_version text not null,
  pixel_delta numeric(6, 5) check (pixel_delta between 0 and 1),
  changed_pixel_fraction numeric(6, 5)
    check (changed_pixel_fraction between 0 and 1),
  embedding_distance numeric(8, 6),
  review_priority text not null
    check (review_priority in ('low', 'moderate', 'high')),
  summary text,
  evidence jsonb not null default '{}',
  created_at timestamptz not null default now(),
  check (before_asset_id <> after_asset_id),
  unique (before_asset_id, after_asset_id, model_version)
);

create table public.imagery_comparison_reviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  comparison_id uuid not null references public.imagery_comparisons(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  decision text not null check (decision in ('confirmed', 'dismissed', 'needs_field_check')),
  note text,
  created_at timestamptz not null default now()
);

create index vision_jobs_queue_idx
on public.vision_jobs (status, priority desc, requested_at);

create index imagery_comparisons_property_time_idx
on public.imagery_comparisons (property_id, created_at desc);

create index imagery_comparison_reviews_comparison_time_idx
on public.imagery_comparison_reviews (comparison_id, created_at desc);

alter table public.vision_jobs enable row level security;
alter table public.imagery_comparisons enable row level security;
alter table public.imagery_comparison_reviews enable row level security;

create policy vision_jobs_read on public.vision_jobs
for select using (public.can_read_org(org_id));

create policy vision_jobs_write on public.vision_jobs
for all to authenticated
using (public.can_write_org(org_id))
with check (public.can_write_org(org_id));

create policy imagery_comparisons_read on public.imagery_comparisons
for select using (public.can_read_org(org_id));

create policy imagery_comparisons_insert on public.imagery_comparisons
for insert to authenticated
with check (public.can_write_org(org_id));

create policy imagery_comparison_reviews_read on public.imagery_comparison_reviews
for select using (public.can_read_org(org_id));

create policy imagery_comparison_reviews_insert on public.imagery_comparison_reviews
for insert to authenticated
with check (public.can_write_org(org_id));

grant select on public.vision_jobs, public.imagery_comparisons,
  public.imagery_comparison_reviews to anon, authenticated;

grant insert, update, delete on public.vision_jobs to authenticated;
grant insert on public.imagery_comparisons, public.imagery_comparison_reviews
to authenticated;
