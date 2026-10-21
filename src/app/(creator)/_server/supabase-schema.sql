-- PART B INTEGRATION DRAFT ONLY. Not applied; not an operational migration.
-- Prerequisites owned by shared/auth team:
-- public.profiles(user_id uuid PK -> auth.users, role text,
--   nickname text, bio_text text, social_links jsonb, is_verified_creator boolean).
-- Approve those contracts first, then move this draft to the team's migration directory.
-- No profile mutation policies, service-role keys, or SECURITY DEFINER bypasses are supplied.

create table public.creator_rooms (
  creator_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(user_id),
  room_title text not null check (char_length(room_title) between 1 and 40),
  bio_text text not null check (char_length(bio_text) <= 150),
  cover_image_url text,
  social_links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create table public.curation_requests (
  request_id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_rooms(creator_id),
  author_id uuid not null references public.profiles(user_id),
  product_url text not null, -- server canonicalization + approved metadata adapter required
  affiliate_url text,
  product_info jsonb not null,
  category text not null check (category in ('의류','뷰티','신발','잡화','명품')),
  concern_text text not null check (char_length(concern_text) between 1 and 150),
  situation_tags text[] not null default '{}' check (cardinality(situation_tags) <= 4),
  body_spec_snapshot jsonb not null default '{}'::jsonb, -- consented, validated fields only
  status text not null default 'ING' check (status in ('ING','BUY','NOT','EXPIRED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index curation_active_product_unique on public.curation_requests(creator_id,product_url)
  where deleted_at is null and status <> 'EXPIRED';
create index curation_room_status_created on public.curation_requests(creator_id,status,created_at desc);
create table public.creator_evaluations (
  evaluation_id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.curation_requests(request_id) on delete cascade,
  creator_id uuid not null references public.profiles(user_id),
  decision text not null check (decision in ('BUY','NOT')),
  comment text not null default '' check (char_length(comment) <= 150),
  created_at timestamptz not null default now()
);
create table public.creator_applications (
  application_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id),
  room_title text not null check (char_length(room_title) between 1 and 40),
  bio_text text not null check (char_length(bio_text) between 1 and 150),
  channel_type text not null check (channel_type in ('Instagram','YouTube','TikTok','Blog')),
  channel_url text not null,
  followers integer not null check (followers >= 0),
  content_count integer not null check (content_count >= 0),
  verification_code text not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  reject_reason text,
  created_at timestamptz not null default now()
);
create unique index creator_one_pending_application on public.creator_applications(user_id)
  where status = 'PENDING';
create table public.curation_hearts (
  request_id uuid references public.curation_requests(request_id) on delete cascade,
  user_id uuid references public.profiles(user_id),
  primary key(request_id,user_id)
);
create table public.creator_follows (
  creator_id uuid references public.creator_rooms(creator_id),
  user_id uuid references public.profiles(user_id),
  primary key(creator_id,user_id)
);
alter table public.creator_rooms enable row level security;
alter table public.curation_requests enable row level security;
alter table public.creator_evaluations enable row level security;
alter table public.creator_applications enable row level security;
alter table public.curation_hearts enable row level security;
alter table public.creator_follows enable row level security;
create policy creator_rooms_public on public.creator_rooms for select using (true);
create policy curation_requests_public on public.curation_requests for select using (deleted_at is null);
create policy creator_evaluations_public on public.creator_evaluations for select using (
  exists (select 1 from public.curation_requests r where r.request_id = creator_evaluations.request_id and r.deleted_at is null)
);
create policy applications_owner_read on public.creator_applications for select to authenticated using (auth.uid() = user_id);
create policy hearts_owner_read on public.curation_hearts for select to authenticated using (auth.uid() = user_id);
create policy follows_owner_read on public.creator_follows for select to authenticated using (auth.uid() = user_id);
-- ALL writes and admin-only reads intentionally have no permissive policy yet.
-- Add audited auth-scoped RPCs/transactions before deployment:
-- 1. create/update/delete with author = auth.uid(), canonical URL validation and approved metadata.
-- 2. evaluate: lock request, expire ING older than 30 days, check room owner/role,
--    INSERT unique evaluation + UPDATE request status atomically.
-- 3. approve: verify authenticated ADMIN from protected profiles, lock pending application,
--    verify external channel, create room + set role/verification + update application atomically.
-- 4. follow/heart owner policies; application creation with server-issued code and verified channel.
-- 5. expiry scheduled job/read-time normalization; soft-delete/updated_at behavior.
-- Keep profiles.role/is_verified_creator unmodifiable by ordinary profile edits.
