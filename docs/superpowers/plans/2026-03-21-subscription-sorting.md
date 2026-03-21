# Subscription Table Sorting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add clickable column-header sorting (Name, Amount, Billing cycle, Next payment) to the subscriptions table, defaulting to soonest next payment first.

**Architecture:** All sort state lives inside the `SubscriptionTable` component in `SubscriptionsPage.tsx` — no props changes needed. Sort is computed client-side from the already-loaded `subscriptions` array. A small `SortableHead` helper component handles the clickable header + icon UI.

**Tech Stack:** React 19, TypeScript (strict), Tailwind CSS v4, lucide-react, existing helpers `nextPaymentDate` / `parseLocalDate` from `@/lib/subscriptions`

**Spec:** `docs/superpowers/specs/2026-03-21-subscription-sorting-design.md`

> **Note:** This project has no test suite. Verification steps use the dev server (`npm run dev`) instead of automated tests. After each task, do a quick visual check in the browser before committing.

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `src/pages/SubscriptionsPage.tsx` | Modify | Add `SortKey`/`SortDir` types, `sortSubscriptions` helper, `SortableHead` component, sort state + sorted rows inside `SubscriptionTable` |

No other files need to change. No DB changes.

---

### Task 1: Add sort types and sort logic

**Files:**
- Modify: `src/pages/SubscriptionsPage.tsx`

- [ ] **Step 1: Add the lucide-react sort icons to the import**

  In `src/pages/SubscriptionsPage.tsx`, find the lucide-react import line (currently `ChevronRight, CreditCard, Plus`) and add the three sort icons:

  ```ts
  import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, CreditCard, Plus } from 'lucide-react'
  ```

- [ ] **Step 2: Add `BillingCycle` to the types import**

  The current import from `@/types` is:
  ```ts
  import type { CreateSubscriptionInput, Subscription } from '@/types'
  ```

  Add `BillingCycle`:
  ```ts
  import type { BillingCycle, CreateSubscriptionInput, Subscription } from '@/types'
  ```

- [ ] **Step 3: Add sort types and the billing cycle order map**

  Add this block immediately after the existing imports, before the `// ─── Helpers ───` section:

  ```ts
  // ─── Sorting ──────────────────────────────────────────────────────────────────

  type SortKey = 'name' | 'amount' | 'billing_cycle' | 'next_payment'
  type SortDir = 'asc' | 'desc'

  const CYCLE_ORDER: Record<BillingCycle, number> = {
    weekly: 1,
    monthly: 2,
    quarterly: 3,
    bi_annual: 4,
    yearly: 5,
    biennial: 6,
    triennial: 7,
  }
  ```

- [ ] **Step 4: Add the `sortSubscriptions` helper function**

  Add this function in the same `// ─── Sorting ───` section, below the types:

  ```ts
  function sortSubscriptions(subs: Subscription[], key: SortKey, dir: SortDir): Subscription[] {
    if (key === 'next_payment') {
      const withDates = subs.map(s => ({
        sub: s,
        next: nextPaymentDate(parseLocalDate(s.start_date), s.billing_cycle),
      }))
      withDates.sort((a, b) => a.next.getTime() - b.next.getTime())
      const result = withDates.map(({ sub }) => sub)
      return dir === 'desc' ? result.reverse() : result
    }

    const sorted = [...subs]
    sorted.sort((a, b) => {
      let cmp = 0
      if (key === 'name') {
        cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      } else if (key === 'amount') {
        cmp = a.amount - b.amount
      } else if (key === 'billing_cycle') {
        cmp = CYCLE_ORDER[a.billing_cycle] - CYCLE_ORDER[b.billing_cycle]
      }
      return dir === 'desc' ? -cmp : cmp
    })
    return sorted
  }
  ```

- [ ] **Step 5: Verify TypeScript compiles cleanly**

  ```bash
  npm run build
  ```

  Expected: no type errors.

- [ ] **Step 6: Commit**

  ```bash
  git add src/pages/SubscriptionsPage.tsx
  git commit -m "feat: add sort types and sortSubscriptions helper (#21)"
  ```

---

### Task 2: Add the `SortableHead` component

**Files:**
- Modify: `src/pages/SubscriptionsPage.tsx`

- [ ] **Step 1: Add `SortableHead` component**

  Add this component in the `// ─── Sorting ───` section, after `sortSubscriptions`:

  ```tsx
  function SortableHead({
    label,
    sortKey,
    activeSortKey,
    sortDir,
    onSort,
    className,
  }: {
    label: string
    sortKey: SortKey
    activeSortKey: SortKey
    sortDir: SortDir
    onSort: (key: SortKey) => void
    className?: string
  }) {
    const isActive = sortKey === activeSortKey
    return (
      <TableHead
        className={cn('cursor-pointer select-none group', className)}
        onClick={() => onSort(sortKey)}
      >
        <div className="flex items-center gap-1">
          {label}
          {isActive ? (
            sortDir === 'asc'
              ? <ArrowUp className="h-4 w-4 text-foreground" />
              : <ArrowDown className="h-4 w-4 text-foreground" />
          ) : (
            <ArrowUpDown className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </TableHead>
    )
  }
  ```

  **Why `group` on `TableHead`:** Tailwind's `group-hover:` utility applies a style when the element with `group` is hovered. Putting `group` on the `<TableHead>` and `group-hover:opacity-100` on the icon gives a smooth hover reveal without any JS hover state.

  **Active icon color:** `text-foreground` uses the primary text color, which is visually distinct from the `text-muted-foreground` used on inactive header text. This achieves the "accent" intent from the spec — the active column stands out — without introducing a brand/accent color token that may not suit the existing design.

