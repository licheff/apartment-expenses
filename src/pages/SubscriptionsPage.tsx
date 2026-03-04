import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { ChevronRight, CreditCard, Plus } from 'lucide-react'
import { Header } from '@/components/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AddSubscriptionDialog } from '@/components/AddSubscriptionDialog'
import { EditSubscriptionDialog } from '@/components/EditSubscriptionDialog'
import { ManagePaymentSourcesDialog } from '@/components/ManagePaymentSourcesDialog'
import { SubscriptionCalendar } from '@/components/SubscriptionCalendar'
import { DaysBadge } from '@/components/DaysBadge'
import { SectionCard } from '@/components/SectionCard'
import { TableContainer } from '@/components/TableContainer'
import { UpcomingPaymentsList } from '@/components/UpcomingPaymentsList'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { usePaymentSources } from '@/hooks/usePaymentSources'
import type { CreateSubscriptionInput, Subscription } from '@/types'
import {
  cycleLabelBg,
  daysUntilNextPayment,
  nextPaymentDate,
  parseLocalDate,
} from '@/lib/subscriptions'
import { formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Subscription table ───────────────────────────────────────────────────────

function SubscriptionTable({
  subscriptions,
  onEdit,
}: {
  subscriptions: Subscription[]
  onEdit: (sub: Subscription) => void
}) {
  if (subscriptions.length === 0) {
    return (
      <TableContainer className="py-12 text-center text-sm text-muted-foreground">
        Няма абонаменти в тази категория
      </TableContainer>
    )
  }

  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Наименование</TableHead>
            <TableHead>Сума</TableHead>
            <TableHead className="hidden sm:table-cell">Периодичност</TableHead>
            <TableHead className="hidden sm:table-cell">Следващо плащане</TableHead>
            <TableHead className="hidden sm:table-cell">Начин на плащане</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map(sub => {
            const start = parseLocalDate(sub.start_date)
            const next = nextPaymentDate(start, sub.billing_cycle)
            const days = daysUntilNextPayment(start, sub.billing_cycle)

            return (
              <TableRow key={sub.id} className={cn('cursor-pointer', sub.is_rebate && 'text-muted-foreground')} onClick={() => onEdit(sub)}>
                <TableCell className={cn('font-medium', sub.is_rebate && 'italic')}>{sub.name}</TableCell>
                <TableCell className="tabular-nums">
                  {formatCurrency(sub.amount)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                  {cycleLabelBg(sub.billing_cycle)}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{formatDate(next)}</span>
                    <DaysBadge days={days} />
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                  {sub.payment_source?.name ?? '—'}
                </TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// ─── Upcoming payments ────────────────────────────────────────────────────────

function UpcomingPayments({ subscriptions }: { subscriptions: Subscription[] }) {
  const sorted = [...subscriptions]
    .map(sub => ({
      id: sub.id,
      name: sub.name,
      amount: sub.amount,
      days: daysUntilNextPayment(parseLocalDate(sub.start_date), sub.billing_cycle),
      next: nextPaymentDate(parseLocalDate(sub.start_date), sub.billing_cycle),
    }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 8)

  if (sorted.length === 0) {
    return (
      <SectionCard title="Предстоящи плащания" className="sm:col-span-2">
        <p className="py-8 text-center text-sm text-muted-foreground">Няма предстоящи плащания</p>
      </SectionCard>
    )
  }

  return (
    <SectionCard title="Предстоящи плащания" className="sm:col-span-2">
      <UpcomingPaymentsList items={sorted} />
    </SectionCard>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SubscriptionsPage() {
  const {
    subscriptions,
    activeSubscriptions,
    totalPerMonth,
    totalPerYear,
    loading,
    create,
    update,
    remove,
  } = useSubscriptions()

  const { paymentSources, create: createSource, remove: removeSource } = usePaymentSources()

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)
  const [sourcesOpen, setSourcesOpen] = useState(false)

  const handleOpenAdd = useCallback(() => setAddOpen(true), [])

  // ⌘A keyboard shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'a' && !addOpen && !editOpen && !sourcesOpen) {
        e.preventDefault()
        handleOpenAdd()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleOpenAdd, addOpen, editOpen, sourcesOpen])

  // Hide mobile add button on scroll down, show on scroll up or after idle
  const [showMobileAdd, setShowMobileAdd] = useState(true)
  const lastScrollY = useRef(0)
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const scrollingUp = y < lastScrollY.current
      lastScrollY.current = y

      if (scrollingUp || y < 10) {
        setShowMobileAdd(true)
        if (scrollTimer.current) clearTimeout(scrollTimer.current)
      } else {
        setShowMobileAdd(false)
        if (scrollTimer.current) clearTimeout(scrollTimer.current)
        scrollTimer.current = setTimeout(() => setShowMobileAdd(true), 800)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollTimer.current) clearTimeout(scrollTimer.current)
    }
  }, [])

  const inactiveSubscriptions = subscriptions.filter(s => !s.is_active)

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub)
    setEditOpen(true)
  }

  const handleCreate = async (input: CreateSubscriptionInput) => {
    const { error } = await create(input)
    if (error) {
      toast.error('Грешка при запазване')
    } else {
      toast.success(`${input.name} е добавен`)
    }
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

  return (
    <>
    <Header
      title="Абонаменти"
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSourcesOpen(true)}
          >
            <CreditCard className="h-4 w-4 mr-1.5" />
            Плащания
          </Button>
          <Button size="sm" className="hidden sm:inline-flex" onClick={handleOpenAdd}>
            Добави
            <kbd className="ml-0 text-[11px] opacity-60 font-sans pt-1">⌘A</kbd>
          </Button>
        </>
      }
    />
    <div className="mx-auto max-w-[1000px] px-4 pt-6 pb-12 sm:pb-6 space-y-6">
      {/* Stats strip */}
      {loading ? (
        <Skeleton className="h-[80px] rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="py-0">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Общо / месец</p>
              <p className="text-2xl font-bold tabular-nums leading-tight">
                {formatCurrency(totalPerMonth)}
              </p>
            </CardContent>
          </Card>
          <Card className="py-0">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Общо / година</p>
              <p className="text-2xl font-bold tabular-nums leading-tight">
                {formatCurrency(totalPerYear)}
              </p>
            </CardContent>
          </Card>
          <Card className="py-0">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Активни</p>
              <p className="text-2xl font-bold tabular-nums leading-tight">
                {activeSubscriptions.length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendar + upcoming payments */}
      {loading ? (
        <Skeleton className="h-[320px] rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          <SubscriptionCalendar subscriptions={activeSubscriptions} />
          <UpcomingPayments subscriptions={activeSubscriptions} />
        </div>
      )}

      {/* Subscription tabs + table */}
      {loading ? (
        <Skeleton className="h-[200px] rounded-xl" />
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">
              Активни ({activeSubscriptions.length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Неактивни ({inactiveSubscriptions.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-4">
            <SubscriptionTable subscriptions={activeSubscriptions} onEdit={handleEdit} />
          </TabsContent>
          <TabsContent value="inactive" className="mt-4">
            <SubscriptionTable subscriptions={inactiveSubscriptions} onEdit={handleEdit} />
          </TabsContent>
        </Tabs>
      )}

      {/* Mobile-only sticky add button — positioned above the bottom tab bar (bottom-16) */}
      <div
        className={`fixed bottom-16 left-0 right-0 z-10 p-4 sm:hidden transition-transform duration-200 ${
          showMobileAdd ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <Button className="w-full" size="lg" onClick={handleOpenAdd}>
          <Plus className="h-5 w-5" />
          Добави
        </Button>
      </div>

      {/* Dialogs */}
      <AddSubscriptionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        paymentSources={paymentSources}
        onSave={handleCreate}
      />

      <EditSubscriptionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        subscription={editingSub}
        paymentSources={paymentSources}
        onSave={handleUpdate}
        onDelete={handleDelete}
      />

      <ManagePaymentSourcesDialog
        open={sourcesOpen}
        onOpenChange={setSourcesOpen}
        paymentSources={paymentSources}
        onCreate={createSource}
        onDelete={removeSource}
      />
    </div>
    </>
  )
}
