import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DaysBadge } from '@/components/DaysBadge'
import { formatCurrency } from '@/lib/constants'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
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
  onSelect: (id: string) => void
}

export function UpcomingPaymentsList({ items, onSelect }: UpcomingPaymentsListProps) {
  return (
    <Carousel opts={{ align: 'start', dragFree: true }}>
      <CarouselContent className="-ml-3">
        {items.map(({ id, name, days, next, amount, icon_url }) => (
          <CarouselItem key={id} className="pl-3 basis-1/3">
            <button
              onClick={() => onSelect(id)}
              className="relative w-full text-left border rounded-lg p-4 flex flex-col gap-2 min-h-[140px] bg-card hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="absolute top-4 right-4">
                <DaysBadge days={days} />
              </div>
              <Avatar size="md">
                {icon_url && <AvatarImage src={icon_url} />}
                <AvatarFallback>{name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium line-clamp-2 w-full">{name}</p>
              <p className="text-xs text-muted-foreground">
                {next.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <div className="flex flex-row items-center gap-2 mt-auto">
                <span className="text-sm tabular-nums">{formatCurrency(amount)}</span>
              </div>
            </button>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-0 -translate-x-1/2" />
      <CarouselNext className="right-0 translate-x-1/2" />
    </Carousel>
  )
}
