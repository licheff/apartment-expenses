# Settings Page Tweaks Design

**Date:** 2026-03-28
**Status:** Approved

## Summary

Two UI improvements to `SettingsPage`:
1. Two-column layout — Locations left, Payment Methods right, Logout below
2. Rent amount via the standard amount dialog (same as yearly expenses), displayed as a labeled row once set

---

## Tweak 1: Two-Column Layout

**File:** `src/pages/SettingsPage.tsx`

Change `<main>` max-width from `max-w-[600px]` to `max-w-[1000px]` — consistent with `OverviewPage`, `SubscriptionsPage`, and the expenses view.

Inside `<main>`, wrap the two sections in a CSS grid:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
  {/* Left: Locations */}
  <section>...</section>

  {/* Right: Payment Methods */}
  <section>...</section>
</div>
```

On desktop (`sm:` and above): two equal columns side by side.
On mobile: stacks vertically (single column).

The Logout section sits **below** the grid, outside of it, full-width or left-aligned.

---

## Tweak 2: Rent Amount via Dialog

**File:** `src/pages/SettingsPage.tsx`

### Removing the old rent UI

Inside each apartment's `<TabsContent>`, remove:
- The `<Separator />` before rent
- The rent `<Label>`, `<Input>`, "Запази" button, and "Премахни наема" button
- The `rentInputs` state and `getRentInput` / `handleSaveRent` helpers

### New rent UI (inside TabsContent, below the add-category row)

**When `apt.rent_amount` is null:** Show a ghost "Добави наем" button:
```tsx
<Button variant="ghost" size="sm" onClick={() => openRentDialog(apt.id)}>
  <Plus className="h-4 w-4 mr-1" />
  Добави наем
</Button>
```

**When `apt.rent_amount` is set:** Show a labeled row (not interactive/clickable) with a delete icon:
```tsx
<div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2.5">
  <span className="text-sm">Наем</span>
  <div className="flex items-center gap-3">
    <span className="text-sm tabular-nums">{formatCurrency(apt.rent_amount)}</span>
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-destructive hover:text-destructive"
      onClick={() => updateRentAmount(apt.id, null)}
      title="Премахни наема"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  </div>
</div>
```

The "Добави наем" button is hidden when rent is set (these two states are mutually exclusive).

### Rent dialog state

Two new state variables in `SettingsPage`:
```tsx
const [rentDialogAptId, setRentDialogAptId] = useState<string | null>(null)
```

Helper:
```tsx
const openRentDialog = (aptId: string) => setRentDialogAptId(aptId)
const closeRentDialog = () => setRentDialogAptId(null)
```

The dialog is open when `rentDialogAptId !== null`.

### RentDialog component

A small local component (defined in `SettingsPage.tsx` above `SettingsPage`) that reuses the same amount input pattern as `YearlyExpensesSection`:

```tsx
interface RentDialogProps {
  open: boolean
  onClose: () => void
  onSave: (amount: number) => Promise<void>
}
```

Internal state: `amount`, `currency`, animation state (same refs and effects as `YearlyExpensesSection`).

Key differences from the yearly expense dialog:
- **No name input** — rent has no label to enter
- **Title:** "Месечен наем"
- **Footer:** Cancel + Save (no Delete button — deletion is handled by the row's trash icon)
- **On save:** converts BGN→EUR if needed, calls `onSave(eur)`, closes dialog

The `onSave` in `SettingsPage`:
```tsx
const handleSaveRent = async (amount: number) => {
  if (!rentDialogAptId) return
  await updateRentAmount(rentDialogAptId, amount)
  closeRentDialog()
}
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/SettingsPage.tsx` | Two-column layout, new rent UI with dialog |

No other files changed. `formatCurrency` is already imported in this file via `@/lib/constants`.

> Note: `formatCurrency` will need to be added to the imports in `SettingsPage.tsx` since it's not currently imported there.
