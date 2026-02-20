import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CurrencyToggle } from '@/components/CurrencyToggle'
import type { Category } from '@/types'
import { MONTH_NAMES, convertBgnToEur } from '@/lib/constants'
import { supabase } from '@/lib/supabase'

type Currency = 'EUR' | 'BGN'

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  onSave: (categoryId: string, month: number, amount: number, year: number) => Promise<void>
  onBulkSave: (rows: { category_id: string; year: number; month: number; amount: number }[]) => Promise<{ error: Error | null; count: number }>
  defaultMonth?: number
  defaultYear: number
}

export function AddExpenseDialog({
  open,
  onOpenChange,
  categories,
  onSave,
  onBulkSave,
  defaultMonth,
  defaultYear,
}: AddExpenseDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const now = new Date()
  const [categoryId, setCategoryId] = useState('')
  const [month, setMonth] = useState(defaultMonth ?? now.getMonth() + 1)
  const [year, setYear] = useState(defaultYear)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('EUR')
  const [allMonths, setAllMonths] = useState(false)
  const [saving, setSaving] = useState(false)
  const [usedCategoryIds, setUsedCategoryIds] = useState<Set<string>>(new Set())
  const [usedMonthsForCategory, setUsedMonthsForCategory] = useState<Set<number>>(new Set())
  const [animKey, setAnimKey] = useState(0)
  const [exitChar, setExitChar] = useState<string | null>(null)
  const [exitKey, setExitKey] = useState(0)
  const prevAmountRef = useRef('')
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentYear = now.getFullYear()
  const yearOptions = Array.from(
    { length: currentYear - 2019 + 1 },
    (_, i) => currentYear + 1 - i,
  )

  useEffect(() => {
    if (open) {
      const d = new Date()
      setCategoryId('')
      setMonth(defaultMonth ?? d.getMonth() + 1)
      setYear(defaultYear)
      setAmount('')
      setCurrency('EUR')
      setAllMonths(false)
      setUsedMonthsForCategory(new Set())
      setExitChar(null)
      prevAmountRef.current = ''
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    }
  }, [open, defaultMonth, defaultYear])

  const categoryIdsKey = useMemo(() => categories.map(c => c.id).join(','), [categories])
  useEffect(() => {
    if (!open || categories.length === 0) return
    const fetchUsed = async () => {
      const { data } = await supabase
        .from('expenses')
        .select('category_id')
        .in('category_id', categories.map(c => c.id))
        .eq('year', year)
        .eq('month', month)
      setUsedCategoryIds(new Set((data ?? []).map(e => e.category_id)))
    }
    fetchUsed()
  }, [open, year, month, categoryIdsKey])

  useEffect(() => {
    if (!open || !allMonths || !categoryId) {
      setUsedMonthsForCategory(new Set())
      return
    }
    const fetchUsedMonths = async () => {
      const { data } = await supabase
        .from('expenses')
        .select('month')
        .eq('category_id', categoryId)
        .eq('year', year)
      setUsedMonthsForCategory(new Set((data ?? []).map(e => e.month)))
    }
    fetchUsedMonths()
  }, [open, allMonths, categoryId, year])

  const availableCategories = allMonths
    ? categories
    : categories.filter(c => !usedCategoryIds.has(c.id))

  useEffect(() => {
    if (categoryId && !allMonths && usedCategoryIds.has(categoryId)) {
      setCategoryId('')
    }
  }, [usedCategoryIds, categoryId, allMonths])

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

  const handleSave = async () => {
    if (!categoryId || !amount) return
    setSaving(true)
    const rawAmount = parseFloat(amount)
    const eurAmount = currency === 'BGN' ? convertBgnToEur(rawAmount) : rawAmount

    if (allMonths) {
      const months = Array.from({ length: 12 }, (_, i) => i + 1)
        .filter(m => !usedMonthsForCategory.has(m))
      const rows = months.map(m => ({
        category_id: categoryId,
        year,
        month: m,
        amount: eurAmount,
      }))
      await onBulkSave(rows)
    } else {
      await onSave(categoryId, month, eurAmount, year)
    }

    setSaving(false)
    setCategoryId('')
    setAmount('')
    setCurrency('EUR')
    setAllMonths(false)
    onOpenChange(false)
  }

  const allUsed = !allMonths && availableCategories.length === 0 && categories.length > 0
  const skippedCount = allMonths && categoryId ? usedMonthsForCategory.size : 0
  const willSaveCount = allMonths ? 12 - skippedCount : 1

  const currencySymbol = currency === 'EUR' ? '€' : 'лв.'
  const amountFontSize = amount.length > 9 ? 24 : amount.length > 6 ? 32 : 40

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] p-0 gap-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-6 border-b">
          <DialogTitle className="text-xl font-semibold">Добави разход</DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-6 flex flex-col gap-8 items-center">

          {/* Amount + currency toggle */}
          <div className="flex flex-col items-center gap-3">
            {/* Clicking anywhere on the row focuses the hidden input */}
            <div
              className="flex items-baseline justify-center gap-0.5 cursor-text"
              onClick={() => inputRef.current?.focus()}
            >
              <div className="relative inline-flex">
                {/* Mirror span sizes the container to the text width */}
                <span
                  className="invisible whitespace-pre font-bold tabular-nums leading-none"
                  style={{ fontSize: amountFontSize }}
                  aria-hidden="true"
                >
                  {exitChar ? amount + exitChar : (amount || '0')}
                </span>
                {/* Animated display */}
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
                {/* Hidden input captures keystrokes */}
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

          {/* Details: category + year / month */}
          <div className="w-full flex flex-col gap-1.5">
            {allUsed ? (
              <p className="text-sm text-muted-foreground py-2">
                Всички категории за {MONTH_NAMES[month]} {year} вече имат стойности.
              </p>
            ) : (
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex gap-1.5">
              <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                <SelectTrigger className="w-[110px] h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(month)} onValueChange={v => setMonth(Number(v))} disabled={allMonths}>
                <SelectTrigger className="flex-1 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <SelectItem key={m} value={String(m)}>{MONTH_NAMES[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="all-months"
                checked={allMonths}
                onCheckedChange={v => setAllMonths(v === true)}
              />
              <Label htmlFor="all-months" className="text-sm font-normal cursor-pointer text-muted-foreground">
                Приложи за всички месеци
              </Label>
            </div>
            {allMonths && skippedCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {skippedCount} от 12 месеца вече имат стойност и ще бъдат пропуснати.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-6 border-t flex items-center gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отказ
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!categoryId || !amount || saving || allUsed || willSaveCount === 0}
          >
            {saving
              ? 'Запазване...'
              : allMonths
                ? `Запази (${willSaveCount} мес.)`
                : 'Запази'}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
