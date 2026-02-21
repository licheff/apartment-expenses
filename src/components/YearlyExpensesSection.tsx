import { useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CurrencyToggle } from '@/components/CurrencyToggle'
import type { YearlyExpense } from '@/types'
import { formatCurrency, convertBgnToEur } from '@/lib/constants'

type Currency = 'EUR' | 'BGN'

interface YearlyExpensesSectionProps {
  yearlyExpenses: YearlyExpense[]
  yearlyTotal: number
  year: number
  onCreate: (name: string, amount: number) => Promise<{ error: unknown }>
  onUpdate: (id: string, amount: number) => Promise<{ error: unknown }>
  onDelete: (id: string) => Promise<{ error: unknown }>
}

export function YearlyExpensesSection({
  yearlyExpenses,
  yearlyTotal,
  year,
  onCreate,
  onUpdate,
  onDelete,
}: YearlyExpensesSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | null>(null)
  const [selectedExp, setSelectedExp] = useState<YearlyExpense | null>(null)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('EUR')

  const [animKey, setAnimKey] = useState(0)
  const [exitChar, setExitChar] = useState<string | null>(null)
  const [exitKey, setExitKey] = useState(0)
  const prevAmountRef = useRef('')
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const resetAnimState = () => {
    setExitChar(null)
    prevAmountRef.current = ''
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
  }

  const openAdd = () => {
    setName('')
    setAmount('')
    setCurrency('EUR')
    resetAnimState()
    setDialogMode('add')
  }

  const openEdit = (exp: YearlyExpense) => {
    setSelectedExp(exp)
    setAmount(String(exp.amount))
    setCurrency('EUR')
    resetAnimState()
    prevAmountRef.current = String(exp.amount)
    setDialogMode('edit')
  }

  const closeDialog = () => {
    setDialogMode(null)
    setSelectedExp(null)
    setName('')
    setAmount('')
    setCurrency('EUR')
    resetAnimState()
  }

  const handleAdd = async () => {
    if (!name.trim() || !amount) return
    const eur = currency === 'BGN' ? convertBgnToEur(parseFloat(amount)) : parseFloat(amount)
    await onCreate(name.trim(), eur)
    closeDialog()
  }

  const handleEdit = async () => {
    if (!selectedExp || !amount) return
    const eur = currency === 'BGN' ? convertBgnToEur(parseFloat(amount)) : parseFloat(amount)
    await onUpdate(selectedExp.id, eur)
    closeDialog()
  }

  const handleDelete = async () => {
    if (!selectedExp) return
    await onDelete(selectedExp.id)
    closeDialog()
  }

  const currencySymbol = currency === 'EUR' ? '€' : 'лв.'
  const amountFontSize = amount.length > 9 ? 24 : amount.length > 6 ? 32 : 40

  return (
    <Card className="h-full py-0">
      <CardHeader className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Годишни разходи
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Добави
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-0 flex-1">
        {yearlyExpenses.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Няма годишни разходи
          </p>
        )}
        <div className="space-y-2">
          {yearlyExpenses.map(exp => (
            <button
              key={exp.id}
              type="button"
              onClick={() => openEdit(exp)}
              className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2.5 text-left hover:bg-accent transition-colors cursor-pointer"
            >
              <span className="text-sm">{exp.name}</span>
              <span className="text-sm tabular-nums">{formatCurrency(Number(exp.amount))}</span>
            </button>
          ))}
        </div>
      </CardContent>

      {yearlyExpenses.length > 0 ? (
        <div className="px-4 pt-2 pb-4 mt-3 border-t flex items-center justify-between">
          <span className="text-sm font-normal">Общо годишни</span>
          <span className="text-sm font-bold tabular-nums text-primary">
            {formatCurrency(yearlyTotal)}
          </span>
        </div>
      ) : (
        <div className="pb-4" />
      )}

      <Dialog open={dialogMode !== null} onOpenChange={open => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[360px] p-0 gap-0 overflow-hidden">

          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-6 border-b">
            <DialogTitle className="text-xl font-semibold">
              {dialogMode === 'add' ? `Годишен разход` : selectedExp?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Content */}
          <div className="px-6 py-6 flex flex-col gap-8 items-center">

            {/* Amount + currency toggle */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="flex items-baseline justify-center gap-0.5 cursor-text"
                onClick={() => inputRef.current?.focus()}
              >
                <div className="relative inline-flex">
                  <span
                    className="invisible whitespace-pre font-bold tabular-nums leading-none"
                    style={{ fontSize: amountFontSize }}
                    aria-hidden="true"
                  >
                    {exitChar ? amount + exitChar : (amount || '0')}
                  </span>
                  <div
                    className="absolute inset-0 flex items-center font-bold tabular-nums leading-none pointer-events-none select-none overflow-hidden"
                    style={{ fontSize: amountFontSize, color: (amount || exitChar) ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                  >
                    {!amount && !exitChar ? '0' : (
                      <>
                        {amount.slice(0, -1)}
                        {amount && (
                          <span key={animKey} className="inline-block animate-in slide-in-from-bottom-3 fade-in-0 duration-150">
                            {amount.slice(-1)}
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
                    value={amount}
                    onChange={e => {
                      const v = e.target.value
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v)
                    }}
                    autoFocus
                    className="absolute inset-0 w-full opacity-0 border-none outline-none cursor-text"
                  />
                </div>
                <span className="font-bold leading-none pointer-events-none" style={{ fontSize: amountFontSize }}>
                  {currencySymbol}
                </span>
              </div>
              <CurrencyToggle value={currency} onChange={setCurrency} />
              {currency === 'BGN' && amount && (
                <p className="text-xs text-muted-foreground -mt-1">
                  ≈ {convertBgnToEur(Number(amount)).toFixed(2)} €
                </p>
              )}
            </div>

            {/* Name input — add mode only */}
            {dialogMode === 'add' && (
              <div className="w-full">
                <Input
                  placeholder="напр. Данък"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-6 border-t flex items-center gap-2">
            {dialogMode === 'edit' && (
              <Button variant="destructive" onClick={handleDelete} className="mr-auto">
                Изтрий
              </Button>
            )}
            <Button variant="outline" onClick={closeDialog}>
              Отказ
            </Button>
            <Button
              className="flex-1"
              onClick={dialogMode === 'add' ? handleAdd : handleEdit}
              disabled={dialogMode === 'add' ? !name.trim() || !amount : !amount}
            >
              Запази
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </Card>
  )
}
