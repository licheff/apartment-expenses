# skills/ui.md

**Purpose:** UI patterns for tables, badges, and responsive layout.

## Table Interactions

- Entire row is clickable: `cursor-pointer` + `onClick` on `<TableRow>`
- `ChevronRight` icon in the last column signals clickability
- Rent checkbox cell needs `onClick={e => e.stopPropagation()}` to prevent row click
- Edit/delete always happens inside a modal, never inline
- Individual expense deletion (by ID) happens inside the edit modal per category row

## Badge Conventions

**YoY comparison** (`variant="outline"` with color overrides):
```tsx
isUp   → 'border-destructive/30 bg-destructive/10 text-destructive'
isDown → 'border-green-600/30 bg-green-500/10 text-green-600 dark:text-green-500'
flat   → 'text-muted-foreground'
```
Spending up = bad (red). Spending down = good (green). Use `ArrowUpRight` / `ArrowDownRight` / `Minus` icons.

**Status/count badges:** `variant="secondary"` (e.g. rent paid count, category counts).

## Responsive Layout

- Main two-column: `grid grid-cols-1 sm:grid-cols-3`, chart takes `sm:col-span-2`
- Summary strip: `grid-cols-1 sm:grid-cols-2` (or `sm:grid-cols-3` when rent is configured)
- App is used on iOS — always verify mobile experience for new UI

## Non-`paid_by_me` Categories

Style with `italic text-muted-foreground` in tables to visually distinguish tenant-paid expenses.
