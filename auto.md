# Utility Bill Automation — Handoff

## Overview
We built an automated system that parses utility bills from Gmail and stores them in Supabase. This document summarizes everything for integration with the existing expense tracking app.

## Architecture

```
Gmail Inbox
    ↓ (monthly Google Apps Script trigger)
Google Apps Script (OCR + parse PDF)
    ↓ (HTTP POST via service_role key)
Supabase (locations, providers, bills tables)
    ↓ (query from app)
React App (display)
```

## Supabase Tables Created

### `locations`
Tracks physical properties/apartments.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| name | TEXT | e.g. "Драгалевци" |
| address | TEXT | Full address (optional) |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMPTZ | |

**Current data:**
- `Драгалевци` (id: `a0000000-0000-0000-0000-000000000001`) — кв. Драгалевци, Ул. Ненко Балкански No.1, Вх.Б, Ет:1, Ап:Б4, 1415, ВИТОША, гр.СОФИЯ

### `providers`
One row per utility company per location. Stores email matching rules and parsing config.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| location_id | UUID (FK → locations) | Which property this provider serves |
| name | TEXT | e.g. "Софийска вода" |
| email_sender | TEXT | Gmail `from:` filter |
| email_subject | TEXT | Gmail `subject:` filter (prefix match) |
| parse_keyword | TEXT | Text to search for in PDF before the amount |
| currency | TEXT | e.g. "EUR", "BGN" |
| schedule_day | INTEGER | Day of month the script trigger runs |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | Auto-updated via trigger |

**Current data:**

| Name | Location | email_sender | parse_keyword | Currency |
|------|----------|-------------|---------------|----------|
| Софийска вода | Драгалевци | E-faktura@invoice.sofiyskavoda.bg | ОБЩА ДЪЛЖИМА СУМА | EUR |
| Електрохолд | Драгалевци | info@invoices.electrohold.bg | Обща стойност на сделката | EUR |

### `bills`
One row per parsed bill. Populated automatically by the Google Apps Script.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | |
| provider_id | UUID (FK → providers) | |
| location_id | UUID (FK → locations) | |
| amount | NUMERIC(10,2) | e.g. 108.84 |
| currency | TEXT | e.g. "EUR" |
| bill_date | DATE | Date the email was received |
| email_date | TIMESTAMPTZ | Exact email timestamp |
| gmail_message_id | TEXT | Unique, prevents duplicates |
| created_at | TIMESTAMPTZ | |

**Current data:**

| Provider | Amount | Currency | Date |
|----------|--------|----------|------|
| Софийска вода | 11.35 | EUR | 2026-02-11 |
| Електрохолд | 108.84 | EUR | 2026-02-20 |

## Google Apps Script

**Location:** Google Apps Script project (separate from the React app)

**Script Properties (configured):**
- `SUPABASE_URL` — project URL
- `SUPABASE_SERVICE_KEY` — legacy service_role key

**How it works:**
1. Runs monthly (trigger set for 1st of month at 10am Sofia time)
2. Fetches active providers from Supabase
3. For each provider, searches Gmail by `from:` + `subject:` + `newer_than:35d`
4. Extracts PDF attachment → uploads to Google Drive as Google Doc (OCR with Bulgarian language)
5. Searches OCR text for `parse_keyword`, then extracts the first number with 2 decimal places after it (preferring amounts followed by €/евро/EUR)
6. POSTs bill to Supabase `bills` table
7. Labels processed emails with `BillsProcessed` in Gmail
8. Duplicate prevention via unique `gmail_message_id`

**Key functions:**
- `testManual()` — processes all providers regardless of schedule (for testing)
- `setupMonthlyTriggers()` — creates monthly trigger on the 1st
- `setupCustomTrigger(day)` — creates trigger for a specific day
- `debugExtraction()` — logs OCR text around keywords (for debugging parsing)

## RLS Policies
- All tables have RLS enabled
- `authenticated` users have full access
- `service_role` can insert into `bills` (used by Google Apps Script)

## Integration Notes

### What the React app needs to do:
- Query `bills` joined with `providers` and `locations` to display expense history
- The `locations` table can serve as the top-level grouping (e.g. tabs or filters by property)
- `providers.name` gives the expense category (water, electricity, etc.)

### Potential schema alignment needed:
- If the existing app has its own `expenses` or `monthly_expenses` table, we may want to either:
  - (a) Have the app read directly from `bills` + `providers` + `locations`
  - (b) Create a view that unions the `bills` table with existing expense data
  - (c) Migrate existing tables to use the new schema

### Second location:
- A second location exists but no email-based providers are configured for it yet
- Can be added with a simple INSERT into `locations` and then `providers`

### Adding providers without email automation:
- Providers can be added for manual entry too — just leave `email_sender` and `email_subject` empty and set `is_active = false` for the automation
- The app could have a manual entry form that inserts directly into `bills`     