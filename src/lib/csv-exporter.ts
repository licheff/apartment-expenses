import Papa from 'papaparse'
import type { Category, MonthRow } from '@/types'
import { MONTH_NAMES } from '@/lib/constants'

export function exportToCsv(
  apartmentName: string,
  year: number,
  categories: Category[],
  monthRows: MonthRow[],
  columnTotals: Record<string, number>,
  grandTotal: number,
): void {
  const rows: (string | number)[][] = []

  // Year header
  rows.push([String(year)])

  // Column headers
  rows.push(['', ...categories.map(c => c.name), 'Общо'])

  // Month rows
  for (const row of monthRows) {
    const monthData: (string | number)[] = [MONTH_NAMES[row.month]]
    for (const cat of categories) {
      monthData.push(row.expenses[cat.id] ?? 0)
    }
    monthData.push(row.total)
    rows.push(monthData)
  }

  // Totals row
  const totalsRow: (string | number)[] = ['Общо']
  for (const cat of categories) {
    totalsRow.push(columnTotals[cat.id] ?? 0)
  }
  totalsRow.push(grandTotal)
  rows.push(totalsRow)

  const csv = Papa.unparse(rows)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${apartmentName}_${year}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
