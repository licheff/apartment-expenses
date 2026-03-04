import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DaysBadge } from '@/components/DaysBadge'
import { formatCurrency } from '@/lib/constants'

export interface UpcomingItem {
  id: string
  name: string
  days: number
  next: Date
  amount: number
  icon_url: string | null
}

interface UpcomingPaymentsListProps {
  items: UpcomingItem[]
}

export function UpcomingPaymentsList({ items }: UpcomingPaymentsListProps) {
  return (
    <ul className="divide-y">
      {items.map(({ id, name, days, next, amount, icon_url }) => (
        <li key={id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar size="md">
              {icon_url && <AvatarImage src={icon_url} />}
              <AvatarFallback>{name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{name}</p>
              <p className="text-xs text-muted-foreground">
                {next.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm tabular-nums">{formatCurrency(amount)}</span>
            <DaysBadge days={days} />
          </div>
        </li>
      ))}
    </ul>
  )
}
