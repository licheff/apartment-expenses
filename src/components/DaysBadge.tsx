import { Badge } from '@/components/ui/badge'

/**
 * Shows urgency of an upcoming payment.
 * Destructive (red) for today or ≤3 days, secondary for ≤7, outline for later.
 */
export function DaysBadge({ days }: { days: number }) {
  if (days === 0) return <Badge variant="destructive">Днес</Badge>
  if (days <= 3) return <Badge variant="destructive">след {days} дни</Badge>
  if (days <= 7) return <Badge variant="secondary">след {days} дни</Badge>
  return <Badge variant="outline" className="text-muted-foreground">след {days} дни</Badge>
}
