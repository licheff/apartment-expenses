# Subscription: Biennial/Triennial Cycles & Dirty-State Save Button

**Date:** 2026-03-21
**Issues:** #22, #25

---

## Issue #22 — Add Biennial & Triennial Billing Cycles

### Goal
Support subscriptions that recur every 2 years (biennial) or every 3 years (triennial).

### Scope
Pure TypeScript + logic change. No DB migration required — `billing_cycle` is a plain `TEXT` column, not a Postgres enum.

### Changes

**`src/types/index.ts`**
Extend `BillingCycle`:
```ts
export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'bi_annual' | 'yearly' | 'biennial' | 'triennial'
```

**`src/lib/subscriptions.ts`**

`addInterval`:
- `biennial` → advance by 2 years (`setFullYear + 2`)
- `triennial` → advance by 3 years (`setFullYear + 3`)

`MONTHLY_FACTORS`:
- `biennial: 1 / 24`
- `triennial: 1 / 36`

`cycleLabelBg`:
- `biennial: 'Двугодишно'`
- `triennial: 'Тригодишно'`

**`src/components/AddSubscriptionDialog.tsx`** and **`src/components/EditSubscriptionDialog.tsx`**

Append to `BILLING_CYCLES` array (after `'yearly'`):
```ts
const BILLING_CYCLES: BillingCycle[] = ['weekly', 'monthly', 'quarterly', 'bi_annual', 'yearly', 'biennial', 'triennial']
```

### No changes needed
- DB schema (TEXT column accepts any value)
- `paymentDatesInMonth` and `nextPaymentDate` — both use `addInterval`, so they work automatically
- `daysUntilNextPayment` — same, uses `nextPaymentDate`

---

## Issue #25 — Save Button Enabled Only When Changes Are Made

### Goal
In `EditSubscriptionDialog`, the Save button should be disabled until the user has actually changed something from the loaded subscription values.

### Approach
Add an `isDirty` boolean computed from comparing form state to the original `subscription` prop. Update `canSave` to require `isDirty`.

### Change — `src/components/EditSubscriptionDialog.tsx`

Replace the current `canSave` line with:

```ts
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
  (showPriceUpdate && Number(newPrice) > 0)
)

const canSave = isDirty && name.trim() && startDate && priceUpdateValid
```

### Dirty field definitions
| Field | Dirty when |
|---|---|
| name | differs from `subscription.name` |
| cycle | differs from `subscription.billing_cycle` |
| sourceId | differs from `subscription.payment_source_id ?? '__none__'` |
| startDate | differs from `subscription.start_date` |
| notes | differs from `subscription.notes ?? ''` |
| isActive | differs from `subscription.is_active` |
| isRebate | differs from `subscription.is_rebate` |
| iconFile | any file selected (`!== null`) |
| iconRemoved | icon was explicitly removed |
| price change | price update form open AND valid new price entered |

**Key behaviour:** reverting all fields back to their original values disables Save again.

**Price change form:** opening the form alone does not enable Save — only entering a valid (> 0) new price does.

---

## Files Changed Summary

| File | Change |
|---|---|
| `src/types/index.ts` | Add `biennial`, `triennial` to `BillingCycle` |
| `src/lib/subscriptions.ts` | `addInterval`, `MONTHLY_FACTORS`, `cycleLabelBg` |
| `src/components/AddSubscriptionDialog.tsx` | `BILLING_CYCLES` array |
| `src/components/EditSubscriptionDialog.tsx` | `BILLING_CYCLES` array + `isDirty` + `canSave` |
