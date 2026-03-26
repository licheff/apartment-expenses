-- Add optional end_date to categories for service contract expiry tracking
ALTER TABLE categories ADD COLUMN end_date DATE NULL;
