# skills/amount-input.md

**Purpose:** Correct amount input behaviour across web and iOS.

## Rules

1. **Never use `type="number"`** — browsers return `""` mid-decimal (e.g. after typing "123."), breaking controlled state
2. Always use `type="text" inputMode="decimal"`
3. Normalize iOS comma before validation — iOS numeric keyboard sends `,` as decimal separator
4. Use `validateAmountInput()` from `src/lib/constants.ts` — it handles both normalization and validation

```tsx
<input
  type="text"
  inputMode="decimal"
  onChange={e => {
    const result = validateAmountInput(e.target.value)
    if (result === false) { /* shake feedback */ return }
    setValue(result)
  }}
/>
```

## Animated Amount Input (AddExpenseDialog / YearlyExpensesSection)

Three-layer trick for the animated display:
1. **Mirror span** (invisible) — sizes the container to the text width
2. **Display div** (absolute, pointer-events-none) — renders animated characters
3. **Hidden input** (absolute, opacity-0) — captures keystrokes

Font size thresholds (based on `formatAmountInput(amount).length`):
- `> 10` chars → 24px
- `> 9` chars → 32px
- default → 40px

Only the **last typed character** gets a new key → only it animates in. Deleted character animates out via `exitChar`.

## Anti-patterns

- Don't apply `.replace(',', '.')` manually — `validateAmountInput()` already does it
- Don't use `Number(value)` without checking for `""` — always guard with `value && Number(value) > 0`
