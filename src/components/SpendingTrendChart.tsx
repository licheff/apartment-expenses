// src/components/SpendingTrendChart.tsx
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MONTH_NAMES_SHORT } from '@/lib/constants'

interface SpendingTrendChartProps {
  monthlyUtilityTotals: Record<number, number>  // sparse; ?? 0 applied internally
  subscriptionsPerMonth: number
}

const chartConfig: ChartConfig = {
  utilities: { label: 'Комунални', color: 'var(--chart-1)' },
  subscriptions: { label: 'Абонаменти', color: 'var(--chart-2)' },
}

export function SpendingTrendChart({
  monthlyUtilityTotals,
  subscriptionsPerMonth,
}: SpendingTrendChartProps) {
  const [collapsed, setCollapsed] = useState(false)
  // false = open/visible; {!collapsed && <content />}

  const chartData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        month: MONTH_NAMES_SHORT[i + 1],          // MONTH_NAMES_SHORT keys are 1–12
        utilities: monthlyUtilityTotals[i + 1] ?? 0,
        subscriptions: subscriptionsPerMonth,
      })),
    [monthlyUtilityTotals, subscriptionsPerMonth],
  )

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
          <CardTitle className="text-sm font-medium">Разходи по месец</CardTitle>
        </button>
      </CardHeader>
      {!collapsed && (
        <CardContent className="px-4 pb-4 overflow-hidden">
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="utilities"
                fill="var(--color-utilities)"
                stackId="spending"
                radius={[0, 0, 0, 0] as [number, number, number, number]}
              />
              <Bar
                dataKey="subscriptions"
                fill="var(--color-subscriptions)"
                stackId="spending"
                radius={[3, 3, 0, 0] as [number, number, number, number]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      )}
    </Card>
  )
}
