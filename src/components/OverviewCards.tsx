import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { YearSummary } from '@/types'
import { formatCurrency } from '@/lib/constants'

interface OverviewCardsProps {
  summary: YearSummary
}

export function OverviewCards({ summary }: OverviewCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Общо за {summary.year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(summary.total)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Средно/месец
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(summary.monthlyAverage)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Най-висок месец
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{summary.highestMonth.monthName}</p>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(summary.highestMonth.total)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Най-нисък месец
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{summary.lowestMonth.monthName}</p>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(summary.lowestMonth.total)}</p>
        </CardContent>
      </Card>
    </div>
  )
}
