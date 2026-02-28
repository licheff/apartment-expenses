import { Link } from 'react-router-dom'
import { Receipt, ArrowRight } from 'lucide-react'
import { Header } from '@/components/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SectionCard } from '@/components/SectionCard'
import { UpcomingPaymentsList } from '@/components/UpcomingPaymentsList'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import {
  daysUntilNextPayment,
  nextPaymentDate,
  parseLocalDate,
} from '@/lib/subscriptions'
import { formatCurrency } from '@/lib/constants'


export function OverviewPage() {
  const { activeSubscriptions, totalPerMonth, totalPerYear, loading } = useSubscriptions()

  const upcoming = [...activeSubscriptions]
    .map(sub => ({
      id: sub.id,
      name: sub.name,
      amount: sub.amount,
      days: daysUntilNextPayment(parseLocalDate(sub.start_date), sub.billing_cycle),
      next: nextPaymentDate(parseLocalDate(sub.start_date), sub.billing_cycle),
    }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 5)

  return (
    <>
    <Header title="Преглед" />
    <div className="mx-auto max-w-[1000px] px-4 py-6 space-y-6">
      {/* Subscription stats */}
      {loading ? (
        <Skeleton className="h-[80px] rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="py-0">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Абонаменти / месец</p>
              <p className="text-2xl font-bold tabular-nums leading-tight">
                {formatCurrency(totalPerMonth)}
              </p>
            </CardContent>
          </Card>
          <Card className="py-0">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Абонаменти / година</p>
              <p className="text-2xl font-bold tabular-nums leading-tight">
                {formatCurrency(totalPerYear)}
              </p>
            </CardContent>
          </Card>
          <Card className="py-0">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Активни абонаменти</p>
              <p className="text-2xl font-bold tabular-nums leading-tight">
                {activeSubscriptions.length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming payments */}
      {loading ? (
        <Skeleton className="h-[200px] rounded-xl" />
      ) : upcoming.length > 0 ? (
        <SectionCard title="Предстоящи плащания">
          <UpcomingPaymentsList items={upcoming} />
        </SectionCard>
      ) : null}

      {/* Quick link to Expenses */}
      <Link
        to="/expenses"
        className="flex items-center justify-between rounded-lg border bg-card px-4 py-4 hover:bg-accent transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Разходи по апартамент</p>
            <p className="text-xs text-muted-foreground">Месечни разходи, наем, категории</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
    </>
  )
}
