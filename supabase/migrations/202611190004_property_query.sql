create or replace function public.get_properties_in_bounds(
  p_west double precision,
  p_south double precision,
  p_east double precision,
  p_north double precision,
  p_query text default null
)
returns table (
  id uuid,
  reference_code text,
  name text,
  address text,
  city text,
  state text,
  status public.property_status,
  observed_state text,
  legal_state text,
  recorded_state text,
  zoning_code text,
  confidence numeric,
  tags text[],
  latitude double precision,
  longitude double precision,
  image_label text
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    p.id,
    p.reference_code,
    p.name,
    p.address,
    p.city,
    p.state,
    p.status,
    p.observed_state,
    p.legal_state,
    p.recorded_state,
    p.zoning_code,
    p.confidence,
    p.tags,
    extensions.st_y(p.centroid::extensions.geometry) as latitude,
    extensions.st_x(p.centroid::extensions.geometry) as longitude,
    p.image_label
  from public.properties p
  where extensions.st_intersects(
    p.centroid,
    extensions.st_makeenvelope(p_west, p_south, p_east, p_north, 4326)::extensions.geography
  )
  and (
    p_query is null
    or concat_ws(' ', p.name, p.address, p.zoning_code, p.observed_state,
      p.legal_state, p.recorded_state, array_to_string(p.tags, ' ')) ilike '%' || p_query || '%'
  )
  order by p.name;
$$;

grant execute on function public.get_properties_in_bounds(
  double precision, double precision, double precision, double precision, text
) to anon, authenticated;
