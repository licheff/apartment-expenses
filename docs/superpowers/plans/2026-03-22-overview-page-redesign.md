# Overview Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a utility bills stat card, a subscriptions stat card, and a stacked bar spending trend chart to the Overview page, replacing the existing three subscription-only stat cards.

**Architecture:** A new `useOverviewStats` hook queries Supabase for cross-apartment `paid_by_me` expenses and exposes per-month totals and a last-month utility total. A new `SpendingTrendChart` component renders a collapsible stacked bar chart using Recharts + the project's shadcn chart primitives. `OverviewPage` is wired to call both hooks and render the new layout.

**Tech Stack:** React 19, TypeScript (strict), Supabase JS client, Recharts, shadcn/ui chart primitives (`ChartContainer`, `ChartTooltip`, `ChartLegend`), Tailwind CSS v4

**Note on testing:** This project has no test suite configured. Verification steps use `npm run build` (TypeScript type check) and manual browser inspection instead of automated tests.

---

### Task 1: `useOverviewStats` hook

**Files:**
- Create: `src/hooks/useOverviewStats.ts`

**Context:** This hook is the data backbone for the new Overview features. It queries Supabase in two or three steps depending on the current month, then derives the values the page needs.

Reference `src/hooks/useExpenses.ts` for the Supabase query pattern (import `supabase` from `@/lib/supabase`, use `useState` + `useCallback` + `useEffect`).

- [ ] **Step 1: Create the file with types and skeleton**

```ts
// src/hooks/useOverviewStats.ts
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface OverviewStats {
  lastMonthUtilities: number
  lastMonth: number        // 1–12, for building the card label in the page
  monthlyUtilityTotals: Record<number, number>  // sparse: only months with data have a key
  loading: boolean
}

export function useOverviewStats(): OverviewStats {
  const [lastMonthUtilities, setLastMonthUtilities] = useState(0)
  const [lastMonth, setLastMonth] = useState(0)
  const [monthlyUtilityTotals, setMonthlyUtilityTotals] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    // implementation goes here
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { lastMonthUtilities, lastMonth, monthlyUtilityTotals, loading }
}
```

- [ ] **Step 2: Implement `fetchStats` — date math**

Inside `fetchStats`, before any queries, compute the date values:

```ts
const now = new Date()
const currentMonth = now.getMonth() + 1   // getMonth() is 0-indexed
const currentYear = now.getFullYear()

// "last month" rule: always one calendar month back
const lMonth = currentMonth === 1 ? 12 : currentMonth - 1
const lYear = currentMonth === 1 ? currentYear - 1 : currentYear

setLastMonth(lMonth)
```

- [ ] **Step 3: Implement query 1 — fetch `paid_by_me` category IDs**

Still inside `fetchStats`, after the date math:

```ts
// Query 1: get all paid_by_me category IDs across all apartments
const { data: catData, error: catError } = await supabase
  .from('categories')
  .select('id')
  .eq('paid_by_me', true)

if (catError || !catData || catData.length === 0) {
  setLastMonthUtilities(0)
  setMonthlyUtilityTotals({})
  setLoading(false)
  return
}

const categoryIds = catData.map(c => c.id)
```

- [ ] **Step 4: Implement query 2 — fetch current year expenses**

```ts
// Query 2: all expenses for current year in paid_by_me categories
const q2Promise = supabase
  .from('expenses')
  .select('month, amount')
  .in('category_id', categoryIds)
  .eq('year', currentYear)

// Query 3 (January only): December of previous year for the stat card
const q3Promise = currentMonth === 1
  ? supabase
      .from('expenses')
      .select('amount')
      .in('category_id', categoryIds)
      .eq('year', lYear)
      .eq('month', 12)
  : Promise.resolve({ data: null, error: null })

const [q2Result, q3Result] = await Promise.all([q2Promise, q3Promise])
```

- [ ] **Step 5: Implement derivations — `monthlyUtilityTotals` and `lastMonthUtilities`**

