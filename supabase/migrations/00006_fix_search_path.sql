-- Fix mutable search_path on functions by recreating them with SET search_path = ''
-- This prevents search_path injection attacks

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

create or replace function public.sync_bill_to_expense()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
DECLARE
  v_category_id UUID;
  v_date DATE;
BEGIN
  SELECT category_id INTO v_category_id
  FROM public.providers WHERE id = NEW.provider_id;

  v_date := NEW.bill_date - INTERVAL '1 month';

  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.expenses (category_id, year, month, amount, updated_at)
    VALUES (
      v_category_id,
      EXTRACT(YEAR  FROM v_date)::INTEGER,
      EXTRACT(MONTH FROM v_date)::INTEGER,
      NEW.amount,
      NOW()
    )
    ON CONFLICT (category_id, year, month)
    DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;
