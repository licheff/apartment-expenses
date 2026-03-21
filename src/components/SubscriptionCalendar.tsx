import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Tooltip as RadixTooltip } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MONTH_NAMES, formatCurrency } from '@/lib/constants'
import { parseLocalDate, paymentDatesInMonth } from '@/lib/subscriptions'
import type { Subscription } from '@/types'

// Bulgarian day abbreviations, Monday-first
const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

// A small set of distinct accent colors for subscription dots
const DOT_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-pink-500',
]

interface SubscriptionCalendarProps {
  subscriptions: Subscription[]
}

export function SubscriptionCalendar({ subscriptions }: SubscriptionCalendarProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1) // 1-indexed
  // Assign a stable color to each subscription by its index
  const colorMap = useMemo(() => {
    const map = new Map<string, string>()
    subscriptions.forEach((sub, i) => {
      map.set(sub.id, DOT_COLORS[i % DOT_COLORS.length])
    })
    return map
  }, [subscriptions])

  // Build a map of day → subscriptions due that day
  const paymentMap = useMemo(() => {
    const map = new Map<number, Subscription[]>()
    for (const sub of subscriptions) {
      const start = parseLocalDate(sub.start_date)
      const dates = paymentDatesInMonth(start, sub.billing_cycle, year, month)
      for (const d of dates) {
        const day = d.getDate()
        if (!map.has(day)) map.set(day, [])
        map.get(day)!.push(sub)
      }
    }
    return map
  }, [subscriptions, year, month])

  const monthTotal = useMemo(() => {
    let total = 0
    paymentMap.forEach(subs => subs.forEach(sub => { total += sub.amount }))
    return total
  }, [paymentMap])

  // Calendar grid math
  // JS getDay(): 0=Sun, 1=Mon … 6=Sat → convert to Monday-first offset
  const firstDayOfMonth = new Date(year, month - 1, 1)
  const jsDay = firstDayOfMonth.getDay() // 0=Sun
  const startOffset = (jsDay + 6) % 7    // Mon=0, Tue=1 … Sun=6
  const daysInMonth = new Date(year, month, 0).getDate()

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear()

  return (
    <RadixTooltip.Provider delayDuration={300}>
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Header — month + nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-semibold text-[15px]">
            {MONTH_NAMES[month]} {year}
          </span>
          {monthTotal > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatCurrency(monthTotal)}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 text-center">
        {DAY_LABELS.map(label => (
          <div key={label} className="text-[11px] font-medium text-muted-foreground py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Leading empty cells */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const subs = paymentMap.get(day) ?? []
          const hasSubs = subs.length > 0
          const todayDay = isToday(day)

          if (!hasSubs) {
            return (
              <div
                key={day}
                className={[
                  'flex flex-col items-center gap-1.5 rounded-md py-3.5 text-sm',
                  todayDay ? 'font-bold' : '',
                ].join(' ')}
              >
                <span className={todayDay
                  ? 'flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold'
                  : 'flex h-[34px] w-[34px] items-center justify-center text-sm'
                }>
                  {day}
                </span>
              </div>
            )
          }

          return (
            <RadixTooltip.Root key={day}>
              <RadixTooltip.Trigger asChild>
                <button
                  type="button"
                  className={[
                    'flex flex-col items-center gap-1.5 rounded-md py-3.5 text-sm transition-colors',
                    'hover:bg-accent cursor-pointer',
                    todayDay ? 'font-bold' : '',
                  ].join(' ')}
                >
                  <span className={todayDay
                    ? 'flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold'
                    : 'flex h-[34px] w-[34px] items-center justify-center text-sm'
                  }>
                    {day}
                  </span>
                  <div className="flex gap-1.5">
                    {subs.slice(0, 3).map(sub => (
                      <Avatar key={sub.id} size="md">
                        {sub.icon_url && <AvatarImage src={sub.icon_url} />}
                        <AvatarFallback className={`${colorMap.get(sub.id)} text-white`}>
                          {sub.name[0]}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {subs.length > 3 && (
                      <span className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        +{subs.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              </RadixTooltip.Trigger>
              <RadixTooltip.Portal>
                <RadixTooltip.Content
                  side="top"
                  align="center"
                  sideOffset={6}
                  avoidCollisions
                  className="z-50 rounded-lg border bg-popover text-popover-foreground shadow-md p-3 min-w-[180px] max-w-[240px]"
                >
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {day} {MONTH_NAMES[month]}
                  </p>
                  <ul className="space-y-1.5">
                    {subs.map(sub => (
                      <li key={sub.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            {sub.icon_url && <AvatarImage src={sub.icon_url} />}
                            <AvatarFallback className={`${colorMap.get(sub.id)} text-white`}>
                              {sub.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{sub.name}</span>
                        </div>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {formatCurrency(sub.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <RadixTooltip.Arrow className="fill-border" />
                </RadixTooltip.Content>
              </RadixTooltip.Portal>
            </RadixTooltip.Root>
          )
        })}

        {/* Trailing empty cells to always fill 6 rows */}
        {Array.from({ length: 42 - startOffset - daysInMonth }).map((_, i) => (
          <div key={`trail-${i}`} />
        ))}
      </div>

    </div>
  </RadixTooltip.Provider>
  )
}
