# skills/business-logic.md

**Purpose:** Core domain rules that must not be simplified or removed.

## paid_by_me

Categories have a `paid_by_me: boolean` flag:
- `true` — user pays this expense; included in "my total" summary calculations
- `false` — tenant pays it; tracked for record-keeping, excluded from personal totals and averages

Both types appear in the expense table. Non-`paid_by_me` categories are styled:
```tsx
className="italic text-muted-foreground"
```

**Do not remove or simplify this distinction** — it's core to the multi-tenant tracking use case.

## Rent Tracking

Rent is separate from expenses:
- `rent_payments` stores which months rent was received — no amount (amount comes from `apartments.rent_amount`)
- `YearSummaryStrip` rent card: `paidMonths.length × rentAmount`
- Rent checkboxes are in their own table column, toggled independently

## Expense Upsert Key

Expenses use a `(category_id, year, month)` unique constraint — always upsert, never plain insert.

## Month Offset (Automation)

Bills arrive a month after the consumption period. The `sync_bill_to_expense` trigger applies `- INTERVAL '1 month'` to `bill_date` when writing to `expenses`. The `bills` table keeps the accurate received date unchanged.

## Anti-patterns

- Don't include non-`paid_by_me` expenses in averages or yearly totals
- Don't store rent amounts in the `expenses` table
- Don't insert bills into `expenses` without the month offset
