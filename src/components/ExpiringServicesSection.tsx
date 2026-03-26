import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ExpiringService } from '@/hooks/useExpiringServices'

function ExpiryBadge({ days }: { days: number }) {
  if (days < 0)
    return <Badge variant="destructive">Изтекъл</Badge>
  if (days === 0)
    return <Badge variant="destructive">Днес</Badge>
  if (days <= 30)
    return (
      <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
        след {days} дни
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-muted-foreground">
      {new Date(days * 86400000 + Date.now()).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' })}
    </Badge>
  )
}

interface ExpiringServicesSectionProps {
  services: ExpiringService[]
}

export function ExpiringServicesSection({ services }: ExpiringServicesSectionProps) {
  return (
    <Card className="h-full py-0">
      <CardHeader className="px-4 pt-4 pb-3">
        <CardTitle className="text-sm text-foreground">Изтичащи услуги</CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            Няма зададени дати
          </p>
        ) : (
          <div className="space-y-2">
            {services.map(service => (
              <div
                key={service.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="min-w-0 mr-2">
                  <p className="text-sm truncate">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.apartment_name}</p>
                </div>
                <ExpiryBadge days={service.daysUntil} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
