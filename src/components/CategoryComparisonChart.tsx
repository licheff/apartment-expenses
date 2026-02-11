import { useMemo } from 'react'
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
import type { Category, MonthRow } from '@/types'
import { MONTH_NAMES_SHORT } from '@/lib/constants'

// Grey shades from light to dark
const GREY_SHADES_LIGHT = [
  '#d4d4d4',
  '#a3a3a3',
  '#737373',
  '#525252',
  '#262626',
]

const GREY_SHADES_DARK = [
  '#404040',
  '#6b6b6b',
  '#8b8b8b',
  '#b0b0b0',
  '#d4d4d4',
]

interface CategoryComparisonChartProps {
  categories: Category[]
  monthRows: MonthRow[]
}

export function CategoryComparisonChart({ categories, monthRows }: CategoryComparisonChartProps) {
  const isDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

  // Use stable keys like "cat0", "cat1" instead of UUIDs (UUIDs break CSS variable names)
  const chartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {}
    const shades = isDark ? GREY_SHADES_DARK : GREY_SHADES_LIGHT
    categories.forEach((cat, i) => {
      config[`cat${i}`] = {
        label: cat.name,
        color: shades[i % shades.length],
      }
    })
    return config
  }, [categories, isDark])

  const chartData = useMemo(() => {
    return monthRows.map(row => {
      const entry: Record<string, string | number> = {
        month: MONTH_NAMES_SHORT[row.month],
      }
      categories.forEach((cat, i) => {
        entry[`cat${i}`] = row.expenses[cat.id] ?? 0
      })
      return entry
    })
  }, [monthRows, categories])

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Разходи по категории</CardTitle>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={v => `${v}`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {categories.map((_, i) => (
              <Bar
                key={`cat${i}`}
                dataKey={`cat${i}`}
                stackId="a"
                fill={`var(--color-cat${i})`}
                radius={i === categories.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