```ts
// Build monthlyUtilityTotals from query 2
const totals: Record<number, number> = {}
for (const row of q2Result.data ?? []) {
  totals[row.month] = (totals[row.month] ?? 0) + row.amount
}
setMonthlyUtilityTotals(totals)

// Derive lastMonthUtilities
let lastUtil = 0
if (currentMonth === 1) {
  // January: use query 3 (previous December)
  for (const row of q3Result.data ?? []) {
    lastUtil += row.amount
  }
} else {
  // Months 2–12: pull from query 2 results
  lastUtil = totals[lMonth] ?? 0
}
setLastMonthUtilities(lastUtil)
```

- [ ] **Step 6: Verify the build passes**

```bash
cd ~/Documents/dev/apartment-expenses
npm run build
```

Expected: no TypeScript errors. Fix any type errors before continuing.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useOverviewStats.ts
git commit -m "feat: add useOverviewStats hook for cross-apartment utility totals"
```

---

### Task 2: `SpendingTrendChart` component

**Files:**
- Create: `src/components/SpendingTrendChart.tsx`

**Context:** Modelled after `src/components/YearComparisonChart.tsx` — read that file first. Key differences: stacked bars instead of bar+line, two data keys (`utilities` + `subscriptions`), different chart config. The `ChartContainer` wrapper is required for CSS variable color resolution.

- [ ] **Step 1: Create the file with props interface and imports**

```tsx
// src/components/SpendingTrendChart.tsx
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MONTH_NAMES_SHORT } from '@/lib/constants'

interface SpendingTrendChartProps {
  monthlyUtilityTotals: Record<number, number>  // sparse; ?? 0 applied internally
  subscriptionsPerMonth: number
}
```

- [ ] **Step 2: Define `chartConfig` and build `chartData`**

Inside the component function:

```tsx
export function SpendingTrendChart({
  monthlyUtilityTotals,
  subscriptionsPerMonth,
}: SpendingTrendChartProps) {
  const [collapsed, setCollapsed] = useState(false)
  // false = open/visible; renders {!collapsed && <content />}

  const chartConfig: ChartConfig = {
    utilities: { label: 'Комунални', color: 'var(--chart-1)' },
    subscriptions: { label: 'Абонаменти', color: 'var(--chart-2)' },
  }

  const chartData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        month: MONTH_NAMES_SHORT[i + 1],          // MONTH_NAMES_SHORT keys are 1–12
        utilities: monthlyUtilityTotals[i + 1] ?? 0,
        subscriptions: subscriptionsPerMonth,
      })),
    [monthlyUtilityTotals, subscriptionsPerMonth],
  )
```

- [ ] **Step 3: Render the collapsible card with the chart**

```tsx
  return (
    <Card className="py-0">
      <CardHeader className="px-4 pt-4 pb-2">
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => setCollapsed(c => !c)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          <CardTitle className="text-sm font-medium">Разходи по месец</CardTitle>
        </button>
      </CardHeader>
      {!collapsed && (
        <CardContent className="px-4 pb-4 overflow-hidden">
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="utilities"
                fill="var(--color-utilities)"
                stackId="spending"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="subscriptions"
                fill="var(--color-subscriptions)"
                stackId="spending"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      )}
    </Card>
  )
}
```

- [ ] **Step 4: Verify the build passes**

```bash
npm run build
```

Expected: no TypeScript errors. If Recharts complains about `radius` prop type on `Bar`, cast it: `radius={[0, 0, 0, 0] as [number, number, number, number]}`.

- [ ] **Step 5: Commit**

```bash
git add src/components/SpendingTrendChart.tsx
git commit -m "feat: add SpendingTrendChart stacked bar component"
```

---

### Task 3: Wire up `OverviewPage`

**Files:**
- Modify: `src/pages/OverviewPage.tsx`

**Context:** Read the current `src/pages/OverviewPage.tsx` in full before editing. You will:
1. Add imports for `useOverviewStats`, `SpendingTrendChart`, `Skeleton`, `MONTH_NAMES`
2. Call `useOverviewStats()` at the top (unconditionally, alongside the existing hooks)
3. Replace the 3-card subscription grid with a 2-card grid (utilities + subscriptions)
4. Add `SpendingTrendChart` below the upcoming payments section

The existing upcoming payments section and quick link to expenses are **unchanged**.

- [ ] **Step 1: Add imports**

At the top of `OverviewPage.tsx`, add:

```tsx
import { Skeleton } from '@/components/ui/skeleton'
import { SpendingTrendChart } from '@/components/SpendingTrendChart'
import { useOverviewStats } from '@/hooks/useOverviewStats'
import { MONTH_NAMES } from '@/lib/constants'
```

`formatCurrency` is already imported from `@/lib/constants` — verify it's there, add it if not.

- [ ] **Step 2: Call `useOverviewStats` at the top of the component**

Immediately after the existing `useSubscriptions` destructure, add:

```tsx
const {
  lastMonthUtilities,
  lastMonth,
  monthlyUtilityTotals,
  loading: overviewLoading,
} = useOverviewStats()
```

Rename the existing `loading` from `useSubscriptions` to `subscriptionsLoading` to avoid the name collision:

```tsx
// Before:
const { activeSubscriptions, totalPerMonth, totalPerYear, loading, update, remove } = useSubscriptions()

