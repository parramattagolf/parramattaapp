-- Policy to allow users to update their own subscriptions
create policy "Users can update their own subscriptions"
  on public.push_subscriptions
  for update
  using (auth.uid() = user_id);
