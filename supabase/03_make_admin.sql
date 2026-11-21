-- Northeast Connect — make a user an admin
--
-- 1. First create the user: Authentication → Users → Add user → Create new user
--    (tick "Auto Confirm User").
-- 2. Change the email below to that user's email.
-- 3. SQL Editor → New query → paste → Run.

insert into public.admins (user_id)
select id from auth.users where email = 'admin@example.com'   -- ← change this
on conflict (user_id) do nothing;

-- Shows the admins list, so you can check it worked.
select u.email, a.created_at
from public.admins a
join auth.users u on u.id = a.user_id;
