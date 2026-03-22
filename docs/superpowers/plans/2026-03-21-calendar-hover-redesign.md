# Subscription Calendar Hover Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix calendar height instability, replace the click-based detail panel with a hover tooltip, add monthly total to the header, and show "+N" overflow counts.

**Architecture:** Single file edit — all changes are in `src/components/SubscriptionCalendar.tsx`. Add Tooltip from the already-installed `radix-ui` package. Remove `selectedDay` state entirely. Pad the grid to always 42 cells.

**Tech Stack:** React 19, TypeScript (strict), Tailwind CSS v4, Radix UI (already installed as `"radix-ui"`)

**Spec:** `docs/superpowers/specs/2026-03-21-calendar-hover-redesign.md`

> **Note:** No test suite exists. Verification is manual via `npm run dev` in the browser.

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `src/components/SubscriptionCalendar.tsx` | Modify | All changes — Tooltip import, remove selectedDay, add monthTotal, header update, 42-cell grid, hover tooltip per day, overflow count |

---

### Task 1: Remove selectedDay state and add Tooltip infrastructure

This task clears out the old click-based interaction and sets up the Tooltip wrapper. It will temporarily leave the grid without hover behavior (the tooltip triggers come in Task 2), but the page should render without errors.

**Files:**
- Modify: `src/components/SubscriptionCalendar.tsx`

- [ ] **Step 1: Add the Tooltip import**

  In `src/components/SubscriptionCalendar.tsx`, after the existing imports, add:

  ```ts
  import { Tooltip as RadixTooltip } from 'radix-ui'
  ```

- [ ] **Step 2: Remove `selectedDay` state and all related code**

  Delete these lines (exact text to find and remove):

  **Line 33 — state declaration:**
  ```ts
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  ```

  **Line 80 — derived variable:**
  ```ts
  const selectedSubs = selectedDay !== null ? (paymentMap.get(selectedDay) ?? []) : []
  ```

  **Inside `prevMonth` (line 69) — remove this line only:**
  ```ts
  setSelectedDay(null)
  ```

  **Inside `nextMonth` (line 74) — remove this line only:**
  ```ts
  setSelectedDay(null)
  ```

  **Inside the day cell map — remove these three lines:**
  ```ts
  const isSelected = selectedDay === day
  ```
  the `isSelected ? 'bg-accent' : ''` entry in the className array, and the `onClick` prop on the button:
  ```tsx
  onClick={() => setSelectedDay(isSelected ? null : day)}
  ```

  **The entire selected day detail block at the bottom of return (lines 160–189):**
  ```tsx
  {/* Selected day detail */}
  {selectedDay !== null && (
    <div className="border-t pt-3 space-y-2">
      ...
    </div>
  )}
  ```
  Delete from `{/* Selected day detail */}` through the closing `)}`.

- [ ] **Step 3: Wrap the return in TooltipProvider**

  (This is done now as scaffolding so Task 3 can add `RadixTooltip.Root` consumers without needing to touch the outer wrapper. No consumers exist yet — that is fine; a provider without consumers is harmless.)

  The current return starts with:
  ```tsx
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
  ```

  Change to:
  ```tsx
  return (
    <RadixTooltip.Provider delayDuration={300}>
      <div className="rounded-lg border bg-card p-4 space-y-3">
  ```

  And add the closing tag at the very end:
  ```tsx
      </div>
    </RadixTooltip.Provider>
  )
  ```

- [ ] **Step 4: Build and verify**

  ```bash
  cd "/Users/licheff/Documents/Dev Projects/apartment-expenses" && npm run build
  ```

  Expected: zero TypeScript errors. If TypeScript complains about `selectedDay` still being referenced somewhere, search the file and remove the remaining reference.

---

### Task 2: Add monthly total to header and fix grid to 42 cells

**Files:**
- Modify: `src/components/SubscriptionCalendar.tsx`

- [ ] **Step 1: Add `monthTotal` computed value**

  After the `paymentMap` useMemo block, add:

  ```ts
  const monthTotal = useMemo(() => {
    let total = 0
    paymentMap.forEach(subs => subs.forEach(sub => { total += sub.amount }))
    return total
  }, [paymentMap])
  ```

- [ ] **Step 2: Update the header to show the monthly total**

  Find the current header center span:

  ```tsx
  <span className="font-semibold text-[15px]">
    {MONTH_NAMES[month]} {year}
  </span>
  ```

  Replace with:

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

- [ ] **Step 3: Add trailing empty cells to always fill 42 grid cells**

  Find the calendar grid `<div className="grid grid-cols-7">` block. After the day cells loop (the `Array.from({ length: daysInMonth }, ...).map(...)` block), add:

  ```tsx
  {/* Trailing empty cells to always fill 6 rows */}
  {Array.from({ length: 42 - startOffset - daysInMonth }).map((_, i) => (
    <div key={`trail-${i}`} />
  ))}
  ```

- [ ] **Step 4: Build and verify**

  ```bash
  npm run build
  ```

  Expected: zero TypeScript errors.

---

### Task 3: Replace day cells with hover tooltip

This is the main interaction change. Days without subscriptions become plain `<div>`s. Days with subscriptions become tooltip-wrapped `<button>`s.

**Files:**
- Modify: `src/components/SubscriptionCalendar.tsx`

- [ ] **Step 1: Replace the day cell render logic**

  Find the `{Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => { ... })}` block (the entire day cell map). Replace the return inside the map with a conditional: either a plain div (no subs) or a tooltip-wrapped button (has subs).

  Replace the entire map with:

  ```tsx
  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
    const subs = paymentMap.get(day) ?? []
    const hasSubs = subs.length > 0
    const todayDay = isToday(day)

    if (!hasSubs) {
      return (
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
      )
    }

    return (
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
    )
  })}
  ```

- [ ] **Step 2: Build and verify clean**

  ```bash
  npm run build
  ```

  Expected: **zero TypeScript errors**.

- [ ] **Step 3: Start dev server and verify in browser**

  ```bash
  npm run dev
  ```

  Open the Subscriptions page and check:
  - [ ] Navigating between months — calendar height stays constant, no page jump
  - [ ] A month with subscriptions — hovering a day with subs shows a floating card with name + amount
  - [ ] Tooltip card has a date label, subscription list, and a small arrow pointing to the cell
  - [ ] A month with no subscriptions on a given day — no hover effect, no tooltip
  - [ ] Monthly total appears below the month name in the header (e.g. "€47.50")
  - [ ] Months with zero total (e.g. a future month with no payments) — total line is hidden
  - [ ] If any day has >3 subs — "+1", "+2" etc. appears as a count, not a blank rectangle
  - [ ] Today's date still has the primary-colored circle regardless of hover state
  - [ ] Tooltip card background and text are visually distinct from the calendar card (confirms `bg-popover` / `text-popover-foreground` tokens resolve correctly)

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/SubscriptionCalendar.tsx
  git commit -m "feat: hover tooltip for subscription details, fixed grid height, monthly total in header"
  ```
