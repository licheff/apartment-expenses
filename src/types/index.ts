export interface Apartment {
  id: string
  name: string
  rent_amount: number | null
  created_at: string
}

export interface Category {
  id: string
  apartment_id: string
  name: string
  sort_order: number
  paid_by_me: boolean
  created_at: string
}

export interface Expense {
  id: string
  category_id: string
  year: number
  month: number
  amount: number
  created_at: string
  updated_at: string
}

export interface ExpenseWithCategory extends Expense {
  category: Category
}

export interface RentPayment {
  id: string
  apartment_id: string
  year: number
  month: number
  created_at: string
}

export interface YearlyExpense {
  id: string
  apartment_id: string
  year: number
  name: string
  amount: number
  created_at: string
  updated_at: string
}

export interface MonthRow {
  month: number
  monthName: string
  expenses: Record<string, number> // category_id -> amount
  expenseIds: Record<string, string> // category_id -> expense id
  total: number
}

// ─── Subscriptions ──────────────────────────────────────────────────────────

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'bi_annual' | 'yearly'

export interface PaymentSource {
  id: string
  name: string
  sort_order: number
  created_at: string
}

export interface Subscription {
  id: string
  name: string
  amount: number               // always EUR
  billing_cycle: BillingCycle
  payment_source_id: string | null
  payment_source?: PaymentSource | null  // from Supabase join
  start_date: string           // "YYYY-MM-DD" — billing anchor date
  is_active: boolean
  is_rebate: boolean           // excluded from totals when true
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateSubscriptionInput {
  name: string
  amount: number
  billing_cycle: BillingCycle
  payment_source_id: string | null
  start_date: string
  is_active: boolean
  is_rebate: boolean
  notes: string | null
}

// ─── Expense summary ─────────────────────────────────────────────────────────

export interface YearSummary {
  year: number
  total: number
  totalWithYearly: number
  myTotal: number
  monthlyAverage: number
  highestMonth: { month: number; monthName: string; total: number }
  lowestMonth: { month: number; monthName: string; total: number }
  categoryTotals: Record<string, number> // category_id -> total
  yearlyExpensesTotal: number
}
