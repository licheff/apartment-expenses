# Subscriptions Calendar Redesign — Design Spec

**Date:** 2026-03-21
**Status:** Approved

---

## Overview

Make the subscription calendar the primary UI on the Subscriptions page. Remove the UpcomingPayments section from this page (it remains on the Overview page), make the calendar full-width, and increase day cell and icon sizing to the "Spacious" calibration.

---

## Scope

- Remove `UpcomingPayments` from `SubscriptionsPage.tsx` only — Overview page is unaffected
- Make `SubscriptionCalendar` full-width by removing the 3-column grid wrapper
- Increase calendar day cell size (Spacious B: 34px day circles, 32px icons)
- Detail panel below the grid on day click — no change, already correct

---

## Out of Scope

- Overview page (UpcomingPayments stays there unchanged)
- `UpcomingPaymentsList` component itself (keep, still used on Overview)
- Detail panel behavior or layout

---

## `SubscriptionsPage.tsx` Changes

### Remove UpcomingPayments

Delete the local `UpcomingPayments` function component (currently lines 239–265). Note: the `sm:col-span-2` class that makes it span 2 columns is applied inside that function's returned JSX — it disappears with the deletion, no extra cleanup needed elsewhere.

Remove the `UpcomingPaymentsList` import.

### Remove 3-column grid wrapper

Replace the calendar+upcoming grid block:

```tsx
{loading ? (
  <Skeleton className="h-[320px] rounded-xl" />
) : (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
    <SubscriptionCalendar subscriptions={activeSubscriptions} />
    <UpcomingPayments subscriptions={activeSubscriptions} />
  </div>
)}
```

With just the calendar, full-width:

```tsx
{loading ? (
  <Skeleton className="h-[460px] rounded-xl" />
) : (
  <SubscriptionCalendar subscriptions={activeSubscriptions} />
)}
```

Skeleton height updated from `h-[320px]` to `h-[460px]` to match the taller calendar.

---

## `SubscriptionCalendar.tsx` Changes

### Cell button sizing

```tsx
// Before
'flex flex-col items-center gap-0.5 rounded-md py-1 text-sm transition-colors',

// After
'flex flex-col items-center gap-1.5 rounded-md py-3.5 text-sm transition-colors',
```

### Day number circle — regular day

```tsx
// Before
'flex h-6 w-6 items-center justify-center text-xs'

// After
'flex h-[34px] w-[34px] items-center justify-center text-sm'
```

### Day number circle — today

```tsx
// Before
'flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold'

// After
'flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold'
```

### Calendar grid icons

There are two `Avatar size="sm"` usages in the file. Change only the one inside the `hasSubs &&` block (the calendar grid). The detail panel icons inside `selectedSubs.map` remain `size="sm"`.

```tsx
// Before — inside the hasSubs && block (calendar grid):
{hasSubs && (
  <div className="flex gap-0.5">
    {subs.slice(0, 3).map(sub => (
      <Avatar key={sub.id} size="sm">

// After — same location, size changed to md:
{hasSubs && (
  <div className="flex gap-1.5">
    {subs.slice(0, 3).map(sub => (
      <Avatar key={sub.id} size="md">
```

Note: the `gap-0.5` on the icon wrapper also changes to `gap-1.5` to give the larger icons appropriate spacing.

### Overflow dot

```tsx
// Before
<span className="h-4 w-4 rounded-lg bg-muted-foreground" />

// After
<span className="h-8 w-8 rounded-lg bg-muted-foreground" />
```

### Month header

```tsx
// Before
<span className="font-semibold text-sm">

// After
<span className="font-semibold text-[15px]">
```

---

## Files to Change

| File | Change |
|------|--------|
| `src/pages/SubscriptionsPage.tsx` | Remove `UpcomingPayments` function, remove `UpcomingPaymentsList` import, replace 3-col grid with full-width calendar |
| `src/components/SubscriptionCalendar.tsx` | Spacious B sizing: cell padding, day circle, grid icon size, overflow dot, month header |
