-- Run in Supabase SQL editor
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int check (rating between 1 and 5),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

drop policy if exists "insert own feedback" on feedback;
create policy "insert own feedback" on feedback
  for insert with check (auth.uid() = user_id);
