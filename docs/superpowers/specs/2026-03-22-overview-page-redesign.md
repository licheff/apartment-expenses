# Overview Page Redesign

**Date:** 2026-03-22
**Status:** Approved

## Goal

Enrich the Overview page with utility bill tracking and a combined spending trend chart, so it surfaces both expense and subscription data at a glance — without changing the Expenses or Subscriptions pages.

---

## Data Layer

### New hook: `useOverviewStats`

Located at `src/hooks/useOverviewStats.ts`.

**Queries:**
1. Fetch all categories where `paid_by_me = true` — returns their IDs across all apartments.
2. Fetch all expenses for the current calendar year where `category_id` is in those IDs.

**Returns:**
```ts
{
  lastMonthUtilities: number        // sum of paid_by_me expenses for currentMonth - 1
  monthlyUtilityTotals: Record<number, number>  // month (1–12) → total
  loading: boolean
}
```

**"Last month" rule:** always `currentMonth - 1` (calendar month, not last month with data). If today is March, shows February's total. The rationale: current month is unlikely to have all bills entered yet.

**Existing data (no changes needed):**
- `useSubscriptions` already in `OverviewPage` provides `totalPerMonth`, `activeSubscriptions.length`
- These are used for the subscription stat card and the chart's subscription segment

---

## Components

### 1. Stat Cards

Replaces the current three-card row (per month / per year / active count) with two cards:

| Card | Label | Value | Secondary |
|------|-------|-------|-----------|
| Utility bills | "Комунални за [month name]" (Bulgarian, lowercase) | `lastMonthUtilities` formatted as EUR | — |
| Subscriptions | "Абонаменти / месец" | `totalPerMonth` formatted as EUR | "[n] активни абонамента" in `text-muted-foreground` |

Grid: `grid-cols-1 sm:grid-cols-2 gap-4` (was 3 columns).

The per-year card is removed — it's available on the Expenses page.

### 2. New component: `SpendingTrendChart`

Located at `src/components/SpendingTrendChart.tsx`.

**Chart type:** Recharts `BarChart` with two stacked `Bar` segments per month.

**Data shape per month entry:**
```ts
{ month: string, utilities: number, subscriptions: number }
```
- `utilities` — from `monthlyUtilityTotals[m] ?? 0`
- `subscriptions` — `totalPerMonth` (flat, same value for all 12 months)

**Segments:**
- Bottom: utilities — `var(--chart-1)`
- Top: subscriptions — `var(--chart-2)`
Both bars share `stackId="spending"`.

**Axes:**
- X: Bulgarian short month names (`MONTH_NAMES_SHORT` from `@/lib/constants`)
- Y: numeric, no unit label (amounts implied as EUR)

**Tooltip/Legend:** Uses `ChartTooltip` + `ChartTooltipContent` + `ChartLegend` + `ChartLegendContent` from `@/components/ui/chart` — identical pattern to `YearComparisonChart`.

**ChartConfig labels:**
- `utilities`: "Комунални"
- `subscriptions`: "Абонаменти"

**Collapsible:** Yes — same collapsible header pattern as `YearComparisonChart` (chevron button, collapsed state).

**Props:**
```ts
interface SpendingTrendChartProps {
  monthlyUtilityTotals: Record<number, number>
  subscriptionsPerMonth: number
}
```

---

## Page Layout

`OverviewPage.tsx` — top to bottom:

1. **Stat cards** — 2-column grid (utility bills | subscriptions)
2. **Upcoming payments** — carousel, unchanged
3. **SpendingTrendChart** — full width
4. **Quick link to Expenses** — unchanged

Loading states: skeleton placeholders for stat cards and chart (same pattern as current).

---

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useOverviewStats.ts` | **New** — cross-apartment utility stats hook |
| `src/components/SpendingTrendChart.tsx` | **New** — stacked bar chart component |
| `src/pages/OverviewPage.tsx` | **Modified** — wire new hook + component, restructure stat cards |

No database changes. No new dependencies.
