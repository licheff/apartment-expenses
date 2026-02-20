import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Bar, Line, ComposedChart, CartesianGrid, XAxis, YAxis } from 'recharts'
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

interface YearComparisonChartProps {
  currentYear: number
  currentMonthRows: MonthRow[]
  prevYear: number
  prevMonthRows: MonthRow[]
}

export function YearComparisonChart({
  currentYear,
  currentMonthRows,
  prevYear,
  prevMonthRows,
}: YearComparisonChartProps) {
  const [collapsed, setCollapsed] = useState(false)

  const hasPrevData = prevMonthRows.some(r => r.total > 0)

  const chartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {
      current: {
        label: String(currentYear),
        color: '#525252', // neutral-600
      },
    }
    if (hasPrevData) {
      config.previous = {
        label: String(prevYear),
        color: '#a3a3a3', // neutral-400
      }
    }
    return config
  }, [currentYear, prevYear, hasPrevData])

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const entry: Record<string, string | number> = {
        month: MONTH_NAMES_SHORT[month],
        current: currentMonthRows[i]?.total ?? 0,
      }
      if (hasPrevData) {
        entry.previous = prevMonthRows[i]?.total ?? 0
      }
      return entry
    })
  }, [currentMonthRows, prevMonthRows, hasPrevData])

  return (
    <Card className="py-0">
      <CardHeader className="px-4 pt-4 pb-2">
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => setCollapsed(c => !c)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          <CardTitle className="text-sm font-medium">Графика</CardTitle>
        </button>
      </CardHeader>
      {!collapsed && (
        <CardContent className="px-4 pb-4 overflow-hidden">
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <ComposedChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={v => `${v}`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="current"
                fill="var(--color-current)"
                radius={[3, 3, 0, 0]}
                barSize={24}
              />
              {hasPrevData && (
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
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      )}
    </Card>
  )
}
