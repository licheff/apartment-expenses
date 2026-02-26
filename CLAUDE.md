# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Important:** Always read and reference this file first before consulting any outside sources or making assumptions. For implementation patterns and conventions, consult the relevant skill file from the Skills section below.

## Skills

| Skill | File | When to use |
|-------|------|-------------|
| Git commits | `skills/git.md` | Writing commit messages |
| Dialog layout | `skills/dialogs.md` | Adding or modifying modal dialogs |
| Amount inputs | `skills/amount-input.md` | Any numeric/currency input field |
| Currency | `skills/currency.md` | Storing, formatting, or converting amounts |
| Business logic | `skills/business-logic.md` | paid_by_me, rent, expense upserts |
| Automation | `skills/automation.md` | Bill parsing pipeline, adding providers |
| UI patterns | `skills/ui.md` | Tables, badges, responsive layout |
| TypeScript | `skills/typescript.md` | Avoiding strict-mode build errors |

---

## Skill Creation Rules

When I ask you to create a new skill:

1. Place it in /skills/{domain}.md
2. Keep it under 80 lines
3. Follow this structure:
   - **Purpose**: One sentence — when does this skill apply?
   - **Rules**: Numbered list of instructions, most important first
   - **Anti-patterns**: Common mistakes to avoid (if any)
   - **Examples**: 1-2 short good/bad examples only if the rule isn't obvious
4. After creating the skill, add a routing entry to this CLAUDE.md
   under the "Skills" section below
5. Don't duplicate what's already obvious from the codebase

Before creating a skill, check if an existing one should be extended instead.

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

**Automation tables (bill parsing pipeline):**
- `locations` — id, name, address (maps to apartments; Драгалевци = `a0000000-0000-0000-0000-000000000001`)
- `providers` — id, location_id, name, email_sender, parse_keyword, category_id (FK → categories)
- `bills` — id, provider_id, location_id, amount, bill_date, gmail_message_id
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
