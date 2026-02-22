import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyToggle } from '@/components/CurrencyToggle'
import type { Category, MonthRow } from '@/types'
import { convertBgnToEur, convertEurToBgn } from '@/lib/constants'

type Currency = 'EUR' | 'BGN'

interface EditExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  monthRow: MonthRow | null
  onSave: (entries: { categoryId: string; amount: number }[]) => Promise<void>
  onDeleteExpense: (id: string) => Promise<{ error: unknown }>
}

export function EditExpenseDialog({
  open,
  onOpenChange,
  categories,
  monthRow,
  onSave,
  onDeleteExpense,
}: EditExpenseDialogProps) {
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [currencies, setCurrencies] = useState<Record<string, Currency>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (monthRow) {
      const initialAmounts: Record<string, string> = {}
      const initialCurrencies: Record<string, Currency> = {}
      for (const cat of categories) {
        initialAmounts[cat.id] = monthRow.expenses[cat.id] != null
          ? String(monthRow.expenses[cat.id])
          : ''
        initialCurrencies[cat.id] = 'EUR'
      }
      setAmounts(initialAmounts)
      setCurrencies(initialCurrencies)
    }
  }, [monthRow, categories])

  const handleSave = async () => {
    setSaving(true)
    const entries = categories
      .filter(cat => amounts[cat.id] && Number(amounts[cat.id]) > 0)
      .map(cat => {
        const raw = Number(amounts[cat.id])
        const cur = currencies[cat.id] ?? 'EUR'
        return {
          categoryId: cat.id,
          amount: cur === 'BGN' ? convertBgnToEur(raw) : raw,
        }
      })
    await onSave(entries)
    setSaving(false)
    onOpenChange(false)
  }

  const handleDeleteExpense = async (categoryId: string) => {
    if (!monthRow) return
    const id = monthRow.expenseIds[categoryId]
    if (!id) return
    await onDeleteExpense(id)
  }

  if (!monthRow) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">{monthRow.monthName}</DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          {categories.map(cat => {
            const val = amounts[cat.id] ?? ''
            const cur = currencies[cat.id] ?? 'EUR'
            const hasExpense = monthRow.expenseIds[cat.id] != null
            return (
              <div key={cat.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{cat.name}</span>
                  <div className="flex items-center gap-2">
                    <CurrencyToggle
                      value={cur}
                      onChange={c => {
                        setCurrencies(prev => ({ ...prev, [cat.id]: c }))
                        const num = Number(val)
                        if (val && num > 0) {
                          const converted = c === 'BGN'
                            ? convertEurToBgn(num)
                            : convertBgnToEur(num)
                          setAmounts(prev => ({
                            ...prev,
                            [cat.id]: converted.toFixed(2),
                          }))
                        }
                      }}
                    />
                    {hasExpense && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteExpense(cat.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={val}
                  onChange={e => {
                    const v = e.target.value.replace(',', '.')
                    if (v === '' || /^\d*\.?\d*$/.test(v)) {
                      setAmounts(prev => ({ ...prev, [cat.id]: v }))
                    }
                  }}
                  placeholder="0.00"
                />
                {cur === 'BGN' && val && Number(val) > 0 && (
                  <p className="text-xs text-muted-foreground text-right">
                    ≈ {convertBgnToEur(Number(val)).toFixed(2)} €
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отказ
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? 'Запазване...' : 'Запази'}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