// After:
const { activeSubscriptions, totalPerMonth, totalPerYear, loading: subscriptionsLoading, update, remove } = useSubscriptions()
```

- [ ] **Step 3: Replace the stat cards grid**

Find the existing `{/* Subscription stats */}` comment block and replace it entirely with:

```tsx
{/* Stats */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  {overviewLoading || subscriptionsLoading ? (
    <>
      <Skeleton className="h-[80px] rounded-xl" />
      <Skeleton className="h-[80px] rounded-xl" />
    </>
  ) : (
    <>
      <Card className="py-0">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Комунални за {MONTH_NAMES[lastMonth].toLowerCase()}
          </p>
          <p className="text-2xl font-bold tabular-nums leading-tight">
            {formatCurrency(lastMonthUtilities)}
          </p>
        </CardContent>
      </Card>
      <Card className="py-0">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Абонаменти / месец</p>
          <p className="text-2xl font-bold tabular-nums leading-tight">
            {formatCurrency(totalPerMonth)}
          </p>
          <p className="text-sm text-muted-foreground">
            {activeSubscriptions.length === 1
              ? '1 активен абонамент'
              : `${activeSubscriptions.length} активни абонамента`}
          </p>
        </CardContent>
      </Card>
    </>
  )}
</div>
```

- [ ] **Step 4: Fix the upcoming payments loading check**

The upcoming payments block currently checks `loading` — update it to use `subscriptionsLoading`:

```tsx
// Before:
{loading ? (
  <Skeleton className="h-[200px] rounded-xl" />
) : upcoming.length > 0 ? (

// After:
{subscriptionsLoading ? (
  <Skeleton className="h-[200px] rounded-xl" />
) : upcoming.length > 0 ? (
```

- [ ] **Step 5: Add `SpendingTrendChart` below the upcoming payments section**

Find the closing `): null}` of the upcoming payments conditional, then insert the chart block after it and before the quick link:

```tsx
{/* Spending trend */}
{overviewLoading || subscriptionsLoading ? (
  <Skeleton className="h-[280px] rounded-xl" />
) : (
  <SpendingTrendChart
    monthlyUtilityTotals={monthlyUtilityTotals}
    subscriptionsPerMonth={totalPerMonth}
  />
)}
```

- [ ] **Step 6: Remove unused `totalPerYear` from destructure if nothing else uses it**

Check whether `totalPerYear` is used anywhere else in `OverviewPage.tsx`. If not (the per-year card was removed), remove it from the destructure to keep things clean and avoid a lint warning.

- [ ] **Step 7: Verify the build passes**

```bash
npm run build
```

Expected: no TypeScript errors. Common issues to watch for:
- `formatCurrency` not imported — add it from `@/lib/constants`
- `loading` still used somewhere — search for remaining `loading` references and update to `subscriptionsLoading`

- [ ] **Step 8: Start the dev server and verify visually**

```bash
npm run dev
```

Open `http://localhost:5173` and check:
- Two stat cards render: utility bills for last month, subscriptions per month with count
- The upcoming payments carousel is still present and working
- The spending trend chart renders below upcoming payments, collapsed/expanded correctly
- Loading skeletons appear briefly on first load
- Clicking a carousel card still opens the edit dialog

- [ ] **Step 9: Commit**

```bash
git add src/pages/OverviewPage.tsx
git commit -m "feat: redesign overview page with utility stats and spending trend chart"
```
