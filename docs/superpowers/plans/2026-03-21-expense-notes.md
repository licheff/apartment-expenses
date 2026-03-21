# Expense Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional per-expense notes field, editable in the EditExpenseDialog via a collapsible per-row textarea.

**Architecture:** Notes are stored in a new nullable `notes text` column on the `expenses` table. The field flows through the type layer (`Expense`, `MonthRow`), the hook (`useExpenses`), the dialog (`EditExpenseDialog`), and the save handler in `App.tsx`. No new files are created — all changes are additive to existing files.

**Tech Stack:** React 19, TypeScript (strict), Tailwind CSS v4, Supabase

**Spec:** `docs/superpowers/specs/2026-03-21-expense-notes-design.md`

> **Note:** No test suite exists. Verification is manual via `npm run dev` in the browser.

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `supabase/migrations/00008_expense_notes.sql` | Create | Add `notes text` column to `expenses` |
| `src/types/index.ts` | Modify | Add `notes` to `Expense`, add `expenseNotes` to `MonthRow` |
| `src/hooks/useExpenses.ts` | Modify | Populate `expenseNotes` in `monthRows`, extend `bulkUpsert` row type |
| `src/components/EditExpenseDialog.tsx` | Modify | Notes state, per-row toggle UI, extended `onSave` prop type |
| `src/App.tsx` | Modify | Extend `handleEditSave` to pass `notes` through to `bulkUpsert` |

---

### Task 1: Database migration and type definitions

This task is a prerequisite for everything else. The migration must be applied to Supabase before the app can read/write notes.

**Files:**
- Create: `supabase/migrations/00008_expense_notes.sql`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Create the migration file**

  Create `supabase/migrations/00008_expense_notes.sql` with this content:

  ```sql
  -- Add optional notes field to expense entries
  alter table expenses add column notes text;
  ```

- [ ] **Step 2: Apply the migration in Supabase**

  Run this SQL in the Supabase dashboard SQL editor (go to your project → SQL Editor → paste and run):

  ```sql
  alter table expenses add column notes text;
  ```

  Verify: open the Supabase Table Editor, select the `expenses` table, confirm a `notes` column of type `text` now appears (nullable, no default).

- [ ] **Step 3: Add `notes` to the `Expense` type**

  In `src/types/index.ts`, find the `Expense` interface (currently ends at `updated_at`):

  ```ts
  export interface Expense {
    id: string
    category_id: string
    year: number
    month: number
    amount: number
    created_at: string
    updated_at: string
  }
  ```

  Add `notes`:

  ```ts
  export interface Expense {
    id: string
    category_id: string
    year: number
    month: number
    amount: number
    notes: string | null
    created_at: string
    updated_at: string
  }
  ```

- [ ] **Step 4: Add `expenseNotes` to the `MonthRow` type**

  In `src/types/index.ts`, find the `MonthRow` interface:

  ```ts
  export interface MonthRow {
    month: number
    monthName: string
    expenses: Record<string, number> // category_id -> amount
    expenseIds: Record<string, string> // category_id -> expense id
    total: number
  }
  ```

  Add `expenseNotes`:

  ```ts
  export interface MonthRow {
    month: number
    monthName: string
    expenses: Record<string, number>   // category_id -> amount
    expenseIds: Record<string, string> // category_id -> expense id
    expenseNotes: Record<string, string | null> // category_id -> note
    total: number
  }
  ```

- [ ] **Step 5: Verify TypeScript compiles cleanly**

  ```bash
  cd "/Users/licheff/Documents/Dev Projects/apartment-expenses" && npm run build
  ```

  Expected: TypeScript errors for callers of `MonthRow` that don't yet include `expenseNotes` — that's fine at this stage. What should NOT appear: parse errors or unexpected failures.

- [ ] **Step 6: Commit**

  ```bash
  git add supabase/migrations/00008_expense_notes.sql src/types/index.ts
  git commit -m "feat: add notes column to expenses table and type definitions (#18)"
  ```

---

### Task 2: Update `useExpenses` hook

Populate `expenseNotes` in `monthRows` and extend `bulkUpsert` to accept notes.

**Files:**
- Modify: `src/hooks/useExpenses.ts`

