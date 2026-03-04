import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { CurrencyToggle } from '@/components/CurrencyToggle'
import { IconUpload } from '@/components/IconUpload'
import type { BillingCycle, CreateSubscriptionInput, PaymentSource, Subscription } from '@/types'
import { cycleLabelBg } from '@/lib/subscriptions'
import { convertUsdToEur } from '@/lib/constants'
import { uploadSubscriptionIcon } from '@/lib/storage'

type Currency = 'EUR' | 'USD'

const BILLING_CYCLES: BillingCycle[] = ['weekly', 'monthly', 'quarterly', 'bi_annual', 'yearly']

interface EditSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription: Subscription | null
  paymentSources: PaymentSource[]
  onSave: (id: string, input: Partial<CreateSubscriptionInput>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function EditSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  paymentSources,
  onSave,
  onDelete,
}: EditSubscriptionDialogProps) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('EUR')
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [sourceId, setSourceId] = useState<string>('__none__')
  const [startDate, setStartDate] = useState('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isRebate, setIsRebate] = useState(false)
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // Populate form when subscription changes
  useEffect(() => {
    if (subscription) {
      setName(subscription.name)
      setAmount(String(subscription.amount))
      setCurrency('EUR') // stored value is always EUR
      setCycle(subscription.billing_cycle)
      setSourceId(subscription.payment_source_id ?? '__none__')
      setStartDate(subscription.start_date)
      setNotes(subscription.notes ?? '')
      setIsActive(subscription.is_active)
      setIsRebate(subscription.is_rebate)
      setIconFile(null) // clear any staged file when switching subscriptions
      setConfirming(false)
    }
  }, [subscription])

  const canSave = name.trim() && Number(amount) > 0 && startDate

  const handleSave = async () => {
    if (!canSave || !subscription) return
    setSaving(true)
    try {
      const rawAmount = Number(amount)
      const eurAmount = currency === 'USD' ? convertUsdToEur(rawAmount) : rawAmount

      // Upload new icon if one was selected; otherwise keep the existing URL
      let icon_url = subscription.icon_url
      if (iconFile) {
        icon_url = await uploadSubscriptionIcon(iconFile)
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
      toast.error('Грешка при качване на иконата')
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

  return (
    <Dialog open={open} onOpenChange={open => { setConfirming(false); onOpenChange(open) }}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Редактирай абонамент</DialogTitle>
        </DialogHeader>

        <DialogBody className="flex-1 min-h-0 max-h-none">
          {/* Icon upload */}
          <IconUpload
            name={name}
            currentUrl={subscription?.icon_url ?? null}
            selectedFile={iconFile}
            onSelect={setIconFile}
          />

          {/* Name */}
          <div className="grid gap-1.5">
            <Label>Наименование</Label>
            <Input
              placeholder="Netflix, Spotify..."
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Amount + Cycle */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label>Сума</Label>
                <CurrencyToggle value={currency} onChange={v => setCurrency(v as Currency)} currencies={['EUR', 'USD']} />
              </div>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
              {currency === 'USD' && amount && Number(amount) > 0 && (
                <p className="text-xs text-muted-foreground -mt-1">
                  ≈ {convertUsdToEur(Number(amount)).toFixed(2)} €
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label>Периодичност</Label>
              <Select value={cycle} onValueChange={v => setCycle(v as BillingCycle)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLES.map(c => (
                    <SelectItem key={c} value={c}>{cycleLabelBg(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start date */}
          <div className="grid gap-1.5">
            <Label>Следващо плащане</Label>
            <Input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          {/* Payment source */}
          <div className="grid gap-1.5">
            <Label>Начин на плащане</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Не е зададен" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Не е зададен</SelectItem>
                {paymentSources.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label>Бележки (незадължително)</Label>
            <Input
              placeholder=""
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-active"
                checked={isActive}
                onCheckedChange={v => setIsActive(v === true)}
              />
              <Label htmlFor="edit-active" className="cursor-pointer">Активен</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-rebate"
                checked={isRebate}
                onCheckedChange={v => setIsRebate(v === true)}
              />
              <Label htmlFor="edit-rebate" className="cursor-pointer">Rebate</Label>
              <span className="text-xs text-muted-foreground">— не се брои в общите суми</span>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          {/* Delete on the left — two-step confirm */}
          <Button
            variant="outline"
            className={confirming ? 'mr-auto text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive' : 'mr-auto text-destructive hover:text-destructive'}
            onClick={handleDelete}
          >
            {confirming ? 'Сигурен ли си?' : 'Изтрий'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
          <Button className="flex-1" onClick={handleSave} disabled={!canSave || saving}>
            Запази
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
