# Subscriptions Calendar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the subscription calendar the primary UI on the Subscriptions page — full-width, bigger cells, and without the UpcomingPayments sidebar.

**Architecture:** Two surgical edits to existing files. `SubscriptionsPage.tsx` loses the 3-column grid wrapper and the local `UpcomingPayments` component. `SubscriptionCalendar.tsx` gets updated sizing tokens throughout the calendar grid (cell padding, day circle, icon size, overflow dot, month header). No new files, no new dependencies.

**Tech Stack:** React 19, TypeScript (strict), Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-03-21-subscriptions-calendar-redesign.md`

> **Note:** No test suite exists. Verification is manual via `npm run dev` in the browser.

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `src/pages/SubscriptionsPage.tsx` | Modify | Remove `UpcomingPayments` local function, remove `UpcomingPaymentsList` import, replace 3-col grid with full-width calendar |
| `src/components/SubscriptionCalendar.tsx` | Modify | Spacious B sizing: cell padding, day circle, grid icon size, icon wrapper gap, overflow dot, month header |

---

### Task 1: Remove UpcomingPayments from SubscriptionsPage and make calendar full-width

**Files:**
- Modify: `src/pages/SubscriptionsPage.tsx`

- [ ] **Step 1: Remove the `UpcomingPaymentsList` import**

  In `src/pages/SubscriptionsPage.tsx`, find line 25:

  ```ts
  import { UpcomingPaymentsList } from '@/components/UpcomingPaymentsList'
  ```

  Delete that line entirely.

- [ ] **Step 2: Delete the local `UpcomingPayments` function**

  Find and delete lines 237–265 inclusive (the section comment through the function's closing `}`). The block looks like this:

  ```tsx
  // ─── Upcoming payments ────────────────────────────────────────────────────────

  function UpcomingPayments({ subscriptions }: { subscriptions: Subscription[] }) {
    const sorted = [...subscriptions]
      .map(sub => ({
        id: sub.id,
        name: sub.name,
        amount: sub.amount,
        icon_url: sub.icon_url,
        days: daysUntilNextPayment(parseLocalDate(sub.start_date), sub.billing_cycle),
        next: nextPaymentDate(parseLocalDate(sub.start_date), sub.billing_cycle),
      }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 8)

    if (sorted.length === 0) {
      return (
        <SectionCard title="Предстоящи плащания" className="sm:col-span-2">
          <p className="py-8 text-center text-sm text-muted-foreground">Няма предстоящи плащания</p>
        </SectionCard>
      )
    }

    return (
      <SectionCard title="Предстоящи плащания" className="sm:col-span-2">
        <UpcomingPaymentsList items={sorted} />
      </SectionCard>
    )
  }
  ```

  Line 267 (`// ─── Page ──...`) should be the first line that survives. Delete everything from the `// ─── Upcoming payments` comment through the closing `}` at line 265.

- [ ] **Step 3: Replace the 3-column grid block with a full-width calendar**

  Find this block (around line 436 after the deletions above shift line numbers):

  ```tsx
  {/* Calendar + upcoming payments */}
  {loading ? (
    <Skeleton className="h-[320px] rounded-xl" />
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
      <SubscriptionCalendar subscriptions={activeSubscriptions} />
      <UpcomingPayments subscriptions={activeSubscriptions} />
    </div>
  )}
  ```

  Replace it with:

  ```tsx
  {/* Calendar */}
  {loading ? (
    <Skeleton className="h-[460px] rounded-xl" />
  ) : (
    <SubscriptionCalendar subscriptions={activeSubscriptions} />
  )}
  ```

- [ ] **Step 4: Build and verify clean**

  ```bash
  cd "/Users/licheff/Documents/Dev Projects/apartment-expenses" && npm run build
  ```

  Expected: **zero TypeScript errors**. If you see `UpcomingPayments` or `UpcomingPaymentsList` referenced but not found, you missed a usage — search for it and remove it.

- [ ] **Step 5: Start dev server and check in browser**

  ```bash
  npm run dev
  ```

  Open the Subscriptions page and confirm:
  - [ ] The calendar renders across the full page width (no sidebar next to it)
  - [ ] The UpcomingPayments list is gone from this page
  - [ ] The Overview page still shows UpcomingPayments (it imports from `@/components/UpcomingPaymentsList` directly — unaffected)
  - [ ] The subscription table and tabs below the calendar are still present

- [ ] **Step 6: Commit**

  ```bash
  git add src/pages/SubscriptionsPage.tsx
  git commit -m "feat: make subscription calendar full-width, remove upcoming payments from subscriptions page"
  ```

---

### Task 2: Apply Spacious B sizing to SubscriptionCalendar

**Files:**
- Modify: `src/components/SubscriptionCalendar.tsx`

- [ ] **Step 1: Update the month header size**

  Find line 89:

  ```tsx
  <span className="font-semibold text-sm">
  ```

  Change to:

  ```tsx
  <span className="font-semibold text-[15px]">
  ```

- [ ] **Step 2: Update cell button padding and gap**

  Find the cell button className array (line 124–129):

  ```tsx
  className={[
    'flex flex-col items-center gap-0.5 rounded-md py-1 text-sm transition-colors',
    hasSubs ? 'cursor-pointer hover:bg-accent' : 'cursor-default',
    isSelected ? 'bg-accent' : '',
    todayDay && !isSelected ? 'font-bold' : '',
  ].join(' ')}
  ```

  Change `gap-0.5 py-1` to `gap-1.5 py-3.5`:

  ```tsx
  className={[
    'flex flex-col items-center gap-1.5 rounded-md py-3.5 text-sm transition-colors',
    hasSubs ? 'cursor-pointer hover:bg-accent' : 'cursor-default',
    isSelected ? 'bg-accent' : '',
    todayDay && !isSelected ? 'font-bold' : '',
  ].join(' ')}
  ```

- [ ] **Step 3: Update day number circle sizes**

  Find the day number `<span>` (lines 131–134):

  ```tsx
  <span className={todayDay
    ? 'flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold'
    : 'flex h-6 w-6 items-center justify-center text-xs'
  }>
  ```

  Change both `h-6 w-6 text-xs` occurrences to `h-[34px] w-[34px] text-sm`:

  ```tsx
  <span className={todayDay
    ? 'flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold'
    : 'flex h-[34px] w-[34px] items-center justify-center text-sm'
  }>
  ```

- [ ] **Step 4: Update calendar grid icon size and icon wrapper gap**

  Find the icon row inside the `hasSubs &&` block (lines 139–153):

  ```tsx
  {hasSubs && (
    <div className="flex gap-0.5">
      {subs.slice(0, 3).map(sub => (
        <Avatar key={sub.id} size="sm">
  ```

  Change `gap-0.5` → `gap-1.5` and `size="sm"` → `size="md"`:

  ```tsx
  {hasSubs && (
    <div className="flex gap-1.5">
      {subs.slice(0, 3).map(sub => (
        <Avatar key={sub.id} size="md">
  ```

  **Important:** Do NOT change the `<Avatar size="sm">` inside the detail panel (`selectedSubs.map` block, around line 173). Only the one inside `hasSubs &&`.

- [ ] **Step 5: Update the overflow dot size**

  Find line 151:

  ```tsx
  <span className="h-4 w-4 rounded-lg bg-muted-foreground" />
  ```

  Change to `h-8 w-8` (matching the `size="md"` Avatar height of 32px):

  ```tsx
  <span className="h-8 w-8 rounded-lg bg-muted-foreground" />
  ```

- [ ] **Step 6: Build and verify clean**

  ```bash
  npm run build
  ```

  Expected: **zero TypeScript errors**.

- [ ] **Step 7: Verify in browser**

  On the Subscriptions page:
  - [ ] Calendar day cells are noticeably taller and more spacious
  - [ ] Day number circles are larger (34px)
  - [ ] Subscription logos/avatars in calendar cells are larger (32px)
  - [ ] Days with no subscriptions show no icons (unchanged)
  - [ ] Clicking a day still opens the detail panel below — icons in the detail panel remain small (`size="sm"`)
  - [ ] "Today" date still has the primary-colored circle
  - [ ] Month navigation (‹ ›) still works
  - [ ] If any day has >3 subscriptions, the overflow dot appears at the larger size
  - [ ] If any subscription has no logo (`icon_url` is null), the fallback letter renders correctly at the larger `size="md"` in the calendar grid

- [ ] **Step 8: Commit**

  ```bash
  git add src/components/SubscriptionCalendar.tsx
  git commit -m "feat: apply spacious sizing to subscription calendar cells and icons"
  ```
