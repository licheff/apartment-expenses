# Claude Workflow Optimization — Design Spec

**Date:** 2026-03-18
**Scope:** Low-disruption improvements to CLAUDE.md and skills for better Claude accuracy and easier human maintenance. No src/ file moves.

---

## 1. Fix Duplication and Dead Weight

### Remove `skills/main.md`
`skills/main.md` duplicates the routing table already in `CLAUDE.md` and contains a "Planned Features" section that is project memory, not a skill. Deleting it makes `CLAUDE.md` the single source of truth for skill routing.

### Create `ROADMAP.md`
Move the planned features list from `skills/main.md` to a standalone `ROADMAP.md` in the project root. Add a single pointer line in `CLAUDE.md`:
> `See ROADMAP.md for planned features — consult before making architectural decisions.`

This keeps the roadmap discoverable by Claude without loading it as boilerplate on every conversation.

### Remove Skill Creation Rules from `CLAUDE.md`
The "Skill Creation Rules" block in `CLAUDE.md` is meta-instructions for the human author, not guidance for Claude. Remove it to reduce noise. (The rules are already implicitly enforced by the existing skill file structure.)

---

## 2. Tighten Skill Trigger Descriptions

Update the routing table in `CLAUDE.md` with more specific trigger descriptions so Claude knows exactly when each skill applies:

| Skill | Updated trigger |
|-------|----------------|
| `dialogs.md` | Any work inside a Radix dialog — layout, form fields, footer buttons |
| `ui.md` | Tables, badges, layout, SectionCard, TableContainer, DaysBadge, UpcomingPaymentsList |
| `business-logic.md` | paid_by_me calculations, rent tracking, expense upserts, month offset rule |
| `automation.md` | ePay.bg pipeline, providers table, Apps Script, bills table |

(git.md, amount-input.md, currency.md, typescript.md triggers are already precise — leave unchanged.)

---

## 3. Add `skills/subscriptions.md`

A full feature area exists (1 page, 3 dialogs, 3 hooks, 1 lib file) with no routing entry. Create `skills/subscriptions.md` covering:

- Subscription data model (fields, payment_sources FK, price history pattern)
- Recurring payment logic (next payment date calculation, active/paused state)
- Price history — how changes are tracked in `subscription_price_changes`
- Calendar view — how `SubscriptionCalendar` maps payments to months
- Icon upload flow — SVG upload via `IconUpload` + Supabase Storage
- Anti-patterns specific to subscriptions (e.g. don't duplicate expense-tracking patterns)

Add routing entry to `CLAUDE.md`:
> `Subscriptions | skills/subscriptions.md | Any work on subscriptions, recurring payments, subscription calendar, upcoming payments, payment sources`

---

## 4. Add Feature Map to `CLAUDE.md`

Add a `## Feature Map` section after the Architecture section. Maps feature areas to their key files so Claude knows exactly where to look without guessing.

```
## Feature Map

| Feature | Key files |
|---------|-----------|
| Expense tracking | pages/OverviewPage, components/ExpenseTable, components/AddExpenseDialog, components/EditExpenseDialog, hooks/useExpenses, hooks/useRentPayments |
| Subscriptions | pages/SubscriptionsPage, components/AddSubscriptionDialog, components/EditSubscriptionDialog, components/SubscriptionCalendar, hooks/useSubscriptions, hooks/useSubscriptionPriceChanges, lib/subscriptions |
| Yearly expenses | components/YearlyExpensesSection, hooks/useYearlyExpenses |
| Summary & charts | components/YearSummaryStrip, components/YearComparisonChart, hooks/useExpenseSummary |
| Apartments & categories | hooks/useApartments, components/ManageCategoriesDialog, components/ApartmentTabs |
| CSV import/export | components/CsvImportDialog, lib/csv-parser, lib/csv-exporter |
| Payment sources | hooks/usePaymentSources, components/ManagePaymentSourcesDialog |
| Currency & amounts | lib/constants, components/CurrencyToggle, components/MathOperatorButtons |
| Auth | hooks/useAuth, components/LoginPage |
| Layout / shell | App.tsx, components/Layout, components/Header, components/Sidebar |
| Shared UI primitives | components/ui/*, lib/utils |
| Automation (ePay.bg) | DB-only — see skills/automation.md |
```

---

## Summary of Changes

| Action | File |
|--------|------|
| Delete | `skills/main.md` |
| Create | `ROADMAP.md` |
| Modify | `CLAUDE.md` — remove Skill Creation Rules, add ROADMAP pointer, update trigger descriptions, add Feature Map section |
| Create | `skills/subscriptions.md` |

No changes to `src/` — zero import disruption.
