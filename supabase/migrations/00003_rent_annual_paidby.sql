-- Feature: "Not paid by me" flag on categories
ALTER TABLE categories ADD COLUMN paid_by_me boolean NOT NULL DEFAULT true;

-- Feature: Rent amount per apartment (null = no rent tracking)
ALTER TABLE apartments ADD COLUMN rent_amount numeric(10,2);

-- Feature: Rent payments (tracks which months are paid)
CREATE TABLE rent_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  year smallint NOT NULL,
  month smallint NOT NULL CHECK (month >= 1 AND month <= 12),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (apartment_id, year, month)
);

CREATE INDEX idx_rent_payments_apartment_year ON rent_payments(apartment_id, year);

-- Feature: Yearly expenses (e.g. property tax)
CREATE TABLE yearly_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  year smallint NOT NULL,
  name text NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (apartment_id, year, name)
);

CREATE INDEX idx_yearly_expenses_apartment_year ON yearly_expenses(apartment_id, year);

-- RLS for new tables
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE yearly_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access on rent_payments" ON rent_payments
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated access on yearly_expenses" ON yearly_expenses
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
