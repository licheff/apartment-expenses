import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
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
import type { BillingCycle, CreateSubscriptionInput, PaymentSource, Subscription } from '@/types'
import { cycleLabelBg } from '@/lib/subscriptions'

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
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [sourceId, setSourceId] = useState<string>('__none__')
  const [startDate, setStartDate] = useState('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // Populate form when subscription changes
  useEffect(() => {
    if (subscription) {
      setName(subscription.name)
      setAmount(String(subscription.amount))
      setCycle(subscription.billing_cycle)
      setSourceId(subscription.payment_source_id ?? '__none__')
      setStartDate(subscription.start_date)
      setNotes(subscription.notes ?? '')
      setIsActive(subscription.is_active)
      setConfirming(false)
    }
  }, [subscription])

  const canSave = name.trim() && Number(amount) > 0 && startDate

  const handleSave = async () => {
    if (!canSave || !subscription) return
    setSaving(true)
    await onSave(subscription.id, {
      name: name.trim(),
      amount: Number(amount),
      billing_cycle: cycle,
      payment_source_id: sourceId === '__none__' ? null : sourceId,
      start_date: startDate,
      is_active: isActive,
      notes: notes.trim() || null,
    })
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
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">Редактирай абонамент</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
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
              <Label>Сума (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
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
            <Label>Дата на първо плащане</Label>
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

          {/* Active toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-active"
              checked={isActive}
              onCheckedChange={v => setIsActive(v === true)}
            />
            <Label htmlFor="edit-active" className="cursor-pointer">Активен</Label>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center gap-2">
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
