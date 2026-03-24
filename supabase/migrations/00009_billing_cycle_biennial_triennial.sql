-- Extend billing_cycle to support biennial and triennial values.
--
-- The subscriptions table was created outside tracked migrations.
-- billing_cycle may be either a Postgres enum type or a text column
-- with a CHECK constraint — this migration handles both cases.

-- Case 1: billing_cycle is a Postgres enum type
DO $$ BEGIN
  ALTER TYPE billing_cycle ADD VALUE IF NOT EXISTS 'biennial';
  ALTER TYPE billing_cycle ADD VALUE IF NOT EXISTS 'triennial';
EXCEPTION WHEN undefined_object THEN
  NULL; -- not an enum type, handled below
END $$;

-- Case 2: billing_cycle is a text column with a CHECK constraint
DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT conname INTO v_constraint
  FROM pg_constraint
  JOIN pg_class ON pg_class.oid = pg_constraint.conrelid
  WHERE pg_class.relname = 'subscriptions'
    AND contype = 'c'
    AND pg_get_constraintdef(pg_constraint.oid) LIKE '%billing_cycle%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE 'ALTER TABLE subscriptions DROP CONSTRAINT ' || quote_ident(v_constraint);
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_billing_cycle_check
      CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'bi_annual', 'yearly', 'biennial', 'triennial'));
  END IF;
END $$;
