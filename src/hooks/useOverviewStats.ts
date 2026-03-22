import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface OverviewStats {
  lastMonthUtilities: number
  lastMonth: number        // 1–12, used by the page to build the card label
  monthlyUtilityTotals: Record<number, number>  // sparse: only months with data have a key
  loading: boolean
}

export function useOverviewStats(): OverviewStats {
  const [lastMonthUtilities, setLastMonthUtilities] = useState(0)
  const [lastMonth, setLastMonth] = useState(() => {
    const m = new Date().getMonth() + 1   // 1–12
    return m === 1 ? 12 : m - 1
  })
  const [monthlyUtilityTotals, setMonthlyUtilityTotals] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)

    // Date math
    const now = new Date()
    const currentMonth = now.getMonth() + 1   // getMonth() is 0-indexed
    const currentYear = now.getFullYear()
    const lMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const lYear = currentMonth === 1 ? currentYear - 1 : currentYear
    setLastMonth(lMonth)

    // Query 1: get all paid_by_me category IDs across all apartments
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('paid_by_me', true)

    if (catError || !catData || catData.length === 0) {
      setLastMonthUtilities(0)
      setMonthlyUtilityTotals({})
      setLoading(false)
      return
    }

    const categoryIds = catData.map(c => c.id)

    // Query 2: all expenses for current year in paid_by_me categories
    const q2Promise = supabase
      .from('expenses')
      .select('month, amount')
      .in('category_id', categoryIds)
      .eq('year', currentYear)

    // Query 3 (January only): December of previous year for the stat card
    const q3Promise = currentMonth === 1
      ? supabase
          .from('expenses')
          .select('amount')
          .in('category_id', categoryIds)
          .eq('year', lYear)
          .eq('month', 12)
      : Promise.resolve({ data: null, error: null })

    const [q2Result, q3Result] = await Promise.all([q2Promise, q3Promise])

    // Build monthlyUtilityTotals from query 2
    const totals: Record<number, number> = {}
    for (const row of q2Result.data ?? []) {
      totals[row.month] = (totals[row.month] ?? 0) + row.amount
    }
    setMonthlyUtilityTotals(totals)

    // Derive lastMonthUtilities
    let lastUtil = 0
    if (currentMonth === 1) {
      for (const row of q3Result.data ?? []) {
        lastUtil += row.amount
      }
    } else {
      lastUtil = totals[lMonth] ?? 0
    }
    setLastMonthUtilities(lastUtil)

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { lastMonthUtilities, lastMonth, monthlyUtilityTotals, loading }
}
