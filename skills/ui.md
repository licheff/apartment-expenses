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

Use `<UpcomingPaymentsList>` from `@/components/UpcomingPaymentsList`.

Props:
- `items: UpcomingItem[]` — sorted, pre-sliced list (OverviewPage slices to 5)
- `onSelect: (id: string) => void` — called when a card is clicked; caller handles opening the edit dialog

The component renders a horizontal **shadcn Carousel** (Embla-based) of portrait cards — `basis-1/2` on mobile, `basis-1/3` on desktop (2 cards on mobile, 3 on desktop, rest scrollable by drag). Includes `CarouselPrevious` / `CarouselNext` nav arrows positioned to overlap the card edges.

**Section pattern** — render without `SectionCard`. Use a free-floating header + carousel:

```tsx
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <h2 className="text-sm font-semibold">Предстоящи плащания</h2>
    <Link to="/subscriptions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
      покажи всички
    </Link>
  </div>
  <UpcomingPaymentsList items={upcoming} onSelect={handleCardSelect} />
</div>
```

No `overflow-visible` needed — `SectionCard` is not used here.

**Edit dialog** — `OverviewPage` manages `editOpen`/`editingSub` state and mounts `EditSubscriptionDialog` at the fragment root (same pattern as `SubscriptionsPage`). Requires `usePaymentSources()` and `useSubscriptionPriceChanges(editingSub?.id ?? null)`.

The carousel uses custom gutter spacing (`-ml-3` / `pl-3`) that differs from the shadcn default (`-ml-4` / `pl-4`). If `carousel.tsx` is ever regenerated via the shadcn CLI, re-apply these overrides in `UpcomingPaymentsList.tsx`.

## Badge Conventions

**YoY comparison** (`variant="outline"` with color overrides):
```tsx
isUp   → 'border-destructive/30 bg-destructive/10 text-destructive'
isDown → 'border-success/30 bg-success/10 text-success'
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
