-- Automation: ePay.bg bill parsing pipeline
-- providers  → merchant-to-category mapping
-- bills      → parsed bills (populated by Google Apps Script)
-- trigger    → auto-upserts bills into expenses with −1 month offset

-- Drop old automation tables (OCR-based approach) and recreate
DROP FUNCTION IF EXISTS sync_bill_to_expense() CASCADE;
DROP TABLE IF EXISTS bills;
DROP TABLE IF EXISTS providers;
DROP TABLE IF EXISTS locations;

-- Providers: one row per utility company, links ePay merchant name to a category
CREATE TABLE providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  epay_merchant text NOT NULL,       -- exact merchant name as it appears in ePay emails
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_providers_apartment ON providers(apartment_id);

-- Bills: one row per parsed ePay email
CREATE TABLE bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  bill_date date NOT NULL,           -- date the email was received
  gmail_message_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bills_provider ON bills(provider_id);
CREATE INDEX idx_bills_date ON bills(bill_date);

-- RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access on providers" ON providers
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated access on bills" ON bills
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Trigger: when a bill is inserted, upsert into expenses
-- Bills arrive ~1 month after consumption, so we subtract 1 month
CREATE OR REPLACE FUNCTION sync_bill_to_expense()
RETURNS trigger AS $$
DECLARE
  v_category_id uuid;
  v_expense_month smallint;
  v_expense_year smallint;
BEGIN
  SELECT category_id INTO v_category_id
  FROM providers WHERE id = NEW.provider_id;

  v_expense_month := EXTRACT(MONTH FROM NEW.bill_date)::smallint - 1;
  v_expense_year  := EXTRACT(YEAR  FROM NEW.bill_date)::smallint;

  -- Handle January bills → December of previous year
  IF v_expense_month = 0 THEN
    v_expense_month := 12;
    v_expense_year  := v_expense_year - 1;
  END IF;

  INSERT INTO expenses (category_id, year, month, amount)
  VALUES (v_category_id, v_expense_year, v_expense_month, NEW.amount)
  ON CONFLICT (category_id, year, month)
  DO UPDATE SET amount = EXCLUDED.amount, updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_bill_insert
  AFTER INSERT ON bills
  FOR EACH ROW
  EXECUTE FUNCTION sync_bill_to_expense();

-- Seed providers (lookup category_id by name + apartment)
INSERT INTO providers (apartment_id, category_id, name, epay_merchant)
SELECT 'a1000000-0000-0000-0000-000000000001', id, 'Софийска вода', 'Софийска вода'
FROM categories WHERE apartment_id = 'a1000000-0000-0000-0000-000000000001' AND name = 'Вода';

INSERT INTO providers (apartment_id, category_id, name, epay_merchant)
SELECT 'a1000000-0000-0000-0000-000000000001', id, 'Софиягаз', 'Софиягаз'
FROM categories WHERE apartment_id = 'a1000000-0000-0000-0000-000000000001' AND name = 'Газ';

INSERT INTO providers (apartment_id, category_id, name, epay_merchant)
SELECT 'a1000000-0000-0000-0000-000000000001', id, 'Електрохолд', 'Електрохолд'
FROM categories WHERE apartment_id = 'a1000000-0000-0000-0000-000000000001' AND name = 'Ток';

INSERT INTO providers (apartment_id, category_id, name, epay_merchant)
SELECT 'a1000000-0000-0000-0000-000000000002', id, 'ВиК Пловдив', 'ВиК Пловдив'
FROM categories WHERE apartment_id = 'a1000000-0000-0000-0000-000000000002' AND name = 'Вода';
