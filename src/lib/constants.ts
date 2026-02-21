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
