create or replace function public.search_property_memory(
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
  with query_terms as (
    select distinct term
    from regexp_split_to_table(
      lower(regexp_replace(coalesce(p_query, ''), '[^a-z0-9-]+', ' ', 'g')),
      '\s+'
    ) as term
    where length(term) > 2
      and term not in (
        'and', 'are', 'find', 'for', 'from', 'larger', 'near', 'properties',
        'property', 'show', 'sites', 'than', 'the', 'with'
      )
  ),
  query_input as (
    select case
      when count(*) = 0 then null
      else websearch_to_tsquery('english', string_agg(term, ' OR '))
    end as query
    from query_terms
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

