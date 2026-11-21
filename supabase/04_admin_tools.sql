-- Northeast Connect — tools for the "Manage admins" page
-- Run AFTER 01_schema.sql: SQL Editor → New query → paste this whole file → Run.
-- Safe to run again.
--
-- How adding an admin works
--   * If the email already has an account, it becomes an admin at once.
--   * If not, the email is saved as a pending invite. As soon as an account
--     with that email is created (Authentication → Users → Add user, with
--     "Auto Confirm User" ticked), it becomes an admin automatically.
--   * Creating a login from the browser would need the secret key, which must
--     never be in the app, so accounts are still created in the dashboard.
--
-- Security
--   * Every function below checks public.is_admin() first.
--   * Nobody can read or write the tables directly; only these functions can.
--   * You cannot remove yourself, so there is always at least one admin.

-- ──────────────────────────────────────────────────────── admin_invites ──
create table if not exists public.admin_invites (
  email      text primary key
             check (email = lower(email) and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.admin_invites enable row level security;
revoke all on public.admin_invites from anon, authenticated;

-- ─────────────────────────────────────────────────────────── list_admins ──
-- Admins and pending invites, for the "Manage admins" page.
create or replace function public.list_admins()
returns table (
  user_id  uuid,
  email    text,
  added_at timestamptz,
  is_you   boolean,
  pending  boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can see the admin list' using errcode = '42501';
  end if;

  return query
    select a.user_id, u.email::text, a.created_at, a.user_id = auth.uid(), false
    from public.admins a
    join auth.users u on u.id = a.user_id
    union all
    select null::uuid, i.email, i.created_at, false, true
    from public.admin_invites i
    order by 5, 3;
end;
$$;

-- ───────────────────────────────────────────────────────────── add_admin ──
-- Returns 'added', 'already' or 'invited'.
create or replace function public.add_admin(p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_uid   uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can add admins' using errcode = '42501';
  end if;
  if v_email is null or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'That is not a valid email address' using errcode = '22023';
  end if;

  select u.id into v_uid
  from auth.users u
  where lower(u.email) = v_email and u.email_confirmed_at is not null
  limit 1;

  if v_uid is null then
    insert into public.admin_invites (email, invited_by)
    values (v_email, auth.uid())
    on conflict (email) do nothing;
    return 'invited';
  end if;

  delete from public.admin_invites where email = v_email;
  if exists (select 1 from public.admins a where a.user_id = v_uid) then
    return 'already';
  end if;
  insert into public.admins (user_id) values (v_uid);
  return 'added';
end;
$$;

-- ────────────────────────────────────────────────────────── remove_admin ──
-- Removes an admin or cancels a pending invite. Returns 'removed' or 'not_found'.
create or replace function public.remove_admin(p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_uid   uuid;
begin
  -- One removal at a time, so two admins can't remove each other at once
  -- and leave nobody in charge.
  lock table public.admins in exclusive mode;

  if not public.is_admin() then
    raise exception 'Only admins can remove admins' using errcode = '42501';
  end if;

  delete from public.admin_invites where email = v_email;
  if found then
    return 'removed';
  end if;

  select a.user_id into v_uid
  from public.admins a
  join auth.users u on u.id = a.user_id
  where lower(u.email) = v_email;

  if v_uid is null then
    return 'not_found';
  end if;
  if v_uid = auth.uid() then
    raise exception 'You cannot remove yourself. Ask another admin to do it.' using errcode = '22023';
  end if;

  delete from public.admins where user_id = v_uid;
  return 'removed';
end;
$$;

revoke all on function public.list_admins() from public, anon;
revoke all on function public.add_admin(text) from public, anon;
revoke all on function public.remove_admin(text) from public, anon;
grant execute on function public.list_admins() to authenticated;
grant execute on function public.add_admin(text) to authenticated;
grant execute on function public.remove_admin(text) to authenticated;

-- ─────────────────────────────────── turn a pending invite into an admin ──
-- Runs when an account is created or its email is confirmed. Only confirmed
-- emails count, so nobody can claim an invite for an address they don't own.
create or replace function public.promote_invited_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is not null and new.email_confirmed_at is not null then
    with claimed as (
      delete from public.admin_invites where email = lower(new.email) returning email
    )
    insert into public.admins (user_id)
    select new.id from claimed
    on conflict (user_id) do nothing;
  end if;
  return new;
exception when others then
  -- Never block account creation because of this.
  raise warning 'promote_invited_admin: %', sqlerrm;
  return new;
end;
$$;

revoke all on function public.promote_invited_admin() from public, anon, authenticated;

drop trigger if exists promote_invited_admin on auth.users;
create trigger promote_invited_admin
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.promote_invited_admin();
