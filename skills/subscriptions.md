# skills/subscriptions.md

**Purpose:** Data model, logic, and UI patterns for the subscriptions feature. Use for any work on subscriptions, recurring payments, the subscription calendar, upcoming payments, or payment sources.

## Data Model

```ts
Subscription {
  id, name, amount (EUR), billing_cycle: BillingCycle
  payment_source_id → payment_sources.id (nullable)
  start_date: "YYYY-MM-DD"   // billing anchor — next payment computed from this
  is_active: boolean
  is_rebate: boolean          // excluded from totals when true
  notes: string | null
  icon_url: string | null     // Supabase Storage public URL for SVG
}

SubscriptionPriceChange {
  subscription_id, amount (new price), previous_amount (old price, null for initial), effective_from: "YYYY-MM-DD"
}

BillingCycle: 'weekly' | 'monthly' | 'quarterly' | 'bi_annual' | 'yearly' | 'biennial' | 'triennial'
```

## Key Logic (`lib/subscriptions.ts`)

- **`nextPaymentDate(startDate, cycle)`** — advances from `start_date` until >= today. Always call this for "days until" and calendar placement.
- **`paymentDatesInMonth(startDate, cycle, year, month)`** — all occurrences in a month. Weekly subscriptions can hit 4–5 times.
- **`monthlyEquivalent(amount, cycle)`** — normalises any cycle to a monthly cost for summary totals.
- **`daysUntilNextPayment(startDate, cycle)`** — days >= 0.
- **`cycleLabelBg(cycle)`** — Bulgarian display label.
- **`parseLocalDate(dateStr)`** — always use this instead of `new Date(dateStr)` to avoid UTC midnight timezone shift.

## Totals Rule

Summary totals (`totalPerMonth`, `totalPerYear`) include **active, non-rebate** subscriptions only:
```ts
subscriptions.filter(s => s.is_active && !s.is_rebate)
```
Never include paused or rebate subscriptions in cost summaries.

## Price History

When a subscription price changes, insert a row into `subscription_price_changes` — do not just update `subscriptions.amount`. The UI reads the history to show a price timeline. `useSubscriptionPriceChanges(subscriptionId)` fetches the log for a given subscription.

## Calendar View (`SubscriptionCalendar`)

`SubscriptionCalendar` renders a 12-month grid for a given year. For each month cell, it calls `paymentDatesInMonth(parseLocalDate(sub.start_date), sub.billing_cycle, year, month)` for each active subscription. If the returned array is non-empty, the subscription appears in that cell. Weekly subscriptions may appear multiple times in a single month (4–5 hits). The calendar is read-only — clicking a subscription opens its edit dialog, it does not log a payment.

## Icon Upload

SVG icons upload via `<IconUpload>` → Supabase Storage bucket. The returned public URL is stored in `subscriptions.icon_url`. Always display with `<img src={icon_url} />` — never inline the SVG. On delete, remove the storage object before deleting the subscription row.

## Anti-patterns

- Don't use `new Date(dateStr)` on `start_date` strings — use `parseLocalDate()` instead
- Don't include rebate or inactive subscriptions in cost totals
- Don't update `subscriptions.amount` directly for a price change — insert into `subscription_price_changes`
- Don't store subscription costs in the `expenses` table — subscriptions are tracked separately
