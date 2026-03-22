# Overview Page Redesign

**Date:** 2026-03-22
**Status:** Approved

## Goal

Enrich the Overview page with utility bill tracking and a combined spending trend chart, so it surfaces both expense and subscription data at a glance — without changing the Expenses or Subscriptions pages.

---

## Data Layer

### New hook: `useOverviewStats`

Located at `src/hooks/useOverviewStats.ts`.

**Year anchor:** Derived internally via `new Date()`. No year parameter. Always uses current calendar year.

**"Last month" rule:** `lastMonth = currentMonth - 1`. If `currentMonth === 1`, `lastMonth = 12` and `lastYear = currentYear - 1`. Otherwise `lastYear = currentYear`.

**Data model note:** `paid_by_me` is a field on each row in the `categories` table. Each category belongs to exactly one apartment. Querying categories where `paid_by_me = true` globally yields a flat list of unique IDs with no double-counting risk.

**Queries:**
1. Fetch all categories where `paid_by_me = true` (no apartment filter). Returns their IDs. Must complete before queries 2 and 3.
2. Fetch all expenses for `currentYear` where `category_id` is in those IDs (no apartment filter). Always runs, including in January. Used to build `monthlyUtilityTotals`.
3. Only if `currentMonth === 1`: fetch expenses for `lastYear` where `category_id` is in those IDs and `month = 12`. Used exclusively to compute `lastMonthUtilities`. Queries 2 and 3 may run in parallel via `Promise.all` in January.

**`monthlyUtilityTotals` derivation (from query 2):**
Group results by `expense.month`. For each month, sum all `expense.amount` values. Months with no expenses are absent from the record (sparse).

**`lastMonthUtilities` derivation:**
- Months 2–12: filter query 2 results to `expense.month === lastMonth`, sum amounts.
- January: sum query 3 results' amounts.

**Returns:**
```ts
{
  lastMonthUtilities: number                    // raw EUR number, 0 on error or no data
  lastMonth: number                             // 1–12; used by OverviewPage to build the card label
  monthlyUtilityTotals: Record<number, number>  // sparse — only months with ≥1 expense have a key
  loading: boolean
}
```

**Error handling:** Any Supabase failure → fall back to 0 / empty record. No UI error state.

---

## Components

### 1. Stat Cards

Both hooks — `useOverviewStats` and `useSubscriptions` — called unconditionally at the top of `OverviewPage`.

Grid wrapper `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">` is always rendered. Both cards wait for both hooks: while `overviewLoading || subscriptionsLoading`, both card slots show skeletons. Neither card renders until both hooks have resolved.

**Loading state:** Two `<Skeleton className="h-[80px] rounded-xl" />` (from `@/components/ui/skeleton`) inside the grid.

**Card 1 — Utility bills:**
- Label: `"Комунални за " + MONTH_NAMES[lastMonth].toLowerCase()` where `lastMonth` comes from `useOverviewStats`
  - January: `lastMonth = 12` → "Комунални за декември" — correct and intentional
  - March: `lastMonth = 2` → "Комунални за февруари"
- Value: `formatCurrency(lastMonthUtilities)` (from `@/lib/constants`)

**Card 2 — Subscriptions:**
- Label: "Абонаменти / месец"
- Value: `formatCurrency(totalPerMonth)` where `totalPerMonth` is the raw `number` from `useSubscriptions`
- Secondary line (`text-sm text-muted-foreground`):
  - `n === 1` → "1 активен абонамент"
  - all other counts including 0 → `"{n} активни абонамента"` — intentional; "0 активни абонамента" is correct Bulgarian

The per-year card is removed.

### 2. New component: `SpendingTrendChart`

Located at `src/components/SpendingTrendChart.tsx`.

**Props:**
```ts
interface SpendingTrendChartProps {
  monthlyUtilityTotals: Record<number, number>  // sparse; chart defaults missing keys to 0 internally
  subscriptionsPerMonth: number                  // raw EUR number, same value for all 12 months
}
```

**Known limitation:** `subscriptionsPerMonth` is a flat constant across all 12 months. Historical per-month accuracy is out of scope.

**Chart type:** Recharts `BarChart` wrapped in `ChartContainer` from `@/components/ui/chart`. Required — resolves `var(--color-utilities)` and `var(--color-subscriptions)`.

**Data shape (via `useMemo`):**
```ts
Array.from({ length: 12 }, (_, i) => ({
  month: MONTH_NAMES_SHORT[i + 1],
  utilities: monthlyUtilityTotals[i + 1] ?? 0,   // ?? 0 handles sparse record
  subscriptions: subscriptionsPerMonth,
}))
```

`OverviewPage` passes `monthlyUtilityTotals` directly — no normalization needed at the page level.

**Segments:**
- Bottom: `dataKey="utilities"`, `fill="var(--color-utilities)"`, `stackId="spending"`, `radius={[0, 0, 0, 0]}`
- Top: `dataKey="subscriptions"`, `fill="var(--color-subscriptions)"`, `stackId="spending"`, `radius={[3, 3, 0, 0]}`

**Radius edge case:** If `subscriptionsPerMonth === 0`, utilities render with flat top corners (`radius={[0,0,0,0]}`). Acceptable — no dynamic radius logic.

**ChartConfig:**
```ts
const chartConfig: ChartConfig = {
  utilities: { label: 'Комунални', color: 'var(--chart-1)' },
  subscriptions: { label: 'Абонаменти', color: 'var(--chart-2)' },
}
```

**Axes:**
- X: `dataKey="month"`, `tickLine={false}`, `axisLine={false}`
- Y: `tickLine={false}`, `axisLine={false}`, no tick formatter (raw numbers — intentional, matches `YearComparisonChart`)

**Tooltip/Legend:** `ChartTooltip` + `ChartTooltipContent` + `ChartLegend` + `ChartLegendContent` from `@/components/ui/chart`.

**Collapsible:**
```tsx
const [collapsed, setCollapsed] = useState(false)
// false = open/visible
// render: {!collapsed && <CardContent>...</CardContent>}
```
Same pattern as `YearComparisonChart`. Chevron button in header. Title: "Разходи по месец".

**Chart height:** `h-[280px]` on `ChartContainer`.

**Zero state:** No empty message. All-zero bars are acceptable.

---

## Page Layout

Both hooks called unconditionally at top of `OverviewPage`.

Top to bottom:

1. **Stat cards** — grid always rendered; skeletons while `overviewLoading || subscriptionsLoading`.
2. **Upcoming payments** — unchanged.
3. **SpendingTrendChart** — skeleton while `overviewLoading || subscriptionsLoading`; then:
   ```tsx
   <SpendingTrendChart
     monthlyUtilityTotals={monthlyUtilityTotals}
     subscriptionsPerMonth={totalPerMonth}  // totalPerMonth from useSubscriptions passed directly
   />
   ```
4. **Quick link to Expenses** — unchanged, always visible.

---

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useOverviewStats.ts` | **New** |
| `src/components/SpendingTrendChart.tsx` | **New** |
| `src/pages/OverviewPage.tsx` | **Modified** |

No database changes. No new dependencies.
