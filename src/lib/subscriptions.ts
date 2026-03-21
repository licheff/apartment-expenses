import type { BillingCycle } from '@/types'

// Parse "YYYY-MM-DD" as a local date (avoids UTC-midnight timezone shift)
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Advance a date by one billing cycle interval
function addInterval(date: Date, cycle: BillingCycle): Date {
  const d = new Date(date)
  switch (cycle) {
    case 'weekly':    d.setDate(d.getDate() + 7); break
    case 'monthly':   d.setMonth(d.getMonth() + 1); break
    case 'quarterly': d.setMonth(d.getMonth() + 3); break
    case 'bi_annual': d.setMonth(d.getMonth() + 6); break
    case 'yearly':    d.setFullYear(d.getFullYear() + 1); break
    case 'biennial':  d.setFullYear(d.getFullYear() + 2); break
    case 'triennial': d.setFullYear(d.getFullYear() + 3); break
  }
  return d
}

// Monthly cost equivalent for summary stats
const MONTHLY_FACTORS: Record<BillingCycle, number> = {
  weekly:    52 / 12,
  monthly:   1,
  quarterly: 1 / 3,
  bi_annual: 1 / 6,
  yearly:    1 / 12,
  biennial:  1 / 24,
  triennial: 1 / 36,
}

export function monthlyEquivalent(amount: number, cycle: BillingCycle): number {
  return amount * MONTHLY_FACTORS[cycle]
}

// Next payment date >= today, computed by advancing from start_date
export function nextPaymentDate(startDate: Date, cycle: BillingCycle): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let d = new Date(startDate)
  d.setHours(0, 0, 0, 0)

  // If start is in the future, that IS the next payment
  if (d >= today) return d

  // Advance until we reach or pass today
  while (d < today) {
    d = addInterval(d, cycle)
  }
  return d
}

// All payment dates that fall within a given month (1-indexed month)
// Weekly subscriptions can hit 4–5 times; others hit 0 or 1 time
export function paymentDatesInMonth(
  startDate: Date,
  cycle: BillingCycle,
  year: number,
  month: number,
): Date[] {
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd   = new Date(year, month, 0)   // last day of month

  // Find first occurrence at or after the month start
  let d = new Date(startDate)
  d.setHours(0, 0, 0, 0)
  while (d < monthStart) {
    d = addInterval(d, cycle)
  }

  const results: Date[] = []
  while (d <= monthEnd) {
    results.push(new Date(d))
    d = addInterval(d, cycle)
  }
  return results
}

// Days until next payment (always >= 0)
export function daysUntilNextPayment(startDate: Date, cycle: BillingCycle): number {
  const next = nextPaymentDate(startDate, cycle)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// Bulgarian label for each billing cycle
export function cycleLabelBg(cycle: BillingCycle): string {
  const labels: Record<BillingCycle, string> = {
    weekly:    'Седмично',
    monthly:   'Месечно',
    quarterly: 'Тримесечно',
    bi_annual: 'Полугодишно',
    yearly:    'Годишно',
    biennial:  'Двугодишно',
    triennial: 'Тригодишно',
  }
  return labels[cycle]
}
