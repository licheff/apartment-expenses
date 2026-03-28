import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, CalendarClock, LogOut } from 'lucide-react'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CurrencyToggle } from '@/components/CurrencyToggle'
import { MathOperatorButtons } from '@/components/MathOperatorButtons'
import { useApartments } from '@/hooks/useApartments'
import { usePaymentSources } from '@/hooks/usePaymentSources'
import {
  formatCurrency,
  convertBgnToEur,
  evaluateExpression,
  formatAmountInput,
  validateExpressionInput,
} from '@/lib/constants'

interface SettingsPageProps {
  signOut: () => Promise<void>
}

function getEndDateStatus(endDate: string | null): 'none' | 'ok' | 'soon' | 'expired' {
  if (!endDate) return 'none'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(endDate)
  const diffDays = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= 30) return 'soon'
  return 'ok'
}

const endDateIconClass: Record<ReturnType<typeof getEndDateStatus>, string> = {
  none: 'text-muted-foreground/40 hover:text-muted-foreground',
  ok: 'text-muted-foreground hover:text-foreground',
  soon: 'text-amber-500 hover:text-amber-600',
  expired: 'text-destructive hover:text-destructive/80',
}

// ─── Rent Dialog ──────────────────────────────────────────────────────────────

interface RentDialogProps {
  open: boolean
  onClose: () => void
  onSave: (amount: number) => Promise<void>
}

function RentDialog({ open, onClose, onSave }: RentDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'EUR' | 'BGN'>('EUR')
  const [animKey, setAnimKey] = useState(0)
  const [exitChar, setExitChar] = useState<string | null>(null)
  const [exitKey, setExitKey] = useState(0)
  const [shaking, setShaking] = useState(false)
  const [focused, setFocused] = useState(false)
  const prevAmountRef = useRef('')
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      setAmount('')
      setCurrency('EUR')
      prevAmountRef.current = ''
      setExitChar(null)
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    }
  }, [open])

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

  const resolveAmount = (): number | null => {
    let final = amount
    if ([...final].some(c => '+-*/()'.includes(c))) {
      const result = evaluateExpression(final)
      if (result === false) return null
      final = String(result)
    }
    return parseFloat(final)
  }

  const handleSave = async () => {
    if (!amount) return
    const raw = resolveAmount()
    if (raw === null) return
    const eur = currency === 'BGN' ? convertBgnToEur(raw) : raw
    await onSave(eur)
    onClose()
  }

  const currencySymbol = currency === 'EUR' ? '€' : 'лв.'
  const isExpression = [...amount].some(c => '+-*/()'.includes(c))
  const formatted = isExpression ? amount : formatAmountInput(amount)
  const amountFontSize = formatted.length > 10 ? 24 : formatted.length > 9 ? 32 : 40

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[360px] p-0 gap-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Месечен наем</DialogTitle>
        </DialogHeader>

        <DialogBody className="flex-1 min-h-0 max-h-none gap-8 items-center">
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
                  autoFocus
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
            <CurrencyToggle value={currency} onChange={v => setCurrency(v as 'EUR' | 'BGN')} />
            {currency === 'BGN' && amount && !isExpression && (
              <p className="text-xs text-muted-foreground -mt-1">
                ≈ {convertBgnToEur(Number(amount)).toFixed(2)} €
              </p>
            )}
          </div>

          <MathOperatorButtons />
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отказ
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={!amount}>
            Запази
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── SettingsPage ─────────────────────────────────────────────────────────────

