# Expense Notes — Design Spec

**Issue:** #18
**Date:** 2026-03-21
**Status:** Approved

---

## Overview

Add an optional, per-expense notes field. Notes are attached to individual expense entries (category × month). They appear in the **EditExpenseDialog** only — the AddExpenseDialog is intentionally excluded to keep the fast-entry flow uncluttered.

---

## Scope

- Notes are per expense entry (`category_id + year + month` unique key)
- Notes UI lives in `EditExpenseDialog` only (not `AddExpenseDialog`)
- Notes are optional and free-form text — no length limit enforced in UI
- Display: hidden by default, revealed per-row via "Добави бележка" toggle link

---

## Database

```sql
alter table expenses add column notes text;
```

Nullable, no default. Existing rows get `null`. The `sync_bill_to_expense()` trigger (ePay.bg automation) is unaffected — it doesn't set `notes`.

---

## Type Changes (`src/types/index.ts`)

```ts
// Add to Expense:
notes: string | null

// Add to MonthRow:
expenseNotes: Record<string, string | null>  // category_id → note
```

---

## Hook Changes (`src/hooks/useExpenses.ts`)

**`monthRows` builder** — populate `expenseNotes` alongside `expenses` and `expenseIds`:

```ts
const notesMap: Record<string, string | null> = {}
for (const exp of monthExpenses) {
  expenseMap[exp.category_id] = exp.amount
  idMap[exp.category_id] = exp.id
  notesMap[exp.category_id] = exp.notes ?? null
}
// return: { ..., expenseNotes: notesMap }
```

The existing `select('*')` in `fetchExpenses` will pick up the new `notes` column automatically — no query change needed.

**`bulkUpsert`** — extend row type to accept optional `notes`:

```ts
// Current signature:
bulkUpsert(rows: { category_id: string; year: number; month: number; amount: number }[])

// New signature:
bulkUpsert(rows: { category_id: string; year: number; month: number; amount: number; notes?: string | null }[])
```

Include `notes` in the upsert payload when present. The `onConflict: 'category_id,year,month'` key is unchanged — the upsert will update `notes` alongside `amount`.

---

## EditExpenseDialog Changes (`src/components/EditExpenseDialog.tsx`)

### New state

```ts
const [notes, setNotes] = useState<Record<string, string>>({})
const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
```

### Initialisation (inside the existing `useEffect` on `monthRow`)

```ts
const initialNotes: Record<string, string> = {}
const initialExpanded: Record<string, boolean> = {}
for (const cat of categories) {
  const note = monthRow.expenseNotes?.[cat.id] ?? ''
  initialNotes[cat.id] = note
  initialExpanded[cat.id] = note.length > 0  // auto-expand rows with existing notes
}
setNotes(initialNotes)
setExpandedNotes(initialExpanded)
```

### Per-row UI

Below each category's amount input row, add:

```tsx
{expandedNotes[cat.id] ? (
  <textarea
    className="w-full text-sm resize-none rounded-md border border-input bg-transparent px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    rows={2}
    placeholder="Бележка..."
    value={notes[cat.id] ?? ''}
    onChange={e => setNotes(prev => ({ ...prev, [cat.id]: e.target.value }))}
  />
) : (
  <button
    type="button"
    className="text-xs text-muted-foreground hover:text-foreground text-left"
    onClick={() => setExpandedNotes(prev => ({ ...prev, [cat.id]: true }))}
  >
    + Добави бележка
  </button>
)}
```

Only show the toggle/textarea when `hasExpense` is true, or when the amount field has a valid positive value (`Number(val) > 0` and no unevaluated math expression). This matches the `handleSave` filter logic — notes on a row that won't be saved are not shown.

### `onSave` prop signature extension

```ts
// Current:
onSave: (entries: { categoryId: string; amount: number }[]) => Promise<void>

// New:
onSave: (entries: { categoryId: string; amount: number; notes: string | null }[]) => Promise<void>
```

Include `notes: notes[cat.id]?.trim() || null` in each entry.

---

## App.tsx Changes

**`handleEditSave`** — extend to map notes into `bulkUpsert` rows:

```ts
const handleEditSave = useCallback(
  async (entries: { categoryId: string; amount: number; notes: string | null }[]) => {
    if (editMonth === null) return
    const rows = entries.map(e => ({
      category_id: e.categoryId,
      year: selectedYear,
      month: editMonth,
      amount: e.amount,
      notes: e.notes,
    }))
    const { error } = await bulkUpsert(rows)
    // ... toast handling unchanged
  },
  [editMonth, selectedYear, bulkUpsert],
)
```

---

## Files to Change

| File | Change |
|------|--------|
| Supabase migration | `alter table expenses add column notes text` |
| `src/types/index.ts` | Add `notes` to `Expense`, add `expenseNotes` to `MonthRow` |
| `src/hooks/useExpenses.ts` | Populate `expenseNotes` in `monthRows`, extend `bulkUpsert` row type |
| `src/components/EditExpenseDialog.tsx` | Notes state, per-row toggle UI, extended `onSave` type |
| `src/App.tsx` | Extend `handleEditSave` to pass notes through `bulkUpsert` |

---

## Out of Scope

- Notes in `AddExpenseDialog`
- Notes in `createExpense` / `createBulkExpenses` (add-flow functions)
- Displaying notes in the expense table view
- Notes on `YearlyExpense` entries
- Character limit or validation
