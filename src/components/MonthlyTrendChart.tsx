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
import type { YearMonthlyTotals } from '@/hooks/useAllYearsMonthlyTotals'
import { MONTH_NAMES_SHORT } from '@/lib/constants'

// Palette for year lines – current year is always the boldest
const YEAR_COLORS = [
  '#6b7280', // gray-500
  '#a3a3a3', // neutral-400
  '#d4d4d4', // neutral-300
  '#c4b5fd', // violet-300
  '#93c5fd', // blue-300
  '#86efac', // green-300
  '#fca5a5', // red-300
  '#fdba74', // orange-300
]

interface MonthlyTrendChartProps {
  currentYear: number
  currentMonthRows: MonthRow[]
  otherYearsData: YearMonthlyTotals[]
}

export function MonthlyTrendChart({
  currentYear,
  currentMonthRows,
  otherYearsData,
}: MonthlyTrendChartProps) {
  // Build sorted list: current year first, then other years descending
  const allYears = useMemo(() => {
    const others = otherYearsData.map(d => d.year).sort((a, b) => b - a)
    return [currentYear, ...others]
  }, [currentYear, otherYearsData])

  const chartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {}
    for (let i = 0; i < allYears.length; i++) {
      const year = allYears[i]
      config[`y${year}`] = {
        label: String(year),
        color: i === 0 ? '#404040' : YEAR_COLORS[(i - 1) % YEAR_COLORS.length],
      }
    }
    return config
  }, [allYears])

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const entry: Record<string, string | number> = {
        month: MONTH_NAMES_SHORT[month],
      }
      // Current year
      entry[`y${currentYear}`] = currentMonthRows[i]?.total ?? 0
      // Other years
      for (const yd of otherYearsData) {
        entry[`y${yd.year}`] = yd.monthTotals[i] ?? 0
      }
      return entry
    })
  }, [currentYear, currentMonthRows, otherYearsData])

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
            {allYears.map((year, i) => (
              <Line
                key={year}
                type="monotone"
                dataKey={`y${year}`}
                stroke={`var(--color-y${year})`}
                strokeWidth={i === 0 ? 2 : 1.5}
                strokeDasharray={i === 0 ? undefined : '5 5'}
                dot={{ r: i === 0 ? 3 : 2, fill: `var(--color-y${year})` }}
                activeDot={{ r: i === 0 ? 5 : 4 }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
