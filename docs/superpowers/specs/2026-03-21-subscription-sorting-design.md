# Subscription Table Sorting — Design Spec

**Issue:** #21
**Date:** 2026-03-21
**Status:** Approved

---

## Overview

Add client-side column sorting to the subscriptions table. Users can click column headers to sort by name, amount, billing period, or next payment date. Default sort is soonest next payment first.

---

## Scope

- Sortable columns: Name, Amount, Billing cycle, Next payment
- Non-sortable columns: Payment source, avatar/icon column, chevron column
- No DB changes — all subscription data is already loaded in memory

---

## State

Sort state lives entirely inside `SubscriptionTable` (approach A — sort is a view concern).

```ts
type SortKey = 'name' | 'amount' | 'billing_cycle' | 'next_payment'
type SortDir = 'asc' | 'desc'

// Defaults
sortKey: 'next_payment'
sortDir: 'asc'
```

**Interaction rules:**
- Clicking an inactive header: sets it as active with `asc`
- Clicking the active header: toggles direction between `asc` and `desc`

**Tab behaviour:** `SubscriptionsPage` renders two separate `<SubscriptionTable>` instances inside separate `<TabsContent>` elements (active tab and inactive tab). React creates two independent component instances, so each tab has its own sort state. Switching tabs does not reset or carry over the other tab's sort. This is intentional.

---

## Sort Logic

For `name`, `amount`, and `billing_cycle`, sort directly on the subscription fields. For `next_payment`, pre-compute the date before sorting — do not call `nextPaymentDate` inside the comparator, as it runs an iteration loop:

```ts
// next_payment sort only
const sorted = [...subscriptions]
  .map(s => ({ sub: s, next: nextPaymentDate(parseLocalDate(s.start_date), s.billing_cycle) }))
  .sort((a, b) => a.next.getTime() - b.next.getTime())
  .map(({ sub }) => sub)
```

| Column | Sort logic |
|--------|-----------|
| `name` | Case-insensitive string compare (`localeCompare`) |
| `amount` | Numeric compare on `sub.amount` |
| `next_payment` | Pre-compute `nextPaymentDate` timestamps as above. For inactive subscriptions, this produces a theoretical future date — this is accepted behaviour; the sort still functions correctly. |
| `billing_cycle` | Custom order: `weekly(1) → monthly(2) → quarterly(3) → bi_annual(4) → yearly(5) → biennial(6) → triennial(7)`. `asc` = shortest cycle first. See `src/types/index.ts` for the full `BillingCycle` union. |

`sortDir: 'desc'` reverses the result of any comparator.

---

## Column Header UI

Sortable headers become clickable. Use a `flex items-center gap-1` row inside each `<TableHead>` with the label and icon inline.

Visual states:

| State | Icon | Colour |
|-------|------|--------|
| Active column, asc | `<ArrowUp className="h-4 w-4" />` | accent |
| Active column, desc | `<ArrowDown className="h-4 w-4" />` | accent |
| Inactive, on hover | `<ArrowUpDown className="h-4 w-4" />` | muted |
| Inactive, idle | `<ArrowUpDown className="h-4 w-4 opacity-30" />` | muted |

All three icons (`ArrowUp`, `ArrowDown`, `ArrowUpDown`) are available from `lucide-react` and should use `h-4 w-4` to match existing icon usage in the file.

Sortable headers get `cursor-pointer`. For the idle→hover icon transition, use Tailwind's `group-hover:opacity-100 opacity-30` on the icon — no JS hover state needed. Wrap the `<TableHead>` content in a `group` element or apply `hover:` directly on the header.

---

## Files to Change

| File | Change |
|------|--------|
| `src/pages/SubscriptionsPage.tsx` | `SubscriptionTable` component — add sort state, pre-computed sort values, updated `TableHead` elements |
| `skills/subscriptions.md` | Already updated — `BillingCycle` now includes `biennial` and `triennial` |

---

## Out of Scope

- Persisting sort preference to `localStorage`
- Mobile column visibility (Period, Next payment, Payment source remain `hidden sm:table-cell` — sort indicators only appear when columns are visible)
