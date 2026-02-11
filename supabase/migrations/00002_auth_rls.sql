-- Replace permissive RLS policies with authenticated-only policies

DROP POLICY IF EXISTS "Allow all on apartments" ON apartments;
DROP POLICY IF EXISTS "Allow all on categories" ON categories;
DROP POLICY IF EXISTS "Allow all on expenses" ON expenses;

CREATE POLICY "Authenticated access on apartments" ON apartments
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated access on categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated access on expenses" ON expenses
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
