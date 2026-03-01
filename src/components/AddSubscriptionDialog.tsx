import { useState } from 'react'
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
import type { BillingCycle, CreateSubscriptionInput, PaymentSource } from '@/types'
import { cycleLabelBg } from '@/lib/subscriptions'

const BILLING_CYCLES: BillingCycle[] = ['weekly', 'monthly', 'quarterly', 'bi_annual', 'yearly']

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface AddSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentSources: PaymentSource[]
  onSave: (input: CreateSubscriptionInput) => Promise<void>
}

export function AddSubscriptionDialog({
  open,
  onOpenChange,
  paymentSources,
  onSave,
}: AddSubscriptionDialogProps) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [sourceId, setSourceId] = useState<string>('__none__')
  const [startDate, setStartDate] = useState(todayStr)
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const canSave = name.trim() && Number(amount) > 0 && startDate

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    await onSave({
      name: name.trim(),
      amount: Number(amount),
      billing_cycle: cycle,
      payment_source_id: sourceId === '__none__' ? null : sourceId,
      start_date: startDate,
      is_active: isActive,
      notes: notes.trim() || null,
    })
    setSaving(false)
    // Reset form
    setName('')
    setAmount('')
    setCycle('monthly')
    setSourceId('__none__')
    setStartDate(todayStr())
    setNotes('')
    setIsActive(true)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Нов абонамент</DialogTitle>
        </DialogHeader>

        <DialogBody className="flex-1 min-h-0 max-h-none">
          {/* Name */}
          <div className="grid gap-1.5">
            <Label>Наименование</Label>
            <Input
              placeholder="Netflix, Spotify..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
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

          {/* Active toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="add-active"
              checked={isActive}
              onCheckedChange={v => setIsActive(v === true)}
            />
            <Label htmlFor="add-active" className="cursor-pointer">Активен</Label>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
          <Button className="flex-1" onClick={handleSave} disabled={!canSave || saving}>
            Запази
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
