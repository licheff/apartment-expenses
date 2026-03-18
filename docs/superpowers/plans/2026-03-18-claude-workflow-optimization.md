# Claude Workflow Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve Claude's accuracy on this codebase and reduce maintenance overhead by removing duplication, tightening skill triggers, adding a missing subscriptions skill, and adding a feature→file map to CLAUDE.md.

**Architecture:** Documentation-only changes — no src/ files are touched, no imports change. All changes are to CLAUDE.md, skills/, and a new ROADMAP.md. The Feature Map section is the highest-value change: it gives Claude explicit file navigation context for every feature area.

**Tech Stack:** Markdown only.

**Spec:** `docs/superpowers/specs/2026-03-18-claude-workflow-optimization-design.md`

---

## Files Changed

| Action | File | Purpose |
|--------|------|---------|
| Delete | `skills/main.md` | Removes duplicated routing table and misplaced roadmap |
| Create | `ROADMAP.md` | New home for planned features |
| Modify | `CLAUDE.md` | Remove Skill Creation Rules, add ROADMAP pointer, update trigger descriptions, add Feature Map |
| Create | `skills/subscriptions.md` | New skill covering the subscriptions feature area |

---

### Task 1: Delete `skills/main.md`

**Files:**
- Delete: `skills/main.md`

- [ ] **Step 1: Delete the file**

```bash
rm skills/main.md
```

- [ ] **Step 2: Verify it's gone**

```bash
ls skills/
```

Expected: `main.md` no longer appears in the listing.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove skills/main.md (duplicate of CLAUDE.md routing table)"
```

---

### Task 2: Create `ROADMAP.md`

**Files:**
- Create: `ROADMAP.md`

- [ ] **Step 1: Create the file with the planned features list**

```markdown
# Roadmap

Planned features — consult before making architectural decisions to ensure new work aligns with future direction.

## Planned

- **Detailed location summaries** — per-location breakdowns beyond the current apartment switcher
- **Outlier analysis** — detecting unusual months or categories
- **More automated providers for location 142** — same trigger architecture, just needs new `providers` rows
```

- [ ] **Step 2: Verify the file renders correctly**

Open `ROADMAP.md` and confirm it reads cleanly.

- [ ] **Step 3: Commit**

```bash
git add ROADMAP.md
git commit -m "chore: add ROADMAP.md for planned features"
```

---

### Task 3: Update `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

Three sub-changes in this task — do them in order, verify after each, then commit once at the end.

- [ ] **Step 1: Remove the Skill Creation Rules block**

Find and delete this entire block (lines starting with `## Skill Creation Rules` through the closing `Before creating a skill, check if an existing one should be extended instead.` line, inclusive).

Verify: `CLAUDE.md` no longer contains `## Skill Creation Rules`.

- [ ] **Step 2: Add ROADMAP pointer**

After the Skills table (before `## Commands`), add:

```markdown
> See [ROADMAP.md](ROADMAP.md) for planned features — consult before making architectural decisions.
```

- [ ] **Step 3: Update trigger descriptions in the Skills table**

Replace the four trigger descriptions as follows (leave git.md, amount-input.md, currency.md, typescript.md unchanged):

| Skill | New "When to use" value |
|-------|------------------------|
| `dialogs.md` | Any work inside a Radix dialog — layout, form fields, footer buttons |
| `ui.md` | Tables, badges, layout, SectionCard, TableContainer, DaysBadge, UpcomingPaymentsList |
| `business-logic.md` | paid_by_me calculations, rent tracking, expense upserts, month offset rule |
| `automation.md` | ePay.bg pipeline, providers table, Apps Script, bills table |

Also add a new row for the subscriptions skill (will be created in Task 4):

| `subscriptions.md` | Any work on subscriptions, recurring payments, subscription calendar, upcoming payments, payment sources |

- [ ] **Step 4: Add Feature Map section**

Add this section after `### UI Patterns` (the last section of the Architecture block), before any horizontal rule or end of file:

```markdown
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
```

- [ ] **Step 5: Verify CLAUDE.md**

