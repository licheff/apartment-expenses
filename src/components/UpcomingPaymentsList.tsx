import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DaysBadge } from '@/components/DaysBadge'
import { formatCurrency } from '@/lib/constants'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'

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
    <Carousel
      opts={{ align: 'start', dragFree: true }}
      className="px-4 py-3"
    >
      <CarouselContent className="-ml-3">
        {items.map(({ id, name, days, next, amount, icon_url }) => (
          <CarouselItem key={id} className="pl-3 basis-1/2 sm:basis-1/3">
            <div className="border rounded-lg p-3 flex flex-col items-center gap-2 min-h-[140px] bg-card">
              <Avatar size="md">
                {icon_url && <AvatarImage src={icon_url} />}
                <AvatarFallback>{name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium text-center line-clamp-2 w-full">{name}</p>
              <p className="text-xs text-muted-foreground text-center">
                {next.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <div className="flex flex-row items-center justify-center gap-2 mt-auto">
                <span className="text-sm tabular-nums">{formatCurrency(amount)}</span>
                <DaysBadge days={days} />
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
