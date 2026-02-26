# skills/automation.md

**Purpose:** How the bill parsing pipeline works and how to extend it.

## Architecture

```
Gmail → Google Apps Script (monthly, 1st of month)
  → OCR parses PDF bill
  → INSERT into bills table
  → Supabase trigger sync_bill_to_expense()
  → UPSERT into expenses table
```

## Adding a New Automated Provider

Only requires a database INSERT — no app code changes:

```sql
INSERT INTO providers (location_id, name, email_sender, email_subject, parse_keyword, currency, category_id)
VALUES (
  'a0000000-0000-0000-0000-000000000001',  -- Драгалевци
  'Provider Name',
  'billing@provider.bg',
  'Your Invoice',
  'TOTAL DUE',     -- text in PDF before the amount
  'EUR',
  '<category_uuid>'
);
```

`providers.category_id` is the only mapping needed — the trigger reads it to write to `expenses`.

## Current Mappings (Драгалевци)

| Provider | Category | category_id |
|----------|----------|-------------|
| Софийска вода | Вода | `e611ecae-9c91-4146-acce-4c6fc65fa2b6` |
| Електрохолд | Ток | `79d13f35-959b-45d5-b81f-19f404340d2c` |

Location `a0000000-0000-0000-0000-000000000001` = Драгалевци. Location 142 has no automated providers yet.

## Debugging

- `testManual()` in Apps Script — processes all providers regardless of schedule
- `debugExtraction()` — logs OCR text around keywords

## Anti-patterns

- Don't edit the Google Apps Script to add providers — use the `providers` table
- Don't forget the `-1 month` offset when manually inserting into `bills`
