import type { MonthRow } from '@/types'
import { MONTH_NAMES_SHORT, formatCurrencyShort } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface MonthIndicatorProps {
  monthRows: MonthRow[]
  onEditMonth: (month: number) => void
  onAddMonth: (month: number) => void
  selectedYear: number
}

export function MonthIndicator({
  monthRows,
  onEditMonth,
  onAddMonth,
  selectedYear,
}: MonthIndicatorProps) {
  const now = new Date()
  const isCurrentYear = selectedYear === now.getFullYear()
  const currentMonth = now.getMonth() + 1

  return (
    <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
      {monthRows.map(row => {
        const hasData = row.total > 0
        const isCurrent = isCurrentYear && row.month === currentMonth

        return (
          <button
            key={row.month}
            type="button"
            onClick={() => (hasData ? onEditMonth(row.month) : onAddMonth(row.month))}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer',
              'hover:bg-accent',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
              hasData
                ? 'bg-muted font-semibold text-foreground'
                : 'opacity-40 text-muted-foreground',
              isCurrent && 'ring-1 ring-foreground/30',
            )}
          >
            <span>{MONTH_NAMES_SHORT[row.month]}</span>
            {hasData && (
              <span className="text-[10px] tabular-nums text-muted-foreground font-normal">
                {formatCurrencyShort(row.total)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
