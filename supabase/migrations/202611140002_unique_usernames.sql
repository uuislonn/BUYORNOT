begin;

-- Also supports environments that already applied the nickname migration.
drop function if exists public.nickname_available(text);
drop index if exists auth.auth_users_unique_nickname;

create unique index auth_users_unique_username
on auth.users (lower(btrim(raw_user_meta_data ->> 'username')))
where nullif(btrim(raw_user_meta_data ->> 'username'), '') is not null;

create function public.username_available(candidate text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select case when candidate is null or btrim(candidate) !~ '^[a-zA-Z0-9_]{2,15}$'
    then false
    else not exists (
      select 1 from auth.users
      where lower(btrim(raw_user_meta_data ->> 'username')) = lower(btrim(candidate))
    ) end;
$$;
revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

create function public.username_login_email(candidate text)
returns text language sql stable security definer set search_path = ''
as $$
  select email from auth.users
  where lower(btrim(raw_user_meta_data ->> 'username')) = lower(btrim(candidate))
    and btrim(candidate) ~ '^[a-zA-Z0-9_]{2,15}$'
  limit 1;
$$;
revoke all on function public.username_login_email(text) from public, anon, authenticated;
grant execute on function public.username_login_email(text) to service_role;
commit;
