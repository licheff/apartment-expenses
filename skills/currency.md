# skills/currency.md

**Purpose:** Consistent currency storage, display, and conversion across the app.

## Rules

1. **All amounts stored in EUR** — no exceptions
2. BGN toggle is a convenience for entering pre-2026 historical amounts only; convert to EUR before saving
3. Fixed rate: `1.95583` — defined once in `src/lib/constants.ts`, never hardcoded elsewhere
4. Use the provided formatting helpers — never format currency manually

## Formatting Helpers (`src/lib/constants.ts`)

| Helper | Output | Use when |
|--------|--------|----------|
| `formatCurrency(n)` | `"1 234.56 €"` | Precise amounts (totals, averages) |
| `formatCurrencyShort(n)` | `"1 234 €"` | Rounded display (cards, summaries) |
| `formatAmountInput(raw)` | `"1 234"` | Thousands separator on raw input string |
| `convertBgnToEur(n)` | number | Before saving BGN input |
| `convertEurToBgn(n)` | number | When switching toggle to BGN display |
| `convertUsdToEur(n)` | number | Before saving USD input |
| `convertEurToUsd(n)` | number | When switching toggle to USD display |

Thousands separator is a **non-breaking space** (`\u00A0`) — don't replace it with a regular space.

## BGN Toggle Pattern

```tsx
// On toggle change: convert existing value to new currency
const converted = newCurrency === 'BGN' ? convertEurToBgn(num) : convertBgnToEur(num)
setAmount(converted.toFixed(2))

// On save: always convert to EUR
const euroAmount = currency === 'BGN' ? convertBgnToEur(raw) : raw
```

## USD Toggle Pattern (Subscriptions)

USD rate (`0.92`) is a manually-set fixed rate in `constants.ts`. Same storage rule: convert to EUR before saving.

```tsx
const euroAmount = currency === 'USD' ? convertUsdToEur(raw) : raw
```

`CurrencyToggle` accepts a `currencies` prop — pass `['EUR', 'USD']` for subscription dialogs.

## Anti-patterns

- Don't store BGN or USD in the database
- Don't hardcode `1.95583` or `0.92` — import from constants
- Don't show non-EUR amounts in summary cards or charts
