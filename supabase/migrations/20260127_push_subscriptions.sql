create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.push_subscriptions enable row level security;

-- Policy to allow users to insert their own subscriptions
create policy "Users can insert their own subscriptions"
  on public.push_subscriptions
  for insert
  with check (auth.uid() = user_id);

-- Policy to allow users to view their own subscriptions
create policy "Users can view their own subscriptions"
  on public.push_subscriptions
  for select
  using (auth.uid() = user_id);

-- Policy to allow users to delete their own subscriptions
create policy "Users can delete their own subscriptions"
  on public.push_subscriptions
  for delete
  using (auth.uid() = user_id);
