# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Important:** Always read and reference this file first before consulting any outside sources or making assumptions. For implementation patterns and conventions, consult the relevant skill file from the Skills section below.

## Skills

| Skill | File | When to use |
|-------|------|-------------|
| Git commits | `skills/git.md` | Writing commit messages |
| Dialog layout | `skills/dialogs.md` | Any work inside a Radix dialog — layout, form fields, footer buttons |
| Amount inputs | `skills/amount-input.md` | Any numeric/currency input field |
| Currency | `skills/currency.md` | Storing, formatting, or converting amounts |
| Business logic | `skills/business-logic.md` | paid_by_me calculations, rent tracking, expense upserts, month offset rule |
| Automation | `skills/automation.md` | ePay.bg pipeline, providers table, Apps Script, bills table |
| UI patterns | `skills/ui.md` | Tables, badges, layout, SectionCard, TableContainer, DaysBadge, UpcomingPaymentsList |
| TypeScript | `skills/typescript.md` | Avoiding strict-mode build errors |
| Subscriptions | `skills/subscriptions.md` | Any work on subscriptions, recurring payments, subscription calendar, upcoming payments, payment sources |

> See [ROADMAP.md](ROADMAP.md) for planned features — consult before making architectural decisions.

## Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript type check + production build
npm run lint     # ESLint check
npm run preview  # Preview production build locally
```

No test suite is configured.

## Architecture

This is a React + TypeScript + Supabase expense tracker for managing apartment costs across multiple apartments and years.

**Stack:** React 19, TypeScript (strict), Vite, Tailwind CSS v4, Supabase, Radix UI, Recharts

**Path alias:** `@/` → `src/`

### State Management Pattern

All state lives in `App.tsx`, composed from custom hooks. No global state library — just React hooks + Supabase queries.

```
App.tsx
  ├── useAuth()                          → session state
  ├── useApartments()                    → apartments[], categories[] per apartment
  ├── useExpenses(apartmentId, year)     → monthRows[], column totals
  ├── useYearlyExpenses(apartmentId, year)
  ├── useRentPayments(apartmentId, year)
  ├── useAvailableYears(categories)
  └── useExpenseSummary()                → aggregated stats (totals, averages)
```

Each hook: fetches on mount → exposes mutation functions → refetches after mutation.

### Key Data Flow

- **MonthRow:** The core display unit — one per month, with `amounts: Record<categoryId, number>` built by `useExpenses`
- **Categories** are per-apartment and have a `paid_by_me` flag that affects summary calculations
- **Expenses** are upserted with a `(category_id, year, month)` unique key
- **Rent payments** track which months rent was paid (separate from expense entries)

### Database Tables (Supabase)

- `apartments` — id, name, rent_amount
- `categories` — id, apartment_id, name, sort_order, paid_by_me
- `expenses` — id, category_id, year, month, amount (unique on category_id+year+month)
- `rent_payments` — id, apartment_id, year, month
- `yearly_expenses` — id, apartment_id, year, name, amount

**Automation tables (ePay.bg bill parsing):**
- `providers` — id, apartment_id, category_id, name, epay_merchant, is_active
- `bills` — id, provider_id, amount, bill_date, gmail_message_id
- Trigger `sync_bill_to_expense()` on `bills` auto-upserts into `expenses` (with −1 month offset)

### Environment

Requires `.env.local` with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Localization Notes

- UI strings and month names are in **Bulgarian**
- Currency: **EUR is primary** — all values stored in DB as EUR, all display uses €. BGN exists only as a convenience input toggle (for entering pre-2026 amounts); the fixed conversion rate is 1.95583 in `src/lib/constants.ts`
- Thousand separator uses non-breaking spaces

### UI Patterns

- All CRUD operations happen in modal dialogs; dialog open state is managed in `App.tsx`
- `Cmd+A` keyboard shortcut opens the add expense dialog
- Components in `src/components/ui/` are Radix UI + Tailwind compositions (treated like a local shadcn/ui setup)

### Feature Map

Use this to know which files to read before starting any task.

| Feature | Key files |
|---------|-----------|
| Expense tracking | `pages/OverviewPage`, `components/ExpenseTable`, `components/AddExpenseDialog`, `components/EditExpenseDialog`, `hooks/useExpenses`, `hooks/useRentPayments` |
| Subscriptions | `pages/SubscriptionsPage`, `components/AddSubscriptionDialog`, `components/EditSubscriptionDialog`, `components/SubscriptionCalendar`, `hooks/useSubscriptions`, `hooks/useSubscriptionPriceChanges`, `lib/subscriptions` |
| Yearly expenses | `components/YearlyExpensesSection`, `hooks/useYearlyExpenses` |
| Summary & charts | `components/YearSummaryStrip`, `components/YearComparisonChart`, `hooks/useExpenseSummary` |
| Apartments & categories | `hooks/useApartments`, `components/ManageCategoriesDialog`, `components/ApartmentTabs` |
| CSV import/export | `components/CsvImportDialog`, `lib/csv-parser`, `lib/csv-exporter` |
| Payment sources | `hooks/usePaymentSources`, `components/ManagePaymentSourcesDialog` |
| Currency & amounts | `lib/constants`, `components/CurrencyToggle`, `components/MathOperatorButtons` |
| Auth | `hooks/useAuth`, `components/LoginPage` |
| Layout / shell | `App.tsx`, `components/Layout`, `components/Header`, `components/Sidebar` |
| Shared UI primitives | `components/ui/*`, `lib/utils` |
| Automation (ePay.bg) | DB-only — see `skills/automation.md` |

> All paths relative to `src/` (path alias `@/`).
