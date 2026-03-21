import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { CurrencyToggle } from '@/components/CurrencyToggle'
import { IconUpload } from '@/components/IconUpload'
import type { BillingCycle, CreateSubscriptionInput, PaymentSource, Subscription, SubscriptionPriceChange } from '@/types'
import { cycleLabelBg } from '@/lib/subscriptions'
import { convertUsdToEur, formatCurrency } from '@/lib/constants'
import { uploadSubscriptionIcon } from '@/lib/storage'

type Currency = 'EUR' | 'USD'

const BILLING_CYCLES: BillingCycle[] = ['weekly', 'monthly', 'quarterly', 'bi_annual', 'yearly', 'biennial', 'triennial']

function todayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface EditSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription: Subscription | null
  paymentSources: PaymentSource[]
  priceChanges: SubscriptionPriceChange[]
  priceChangesLoading: boolean
  onSave: (id: string, input: Partial<CreateSubscriptionInput>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onRecordPriceChange: (input: {
    amount: number
    previous_amount: number | null
    effective_from: string
  }) => Promise<{ error: unknown }>
}

export function EditSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  paymentSources,
  priceChanges,
  onSave,
  onDelete,
  onRecordPriceChange,
}: EditSubscriptionDialogProps) {
  const [name, setName] = useState('')
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [sourceId, setSourceId] = useState<string>('__none__')
  const [startDate, setStartDate] = useState('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isRebate, setIsRebate] = useState(false)
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconRemoved, setIconRemoved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // Price update form state
  const [showPriceUpdate, setShowPriceUpdate] = useState(false)
  const [newPrice, setNewPrice] = useState('')
  const [newPriceCurrency, setNewPriceCurrency] = useState<Currency>('EUR')
  const [effectiveFrom, setEffectiveFrom] = useState('')

  // Populate form when subscription changes
  useEffect(() => {
    if (subscription) {
      setName(subscription.name)
      setCycle(subscription.billing_cycle)
      setSourceId(subscription.payment_source_id ?? '__none__')
      setStartDate(subscription.start_date)
      setNotes(subscription.notes ?? '')
      setIsActive(subscription.is_active)
      setIsRebate(subscription.is_rebate)
      setIconFile(null)
      setIconRemoved(false)
      setConfirming(false)
      setShowPriceUpdate(false)
      setNewPrice('')
      setNewPriceCurrency('EUR')
      setEffectiveFrom(todayString())
    }
  }, [subscription])

  const handleIconSelect = (file: File | null) => {
    if (file) {
      setIconFile(file)
      setIconRemoved(false)
    } else {
      setIconFile(null)
      setIconRemoved(true)
    }
  }

  const priceUpdateValid = !showPriceUpdate || (Number(newPrice) > 0 && effectiveFrom)
  const canSave = name.trim() && startDate && priceUpdateValid

  const handleSave = async () => {
    if (!canSave || !subscription) return
    setSaving(true)
    try {
      let eurAmount = subscription.amount

      // If a price change was entered, record it and use the new price
      if (showPriceUpdate && Number(newPrice) > 0 && effectiveFrom) {
        const rawNew = Number(newPrice)
        eurAmount = newPriceCurrency === 'USD' ? convertUsdToEur(rawNew) : rawNew

        const { error } = await onRecordPriceChange({
          amount: eurAmount,
          previous_amount: subscription.amount,
          effective_from: effectiveFrom,
        })
        if (error) {
          toast.error('Грешка при записване на промяната')
          setSaving(false)
          return
        }
      }

      let icon_url = subscription.icon_url
      if (iconFile) {
        icon_url = await uploadSubscriptionIcon(iconFile)
      } else if (iconRemoved) {
        icon_url = null
      }

      await onSave(subscription.id, {
        name: name.trim(),
        amount: eurAmount,
        billing_cycle: cycle,
        payment_source_id: sourceId === '__none__' ? null : sourceId,
        start_date: startDate,
        is_active: isActive,
        is_rebate: isRebate,
        notes: notes.trim() || null,
        icon_url,
      })
    } catch {
      toast.error('Грешка при запазване')
      setSaving(false)
      return
    }
    setSaving(false)
    onOpenChange(false)
  }

  const handleDelete = async () => {
    if (!subscription) return
    if (!confirming) {
      setConfirming(true)
      return
    }
    await onDelete(subscription.id)
    onOpenChange(false)
  }

  // Show existing icon only if not explicitly removed
  const effectiveIconUrl = iconRemoved ? null : (subscription?.icon_url ?? null)

  return (
    <Dialog open={open} onOpenChange={o => { setConfirming(false); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Редактирай абонамент</DialogTitle>
        </DialogHeader>

        <DialogBody className="flex-1 min-h-0 max-h-none gap-6">
            <div className="flex w-full justify-center">
              <IconUpload
                name={name}
                currentUrl={effectiveIconUrl}
                selectedFile={iconFile}
                onSelect={handleIconSelect}
              />
            </div>
          {/* Amount — read-only display */}
          <div className="flex flex-col items-center gap-1 py-4">
            <span className="font-bold tabular-nums leading-none" style={{ fontSize: 40 }}>
              {subscription ? formatCurrency(subscription.amount) : '0 €'}
            </span>
          </div>

          {/* Name */}
            <Input
              placeholder="Име"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          <div className="flex flex-col gap-2">
            {/* Payment source */}
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Начин на плащане" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Не е зададен</SelectItem>
                {paymentSources.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Billing cycle + start date */}
            <div className="flex gap-2">
              <Select value={cycle} onValueChange={v => setCycle(v as BillingCycle)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLES.map(c => (
                    <SelectItem key={c} value={c}>{cycleLabelBg(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                className="flex-1"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <Input
            placeholder="Бележка"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          {/* Toggles */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label htmlFor="edit-sub-active" className="text-sm font-medium cursor-pointer">Активен</label>
              <Switch id="edit-sub-active" checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="edit-sub-rebate" className="text-sm font-medium cursor-pointer">Rebate</label>
              <Switch id="edit-sub-rebate" checked={isRebate} onCheckedChange={setIsRebate} />
            </div>
          </div>

          {/* Price update — record change with effective date */}
          {!showPriceUpdate ? (
            <Button
              variant="outline"
              size="sm"
              className="w-fill"
              onClick={() => setShowPriceUpdate(true)}
            >
              Промяна на цена...
            </Button>
          ) : (
            <div className="rounded-md border bg-muted/15 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Промяна на цена</span>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => { setShowPriceUpdate(false); setNewPrice(''); setNewPriceCurrency('EUR') }}
                >
                  Отказ
                </button>
              </div>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Нова цена</span>
                  <CurrencyToggle value={newPriceCurrency} onChange={v => setNewPriceCurrency(v as Currency)} currencies={['EUR', 'USD']} />
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  autoFocus
                />
                {newPriceCurrency === 'USD' && newPrice && Number(newPrice) > 0 && (
                  <p className="text-xs text-muted-foreground -mt-1">
                    ≈ {convertUsdToEur(Number(newPrice)).toFixed(2)} €
                  </p>
                )}
              </div>
              <div className="grid gap-1.5">
                <span className="text-sm">В сила от</span>
                <Input
                  type="date"
                  value={effectiveFrom}
                  onChange={e => setEffectiveFrom(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Price history */}
          {priceChanges.length > 0 && (
            <>
              <Separator />
              <div className="grid gap-2">
                <span className="text-muted-foreground text-xs uppercase tracking-wide">
                  История на цените
                </span>
                <div className="space-y-1.5">
                  {priceChanges.map(pc => (
                    <div key={pc.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(pc.effective_from + 'T00:00:00').toLocaleDateString('bg-BG', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                      <span className="tabular-nums flex items-center gap-1.5">
                        {pc.previous_amount != null && (
                          <>
                            <span className="text-muted-foreground">{formatCurrency(pc.previous_amount)}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          </>
                        )}
                        <span className="font-medium">{formatCurrency(pc.amount)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            className={confirming ? 'mr-auto text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive' : 'mr-auto text-destructive hover:text-destructive'}
            onClick={handleDelete}
          >
            {confirming ? 'Сигурен ли си?' : 'Изтрий'}
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={!canSave || saving}>
            {saving ? 'Запазване...' : 'Запази'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
