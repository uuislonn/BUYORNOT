begin;
create table public.curation_posts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id) on delete cascade,
 author_name text not null check (length(btrim(author_name)) between 1 and 20),
 creator_id text not null check (creator_id = 'seoa'),
 product jsonb not null,
 concern text not null check (length(btrim(concern)) between 1 and 150),
 tags text[] not null default '{}' check (cardinality(tags) <= 4),
 body_spec jsonb not null default '{}' check (jsonb_typeof(body_spec) = 'object' and body_spec - array['age','height_cm','weight_kg','body_type','personal_color'] = '{}'::jsonb and octet_length(body_spec::text) < 1024),
 status text not null default 'ING' check (status = 'ING'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint safe_product check (
  jsonb_typeof(product) = 'object' and
  product ?& array['url','image','name','brand','category','currency','price'] and
  jsonb_typeof(product->'url') = 'string' and length(product->>'url') <= 2048 and
  (product->>'url') ~ '^https://((www[.])?(musinsa[.]com|29cm[.]co[.]kr|wconcept[.]co[.]kr)|product[.]29cm[.]co[.]kr)/' and
  jsonb_typeof(product->'image') = 'string' and length(product->>'image') <= 4096 and
  (product->>'image') ~ '^https://([a-zA-Z0-9-]+[.])*(msscdn[.]net|musinsa[.]com|29cm[.]co[.]kr|wconcept[.]co[.]kr|wconcept[.]com)/' and
  jsonb_typeof(product->'name') = 'string' and length(btrim(product->>'name')) between 1 and 100 and
  jsonb_typeof(product->'brand') = 'string' and length(btrim(product->>'brand')) between 1 and 50 and
  product->>'category' in ('의류','뷰티','신발','잡화','명품') and product->>'currency' = 'KRW' and
  (product->'price' = 'null'::jsonb or (jsonb_typeof(product->'price') = 'number' and (product->>'price')::numeric between 0 and 100000000)) and
  octet_length(product::text) < 10000
 )
);
create index curation_posts_room_created on public.curation_posts(creator_id,created_at desc);
create index curation_posts_author on public.curation_posts(author_id);
alter table public.curation_posts enable row level security;
revoke all on public.curation_posts from anon, authenticated;
grant select on public.curation_posts to anon,authenticated;
grant insert(author_id,author_name,creator_id,product,concern,tags,body_spec) on public.curation_posts to authenticated;
grant update(product,concern,tags,body_spec) on public.curation_posts to authenticated;
grant delete on public.curation_posts to authenticated;
create policy posts_public_read on public.curation_posts for select to anon,authenticated using (true);
create policy posts_own_insert on public.curation_posts for insert to authenticated with check ((select auth.uid()) = author_id);
create policy posts_own_update on public.curation_posts for update to authenticated using ((select auth.uid()) = author_id and created_at > now() - interval '30 days') with check ((select auth.uid()) = author_id);
create policy posts_own_delete on public.curation_posts for delete to authenticated using ((select auth.uid()) = author_id);
create function public.guard_curation_post() returns trigger language plpgsql set search_path = '' as $$
begin
 if exists(select 1 from unnest(new.tags) t where t is null or length(btrim(t)) not between 1 and 16) then
  raise exception 'Invalid tags' using errcode = '23514';
 end if;
 if exists(select 1 from jsonb_each(new.body_spec) as spec(k,v) where
  (k in ('age','height_cm','weight_kg') and (jsonb_typeof(v) <> 'number' or v::text !~ '^[0-9]+$')) or
  (k in ('body_type','personal_color') and (jsonb_typeof(v) <> 'string' or length(v #>> '{}') not between 1 and 30))) then
  raise exception 'Invalid body spec' using errcode = '23514';
 end if;
 if tg_op = 'UPDATE' then
  if new.author_id <> old.author_id or new.creator_id <> old.creator_id or new.created_at <> old.created_at or new.status <> old.status or new.product->>'url' <> old.product->>'url' then
   raise exception 'Immutable post identity' using errcode = '42501';
  end if;
 else
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.creator_id || (new.product->>'url'),0));
  if exists(select 1 from public.curation_posts p where p.creator_id = new.creator_id and p.product->>'url' = new.product->>'url' and p.created_at > now() - interval '30 days') then
   raise exception 'Duplicate active product' using errcode = '23505';
  end if;
 end if;
 new.updated_at := now();
 return new;
end;
$$;
create trigger curation_post_guard before insert or update on public.curation_posts for each row execute function public.guard_curation_post();
notify pgrst, 'reload schema';
commit;
