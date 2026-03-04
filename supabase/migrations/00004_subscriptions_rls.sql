-- Enable RLS on subscriptions and payment_sources tables
alter table public.subscriptions enable row level security;
alter table public.payment_sources enable row level security;

create policy "Allow authenticated users" on public.subscriptions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Allow authenticated users" on public.payment_sources
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