- [ ] **Step 1: Populate `expenseNotes` in the `monthRows` builder**

  In `src/hooks/useExpenses.ts`, find the `monthRows` builder block (around line 116). It currently builds `expenseMap` and `idMap`:

  ```ts
  const expenseMap: Record<string, number> = {}
  const idMap: Record<string, string> = {}

  for (const exp of monthExpenses) {
    expenseMap[exp.category_id] = exp.amount
    idMap[exp.category_id] = exp.id
  }
  ```

  Add `notesMap`:

  ```ts
  const expenseMap: Record<string, number> = {}
  const idMap: Record<string, string> = {}
  const notesMap: Record<string, string | null> = {}

  for (const exp of monthExpenses) {
    expenseMap[exp.category_id] = exp.amount
    idMap[exp.category_id] = exp.id
    notesMap[exp.category_id] = exp.notes ?? null
  }
  ```

  Then in the returned object for each `MonthRow`, add `expenseNotes: notesMap`:

  ```ts
  return {
    month,
    monthName: MONTH_NAMES[month],
    expenses: expenseMap,
    expenseIds: idMap,
    expenseNotes: notesMap,
    total,
  }
  ```

- [ ] **Step 2: Extend `bulkUpsert` to accept optional `notes`**

  Find the `bulkUpsert` function (around line 103). Its current row type is `{ category_id: string; year: number; month: number; amount: number }[]`.

  Change the signature and payload mapping:

  ```ts
  const bulkUpsert = async (
    rows: { category_id: string; year: number; month: number; amount: number; notes?: string | null }[],
  ) => {
    const withTimestamp = rows.map(r => ({ ...r, updated_at: new Date().toISOString() }))
    const { error } = await supabase
      .from('expenses')
      .upsert(withTimestamp, { onConflict: 'category_id,year,month' })

    if (!error) {
      await fetchExpenses()
    }
    return { error }
  }
  ```

  The spread `...r` already includes `notes` if present — no extra mapping needed.

  Note: `select('*')` in `fetchExpenses` already returns `notes` automatically now that the column exists — no query change needed.

- [ ] **Step 3: Build and confirm no unexpected errors**

  ```bash
  npm run build
  ```

  Expected: TypeScript may still flag `EditExpenseDialog` and `App.tsx` because their signatures haven't been updated yet — that's fine. No errors in the hook itself.

- [ ] **Step 4: Commit**

  ```bash
  git add src/hooks/useExpenses.ts
  git commit -m "feat: populate expenseNotes in monthRows and extend bulkUpsert (#18)"
  ```

---

### Task 3: Update `EditExpenseDialog` with notes UI

Add notes state and a per-row collapsible textarea. This is the core UI change.

**Files:**
- Modify: `src/components/EditExpenseDialog.tsx`

- [ ] **Step 1: Extend the `onSave` prop type**

  Find the `EditExpenseDialogProps` interface at the top of the file. Change:

  ```ts
  onSave: (entries: { categoryId: string; amount: number }[]) => Promise<void>
  ```

  To:

  ```ts
  onSave: (entries: { categoryId: string; amount: number; notes: string | null }[]) => Promise<void>
  ```

- [ ] **Step 2: Add notes state declarations**

  In the `EditExpenseDialog` function body, alongside the existing state declarations (`amounts`, `currencies`, `saving`, `shakingFields`), add:

  ```ts
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
  ```

- [ ] **Step 3: Initialise notes state in the `useEffect`**

  Find the `useEffect` that runs when `monthRow` changes (currently initialises `amounts` and `currencies`). Add notes initialisation inside it:

  ```ts
  useEffect(() => {
    if (monthRow) {
      const initialAmounts: Record<string, string> = {}
      const initialCurrencies: Record<string, Currency> = {}
      const initialNotes: Record<string, string> = {}
      const initialExpanded: Record<string, boolean> = {}
      for (const cat of categories) {
        initialAmounts[cat.id] = monthRow.expenses[cat.id] != null
          ? String(monthRow.expenses[cat.id])
          : ''
        initialCurrencies[cat.id] = 'EUR'
        const note = monthRow.expenseNotes?.[cat.id] ?? ''
        initialNotes[cat.id] = note
        initialExpanded[cat.id] = note.length > 0
      }
      setAmounts(initialAmounts)
      setCurrencies(initialCurrencies)
      setNotes(initialNotes)
      setExpandedNotes(initialExpanded)
    }
  }, [monthRow, categories])
  ```

