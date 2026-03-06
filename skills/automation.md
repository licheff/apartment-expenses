# skills/automation.md

**Purpose:** How the ePay.bg bill parsing pipeline works and how to extend it.

## Architecture

```
Gmail (ntf@epay.bg) → Google Apps Script (daily, 9am)
  → parse plain text: merchant + EUR amount
  → INSERT into bills table
  → Supabase trigger sync_bill_to_expense()
  → UPSERT into expenses table (−1 month offset)
```

## Adding a New Automated Provider

Only requires a database INSERT — no script changes:

```sql
INSERT INTO providers (apartment_id, category_id, name, epay_merchant)
SELECT '<apartment_uuid>', id, 'Provider Name', 'ePay Merchant Name'
FROM categories
WHERE apartment_id = '<apartment_uuid>' AND name = '<category_name>';
```

`epay_merchant` must match the merchant name exactly as it appears in the ePay.bg email.

## Current Providers

| ePay merchant | Category | Apartment |
|--------------|----------|-----------|
| Софийска вода | Вода | Драгалевци |
| Софиягаз | Газ | Драгалевци |
| Електрохолд | Ток | Драгалевци |
| ВиК Пловдив | Вода | 142 |

**Not automated:** ЕВН България (Ток, 142) — bill combines two locations.

## Deduplication

Two layers prevent double-processing:
1. Gmail label `BillsProcessed` — script skips labeled threads
2. `bills.gmail_message_id` UNIQUE constraint — DB rejects duplicates

## Debugging

- `testManual()` in Apps Script — processes all unprocessed emails immediately
- Check Apps Script execution log for `✓` (success) and `✗` (error) entries
- Unknown merchants log as "Unknown merchant in: ..." — add the provider to fix

## Anti-patterns

- Don't hardcode category UUIDs — use a subquery to look up by name + apartment
- Don't forget the −1 month offset when manually inserting into `bills`
- Don't edit the script to add providers — use the `providers` table
