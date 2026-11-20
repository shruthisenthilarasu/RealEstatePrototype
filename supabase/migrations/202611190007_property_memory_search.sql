create table public.property_memory_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  memory_key text not null,
  memory_type text not null check (
    memory_type in ('profile', 'observation', 'event', 'zoning', 'imagery_change', 'parcel_context')
  ),
  title text not null,
  content text not null,
  valid_at timestamptz,
  recorded_at timestamptz not null default now(),
  confidence numeric(4, 3) not null default 1 check (confidence between 0 and 1),
  evidence jsonb not null default '{}',
  embedding extensions.vector(1536),
  embedding_model text,
  search_document tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) stored,
  unique (property_id, memory_key)
);

create index property_memory_items_property_time_idx
on public.property_memory_items (property_id, valid_at desc, recorded_at desc);

create index property_memory_items_search_idx
on public.property_memory_items using gin (search_document);

create index property_memory_items_embedding_hnsw_idx
on public.property_memory_items
using hnsw (embedding extensions.vector_cosine_ops)
where embedding is not null;

alter table public.property_memory_items enable row level security;

create policy property_memory_items_read on public.property_memory_items
for select using (public.can_read_org(org_id));

create policy property_memory_items_write on public.property_memory_items
for all to authenticated
using (public.can_write_org(org_id))
with check (public.can_write_org(org_id));

grant select on public.property_memory_items to anon, authenticated;
grant insert, update, delete on public.property_memory_items to authenticated;

create function public.search_property_memory(
  p_query text,
  p_west double precision,
  p_south double precision,
  p_east double precision,
  p_north double precision,
  p_query_embedding extensions.vector(1536) default null,
  p_limit integer default 20
)
returns table (
  property_id uuid,
  reference_code text,
  name text,
  latitude double precision,
  longitude double precision,
  score double precision,
  evidence jsonb
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with query_input as (
    select websearch_to_tsquery('english', nullif(trim(p_query), '')) as query
  ),
  ranked_memory as (
    select
      m.property_id,
      m.id,
      m.title,
      m.content,
      m.memory_type,
      m.confidence,
      m.valid_at,
      case
        when q.query is null then 0
        else ts_rank_cd(m.search_document, q.query, 32)
      end as text_score,
      case
        when p_query_embedding is null or m.embedding is null then 0
        else 1 - (m.embedding <=> p_query_embedding)
      end as semantic_score
    from public.property_memory_items m
    cross join query_input q
    where q.query is null or m.search_document @@ q.query
  ),
  property_scores as (
    select
      p.id,
      p.reference_code,
      p.name,
      extensions.st_y(p.centroid::extensions.geometry) as latitude,
      extensions.st_x(p.centroid::extensions.geometry) as longitude,
      max(
        (rm.text_score * 0.55) +
        (rm.semantic_score * 0.30) +
        (rm.confidence::double precision * 0.10) +
        (case when rm.valid_at > now() - interval '2 years' then 0.05 else 0 end)
      ) as score
    from ranked_memory rm
    join public.properties p on p.id = rm.property_id
    where extensions.st_intersects(
      p.centroid,
      extensions.st_makeenvelope(
        p_west, p_south, p_east, p_north, 4326
      )::extensions.geography
    )
    group by p.id
  )
  select
    ps.id,
    ps.reference_code,
    ps.name,
    ps.latitude,
    ps.longitude,
    ps.score,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'memory_id', evidence_item.id,
            'type', evidence_item.memory_type,
            'title', evidence_item.title,
            'content', evidence_item.content,
            'confidence', evidence_item.confidence,
            'valid_at', evidence_item.valid_at,
            'text_score', evidence_item.text_score,
            'semantic_score', evidence_item.semantic_score
          ) order by evidence_item.text_score desc,
            evidence_item.semantic_score desc,
            evidence_item.confidence desc
        )
        from (
          select rm.*
          from ranked_memory rm
          where rm.property_id = ps.id
          order by rm.text_score desc, rm.semantic_score desc, rm.confidence desc
          limit 3
        ) evidence_item
      ),
      '[]'::jsonb
    ) as evidence
  from property_scores ps
  order by ps.score desc, ps.name
  limit greatest(1, least(p_limit, 100));
$$;

grant execute on function public.search_property_memory(
  text, double precision, double precision, double precision,
  double precision, extensions.vector, integer
) to anon, authenticated;

