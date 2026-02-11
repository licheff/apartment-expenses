import { useMemo } from 'react'
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MonthRow } from '@/types'
import { MONTH_NAMES_SHORT } from '@/lib/constants'

interface MonthlyTrendChartProps {
  currentYear: number
  currentMonthRows: MonthRow[]
  previousYear?: number
  previousMonthRows?: MonthRow[]
}

export function MonthlyTrendChart({
  currentYear,
  currentMonthRows,
  previousYear,
  previousMonthRows,
}: MonthlyTrendChartProps) {
  const chartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {
      current: {
        label: String(currentYear),
        color: '#404040',
      },
    }
    if (previousYear) {
      config.previous = {
        label: String(previousYear),
        color: '#b0b0b0',
      }
    }
    return config
  }, [currentYear, previousYear])

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const currentTotal = currentMonthRows[i]?.total ?? 0
      const entry: Record<string, string | number> = {
        month: MONTH_NAMES_SHORT[month],
        current: currentTotal,
      }
      if (previousMonthRows) {
        entry.previous = previousMonthRows[i]?.total ?? 0
      }
      return entry
    })
  }, [currentMonthRows, previousMonthRows])

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Месечна тенденция</CardTitle>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={v => `${v}`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="current"
              stroke="var(--color-current)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--color-current)' }}
              activeDot={{ r: 5 }}
            />
            {previousMonthRows && (
              <Line
                type="monotone"
                dataKey="previous"
                stroke="var(--color-previous)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: 'var(--color-previous)' }}
                activeDot={{ r: 5 }}
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
