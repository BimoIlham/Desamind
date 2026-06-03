create table if not exists public.action_participants (
  id text primary key default gen_random_uuid()::text,
  action_id text not null references public.community_actions(id) on delete cascade,
  user_id text not null,
  name text not null,
  email text,
  created_at timestamptz not null default now(),
  unique (action_id, user_id)
);
