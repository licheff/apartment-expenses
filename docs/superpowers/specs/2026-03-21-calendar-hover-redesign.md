# Subscription Calendar Hover Redesign — Design Spec

**Date:** 2026-03-21
**Status:** Approved

---

## Overview

Refine the full-width subscription calendar: fix the height instability, replace the click-based detail panel with a floating hover popover, show the monthly total in the header, and show overflow counts.

---

## Changes at a Glance

| What | Before | After |
|------|--------|-------|
| Grid rows | 5 or 6 (varies) | Always 6 (42 cells) |
| Day details | Click → panel below grid (causes jump) | Hover → floating tooltip near the cell |
| Click interaction | Toggles detail panel | None |
| Header | Month + year only | Month + year + monthly total below |
| Overflow indicator | Blank 32px dark rectangle | "+N" count with text |

---

## Scope

One file changes: `src/components/SubscriptionCalendar.tsx`.

No new npm dependencies — `Tooltip` is available from the existing `"radix-ui"` package.

---

## Detailed Changes

### 1. Imports

Add Tooltip import alongside existing imports:

```ts
import { Tooltip as RadixTooltip } from 'radix-ui'
```

### 2. Remove `selectedDay` state and related code

Delete:
- `const [selectedDay, setSelectedDay] = useState<number | null>(null)`
- `const selectedSubs = selectedDay !== null ? (paymentMap.get(selectedDay) ?? []) : []`
- The two `setSelectedDay(null)` calls inside `prevMonth` and `nextMonth`
- The `isSelected` variable inside the day cell map (currently `const isSelected = selectedDay === day`)
- The `isSelected ? 'bg-accent' : ''` entry in the day button's className array
- The entire `{/* Selected day detail */}` JSX block at the bottom of the return

### 3. Add `monthTotal` computation

Add after the `paymentMap` useMemo:

```ts
const monthTotal = useMemo(() => {
  let total = 0
  paymentMap.forEach(subs => subs.forEach(sub => { total += sub.amount }))
  return total
}, [paymentMap])
```

### 4. Update header to show monthly total

Replace the current single `<span>` in the header center with a column:

```tsx
<div className="flex flex-col items-center gap-0.5">
  <span className="font-semibold text-[15px]">
    {MONTH_NAMES[month]} {year}
  </span>
  {monthTotal > 0 && (
    <span className="text-xs text-muted-foreground tabular-nums">
      {formatCurrency(monthTotal)}
    </span>
  )}
</div>
```

### 5. Always render 42 grid cells

After the day cells loop, add trailing empty cells so the grid always has exactly 6 rows:

```tsx
{/* Trailing empty cells to always fill 6 rows */}
{Array.from({ length: 42 - startOffset - daysInMonth }).map((_, i) => (
  <div key={`trail-${i}`} />
))}
```

### 6. Wrap the calendar in TooltipProvider

Wrap the entire returned `<div>` in `<RadixTooltip.Provider>`:

```tsx
return (
  <RadixTooltip.Provider delayDuration={300}>
    <div className="rounded-lg border bg-card p-4 space-y-3">
      ...
    </div>
  </RadixTooltip.Provider>
)
```

### 7. Update day cells: remove click, add hover tooltip

**For days WITHOUT subscriptions** — render as a plain `<div>` (not a button, since there's no interaction):

```tsx
<div
  key={day}
  className={[
    'flex flex-col items-center gap-1.5 rounded-md py-3.5 text-sm',
    todayDay ? 'font-bold' : '',
  ].join(' ')}
>
  <span className={todayDay
    ? 'flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold'
    : 'flex h-[34px] w-[34px] items-center justify-center text-sm'
  }>
    {day}
  </span>
</div>
```

**For days WITH subscriptions** — wrap in a Tooltip:

```tsx
<RadixTooltip.Root key={day}>
  <RadixTooltip.Trigger asChild>
    <button
      className={[
        'flex flex-col items-center gap-1.5 rounded-md py-3.5 text-sm transition-colors',
        'hover:bg-accent cursor-pointer',
        todayDay ? 'font-bold' : '',
      ].join(' ')}
    >
      <span className={todayDay
        ? 'flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold'
        : 'flex h-[34px] w-[34px] items-center justify-center text-sm'
      }>
        {day}
      </span>
      <div className="flex gap-1.5">
        {subs.slice(0, 3).map(sub => (
          <Avatar key={sub.id} size="md">
            {sub.icon_url && <AvatarImage src={sub.icon_url} />}
            <AvatarFallback className={`${colorMap.get(sub.id)} text-white`}>
              {sub.name[0]}
            </AvatarFallback>
          </Avatar>
        ))}
        {subs.length > 3 && (
          <span className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
            +{subs.length - 3}
          </span>
        )}
      </div>
    </button>
  </RadixTooltip.Trigger>
  <RadixTooltip.Portal>
    <RadixTooltip.Content
      side="top"
      align="center"
      sideOffset={6}
      avoidCollisions
      className="z-50 rounded-lg border bg-popover text-popover-foreground shadow-md p-3 min-w-[180px] max-w-[240px]"
    >
      <p className="text-xs font-medium text-muted-foreground mb-2">
        {day} {MONTH_NAMES[month]}
      </p>
      <ul className="space-y-1.5">
        {subs.map(sub => (
          <li key={sub.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                {sub.icon_url && <AvatarImage src={sub.icon_url} />}
                <AvatarFallback className={`${colorMap.get(sub.id)} text-white`}>
                  {sub.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{sub.name}</span>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">
              {formatCurrency(sub.amount)}
            </span>
          </li>
        ))}
      </ul>
      <RadixTooltip.Arrow className="fill-border" />
    </RadixTooltip.Content>
  </RadixTooltip.Portal>
</RadixTooltip.Root>
```

Note: the tooltip shows **all** subscriptions (not capped at 3 — the `subs.slice(0, 3)` is only for the icon row in the cell itself).

### 8. Styling: popover colors

The tooltip content uses `bg-popover` and `text-popover-foreground`. These are standard Tailwind CSS v4 theme tokens already used throughout the project (same as dialog backgrounds).

---

## What Does NOT Change

- `colorMap`, `paymentMap` useMemos — unchanged
- `prevMonth` / `nextMonth` nav handlers (just remove the `setSelectedDay(null)` calls)
- Day-of-week labels row
- `isToday` helper
- `DOT_COLORS` array
- Avatar component itself
- Any other file in the project

---

## Mobile Behavior

Radix `Tooltip` shows on hover (desktop) and on tap (touch devices — Radix handles this automatically). On mobile, tapping a day cell with subscriptions opens the tooltip; tapping elsewhere closes it. This is acceptable behavior for a secondary detail view.
