create table if not exists public.user_tokens (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    provider text not null,
    access_token text not null,
    refresh_token text not null,
    expires_at timestamptz not null,
    updated_at timestamptz default now(),
    primary key (id),
    unique (user_id, provider)
);

alter table public.user_tokens enable row level security;

create policy "Users can view their own tokens"
    on public.user_tokens for select
    using (auth.uid() = user_id);

create policy "Users can update their own tokens"
    on public.user_tokens for update
    using (auth.uid() = user_id);

create policy "Users can insert their own tokens"
    on public.user_tokens for insert
    with check (auth.uid() = user_id);

create policy "Service role can do anything with tokens"
    on public.user_tokens
    using (true)
    with check (true);

-- Grant permissions if necessary (adjust based on your roles)
grant all on public.user_tokens to service_role;
grant all on public.user_tokens to postgres;
grant select, insert, update, delete on public.user_tokens to authenticated;
