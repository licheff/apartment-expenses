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
