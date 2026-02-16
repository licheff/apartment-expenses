import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { YearSummary } from '@/types'
import { formatCurrency, MONTH_NAMES_SHORT } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface OverviewCardsProps {
  summary: YearSummary
  previousYear?: number
  previousYearTotal?: number
  previousYearAverage?: number
  rentAmount?: number | null
  paidMonths?: number[]
  onToggleRentMonth?: (month: number) => void
}

function YearComparison({
  current,
  previous,
  previousYear,
}: {
  current: number
  previous: number
  previousYear: number
}) {
  if (previous === 0) return null

  const diff = current - previous
  const pct = (diff / previous) * 100

  const isUp = diff > 0
  const isDown = diff < 0
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus
  const color = isUp
    ? 'text-red-500'
    : isDown
      ? 'text-green-600'
      : 'text-muted-foreground'

  return (
    <p className={`text-xs flex items-center gap-1 mt-1 ${color}`}>
      <Icon className="h-3 w-3" />
      {isUp ? '+' : ''}{pct.toFixed(1)}% спрямо {previousYear}
    </p>
  )
}

export function OverviewCards({
  summary,
  previousYear,
  previousYearTotal,
  previousYearAverage,
  rentAmount,
  paidMonths = [],
  onToggleRentMonth,
}: OverviewCardsProps) {
  const hasPrev = previousYear != null && previousYearTotal != null && previousYearTotal > 0
  const hasRent = rentAmount != null && rentAmount > 0
  const hasNotMyExpenses = summary.myTotal !== summary.total
  const totalCollected = hasRent ? paidMonths.length * rentAmount : 0
  const netBalance = totalCollected - summary.totalWithYearly

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {/* Total for year */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Общо за {summary.year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">
            {formatCurrency(summary.totalWithYearly)}
          </p>
          {hasNotMyExpenses && (
            <p className="text-xs text-muted-foreground mt-1">
              Мои: {formatCurrency(summary.myTotal + summary.yearlyExpensesTotal)}
            </p>
          )}
          {summary.yearlyExpensesTotal > 0 && (
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.total)} мес. + {formatCurrency(summary.yearlyExpensesTotal)} год.
            </p>
          )}
          {hasPrev && (
            <YearComparison
              current={summary.total}
              previous={previousYearTotal!}
              previousYear={previousYear!}
            />
          )}
        </CardContent>
      </Card>

      {/* Monthly average */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Средно/месец
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(summary.monthlyAverage)}</p>
          {hasPrev && previousYearAverage != null && previousYearAverage > 0 && (
            <YearComparison
              current={summary.monthlyAverage}
              previous={previousYearAverage}
              previousYear={previousYear!}
            />
          )}
        </CardContent>
      </Card>

      {/* Highest month */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Най-висок месец
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(summary.highestMonth.total)}</p>
          <p className="text-xs text-muted-foreground">{summary.highestMonth.monthName}</p>
        </CardContent>
      </Card>

      {/* Lowest month */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Най-нисък месец
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(summary.lowestMonth.total)}</p>
          <p className="text-xs text-muted-foreground">{summary.lowestMonth.monthName}</p>
        </CardContent>
      </Card>

      {/* Rent card */}
      {hasRent && (
        <Card className="col-span-2 lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Наем ({formatCurrency(rentAmount)}/мес.)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {formatCurrency(totalCollected)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {paidMonths.length} от 12 платени
                </p>
                <p
                  className={cn(
                    'text-sm font-semibold mt-1',
                    netBalance >= 0 ? 'text-green-600' : 'text-red-500',
                  )}
                >
                  Баланс: {netBalance >= 0 ? '+' : ''}
                  {formatCurrency(netBalance)}
                </p>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                  const isPaid = paidMonths.includes(m)
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onToggleRentMonth?.(m)}
                      className={cn(
                        'h-8 w-10 rounded text-xs font-medium border transition-colors cursor-pointer',
                        isPaid
                          ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300'
                          : 'bg-muted border-border text-muted-foreground hover:bg-accent',
                      )}
                    >
                      {MONTH_NAMES_SHORT[m]}
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
