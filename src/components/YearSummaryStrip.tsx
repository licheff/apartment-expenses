import { ArrowUpRight, ArrowDownRight, CircleCheck, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus
  return (
    <Badge
      variant="outline"
      className={cn(
        'mt-2',
        isUp && 'border-destructive/30 bg-destructive/10 text-destructive',
        isDown && 'border-green-600/30 bg-green-500/10 text-green-600 dark:text-green-500 dark:border-green-500/30',
        !isUp && !isDown && 'text-muted-foreground',
      )}
    >
      <Icon />
      {isUp ? '+' : ''}{pct.toFixed(1)}% спрямо {previousYear}
    </Badge>
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
  const totalCollected = hasRent ? paidMonths.length * rentAmount : 0

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
              <Badge variant="secondary" className="mt-2">
                <CircleCheck />
                {paidMonths.length} от 12 платени
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
