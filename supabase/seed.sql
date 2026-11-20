insert into public.organizations (id, name, slug, is_public_demo)
values (
  '00000000-0000-4000-8000-000000000001',
  'SiteLedger San Antonio Demo',
  'siteledger-san-antonio-demo',
  true
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  is_public_demo = excluded.is_public_demo;

insert into public.sources (
  id, org_id, source_key, title, source_type, captured_at, metadata
)
values (
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000001',
  'archive-2025-zip',
  'Supplied San Antonio property archive',
  'marketing_archive',
  '2026-11-18T00:00:00Z',
  '{"filename":"2025.zip","note":"Facts require source and professional verification."}'
)
on conflict (org_id, source_key) do update set
  title = excluded.title,
  metadata = excluded.metadata;

insert into public.external_data_providers (
  id, org_id, provider_key, label, endpoint, layer_type, source_date,
  last_verified_at, attribution, metadata
)
values
  (
    '00000000-0000-4000-8000-000000000211',
    '00000000-0000-4000-8000-000000000001',
    'bexar-parcels',
    'Bexar County GIS parcel snapshot',
    'https://maps.bexar.org/arcgis/rest/services/Parcels/MapServer/0/query',
    'arcgis-feature-query',
    '2021-10-01',
    '2026-11-19T00:00:00Z',
    'Bexar County GIS / Bexar County Appraisal District',
    '{"fields":["PropID","Situs","TotVal","YrBlt","Acres","PropUse"],"warning":"County service metadata reports an older annual snapshot."}'
  ),
  (
    '00000000-0000-4000-8000-000000000212',
    '00000000-0000-4000-8000-000000000001',
    'esri-world-imagery',
    'Esri World Imagery',
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    'raster-tiles',
    null,
    '2026-11-19T00:00:00Z',
    'Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    '{"coordinate_system":"Web Mercator","role":"visual context only"}'
  ),
  (
    '00000000-0000-4000-8000-000000000213',
    '00000000-0000-4000-8000-000000000001',
    'planetary-naip',
    'Microsoft Planetary Computer NAIP archive',
    'https://planetarycomputer.microsoft.com/api/stac/v1/search',
    'stac-imagery-catalog',
    null,
    '2026-11-19T00:00:00Z',
    'USDA NAIP via Microsoft Planetary Computer',
    '{"collection":"naip","resolution_m":0.6,"role":"historical visual memory","refresh_note":"NAIP generally follows a multi-year acquisition cycle."}'
  )
on conflict (org_id, provider_key) do update set
  label = excluded.label,
  endpoint = excluded.endpoint,
  source_date = excluded.source_date,
  last_verified_at = excluded.last_verified_at,
  attribution = excluded.attribution,
  metadata = excluded.metadata;

insert into public.properties (
  id, org_id, reference_code, name, address, city, state, status,
  observed_state, legal_state, recorded_state, zoning_code, confidence,
  tags, centroid, image_label, metadata
)
values
  (
    '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001',
    'ARCHIVE-2026-QSR-01', '1604 / Bandera restaurant', '11707 TX-1604 Loop, Helotes',
    'Helotes', 'TX', 'opportunity', 'Freestanding restaurant with drive-through',
    'C-3 stated in source flyer', 'For-sale flyer in 2026/QSR', 'C-3', 0.98,
    array['drive','reuse','traffic','zoning'],
    extensions.st_setsrid(extensions.st_makepoint(-98.669472, 29.553007), 4326)::extensions.geography,
    'Source: 2026 archive PDF', '{"building_sf":4465,"land_acres":1.21,"traffic_vpd":142543,"bcad_property_id":583796}'
  ),
  (
    '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001',
    'ARCHIVE-2025-INGRAM', 'Former Sonic pad', '6111 Ingram Rd, San Antonio',
    'San Antonio', 'TX', 'opportunity', 'Former Sonic pad marketed for ground lease',
    'Zoning not stated in archive source', 'Ground-lease flyer in 2025 folder', null, 0.97,
    array['drive','reuse','traffic'],
    extensions.st_setsrid(extensions.st_makepoint(-98.604856, 29.466807), 4326)::extensions.geography,
    'Source: 2025 archive PDF', '{"land_acres":0.592,"traffic_vpd":{"ingram":19946,"callaghan":13945},"bcad_property_id":526136}'
  ),
  (
    '00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001',
    'ARCHIVE-2025-WURZBACH', 'Loop 410 pad site', '5630 Wurzbach Rd, Leon Valley',
    'Leon Valley', 'TX', 'opportunity', 'Former Sonic pad adjacent to Bill Miller',
    'Zoning not stated in archive source', 'Ground-lease flyer in 2025 folder', null, 0.97,
    array['drive','reuse','traffic'],
    extensions.st_setsrid(extensions.st_makepoint(-98.603424, 29.484740), 4326)::extensions.geography,
    'Source: 2025 archive PDF', '{"land_acres":0.83,"traffic_vpd":{"loop_410":220688,"bandera":83734},"bcad_property_id":217769}'
  ),
  (
    '00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000001',
    'ARCHIVE-2026-WALZEM', 'Operating second-gen QSR', '5050 Walzem Rd, Windcrest',
    'Windcrest', 'TX', 'stable', '2nd-generation QSR; tenant operating',
    'Zoning not stated in archive source', 'Lease flyer in 2026/QSR', null, 0.98,
    array['drive','reuse','traffic'],
    extensions.st_setsrid(extensions.st_makepoint(-98.391379, 29.509916), 4326)::extensions.geography,
    'Source: 2026 archive PDF', '{"building_sf":2834,"traffic_vpd":34246,"bcad_property_id":502189}'
  ),
  (
    '00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000001',
    'ARCHIVE-2026-BABCOCK', 'Babcock outparcel', '1602 Babcock Rd, San Antonio',
    'San Antonio', 'TX', 'changed', '0.25–0.5 acre outparcel anchored by Gold’s Gym',
    'Zoning not stated in archive source', 'Ground-lease flyer in 2026/Land', null, 0.97,
    array['reuse','traffic'],
    extensions.st_setsrid(extensions.st_makepoint(-98.570704, 29.492241), 4326)::extensions.geography,
    'Source: 2026 archive PDF', '{"land_acres_min":0.25,"land_acres_max":0.5,"traffic_vpd":{"loop_410":166684,"babcock":44683},"bcad_property_id":538378}'
  ),
  (
    '00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-000000000001',
    'ARCHIVE-2025-BROADWAY', 'Broadway retail redevelopment', '2000 Broadway, San Antonio',
    'San Antonio', 'TX', 'changed', 'High-profile retail redevelopment by the Pearl',
    'Zoning not stated in archive source', 'Redevelopment flyer in 2025 folder', null, 0.98,
    array['reuse','traffic'],
    extensions.st_setsrid(extensions.st_makepoint(-98.475694, 29.444643), 4326)::extensions.geography,
    'Source: 2025 archive PDF', '{"building_sf":10564,"traffic_vpd":{"broadway":21702,"josephine":4000},"bcad_property_id":120258}'
  ),
  (
    '00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000001',
    'ARCHIVE-2025-CULEBRA', 'Culebra / Blacktail Lot 3', 'Culebra Rd at Blacktail Crossing, San Antonio',
    'San Antonio', 'TX', 'construction', 'Proposed 5,230 SF commercial drive-through',
    'Zoning not stated on supplied site plan', 'Site plan dated March 17, 2025', null, 0.99,
    array['drive','reuse'],
    extensions.st_setsrid(extensions.st_makepoint(-98.6514, 29.4774), 4326)::extensions.geography,
    'Source: 2025 site-plan PDF', '{"building_sf":5230,"land_acres":1.05,"parking_required":34,"parking_provided":36,"queue_vehicles":15}'
  ),
  (
    '00000000-0000-4000-8000-000000000108', '00000000-0000-4000-8000-000000000001',
    'ARCHIVE-2025-IH10', 'IH-10 / Loop 1604 commercial sites', 'SE corner IH-10 and Loop 1604, San Antonio',
    'San Antonio', 'TX', 'changed', 'Four commercial sites with utilities stated',
    'C-3 stated in archive filename', 'Land offering in 2025 folder', 'C-3', 0.96,
    array['traffic','zoning'],
    extensions.st_setsrid(extensions.st_makepoint(-98.6000, 29.5930), 4326)::extensions.geography,
    'Source: 2025 archive PDF', '{"tract_acres":[5.69,14,4.2,2.87]}'
  )
on conflict (org_id, reference_code) do update set
  name = excluded.name,
  address = excluded.address,
  status = excluded.status,
  observed_state = excluded.observed_state,
  legal_state = excluded.legal_state,
  recorded_state = excluded.recorded_state,
  zoning_code = excluded.zoning_code,
  confidence = excluded.confidence,
  tags = excluded.tags,
  centroid = excluded.centroid,
  image_label = excluded.image_label,
  metadata = excluded.metadata;

insert into public.parcels (org_id, parcel_number, boundary, centroid, metadata)
select
  p.org_id,
  p.reference_code || '-PARCEL',
  extensions.st_buffer(p.centroid, 55)::extensions.geometry,
  p.centroid,
  jsonb_build_object('seed_geometry', true)
from public.properties p
where p.org_id = '00000000-0000-4000-8000-000000000001'
on conflict (org_id, parcel_number) do update set
  boundary = excluded.boundary,
  centroid = excluded.centroid;

insert into public.property_parcels (org_id, property_id, parcel_id, is_primary)
select p.org_id, p.id, parcel.id, true
from public.properties p
join public.parcels parcel
  on parcel.org_id = p.org_id and parcel.parcel_number = p.reference_code || '-PARCEL'
where p.org_id = '00000000-0000-4000-8000-000000000001'
on conflict (property_id, parcel_id) do update set is_primary = true;

insert into public.observations (
  org_id, property_id, source_id, observation_key, observation_type,
  label, confidence, payload
)
select
  p.org_id, p.id, '00000000-0000-4000-8000-000000000201',
  o.observation_key, 'archive_extraction', o.label, o.confidence, o.payload
from public.properties p
cross join lateral (
  values
    ('primary-form', p.observed_state, p.confidence, '{}'::jsonb),
    ('archive-facts', coalesce(p.metadata->>'building_sf', p.metadata->>'land_acres', 'See source metadata'), p.confidence, p.metadata)
) as o(observation_key, label, confidence, payload)
where p.org_id = '00000000-0000-4000-8000-000000000001'
on conflict (property_id, observation_key) do update set
  label = excluded.label,
  confidence = excluded.confidence,
  payload = excluded.payload;

insert into public.property_events (
  org_id, property_id, source_id, event_key, event_type, title,
  display_date, valid_at, confidence
)
select
  p.org_id, p.id, '00000000-0000-4000-8000-000000000201',
  'archive-recorded', 'archive', p.recorded_state,
  case when p.reference_code like 'ARCHIVE-2026%' then '2026' else '2025' end,
  case when p.reference_code like 'ARCHIVE-2026%' then '2026-01-01'::timestamptz else '2025-01-01'::timestamptz end,
  p.confidence
from public.properties p
where p.org_id = '00000000-0000-4000-8000-000000000001'
on conflict (property_id, event_key) do update set
  title = excluded.title,
  display_date = excluded.display_date,
  valid_at = excluded.valid_at;

insert into public.property_events (
  org_id, property_id, source_id, event_key, event_type, title,
  display_date, valid_at, confidence
)
select
  p.org_id, p.id, '00000000-0000-4000-8000-000000000201',
  'future-monitoring', 'monitoring_plan',
  'Continuous imagery, permit and record signals become linked ledger events',
  'FUTURE', null, 0.90
from public.properties p
where p.org_id = '00000000-0000-4000-8000-000000000001'
on conflict (property_id, event_key) do update set title = excluded.title;

insert into public.property_memory_items (
  org_id, property_id, source_id, memory_key, memory_type, title,
  content, valid_at, confidence, evidence
)
select
  p.org_id,
  p.id,
  '00000000-0000-4000-8000-000000000201',
  'property-profile',
  'profile',
  p.name,
  concat_ws(
    '. ', p.address, p.observed_state, p.legal_state, p.recorded_state,
    array_to_string(p.tags, ' '), p.metadata::text
  ),
  p.updated_at,
  p.confidence,
  jsonb_build_object(
    'source_label', p.image_label,
    'reference_code', p.reference_code,
    'metadata', p.metadata
  )
from public.properties p
where p.org_id = '00000000-0000-4000-8000-000000000001'
on conflict (property_id, memory_key) do update set
  title = excluded.title,
  content = excluded.content,
  valid_at = excluded.valid_at,
  confidence = excluded.confidence,
  evidence = excluded.evidence;

insert into public.property_memory_items (
  org_id, property_id, source_id, memory_key, memory_type, title,
  content, valid_at, confidence, evidence
)
select
  e.org_id,
  e.property_id,
  e.source_id,
  'event:' || e.event_key,
  'event',
  e.title,
  concat_ws(' ', e.event_type, e.display_date, e.title),
  e.valid_at,
  e.confidence,
  jsonb_build_object('event_id', e.id, 'display_date', e.display_date)
from public.property_events e
where e.org_id = '00000000-0000-4000-8000-000000000001'
on conflict (property_id, memory_key) do update set
  title = excluded.title,
  content = excluded.content,
  valid_at = excluded.valid_at,
  confidence = excluded.confidence,
  evidence = excluded.evidence;

insert into public.property_memory_items (
  org_id, property_id, source_id, memory_key, memory_type, title,
  content, valid_at, confidence, evidence
)
select
  o.org_id,
  o.property_id,
  o.source_id,
  'observation:' || o.observation_key,
  'observation',
  o.label,
  concat_ws(' ', o.observation_type, o.label, o.payload::text),
  o.observed_at,
  o.confidence,
  jsonb_build_object('observation_id', o.id, 'payload', o.payload)
from public.observations o
where o.org_id = '00000000-0000-4000-8000-000000000001'
on conflict (property_id, memory_key) do update set
  title = excluded.title,
  content = excluded.content,
  valid_at = excluded.valid_at,
  confidence = excluded.confidence,
  evidence = excluded.evidence;
