export interface Apartment {
  id: string
  name: string
  created_at: string
}

export interface Category {
  id: string
  apartment_id: string
  name: string
  sort_order: number
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
  monthlyAverage: number
  highestMonth: { month: number; monthName: string; total: number }
  lowestMonth: { month: number; monthName: string; total: number }
  categoryTotals: Record<string, number> // category_id -> total
}
