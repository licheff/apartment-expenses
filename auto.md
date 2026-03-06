# Utility Bill Automation — ePay.bg

## Overview
Automated system that parses ePay.bg notification emails from Gmail and stores them as expenses in Supabase.

## Architecture

```
Gmail Inbox (ePay.bg notifications)
    ↓ (daily Google Apps Script trigger, 9am)
Google Apps Script (plain text parse)
    ↓ (HTTP POST via service_role key)
Supabase `bills` table
    ↓ (INSERT trigger)
sync_bill_to_expense() → UPSERT into `expenses` (−1 month offset)
```

## Email Format

ePay.bg sends one email per bill from `ntf@epay.bg`. The body contains a plain-text table:

```
Търговец              Абонатен номер        Сума
-------------------------------------------------------------
Софийска вода         Вода Драгалевци       11.35 EUR (22.20 BGN)
```

The script parses the first data line after the `---` separator, extracts the EUR amount, and matches the merchant name against `providers.epay_merchant`.

## Supabase Tables

### `providers`
Maps ePay merchant names to expense categories. One row per utility company.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| apartment_id | UUID (FK → apartments) | |
| category_id | UUID (FK → categories) | Target expense category |
| name | TEXT | Display name |
| epay_merchant | TEXT | Merchant name as it appears in ePay emails |
| is_active | BOOLEAN | Default true |

**Current providers:**

| Name | ePay merchant | Category | Apartment |
|------|--------------|----------|-----------|
| Софийска вода | Софийска вода | Вода | Драгалевци |
| Софиягаз | Софиягаз | Газ | Драгалевци |
| Електрохолд | Електрохолд | Ток | Драгалевци |
| ВиК Пловдив | ВиК Пловдив | Вода | 142 |

### `bills`
One row per parsed email. Populated by the Google Apps Script.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| provider_id | UUID (FK → providers) | |
| amount | NUMERIC(10,2) | EUR amount from email |
| bill_date | DATE | Date the email was received |
| gmail_message_id | TEXT | Unique — prevents duplicate processing |

### `sync_bill_to_expense()` trigger
On INSERT into `bills`, upserts into `expenses` with −1 month offset (bills arrive ~1 month after consumption).

## Google Apps Script

**Location:** `scripts/epay-bills.gs` (reference copy); runs in a Google Apps Script project.

**Script Properties:**
- `SUPABASE_URL` — project URL
- `SUPABASE_SERVICE_KEY` — service_role key

**How it works:**
1. Runs daily at 9am Sofia time
2. Searches Gmail: `from:ntf@epay.bg subject:"Чакащи задължения в ePay.bg" -label:BillsProcessed`
3. Parses plain text body — extracts merchant name + EUR amount
4. Matches merchant against `providers.epay_merchant`
5. Inserts into `bills` table (dedup via unique `gmail_message_id`)
6. Labels processed threads with `BillsProcessed`

**Key functions:**
- `setupDailyTrigger()` — creates the daily 9am trigger (run once)
- `testManual()` — processes all unprocessed emails immediately

## Adding a New Provider

Just insert into the `providers` table — no script changes needed:

```sql
INSERT INTO providers (apartment_id, category_id, name, epay_merchant)
SELECT '<apartment_uuid>', id, 'Provider Name', 'ePay Merchant Name'
FROM categories
WHERE apartment_id = '<apartment_uuid>' AND name = '<category_name>';
```

## Not Yet Automated

- **ЕВН България** (Ток, 142) — the bill combines two locations; needs manual entry for now
