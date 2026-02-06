import { useMemo } from 'react'
import type { MonthRow, Category, YearSummary } from '@/types'

export function useExpenseSummary(
  monthRows: MonthRow[],
  categories: Category[],
  columnTotals: Record<string, number>,
  grandTotal: number,
  year: number,
): YearSummary {
  return useMemo(() => {
    const filledMonths = monthRows.filter(r => r.total > 0)
    const monthlyAverage = filledMonths.length > 0
      ? grandTotal / filledMonths.length
      : 0

    let highest = { month: 0, monthName: '', total: 0 }
    let lowest = { month: 0, monthName: '', total: Infinity }

    for (const row of filledMonths) {
      if (row.total > highest.total) {
        highest = { month: row.month, monthName: row.monthName, total: row.total }
      }
      if (row.total < lowest.total) {
        lowest = { month: row.month, monthName: row.monthName, total: row.total }
      }
    }

    if (filledMonths.length === 0) {
      lowest = { month: 0, monthName: '-', total: 0 }
      highest = { month: 0, monthName: '-', total: 0 }
    }

    const categoryTotals: Record<string, number> = {}
    for (const cat of categories) {
      categoryTotals[cat.id] = columnTotals[cat.id] ?? 0
    }

    return {
      year,
      total: grandTotal,
      monthlyAverage,
      highestMonth: highest,
      lowestMonth: lowest,
      categoryTotals,
    }
  }, [monthRows, categories, columnTotals, grandTotal, year])
}
