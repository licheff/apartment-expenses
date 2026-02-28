# skills/ui.md

**Purpose:** UI patterns for tables, badges, and responsive layout.

## Table Interactions

- Entire row is clickable: `cursor-pointer` + `onClick` on `<TableRow>`
- `ChevronRight` icon in the last column signals clickability
- Rent checkbox cell needs `onClick={e => e.stopPropagation()}` to prevent row click
- Edit/delete always happens inside a modal, never inline
- Individual expense deletion (by ID) happens inside the edit modal per category row

## Table Wrapper

Always use `<TableContainer>` from `@/components/TableContainer` instead of raw divs:

```tsx
<TableContainer>          {/* default: rounded-lg border bg-card overflow-hidden */}
<TableContainer scrollable> {/* for wide tables that need horizontal scroll */}
```

## Section Card (panel with header)

Use `<SectionCard>` from `@/components/SectionCard` for any panel with a labeled header border:

```tsx
<SectionCard title="Предстоящи плащания">
  <UpcomingPaymentsList items={items} />
</SectionCard>

{/* Pass className for grid positioning */}
<SectionCard title="..." className="sm:col-span-2">
```

## Upcoming Payments

Use `<UpcomingPaymentsList>` from `@/components/UpcomingPaymentsList`. Accepts `items: UpcomingItem[]`.
Use `<DaysBadge>` from `@/components/DaysBadge` for urgency color coding.

## Badge Conventions

**YoY comparison** (`variant="outline"` with color overrides):
```tsx
isUp   → 'border-destructive/30 bg-destructive/10 text-destructive'
isDown → 'border-green-600/30 bg-green-500/10 text-green-600 dark:text-green-500'
flat   → 'text-muted-foreground'
```
Spending up = bad (red). Spending down = good (green). Use `ArrowUpRight` / `ArrowDownRight` / `Minus` icons.

**Urgency badges (upcoming payments):** Use `<DaysBadge days={n} />` — handles all variants.

**Status/count badges:** `variant="secondary"` (e.g. rent paid count, category counts).

## Responsive Layout

- Main two-column: `grid grid-cols-1 sm:grid-cols-3`, chart takes `sm:col-span-2`
- Summary strip: `grid-cols-1 sm:grid-cols-2` (or `sm:grid-cols-3` when rent is configured)
- App is used on iOS — always verify mobile experience for new UI

## Non-`paid_by_me` Categories

Style with `italic text-muted-foreground` in tables to visually distinguish tenant-paid expenses.