Read through the full file and confirm:
- No `## Skill Creation Rules` block
- ROADMAP pointer is present
- Skills table has 9 rows (8 existing + subscriptions)
- Feature Map section is present and complete

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md
git commit -m "chore: update CLAUDE.md — remove skill creation rules, add feature map, add ROADMAP pointer, tighten skill triggers"
```

---

### Task 4: Create `skills/subscriptions.md`

**Files:**
- Create: `skills/subscriptions.md`

- [ ] **Step 1: Create the file**

```markdown
# skills/subscriptions.md

**Purpose:** Data model, logic, and UI patterns for the subscriptions feature. Use for any work on subscriptions, recurring payments, the subscription calendar, upcoming payments, or payment sources.

## Data Model

```ts
Subscription {
  id, name, amount (EUR), billing_cycle: BillingCycle
  payment_source_id → payment_sources.id (nullable)
  start_date: "YYYY-MM-DD"   // billing anchor — next payment computed from this
  is_active: boolean
  is_rebate: boolean          // excluded from totals when true
  notes: string | null
  icon_url: string | null     // Supabase Storage public URL for SVG
}

SubscriptionPriceChange {
  subscription_id, amount (new price), previous_amount (old price, null for initial), effective_from: "YYYY-MM-DD"
}

BillingCycle: 'weekly' | 'monthly' | 'quarterly' | 'bi_annual' | 'yearly'
```

## Key Logic (`lib/subscriptions.ts`)

- **`nextPaymentDate(startDate, cycle)`** — advances from `start_date` until >= today. Always call this for "days until" and calendar placement.
- **`paymentDatesInMonth(startDate, cycle, year, month)`** — all occurrences in a month. Weekly subscriptions can hit 4–5 times.
- **`monthlyEquivalent(amount, cycle)`** — normalises any cycle to a monthly cost for summary totals.
- **`daysUntilNextPayment(startDate, cycle)`** — days >= 0.
- **`cycleLabelBg(cycle)`** — Bulgarian display label.
- **`parseLocalDate(dateStr)`** — always use this instead of `new Date(dateStr)` to avoid UTC midnight timezone shift.

## Totals Rule

Summary totals (`totalPerMonth`, `totalPerYear`) include **active, non-rebate** subscriptions only:
```ts
subscriptions.filter(s => s.is_active && !s.is_rebate)
```
Never include paused or rebate subscriptions in cost summaries.

## Price History

When a subscription price changes, insert a row into `subscription_price_changes` — do not just update `subscriptions.amount`. The UI reads the history to show a price timeline. `useSubscriptionPriceChanges(subscriptionId)` fetches the log for a given subscription.

## Calendar View (`SubscriptionCalendar`)

`SubscriptionCalendar` renders a 12-month grid for a given year. For each month cell, it calls `paymentDatesInMonth(parseLocalDate(sub.start_date), sub.billing_cycle, year, month)` for each active subscription. If the returned array is non-empty, the subscription appears in that cell. Weekly subscriptions may appear multiple times in a single month (4–5 hits). The calendar is read-only — clicking a subscription opens its edit dialog, it does not log a payment.

## Icon Upload

SVG icons upload via `<IconUpload>` → Supabase Storage bucket. The returned public URL is stored in `subscriptions.icon_url`. Always display with `<img src={icon_url} />` — never inline the SVG. On delete, remove the storage object before deleting the subscription row.

## Anti-patterns

- Don't use `new Date(dateStr)` on `start_date` strings — use `parseLocalDate()` instead
- Don't include rebate or inactive subscriptions in cost totals
- Don't update `subscriptions.amount` directly for a price change — insert into `subscription_price_changes`
- Don't store subscription costs in the `expenses` table — subscriptions are tracked separately
```

- [ ] **Step 2: Verify the file**

Read through `skills/subscriptions.md` and confirm it stays under 80 lines and follows the standard skill structure (Purpose, rules, anti-patterns).

- [ ] **Step 3: Commit**

```bash
git add skills/subscriptions.md
git commit -m "chore: add skills/subscriptions.md"
```
