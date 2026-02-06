import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category, Expense, MonthRow } from '@/types'
import { MONTH_NAMES } from '@/lib/constants'

export function useExpenses(apartmentId: string, year: number, categories: Category[]) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const categoryIds = categories.map(c => c.id)

  const fetchExpenses = useCallback(async () => {
    if (!apartmentId || categoryIds.length === 0) return
    setLoading(true)

    const { data } = await supabase
      .from('expenses')
      .select('*')
      .in('category_id', categoryIds)
      .eq('year', year)
      .order('month')

    setExpenses(data ?? [])
    setLoading(false)
  }, [apartmentId, year, categoryIds.join(',')])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const createExpense = async (categoryId: string, month: number, amount: number, targetYear?: number) => {
    const expYear = targetYear ?? year
    const { data, error } = await supabase
      .from('expenses')
      .upsert(
        { category_id: categoryId, year: expYear, month, amount, updated_at: new Date().toISOString() },
        { onConflict: 'category_id,year,month' }
      )
      .select()
      .single()

    if (!error && data) {
      await fetchExpenses()
    }
    return { data, error }
  }

  const updateExpense = async (id: string, amount: number) => {
    const { data, error } = await supabase
      .from('expenses')
      .update({ amount, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      await fetchExpenses()
    }
    return { data, error }
  }

  const deleteExpense = async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchExpenses()
    }
    return { error }
  }

  const deleteMonthExpenses = async (month: number) => {
    const monthExpenses = expenses.filter(e => e.month === month)
    if (monthExpenses.length === 0) return { error: null }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .in('id', monthExpenses.map(e => e.id))

    if (!error) {
      await fetchExpenses()
    }
    return { error }
  }

  const bulkUpsert = async (rows: { category_id: string; year: number; month: number; amount: number }[]) => {
    const withTimestamp = rows.map(r => ({ ...r, updated_at: new Date().toISOString() }))
    const { error } = await supabase
      .from('expenses')
      .upsert(withTimestamp, { onConflict: 'category_id,year,month' })

    if (!error) {
      await fetchExpenses()
    }
    return { error }
  }

  // Build month rows for the table
  const monthRows: MonthRow[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const monthExpenses = expenses.filter(e => e.month === month)
    const expenseMap: Record<string, number> = {}
    const idMap: Record<string, string> = {}

    for (const exp of monthExpenses) {
      expenseMap[exp.category_id] = exp.amount
      idMap[exp.category_id] = exp.id
    }

    const total = Object.values(expenseMap).reduce((sum, a) => sum + a, 0)

    return {
      month,
      monthName: MONTH_NAMES[month],
      expenses: expenseMap,
      expenseIds: idMap,
      total,
    }
  })

  // Column totals
  const columnTotals: Record<string, number> = {}
  for (const cat of categories) {
    columnTotals[cat.id] = expenses
      .filter(e => e.category_id === cat.id)
      .reduce((sum, e) => sum + e.amount, 0)
  }
  const grandTotal = Object.values(columnTotals).reduce((sum, a) => sum + a, 0)

  return {
    expenses,
    monthRows,
    columnTotals,
    grandTotal,
    loading,
    createExpense,
    updateExpense,
    deleteExpense,
    deleteMonthExpenses,
    bulkUpsert,
    refetch: fetchExpenses,
  }
}