export function SettingsPage({ signOut }: SettingsPageProps) {
  const {
    apartments,
    categories,
    addCategory,
    deleteCategory,
    toggleCategoryPaidByMe,
    updateCategoryEndDate,
    updateRentAmount,
  } = useApartments()

  const { paymentSources, create: createSource, remove: removeSource } = usePaymentSources()

  const [activeTab, setActiveTab] = useState(apartments[0]?.id ?? '')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null)
  const [newSourceName, setNewSourceName] = useState('')
  const [deletingSource, setDeletingSource] = useState<string | null>(null)
  const [rentDialogAptId, setRentDialogAptId] = useState<string | null>(null)

  useEffect(() => {
    if (!activeTab && apartments.length > 0) {
      setActiveTab(apartments[0].id)
    }
  }, [apartments, activeTab])

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !activeTab) return
    await addCategory(activeTab, newCategoryName.trim())
    setNewCategoryName('')
  }

  const handleDeleteCategory = async (id: string) => {
    setDeletingCategory(id)
    await deleteCategory(id)
    setDeletingCategory(null)
  }

  const handleAddSource = async () => {
    if (!newSourceName.trim()) return
    await createSource(newSourceName.trim())
    setNewSourceName('')
  }

  const handleDeleteSource = async (id: string) => {
    setDeletingSource(id)
    await removeSource(id)
    setDeletingSource(null)
  }

  const handleSaveRent = async (amount: number) => {
    if (!rentDialogAptId) return
    await updateRentAmount(rentDialogAptId, amount)
    setRentDialogAptId(null)
  }

  return (
    <div>
      <Header title="Настройки" />

      <main className="mx-auto px-4 py-6 pb-24 space-y-8 max-w-[1000px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

          {/* Left: Locations */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Разходи по локация</h2>

            <Tabs value={activeTab} onValueChange={tab => { setActiveTab(tab); setNewCategoryName('') }}>
              <TabsList className="w-full">
                {apartments.map(apt => (
                  <TabsTrigger key={apt.id} value={apt.id} className="flex-1">
                    {apt.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {apartments.map(apt => {
                const aptCategories = categories[apt.id] ?? []
                return (
                  <TabsContent key={apt.id} value={apt.id} className="space-y-4">
                    {/* Category list */}
                    <div className="space-y-2">
                      {aptCategories.map(cat => {
                        const status = getEndDateStatus(cat.end_date)
                        return (
                          <div
                            key={cat.id}
                            className="flex items-center justify-between rounded-md border px-3 py-2"
                          >
                            <span className="text-sm">{cat.name}</span>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <Checkbox
                                  id={`paid-${cat.id}`}
                                  checked={cat.paid_by_me}
                                  onCheckedChange={v => toggleCategoryPaidByMe(cat.id, v === true)}
                                />
                                <Label
                                  htmlFor={`paid-${cat.id}`}
                                  className="text-xs text-muted-foreground cursor-pointer"
                                >
                                  Плащам аз
                                </Label>
                              </div>

                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-7 w-7 ${endDateIconClass[status]}`}
                                    title={cat.end_date ? `Изтича: ${cat.end_date}` : 'Задай дата на изтичане'}
                                  >
                                    <CalendarClock className="h-3.5 w-3.5" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={cat.end_date ? new Date(cat.end_date + 'T00:00:00') : undefined}
                                    onSelect={date => {
                                      if (!date) return
                                      const y = date.getFullYear()
                                      const m = String(date.getMonth() + 1).padStart(2, '0')
                                      const d = String(date.getDate()).padStart(2, '0')
                                      updateCategoryEndDate(cat.id, `${y}-${m}-${d}`)
                                    }}
                                    defaultMonth={cat.end_date ? new Date(cat.end_date + 'T00:00:00') : undefined}
                                    initialFocus
                                  />
                                  {cat.end_date && (
                                    <div className="border-t p-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-xs text-muted-foreground"
                                        onClick={() => updateCategoryEndDate(cat.id, null)}
                                      >
                                        Премахни датата
                                      </Button>
                                    </div>
                                  )}
                                </PopoverContent>
                              </Popover>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteCategory(cat.id)}
                                disabled={deletingCategory === cat.id}
                                title="Изтрий категорията"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                      {aptCategories.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Няма категории</p>
                      )}
                    </div>

                    {/* Add category */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Нова категория..."
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                      />
                      <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Добави
                      </Button>
                    </div>

                    {/* Rent */}
                    {apt.rent_amount != null ? (
                      <div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2.5">
                        <span className="text-sm">Наем</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm tabular-nums">{formatCurrency(apt.rent_amount)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => updateRentAmount(apt.id, null)}
                            title="Премахни наема"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRentDialogAptId(apt.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Добави наем
                      </Button>
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>
          </section>

          {/* Right: Payment methods */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Начини на плащане</h2>

            <div className="space-y-2">
              {paymentSources.map(source => (
                <div
                  key={source.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span className="text-sm">{source.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteSource(source.id)}
                    disabled={deletingSource === source.id}
                    title="Изтрий"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {paymentSources.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Няма добавени начини на плащане
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Нов начин на плащане..."
                value={newSourceName}
                onChange={e => setNewSourceName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSource()}
              />
              <Button onClick={handleAddSource} disabled={!newSourceName.trim()} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Добави
              </Button>
            </div>
          </section>

        </div>

        {/* Account */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Акаунт</h2>
          <Button variant="destructive" onClick={signOut} className="gap-2 w-full justify-center">
            <LogOut className="h-4 w-4" />
            Изход
          </Button>
        </section>
      </main>

      <RentDialog
        open={rentDialogAptId !== null}
        onClose={() => setRentDialogAptId(null)}
        onSave={handleSaveRent}
      />
    </div>
  )
}
