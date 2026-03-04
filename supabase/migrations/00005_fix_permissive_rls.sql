-- Replace overly permissive RLS policies (USING (true)) on automation tables
-- with auth-gated equivalents to satisfy Supabase security advisor

-- providers
drop policy if exists "Allow all for authenticated" on public.providers;
create policy "Allow authenticated users" on public.providers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- locations
drop policy if exists "Allow all for authenticated" on public.locations;
create policy "Allow authenticated users" on public.locations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- bills
drop policy if exists "Allow all for authenticated" on public.bills;
create policy "Allow authenticated users" on public.bills
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
