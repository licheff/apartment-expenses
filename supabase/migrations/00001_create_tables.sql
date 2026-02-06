-- Apartments table
CREATE TABLE apartments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Expenses table
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  year smallint NOT NULL,
  month smallint NOT NULL CHECK (month >= 1 AND month <= 12),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, year, month)
);

CREATE INDEX idx_expenses_year_month ON expenses(year, month);
CREATE INDEX idx_categories_apartment ON categories(apartment_id);

-- Seed apartments
INSERT INTO apartments (id, name) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Драгалевци'),
  ('a1000000-0000-0000-0000-000000000002', '142');

-- Seed categories for Драгалевци
INSERT INTO categories (apartment_id, name, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Ток', 1),
  ('a1000000-0000-0000-0000-000000000001', 'Вода', 2),
  ('a1000000-0000-0000-0000-000000000001', 'Газ', 3),
  ('a1000000-0000-0000-0000-000000000001', 'Интернет', 4),
  ('a1000000-0000-0000-0000-000000000001', 'Входна такса', 5);

-- Seed categories for 142
INSERT INTO categories (apartment_id, name, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000002', 'Ток', 1),
  ('a1000000-0000-0000-0000-000000000002', 'Вода', 2),
  ('a1000000-0000-0000-0000-000000000002', 'Комунални/год', 3),
  ('a1000000-0000-0000-0000-000000000002', 'Интернет 142', 4),
  ('a1000000-0000-0000-0000-000000000002', 'Интернет Офис', 5);

-- Allow public access (no auth)
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on apartments" ON apartments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
