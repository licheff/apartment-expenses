-- Track subscription price changes with effective dates
CREATE TABLE subscription_price_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,           -- new price (EUR)
  previous_amount numeric(10,2),           -- old price (EUR), null for initial
  effective_from date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_changes_subscription
  ON subscription_price_changes(subscription_id);

ALTER TABLE subscription_price_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users" ON subscription_price_changes
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
