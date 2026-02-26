export const MONTH_NAMES: Record<number, string> = {
  1: 'Януари',
  2: 'Февруари',
  3: 'Март',
  4: 'Април',
  5: 'Май',
  6: 'Юни',
  7: 'Юли',
  8: 'Август',
  9: 'Септември',
  10: 'Октомври',
  11: 'Ноември',
  12: 'Декември',
}

export const MONTH_NAMES_SHORT: Record<number, string> = {
  1: 'Яну',
  2: 'Фев',
  3: 'Мар',
  4: 'Апр',
  5: 'Май',
  6: 'Юни',
  7: 'Юли',
  8: 'Авг',
  9: 'Сеп',
  10: 'Окт',
  11: 'Ное',
  12: 'Дек',
}

export const BG_MONTH_TO_NUMBER: Record<string, number> = {
  'Януари': 1,
  'Февруари': 2,
  'Март': 3,
  'Април': 4,
  'Май': 5,
  'Юни': 6,
  'Юли': 7,
  'Август': 8,
  'Септември': 9,
  'Октомври': 10,
  'Ноември': 11,
  'Декември': 12,
}

export const BGN_TO_EUR_RATE = 1.95583

/**
 * Validates and sanitizes amount input.
 * Rules: max 6 digits before decimal, max 2 after, no leading zeros (except lone 0).
 * Returns the cleaned string if valid, or `false` if the input should be rejected (trigger shake).
 */
export function validateAmountInput(raw: string): string | false {
  const v = raw.replace(',', '.')
  // Allow empty
  if (v === '') return ''
  // Must be digits with optional single decimal
  if (!/^\d*\.?\d*$/.test(v)) return false

  const [intPart, decPart] = v.split('.')

  // No leading zeros except a lone "0" or "0."
  if (intPart.length > 1 && intPart[0] === '0') return false
  // Max 6 digits before decimal
  if (intPart.length > 6) return false
  // Max 2 digits after decimal
  if (decPart !== undefined && decPart.length > 2) return false

  return v
}

/**
 * Evaluates a safe arithmetic expression (digits, +, -, *, /, parens).
 * Returns the rounded numeric result, or `false` if invalid or non-positive.
 */
export function evaluateExpression(expr: string): number | false {
  const clean = expr.replace(',', '.')
  if (![...clean].every(c => '0123456789.+-*/() '.includes(c))) return false
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function('return ' + clean)() as unknown
    if (typeof result === 'number' && isFinite(result) && result > 0) {
      return Math.round(result * 100) / 100
    }
    return false
  } catch {
    return false
  }
}

/**
 * Validates input that may be a plain number or an arithmetic expression.
 * Plain numbers use strict validateAmountInput rules.
 * Expressions allow +, -, *, /, (, ), spaces — length is unrestricted during typing.
 */
export function validateExpressionInput(raw: string): string | false {
  const v = raw.replace(',', '.')
  if (v === '') return ''
  if (/^\d*\.?\d*$/.test(v)) return validateAmountInput(v)
  if ([...v].every(c => '0123456789.+-*/() '.includes(c))) return v
  return false
}

export function convertBgnToEur(bgn: number): number {
  return bgn / BGN_TO_EUR_RATE
}

export function convertEurToBgn(eur: number): number {
  return eur * BGN_TO_EUR_RATE
}

export function formatAmountInput(raw: string): string {
  if (!raw) return ''
  const [intPart, decPart] = raw.split('.')
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt
}

function withThousands(n: string): string {
  return n.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')
}

export function formatCurrency(amount: number): string {
  const [int, dec] = amount.toFixed(2).split('.')
  return `${withThousands(int)}.${dec} €`
}

export function formatCurrencyShort(amount: number): string {
  return `${withThousands(Math.round(amount).toString())} €`
}
