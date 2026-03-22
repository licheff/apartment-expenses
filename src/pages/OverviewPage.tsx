import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Receipt, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { UpcomingPaymentsList } from '@/components/UpcomingPaymentsList'
import { EditSubscriptionDialog } from '@/components/EditSubscriptionDialog'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { usePaymentSources } from '@/hooks/usePaymentSources'
import { useSubscriptionPriceChanges } from '@/hooks/useSubscriptionPriceChanges'
import { SpendingTrendChart } from '@/components/SpendingTrendChart'
import { useOverviewStats } from '@/hooks/useOverviewStats'
import type { Subscription, CreateSubscriptionInput } from '@/types'
import {
  daysUntilNextPayment,
  nextPaymentDate,
  parseLocalDate,
  paymentDatesInMonth,
} from '@/lib/subscriptions'
import { formatCurrency, MONTH_NAMES } from '@/lib/constants'


export function OverviewPage() {
  const { activeSubscriptions, loading: subscriptionsLoading, update, remove } = useSubscriptions()
  const {
    lastMonthUtilities,
    lastMonth,
    monthlyUtilityTotals,
    loading: overviewLoading,
  } = useOverviewStats()
  const { paymentSources } = usePaymentSources()

  const [editOpen, setEditOpen] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)

  const {
    priceChanges,
    loading: priceChangesLoading,
    recordPriceChange,
  } = useSubscriptionPriceChanges(editingSub?.id ?? null)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Actual amounts due per calendar month (not averages)
  const monthlySubscriptionTotals = useMemo(() => {
    const totals: Record<number, number> = {}
    for (let m = 1; m <= 12; m++) {
      totals[m] = activeSubscriptions
        .filter(s => !s.is_rebate)
        .reduce((sum, s) => {
          const dates = paymentDatesInMonth(parseLocalDate(s.start_date), s.billing_cycle, currentYear, m)
          return sum + dates.length * s.amount
        }, 0)
    }
    return totals
  }, [activeSubscriptions, currentYear])

  const totalThisMonth = monthlySubscriptionTotals[currentMonth] ?? 0

  const upcoming = [...activeSubscriptions]
    .map(sub => ({
      id: sub.id,
      name: sub.name,
      amount: sub.amount,
      icon_url: sub.icon_url,
      days: daysUntilNextPayment(parseLocalDate(sub.start_date), sub.billing_cycle),
      next: nextPaymentDate(parseLocalDate(sub.start_date), sub.billing_cycle),
    }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 5)

  const handleCardSelect = (id: string) => {
    const sub = activeSubscriptions.find(s => s.id === id) ?? null
    setEditingSub(sub)
    setEditOpen(true)
  }

  const handleUpdate = async (id: string, input: Partial<CreateSubscriptionInput>) => {
    const { error } = await update(id, input)
    if (error) {
      toast.error('Грешка при запазване')
    } else {
      toast.success('Промените са запазени')
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await remove(id)
    if (error) {
      toast.error('Грешка при изтриване')
    } else {
      toast.success('Абонаментът е изтрит')
    }
  }

  const handleRecordPriceChange = async (input: {
    amount: number
    previous_amount: number | null
    effective_from: string
  }) => {
    const { error } = await recordPriceChange(input)
    if (error) {
      toast.error('Грешка при записване на промяната')
    }
    return { error }
  }

  return (
    <>
    <Header title="Преглед" />
    <div className="mx-auto max-w-[1000px] px-4 py-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {overviewLoading || subscriptionsLoading ? (
          <>
            <Skeleton className="h-[80px] rounded-xl" />
            <Skeleton className="h-[80px] rounded-xl" />
          </>
        ) : (
          <>
            <Card className="py-0">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Комунални за {MONTH_NAMES[lastMonth].toLowerCase()}
                </p>
                <p className="text-2xl font-bold tabular-nums leading-tight">
                  {formatCurrency(lastMonthUtilities)}
                </p>
              </CardContent>
            </Card>
            <Card className="py-0">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Абонаменти за {MONTH_NAMES[currentMonth].toLowerCase()}
                </p>
                <p className="text-2xl font-bold tabular-nums leading-tight">
                  {formatCurrency(totalThisMonth)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeSubscriptions.length === 1
                    ? '1 активен абонамент'
                    : `${activeSubscriptions.length} активни абонамента`}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Upcoming payments */}
      {subscriptionsLoading ? (
        <Skeleton className="h-[200px] rounded-xl" />
      ) : upcoming.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Предстоящи плащания</h2>
            <Link
              to="/subscriptions"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              покажи всички
            </Link>
          </div>
          <UpcomingPaymentsList items={upcoming} onSelect={handleCardSelect} />
        </div>
      ) : null}

      {/* Spending trend */}
      {overviewLoading || subscriptionsLoading ? (
        <Skeleton className="h-[280px] rounded-xl" />
      ) : (
        <SpendingTrendChart
          monthlyUtilityTotals={monthlyUtilityTotals}
          monthlySubscriptionTotals={monthlySubscriptionTotals}
        />
      )}

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

    <EditSubscriptionDialog
      open={editOpen}
      onOpenChange={setEditOpen}
      subscription={editingSub}
      paymentSources={paymentSources}
      priceChanges={priceChanges}
      priceChangesLoading={priceChangesLoading}
      onSave={handleUpdate}
      onDelete={handleDelete}
      onRecordPriceChange={handleRecordPriceChange}
    />
    </>
  )
}
