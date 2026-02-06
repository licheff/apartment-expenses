import Papa from 'papaparse'
import { BG_MONTH_TO_NUMBER } from '@/lib/constants'

export interface ParsedExpense {
  year: number
  month: number
  categoryName: string
  amount: number
}

export interface ParseResult {
  expenses: ParsedExpense[]
  years: number[]
  categoryNames: string[]
  errors: string[]
}

const SKIP_COLUMNS = new Set(['Общо', 'Общо/година'])
const SKIP_ROWS = new Set(['Общо', 'Средно/месец'])

function isYearRow(row: string[]): number | null {
  const first = String(row[0]).trim()
  const num = Number(first)
  if (num >= 2000 && num <= 2099 && row.slice(1).every(c => !c || String(c).trim() === '')) {
    return num
  }
  return null
}

function isHeaderRow(row: string[]): boolean {
  // Header row usually has empty first cell and category names after
  const cells = row.map(c => String(c).trim())
  if (cells[0] !== '' && !BG_MONTH_TO_NUMBER[cells[0]]) {
    // Could be "Месец" or similar header label
    return cells.slice(1).some(c => c !== '' && !SKIP_COLUMNS.has(c) && isNaN(Number(c)))
  }
  return cells.slice(1).some(c => c !== '' && !SKIP_COLUMNS.has(c) && isNaN(Number(c)))
}

export function parseGoogleSheetsCsv(csvText: string): ParseResult {
  const result = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  const expenses: ParsedExpense[] = []
  const errors: string[] = []
  const yearsSet = new Set<number>()
  const categoryNamesSet = new Set<string>()

  let currentYear: number | null = null
  let currentHeaders: string[] = []

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i].map(c => String(c ?? '').trim())

    // Check if this is a year row
    const yearVal = isYearRow(row)
    if (yearVal !== null) {
      currentYear = yearVal
      yearsSet.add(yearVal)
      currentHeaders = []
      continue
    }

    // Check if this is a header row (has text category names)
    if (currentYear && currentHeaders.length === 0 && isHeaderRow(row)) {
      currentHeaders = row.map(c => c.trim())
      for (const h of currentHeaders) {
        if (h && !SKIP_COLUMNS.has(h) && h !== '' && h !== 'Месец') {
          categoryNamesSet.add(h)
        }
      }
      continue
    }

    // Skip summary rows
    if (SKIP_ROWS.has(row[0])) continue

    // Try to parse as a month data row
    const monthName = row[0]
    const monthNum = BG_MONTH_TO_NUMBER[monthName]

    if (monthNum && currentYear && currentHeaders.length > 0) {
      for (let j = 1; j < row.length && j < currentHeaders.length; j++) {
        const header = currentHeaders[j]
        if (!header || SKIP_COLUMNS.has(header) || header === 'Месец') continue

        const rawValue = row[j].replace(/[^\d.,\-]/g, '').replace(',', '.')
        const amount = Number(rawValue)

        if (!isNaN(amount) && amount > 0) {
          expenses.push({
            year: currentYear,
            month: monthNum,
            categoryName: header,
            amount,
          })
        }
      }
    }
  }

  return {
    expenses,
    years: [...yearsSet].sort((a, b) => a - b),
    categoryNames: [...categoryNamesSet],
    errors,
  }
}