- [ ] **Step 2: Verify TypeScript compiles cleanly**

  ```bash
  npm run build
  ```

  Expected: no errors. `TableHead`, `cn`, `SortKey`, `SortDir`, `ArrowUp`, `ArrowDown`, `ArrowUpDown` must all be in scope.

- [ ] **Step 3: Commit**

  ```bash
  git add src/pages/SubscriptionsPage.tsx
  git commit -m "feat: add SortableHead component (#21)"
  ```

---

### Task 3: Wire sort state and sorted rows into `SubscriptionTable`

**Files:**
- Modify: `src/pages/SubscriptionsPage.tsx` — the `SubscriptionTable` component (lines ~47–116)

- [ ] **Step 1: Add sort state and sorted rows to `SubscriptionTable`**

  At the top of the `SubscriptionTable` function body, before the empty-state check, add:

  ```ts
  const [sortKey, setSortKey] = useState<SortKey>('next_payment')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const sorted = sortSubscriptions(subscriptions, sortKey, sortDir)

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }
  ```

  `useState` is already imported at the top of the file.

- [ ] **Step 2: Replace static `<TableHead>` elements with `<SortableHead>`**

  Find the `<TableHeader>` block inside `SubscriptionTable`. It currently has these static heads:

  ```tsx
  <TableHead className="w-12" />
  <TableHead>Наименование</TableHead>
  <TableHead>Сума</TableHead>
  <TableHead className="hidden sm:table-cell">Периодичност</TableHead>
  <TableHead className="hidden sm:table-cell">Следващо плащане</TableHead>
  <TableHead className="hidden sm:table-cell">Начин на плащане</TableHead>
  <TableHead className="w-10" />
  ```

  Replace with:

  ```tsx
  <TableHead className="w-12" />
  <SortableHead
    label="Наименование"
    sortKey="name"
    activeSortKey={sortKey}
    sortDir={sortDir}
    onSort={handleSort}
  />
  <SortableHead
    label="Сума"
    sortKey="amount"
    activeSortKey={sortKey}
    sortDir={sortDir}
    onSort={handleSort}
  />
  <SortableHead
    label="Периодичност"
    sortKey="billing_cycle"
    activeSortKey={sortKey}
    sortDir={sortDir}
    onSort={handleSort}
    className="hidden sm:table-cell"
  />
  <SortableHead
    label="Следващо плащане"
    sortKey="next_payment"
    activeSortKey={sortKey}
    sortDir={sortDir}
    onSort={handleSort}
    className="hidden sm:table-cell"
  />
  <TableHead className="hidden sm:table-cell">Начин на плащане</TableHead>
  <TableHead className="w-10" />
  ```

  Payment source remains a static, non-sortable header.

- [ ] **Step 3: Replace `subscriptions.map(...)` with `sorted.map(...)` in the table body**

  Find the `<TableBody>` block. The map currently starts with:

  ```tsx
  {subscriptions.map(sub => {
  ```

  Change it to:

  ```tsx
  {sorted.map(sub => {
  ```

  Everything else inside the map stays identical.

- [ ] **Step 4: Build and verify no type errors**

  ```bash
  npm run build
  ```

  Expected: clean build, no TypeScript errors.

- [ ] **Step 5: Start dev server and verify in browser**

  ```bash
  npm run dev
  ```

  Open the Subscriptions page and check:
  - [ ] Table loads sorted by next payment (soonest first) by default
  - [ ] Clicking "Наименование" header sorts A→Z; clicking again reverses to Z→A
  - [ ] Clicking "Сума" sorts lowest→highest; clicking again reverses
  - [ ] Clicking "Периодичност" sorts weekly→triennial; clicking again reverses (desktop only — column is hidden on mobile)
  - [ ] Clicking "Следващо плащане" sorts soonest→latest; clicking again reverses (desktop only)
  - [ ] "Начин на плащане" header is not clickable and has no sort icon
  - [ ] Active sort column shows ↑ or ↓; inactive columns show faint ↕ that brightens on hover
  - [ ] Switching between Active/Inactive tabs: each tab maintains its own sort state independently
  - [ ] Empty state (if inactive tab has 0 subscriptions) renders without errors

- [ ] **Step 6: Commit**

  ```bash
  git add src/pages/SubscriptionsPage.tsx
  git commit -m "feat: add sortable column headers to subscriptions table (#21)"
  ```
