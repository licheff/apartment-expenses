# Upcoming Payments Carousel — Design Spec

**Date:** 2026-03-21
**Status:** Approved

---

## Overview

Replace the vertical list in `UpcomingPaymentsList` with a horizontally scrollable shadcn Carousel. Each upcoming payment becomes a portrait-layout card. The component's public interface (props, exported types) stays identical — `OverviewPage` requires no changes.

---

## Scope

- Rewrite `src/components/UpcomingPaymentsList.tsx` — internal implementation only
- Add `src/components/ui/carousel.tsx` via `npx shadcn@latest add carousel` (also installs `embla-carousel-react`)
- `OverviewPage` is unchanged — it already slices to 5 items and passes the same `UpcomingItem[]` prop

---

## Out of Scope

- `OverviewPage.tsx` — no changes (it already guards `upcoming.length > 0` before rendering, so empty state is handled upstream)
- Any other file in the project
- Prev/next navigation arrows (swipe/drag only)
- Autoplay or looping

---

## Component Design

### Props & Types

The exported `UpcomingItem` interface and `UpcomingPaymentsListProps` are unchanged:

```ts
export interface UpcomingItem {
  id: string
  name: string
  days: number
  next: Date
  amount: number
  icon_url: string | null
}

interface UpcomingPaymentsListProps {
  items: UpcomingItem[]
}
```

### Structure

```tsx
<Carousel opts={{ align: 'start', dragFree: true }}>
  <CarouselContent className="-ml-3">
    {items.map(item => (
      <CarouselItem key={item.id} className="pl-3 basis-1/2 sm:basis-1/3">
        <card />
      </CarouselItem>
    ))}
  </CarouselContent>
</Carousel>
```

No `<CarouselPrevious />` or `<CarouselNext />` — navigation is swipe/drag only.

### Card Layout (Portrait)

Each card is a `<div className="border rounded-lg p-3 flex flex-col items-center gap-2 min-h-[140px]">`. Contents top to bottom:

1. **Avatar** — `size="md"`, icon (`<AvatarImage src={icon_url} />`) or fallback (`name[0]?.toUpperCase()`)
2. **Name** — `text-sm font-medium text-center truncate w-full`
3. **Date** — `text-xs text-muted-foreground text-center`, formatted with `next.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' })`
4. **Footer row** — `flex flex-row items-center justify-center gap-2 mt-auto`: amount as `<span className="text-sm tabular-nums">{formatCurrency(amount)}</span>` (outputs e.g. `"12.99 €"`) and `<DaysBadge days={days} />`

`min-h-[140px]` ensures uniform card heights across all items. `mt-auto` on the footer pins it to the bottom so name/date variance doesn't shift the amount row.

### Carousel Options

```ts
opts={{ align: 'start', dragFree: true }}
```

- `align: 'start'` — first card aligns to the left edge
- `dragFree: true` — free drag (no snap points), feels more natural for a small 5-item set. On desktop/mouse this can feel loose but is acceptable given the small item count — no snapping variant is needed.

### Peer Dependency

`embla-carousel-react` (installed by `shadcn add carousel`) declares `react: "^16.8.0 || ^17.0.1 || ^18.0.0 || ^19.0.0"` — fully compatible with this project's React 19.

### Overflow Clipping

`SectionCard` applies `overflow-hidden` unconditionally, which will clip the partial-peek card on the right edge. Fix this by passing `className="overflow-visible"` to the `<SectionCard>` wrapping the carousel in `OverviewPage`:

```tsx
<SectionCard title="Предстоящи плащания" className="overflow-visible">
  <UpcomingPaymentsList items={upcoming} />
</SectionCard>
```

This is a non-breaking change — `cn()` in `SectionCard` merges classNames and `overflow-visible` overrides `overflow-hidden` in Tailwind. No other uses of `SectionCard` are affected.

This makes `OverviewPage` a required file change.

### Spacing

- `CarouselContent` gets `-ml-3` to offset the per-item left padding
- Each `CarouselItem` gets `pl-3` for the gap between cards

### Sizing

| Breakpoint | `basis` | Cards visible |
|------------|---------|---------------|
| Mobile (`<sm`) | `basis-1/2` | ~2 |
| Desktop (`sm:`) | `sm:basis-1/3` | ~3 |

The partial peek of the next card signals that the list is scrollable.

---

## Imports

```ts
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DaysBadge } from '@/components/DaysBadge'
import { formatCurrency } from '@/lib/constants'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
```

---

## Files Changed

| File | Action |
|------|--------|
| `src/components/ui/carousel.tsx` | Add (via `npx shadcn@latest add carousel`) |
| `src/components/UpcomingPaymentsList.tsx` | Rewrite internals, keep exported interface |
| `src/pages/OverviewPage.tsx` | Add `className="overflow-visible"` to the upcoming payments `SectionCard` |
