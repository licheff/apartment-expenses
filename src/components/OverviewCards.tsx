import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { YearSummary } from '@/types'
import { formatCurrency } from '@/lib/constants'

interface OverviewCardsProps {
  summary: YearSummary
  previousYear?: number
  previousYearTotal?: number
  previousYearAverage?: number
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
}: OverviewCardsProps) {
  const hasPrev = previousYear != null && previousYearTotal != null && previousYearTotal > 0

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Общо за {summary.year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(summary.total)}</p>
          {hasPrev && (
            <YearComparison
              current={summary.total}
              previous={previousYearTotal!}
              previousYear={previousYear!}
            />
          )}
        </CardContent>
      </Card>
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
    </div>
  )
}
