import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

export interface YearMonthlyTotals {
  year: number
  monthTotals: number[] // index 0 = Jan, index 11 = Dec
}

export function useAllYearsMonthlyTotals(
  categories: Category[],
  selectedYear: number,
  availableYears: number[],
) {
  const [data, setData] = useState<YearMonthlyTotals[]>([])
  const categoryIds = categories.map(c => c.id)

  // All years except the currently selected one
  const otherYears = useMemo(
    () => availableYears.filter(y => y !== selectedYear).sort((a, b) => b - a),
    [availableYears, selectedYear],
  )

  const fetchAll = useCallback(async () => {
    if (categoryIds.length === 0 || otherYears.length === 0) {
      setData([])
      return
    }

    const { data: rows } = await supabase
      .from('expenses')
      .select('year, month, amount')
      .in('category_id', categoryIds)
      .in('year', otherYears)

    if (!rows) {
      setData([])
      return
    }

    // Group by year → month → sum
    const yearMap = new Map<number, number[]>()
    for (const y of otherYears) {
      yearMap.set(y, new Array(12).fill(0))
    }
    for (const row of rows) {
      const totals = yearMap.get(row.year)
      if (totals) {
        totals[row.month - 1] += row.amount
      }
    }

    const result: YearMonthlyTotals[] = otherYears
      .map(y => ({
        year: y,
        monthTotals: yearMap.get(y)!,
      }))
      .filter(yt => yt.monthTotals.some(t => t > 0))

    setData(result)
  }, [categoryIds.join(','), otherYears.join(',')])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { allYearsData: data }
}
