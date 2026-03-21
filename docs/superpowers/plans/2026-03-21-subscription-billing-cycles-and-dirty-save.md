# Subscription Billing Cycles & Dirty Save Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add biennial and triennial billing cycles (#22), and disable the Save button in EditSubscriptionDialog until the user makes a change (#25).

**Architecture:** Two independent changes. #22 is a pure type extension — add values to the `BillingCycle` union and update the three functions that branch on it, plus the two dropdown arrays. #25 adds an `isDirty` computed variable to `EditSubscriptionDialog` by comparing form state to the loaded `subscription` prop, and gates `canSave` on it.

**Tech Stack:** React 19, TypeScript (strict), Vite, Tailwind CSS v4, Supabase. No test suite — verify changes manually in the browser with `npm run dev`.

---

## Files Changed

| File | Change |
|---|---|
| `src/types/index.ts` | Extend `BillingCycle` union with `'biennial'` and `'triennial'` |
| `src/lib/subscriptions.ts` | Add cases to `addInterval`, `MONTHLY_FACTORS`, `cycleLabelBg` |
| `src/components/AddSubscriptionDialog.tsx` | Add new cycles to `BILLING_CYCLES` array |
| `src/components/EditSubscriptionDialog.tsx` | Add new cycles to `BILLING_CYCLES` array + add `isDirty` + update `canSave` |

---

## Task 1: Extend the BillingCycle type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Update the union type**

In `src/types/index.ts`, change line 59:

```ts
// Before
export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'bi_annual' | 'yearly'

// After
export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'bi_annual' | 'yearly' | 'biennial' | 'triennial'
```

- [ ] **Step 2: Verify the build catches missing cases**

```bash
npm run build
```

Expected: TypeScript errors in `src/lib/subscriptions.ts` — the `Record<BillingCycle, ...>` objects and the `switch` statement are now incomplete. This is correct; you'll fix them in Task 2.

---

## Task 2: Update billing cycle logic

**Files:**
- Modify: `src/lib/subscriptions.ts`

- [ ] **Step 1: Add cases to `addInterval`**

Locate the `switch` statement inside `addInterval` (around line 12). Add two cases before the closing brace:

```ts
case 'biennial':  d.setFullYear(d.getFullYear() + 2); break
case 'triennial': d.setFullYear(d.getFullYear() + 3); break
```

Full switch after change:
```ts
switch (cycle) {
  case 'weekly':    d.setDate(d.getDate() + 7); break
  case 'monthly':   d.setMonth(d.getMonth() + 1); break
  case 'quarterly': d.setMonth(d.getMonth() + 3); break
  case 'bi_annual': d.setMonth(d.getMonth() + 6); break
  case 'yearly':    d.setFullYear(d.getFullYear() + 1); break
  case 'biennial':  d.setFullYear(d.getFullYear() + 2); break
  case 'triennial': d.setFullYear(d.getFullYear() + 3); break
}
```

- [ ] **Step 2: Add monthly factors**

Locate `MONTHLY_FACTORS` (around line 23). Add two entries:

```ts
const MONTHLY_FACTORS: Record<BillingCycle, number> = {
  weekly:    52 / 12,
  monthly:   1,
  quarterly: 1 / 3,
  bi_annual: 1 / 6,
  yearly:    1 / 12,
  biennial:  1 / 24,
  triennial: 1 / 36,
}
```

- [ ] **Step 3: Add Bulgarian labels**

Locate `cycleLabelBg` (around line 88). Add two entries:

```ts
const labels: Record<BillingCycle, string> = {
  weekly:    'Седмично',
  monthly:   'Месечно',
  quarterly: 'Тримесечно',
  bi_annual: 'Полугодишно',
  yearly:    'Годишно',
  biennial:  'Двугодишно',
  triennial: 'Тригодишно',
}
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: No TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/lib/subscriptions.ts
git commit -m "feat: add biennial and triennial billing cycles (#22)"
```

---

## Task 3: Add new cycles to both subscription dialogs

**Files:**
- Modify: `src/components/AddSubscriptionDialog.tsx`
- Modify: `src/components/EditSubscriptionDialog.tsx`

Both files have an identical `BILLING_CYCLES` constant near the top (line 32 in each).

- [ ] **Step 1: Update AddSubscriptionDialog**

In `src/components/AddSubscriptionDialog.tsx`, change line 30:

```ts
// Before
const BILLING_CYCLES: BillingCycle[] = ['weekly', 'monthly', 'quarterly', 'bi_annual', 'yearly']

// After
const BILLING_CYCLES: BillingCycle[] = ['weekly', 'monthly', 'quarterly', 'bi_annual', 'yearly', 'biennial', 'triennial']
```

- [ ] **Step 2: Update EditSubscriptionDialog**

In `src/components/EditSubscriptionDialog.tsx`, change line 32:

```ts
// Before
const BILLING_CYCLES: BillingCycle[] = ['weekly', 'monthly', 'quarterly', 'bi_annual', 'yearly']

// After
const BILLING_CYCLES: BillingCycle[] = ['weekly', 'monthly', 'quarterly', 'bi_annual', 'yearly', 'biennial', 'triennial']
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

1. Open the Add Subscription dialog — confirm "Двугодишно" and "Тригодишно" appear at the bottom of the billing cycle dropdown.
2. Open the Edit Subscription dialog for any existing subscription — confirm the same two new options appear.

- [ ] **Step 4: Commit**

```bash
git add src/components/AddSubscriptionDialog.tsx src/components/EditSubscriptionDialog.tsx
git commit -m "feat: show biennial and triennial in subscription dialogs (#22)"
```

---

## Task 4: Save button dirty check in EditSubscriptionDialog

**Files:**
- Modify: `src/components/EditSubscriptionDialog.tsx`

- [ ] **Step 1: Locate the existing canSave line**

Find this block near line 113 in `src/components/EditSubscriptionDialog.tsx`:

```ts
const priceUpdateValid = !showPriceUpdate || (Number(newPrice) > 0 && effectiveFrom)
const canSave = name.trim() && startDate && priceUpdateValid
```

- [ ] **Step 2: Add isDirty and update canSave**

Replace those two lines with:

```ts
const priceUpdateValid = !showPriceUpdate || (Number(newPrice) > 0 && effectiveFrom)

const isDirty = !!subscription && (
  name !== subscription.name ||
  cycle !== subscription.billing_cycle ||
  sourceId !== (subscription.payment_source_id ?? '__none__') ||
  startDate !== subscription.start_date ||
  notes !== (subscription.notes ?? '') ||
  isActive !== subscription.is_active ||
  isRebate !== subscription.is_rebate ||
  iconFile !== null ||
  iconRemoved ||
  (showPriceUpdate && Number(newPrice) > 0 && !!effectiveFrom)
)

const canSave = isDirty && name.trim() && startDate && priceUpdateValid
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Test the following scenarios:

1. **Open any subscription** → Save button is disabled immediately on open.
2. **Change the name** → Save button enables.
3. **Revert the name** → Save button disables again.
4. **Toggle Active off then back on** → button disables again after revert.
5. **Change billing cycle** → button enables; change back → disables.
6. **Open the price change form, type a price, but leave effective date blank** → button stays disabled (price change not yet valid).
7. **Fill in both new price and effective date** → button enables.
8. **Cancel the price form** → button disables again.

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: Clean build, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/EditSubscriptionDialog.tsx
git commit -m "fix: enable save button only when changes detected (#25)"
```
