import { useEffect, useRef, useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { CurrencyToggle } from '@/components/CurrencyToggle'
import { IconUpload } from '@/components/IconUpload'
import type { BillingCycle, CreateSubscriptionInput, PaymentSource, Subscription } from '@/types'
import { cycleLabelBg } from '@/lib/subscriptions'
import { convertUsdToEur, formatAmountInput, validateExpressionInput, evaluateExpression } from '@/lib/constants'
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
  const inputRef = useRef<HTMLInputElement>(null)
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
  const [iconRemoved, setIconRemoved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // Animated amount display state
  const [animKey, setAnimKey] = useState(0)
  const [exitChar, setExitChar] = useState<string | null>(null)
  const [exitKey, setExitKey] = useState(0)
  const [shaking, setShaking] = useState(false)
  const [focused, setFocused] = useState(false)
  const prevAmountRef = useRef('')
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Populate form when subscription changes
  useEffect(() => {
    if (subscription) {
      setName(subscription.name)
      setAmount(String(subscription.amount))
      setCurrency('EUR')
      setCycle(subscription.billing_cycle)
      setSourceId(subscription.payment_source_id ?? '__none__')
      setStartDate(subscription.start_date)
      setNotes(subscription.notes ?? '')
      setIsActive(subscription.is_active)
      setIsRebate(subscription.is_rebate)
      setIconFile(null)
      setIconRemoved(false)
      setConfirming(false)
      setExitChar(null)
      prevAmountRef.current = String(subscription.amount)
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    }
  }, [subscription])

  // Animate last character in/out
  useEffect(() => {
    const prev = prevAmountRef.current
    if (amount.length > prev.length) {
      setAnimKey(k => k + 1)
      setExitChar(null)
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    } else if (amount.length < prev.length) {
      setExitChar(prev.slice(-1))
      setExitKey(k => k + 1)
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
      exitTimerRef.current = setTimeout(() => setExitChar(null), 200)
    }
    prevAmountRef.current = amount
  }, [amount])

  const commitExpression = () => {
    if (!amount || ![...amount].some(c => '+-*/()'.includes(c))) return
    const result = evaluateExpression(amount)
    if (result === false) {
      setShaking(true)
      setTimeout(() => setShaking(false), 400)
    } else {
      setAmount(String(result))
    }
  }

  const handleIconSelect = (file: File | null) => {
    if (file) {
      setIconFile(file)
      setIconRemoved(false)
    } else {
      // Removing: clear staged file and mark existing as removed
      setIconFile(null)
      setIconRemoved(true)
    }
  }

  const canSave = name.trim() && amount && Number(amount) > 0 && startDate

  const handleSave = async () => {
    if (!canSave || !subscription) return

    let finalAmount = amount
    if ([...finalAmount].some(c => '+-*/()'.includes(c))) {
      const result = evaluateExpression(finalAmount)
      if (result === false) return
      finalAmount = String(result)
    }

    setSaving(true)
    try {
      const rawAmount = Number(finalAmount)
      const eurAmount = currency === 'USD' ? convertUsdToEur(rawAmount) : rawAmount

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

  const currencySymbol = currency === 'EUR' ? '€' : '$'
  const isExpression = [...amount].some(c => '+-*/()'.includes(c))
  const formatted = isExpression ? amount : formatAmountInput(amount)
  const amountFontSize = formatted.length > 10 ? 24 : formatted.length > 9 ? 32 : 40

  // Show existing icon only if not explicitly removed
  const effectiveIconUrl = iconRemoved ? null : (subscription?.icon_url ?? null)

  return (
    <Dialog open={open} onOpenChange={o => { setConfirming(false); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Редактирай абонамент</DialogTitle>
        </DialogHeader>

        <DialogBody className="flex-1 min-h-0 max-h-none">
          {/* Amount + currency toggle — centered */}
          <div className="flex flex-col items-center gap-3">
            <div
              className={`flex items-baseline justify-center gap-0.5 cursor-text h-[40px] ${shaking ? 'animate-shake' : ''}`}
              onClick={() => inputRef.current?.focus()}
            >
              <div className="relative inline-flex">
                <span
                  className="invisible whitespace-pre font-bold tabular-nums leading-none"
                  style={{ fontSize: amountFontSize }}
                  aria-hidden="true"
                >
                  {exitChar ? formatted + exitChar : (formatted || '0')}
                </span>
                <div
                  className="absolute inset-0 flex items-center font-bold tabular-nums leading-none pointer-events-none select-none overflow-hidden"
                  style={{ fontSize: amountFontSize, color: (amount || exitChar) ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                >
                  {!amount && !exitChar ? '0' : (
                    <>
                      {formatted.slice(0, -1)}
                      {amount && (
                        <span key={animKey} className="inline-block animate-in slide-in-from-bottom-3 fade-in-0 duration-150">
                          {formatted.slice(-1)}
                        </span>
                      )}
                      {exitChar && (
                        <span key={exitKey} className="inline-block animate-out slide-out-to-bottom-3 fade-out-0 duration-150">
                          {exitChar}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="decimal"
                  data-math-input=""
                  value={amount}
                  onChange={e => {
                    const result = validateExpressionInput(e.target.value)
                    if (result === false) {
                      setShaking(true)
                      setTimeout(() => setShaking(false), 400)
                      return
                    }
                    setAmount(result)
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') commitExpression() }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => { setFocused(false); commitExpression() }}
                  className="absolute inset-0 w-full opacity-0 border-none outline-none cursor-text"
                />
              </div>
              <span
                className={`pointer-events-none font-light ${focused ? 'animate-caret' : 'opacity-0'}`}
                style={{ fontSize: amountFontSize, lineHeight: 1 }}
              >|</span>
              <span className="font-bold leading-none pointer-events-none" style={{ fontSize: amountFontSize }}>
                {currencySymbol}
              </span>
            </div>
            <CurrencyToggle value={currency} onChange={v => setCurrency(v as Currency)} currencies={['EUR', 'USD']} />
            {currency === 'USD' && amount && !isExpression && Number(amount) > 0 && (
              <p className="text-xs text-muted-foreground -mt-1">
                ≈ {convertUsdToEur(Number(amount)).toFixed(2)} €
              </p>
            )}
          </div>

          {/* Icon + Name — same row */}
          <div className="flex items-center gap-3">
            <IconUpload
              name={name}
              currentUrl={effectiveIconUrl}
              selectedFile={iconFile}
              onSelect={handleIconSelect}
            />
            <Input
              className="flex-1"
              placeholder="Име"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Payment source */}
          <Select value={sourceId} onValueChange={setSourceId}>
            <SelectTrigger>
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
          <div className="flex gap-3">
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
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            className={confirming ? 'mr-auto text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive' : 'mr-auto text-destructive hover:text-destructive'}
            onClick={handleDelete}
          >
            {confirming ? 'Сигурен ли си?' : 'Изтрий'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
          <Button className="flex-1" onClick={handleSave} disabled={!canSave || saving}>
            {saving ? 'Запазване...' : 'Запази'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
