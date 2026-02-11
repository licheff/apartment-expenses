import { useEffect, useState } from 'react'
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
}

export function EditExpenseDialog({
  open,
  onOpenChange,
  categories,
  monthRow,
  onSave,
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

  if (!monthRow) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Редактирай — {monthRow.monthName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {categories.map(cat => {
            const val = amounts[cat.id] ?? ''
            const cur = currencies[cat.id] ?? 'EUR'
            return (
              <div key={cat.id} className="grid gap-1">
                <div className="flex items-center justify-between">
                  <Label>{cat.name}</Label>
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
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={val}
                  onChange={e =>
                    setAmounts(prev => ({ ...prev, [cat.id]: e.target.value }))
                  }
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отказ
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Запазване...' : 'Запази'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
