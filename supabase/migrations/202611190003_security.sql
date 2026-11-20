create function public.can_read_org(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organizations o
    where o.id = target_org_id and o.is_public_demo
  ) or exists (
    select 1 from public.organization_members m
    where m.org_id = target_org_id and m.user_id = auth.uid()
  );
$$;

create function public.can_write_org(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = target_org_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'editor')
  );
$$;

revoke all on function public.can_read_org(uuid) from public;
revoke all on function public.can_write_org(uuid) from public;
grant execute on function public.can_read_org(uuid) to anon, authenticated;
grant execute on function public.can_write_org(uuid) to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organization_members', 'properties', 'parcels',
    'property_parcels', 'sources', 'observations', 'property_events',
    'zoning_snapshots', 'imagery_assets', 'site_features',
    'property_embeddings', 'watchlists', 'watchlist_properties', 'annotations'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for select using (public.can_read_org(org_id))',
      table_name || '_read', table_name
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.can_write_org(org_id)) with check (public.can_write_org(org_id))',
      table_name || '_write', table_name
    );
  end loop;
end;
$$;

alter table public.organizations enable row level security;

create policy organizations_read on public.organizations
for select using (public.can_read_org(id));
create policy organizations_write on public.organizations
for all to authenticated
using (public.can_write_org(id))
with check (public.can_write_org(id));

grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage on schema public to anon, authenticated;
