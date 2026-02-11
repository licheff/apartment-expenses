import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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

  const currentYear = now.getFullYear()
  const yearOptions = Array.from(
    { length: currentYear - 2019 + 1 },
    (_, i) => currentYear + 1 - i,
  )

  // Reset defaults when the dialog opens
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
    }
  }, [open, defaultMonth, defaultYear])

  // Fetch which categories already have expenses for the selected year + month
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

  // When "all months" is checked and a category is selected, fetch which months already have it
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

  // Available categories = those not yet used for this year+month
  const availableCategories = allMonths
    ? categories
    : categories.filter(c => !usedCategoryIds.has(c.id))

  // If the currently selected category becomes unavailable, clear it
  useEffect(() => {
    if (categoryId && !allMonths && usedCategoryIds.has(categoryId)) {
      setCategoryId('')
    }
  }, [usedCategoryIds, categoryId, allMonths])

  const handleSave = async () => {
    if (!categoryId || !amount) return
    setSaving(true)
    const rawAmount = Number(amount)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Добави разход</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className={`grid gap-4 ${allMonths ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div className="grid gap-2">
              <Label>Година</Label>
              <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(y => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!allMonths && (
              <div className="grid gap-2">
                <Label>Месец</Label>
                <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <SelectItem key={m} value={String(m)}>
                        {MONTH_NAMES[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Категория</Label>
            {allUsed ? (
              <p className="text-sm text-muted-foreground py-2">
                Всички категории за {MONTH_NAMES[month]} {year} вече имат стойности.
              </p>
            ) : (
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Избери категория" />
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
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Сума</Label>
              <CurrencyToggle value={currency} onChange={setCurrency} />
            </div>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
            />
            {currency === 'BGN' && amount && (
              <p className="text-xs text-muted-foreground">
                ≈ {convertBgnToEur(Number(amount)).toFixed(2)} €
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="all-months"
              checked={allMonths}
              onCheckedChange={v => setAllMonths(v === true)}
            />
            <Label htmlFor="all-months" className="text-sm font-normal cursor-pointer">
              Приложи за всички месеци
            </Label>
          </div>
          {allMonths && skippedCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {skippedCount} от 12 месеца вече имат стойност и ще бъдат пропуснати.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отказ
          </Button>
          <Button
            onClick={handleSave}
            disabled={!categoryId || !amount || saving || allUsed || willSaveCount === 0}
          >
            {saving
              ? 'Запазване...'
              : allMonths
                ? `Запази (${willSaveCount} мес.)`
                : 'Запази'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
