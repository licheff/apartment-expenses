import { ArrowUpRight, ArrowDownRight, CircleCheck, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { YearSummary } from '@/types'
import { formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface YearSummaryStripProps {
  summary: YearSummary
  previousYear?: number
  previousYearTotal?: number
  previousYearAverage?: number
  rentAmount?: number | null
  paidMonths?: number[]
}

function YoYBadge({
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
  const Icon = isUp ? ArrowDownRight : isDown ? ArrowUpRight : Minus
  const color = isUp
    ? 'text-destructive'
    : isDown
      ? 'text-green-600'
      : 'text-muted-foreground'

  return (
    <span className={cn('inline-flex items-center pt-2 text-[12px]', color)}>
      <Icon className="h-3 w-3" />
      {isUp ? '+' : ''}{pct.toFixed(1)}% спрямо {previousYear}
    </span>
  )
}

export function YearSummaryStrip({
  summary,
  previousYear,
  previousYearTotal,
  previousYearAverage,
  rentAmount,
  paidMonths = [],
}: YearSummaryStripProps) {
  const hasPrev =
    previousYear != null && previousYearTotal != null && previousYearTotal > 0
  const hasRent = rentAmount != null && rentAmount > 0
  const hasNotMyExpenses = summary.myTotal !== summary.total
  const totalCollected = hasRent ? paidMonths.length * rentAmount : 0
  const balance = hasRent ? totalCollected - summary.totalWithYearly : 0

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4',
        hasRent ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
      )}
    >
      {/* Card 1 — Total */}
      <Card className="py-0">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Общо за {summary.year}
          </p>
          <p className="text-2xl font-bold tabular-nums leading-tight">
            {formatCurrency(summary.totalWithYearly)}
          </p>
          {/* {hasNotMyExpenses && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Мои: {formatCurrency(summary.myTotal + summary.yearlyExpensesTotal)}
            </p>
          )} */}
          {summary.yearlyExpensesTotal > 0 && (
            <p className="text-[12px] text-muted-foreground">
              {/* {formatCurrency(summary.total)} мес. + {formatCurrency(summary.yearlyExpensesTotal)} год. */}
            </p>
          )}
          {(summary.highestMonth.total > 0 || summary.lowestMonth.total > 0) && (
            <div className="flex items-center flex-wrap gap-1 text-[12px] text-foreground pt-2">
              <span className="flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3 text-primary" />
                {summary.highestMonth.monthName} ({formatCurrency(summary.highestMonth.total)})
              </span>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <ArrowDownRight className="h-3 w-3 text-primary" />
                {summary.lowestMonth.monthName} ({formatCurrency(summary.lowestMonth.total)})
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 2 — Average */}
      <Card className="py-0">
        <CardContent className="p-4 space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Средно/месец</p>
            <p className="text-2xl font-bold tabular-nums leading-tight">
              {formatCurrency(summary.monthlyAverage)}
            </p>
            {hasPrev && (
              <YoYBadge
                current={summary.monthlyAverage}
                previous={previousYearAverage ?? 0}
                previousYear={previousYear!}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 3 — Rent (only if configured) */}
      {hasRent && (
        <Card className="py-0">
          <CardContent className="p-4 space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Наем</p>
              <p className="text-2xl font-bold tabular-nums leading-tight">
                {formatCurrency(totalCollected)}
              </p>
              <p className="flex items-center gap-1 text-[12px] text-accent-foreground pt-2">
                <CircleCheck className="h-3 w-3" />
                {paidMonths.length} от 12 платени
              </p>
            </div>
            {/* <div className="border-t pt-2">
              <p className="text-sm text-muted-foreground">Баланс</p>
              <p
                className={cn(
                  'text-lg font-semibold tabular-nums leading-tight',
                  balance >= 0 ? 'text-green-600' : 'text-red-500',
                )}
              >
                {balance >= 0 ? '+' : ''}
                {formatCurrency(balance)}
              </p>
            </div> */}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
