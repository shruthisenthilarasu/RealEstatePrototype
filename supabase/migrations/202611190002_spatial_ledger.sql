create type public.member_role as enum ('owner', 'editor', 'viewer');
create type public.property_status as enum ('opportunity', 'changed', 'construction', 'stable');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_public_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.organization_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  reference_code text not null,
  name text not null,
  address text not null,
  city text not null default 'San Antonio',
  state text not null default 'TX',
  postal_code text,
  status public.property_status not null default 'stable',
  observed_state text not null,
  legal_state text not null,
  recorded_state text not null,
  zoning_code text,
  confidence numeric(4, 3) not null check (confidence between 0 and 1),
  tags text[] not null default '{}',
  centroid extensions.geography(Point, 4326) not null,
  boundary extensions.geometry(Polygon, 4326),
  image_label text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, reference_code)
);

create table public.parcels (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  parcel_number text not null,
  boundary extensions.geometry(Polygon, 4326) not null,
  centroid extensions.geography(Point, 4326) not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (org_id, parcel_number)
);

create table public.property_parcels (
  org_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  parcel_id uuid not null references public.parcels(id) on delete cascade,
  is_primary boolean not null default true,
  primary key (property_id, parcel_id)
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  source_key text not null,
  title text not null,
  source_type text not null,
  uri text,
  captured_at timestamptz,
  checksum text,
  license text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (org_id, source_key)
);

create table public.observations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  observation_key text not null,
  observation_type text not null,
  label text not null,
  observed_at timestamptz,
  confidence numeric(4, 3) not null check (confidence between 0 and 1),
  payload jsonb not null default '{}',
  geom extensions.geometry(Geometry, 4326),
  model_version text,
  created_at timestamptz not null default now(),
  unique (property_id, observation_key)
);

create table public.property_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  event_key text not null,
  event_type text not null,
  title text not null,
  display_date text not null,
  valid_at timestamptz,
  recorded_at timestamptz not null default now(),
  confidence numeric(4, 3) not null default 1 check (confidence between 0 and 1),
  metadata jsonb not null default '{}',
  supersedes_id uuid references public.property_events(id),
  unique (property_id, event_key)
);

create table public.zoning_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  zoning_code text not null,
  effective_at timestamptz,
  captured_at timestamptz not null default now(),
  geom extensions.geometry(MultiPolygon, 4326),
  metadata jsonb not null default '{}'
);

create table public.imagery_assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  captured_at timestamptz,
  uri text not null,
  provider text,
  footprint extensions.geometry(Polygon, 4326),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.site_features (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  imagery_asset_id uuid references public.imagery_assets(id) on delete set null,
  feature_type text not null,
  confidence numeric(4, 3) not null check (confidence between 0 and 1),
  geom extensions.geometry(Geometry, 4326),
  attributes jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.property_embeddings (
  property_id uuid primary key references public.properties(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  embedding extensions.vector(1536) not null,
  model text not null,
  refreshed_at timestamptz not null default now()
);

create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.watchlist_properties (
  org_id uuid not null references public.organizations(id) on delete cascade,
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (watchlist_id, property_id)
);

create table public.annotations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

create trigger annotations_set_updated_at
before update on public.annotations
for each row execute function public.set_updated_at();

create index properties_centroid_gix on public.properties using gist (centroid);
create index properties_boundary_gix on public.properties using gist (boundary);
create index properties_tags_gin on public.properties using gin (tags);
create index properties_org_status_idx on public.properties (org_id, status);
create index parcels_boundary_gix on public.parcels using gist (boundary);
create index observations_property_time_idx on public.observations (property_id, observed_at desc);
create index observations_geom_gix on public.observations using gist (geom);
create index property_events_property_time_idx on public.property_events (property_id, valid_at desc);
create index zoning_snapshots_property_time_idx on public.zoning_snapshots (property_id, captured_at desc);
create index imagery_assets_property_time_idx on public.imagery_assets (property_id, captured_at desc);
create index site_features_geom_gix on public.site_features using gist (geom);
create index property_embeddings_hnsw_idx on public.property_embeddings
using hnsw (embedding extensions.vector_cosine_ops);