- [ ] **Step 4: Add the per-row notes UI**

  In the `categories.map(cat => ...)` render block, find the closing `</div>` of each category row (after the amount input and currency toggle). Add the notes toggle immediately before it, inside the `<div key={cat.id} className="flex flex-col gap-1.5">` wrapper:

  The notes toggle should only show when the row has a value. The condition: `hasExpense || (Number(val) > 0 && ![...val].some(c => '+-*/()'.includes(c)))`.

  Add this block after the `<div className="flex items-center gap-2">` block:

  ```tsx
  {(hasExpense || (Number(val) > 0 && ![...val].some(c => '+-*/()'.includes(c)))) && (
    expandedNotes[cat.id] ? (
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
    )
  )}
  ```

- [ ] **Step 5: Pass notes through in `handleSave`**

  In `handleSave`, the `entries` array is built by mapping over `categories`. Add `notes` to each entry:

  ```ts
  const entries = categories
    .filter(cat => {
      const v = amounts[cat.id]
      if (!v) return false
      if ([...v].some(c => '+-*/()'.includes(c))) return evaluateExpression(v) !== false
      return Number(v) > 0
    })
    .map(cat => {
      let v = amounts[cat.id]
      if ([...v].some(c => '+-*/()'.includes(c))) v = String(evaluateExpression(v) || 0)
      const raw = Number(v)
      const cur = currencies[cat.id] ?? 'EUR'
      return {
        categoryId: cat.id,
        amount: cur === 'BGN' ? convertBgnToEur(raw) : raw,
        notes: notes[cat.id]?.trim() || null,
      }
    })
  await onSave(entries)
  ```

- [ ] **Step 6: Build and verify**

  ```bash
  npm run build
  ```

  Expected: TypeScript error in `App.tsx` only (because `handleEditSave` still uses the old entry type). No errors in `EditExpenseDialog` itself.

- [ ] **Step 7: Commit**

  ```bash
  git add src/components/EditExpenseDialog.tsx
  git commit -m "feat: add per-row notes UI to EditExpenseDialog (#18)"
  ```

---

### Task 4: Wire notes through `App.tsx` and verify end-to-end

The final connection: extend `handleEditSave` to pass notes into `bulkUpsert`.

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Extend `handleEditSave`**

  Find `handleEditSave` in `src/App.tsx` (around line 192). Change:

  ```ts
  const handleEditSave = useCallback(
    async (entries: { categoryId: string; amount: number }[]) => {
      if (editMonth === null) return
      const rows = entries.map(e => ({
        category_id: e.categoryId,
        year: selectedYear,
        month: editMonth,
        amount: e.amount,
      }))
      const { error } = await bulkUpsert(rows)
      if (error) {
        toast.error('Грешка при запазване')
      } else {
        toast.success('Данните са обновени')
      }
    },
    [editMonth, selectedYear, bulkUpsert],
  )
  ```

  To:

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
      if (error) {
        toast.error('Грешка при запазване')
      } else {
        toast.success('Данните са обновени')
      }
    },
    [editMonth, selectedYear, bulkUpsert],
  )
  ```

- [ ] **Step 2: Build and verify clean**

  ```bash
  npm run build
  ```

  Expected: **zero TypeScript errors**. Clean build.

- [ ] **Step 3: Start dev server and verify in browser**

  ```bash
  npm run dev
  ```

  Open the Overview page and check:
  - [ ] Click a month row to open the edit dialog
  - [ ] Rows with existing expenses show a "+ Добави бележка" link below the amount input
  - [ ] Clicking the link expands a textarea (2 rows, placeholder "Бележка...")
  - [ ] Type a note and click Save — dialog closes, toast shows "Данните са обновени"
  - [ ] Re-open the same month row — the textarea is already expanded with the saved note
  - [ ] Clear the note text (leave empty) and save — note is removed (stored as null)
  - [ ] Rows with no amount and no existing expense do NOT show the notes toggle
  - [ ] The "all months" bulk-add flow in AddExpenseDialog is unaffected (no notes field there)

- [ ] **Step 4: Commit**

  ```bash
  git add src/App.tsx
  git commit -m "feat: wire expense notes through handleEditSave (#18)"
  ```
