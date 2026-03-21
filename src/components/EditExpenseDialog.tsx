import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
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
import { CurrencyToggle } from '@/components/CurrencyToggle'
import { MathOperatorButtons } from '@/components/MathOperatorButtons'
import type { Category, MonthRow } from '@/types'
import { convertBgnToEur, convertEurToBgn, evaluateExpression, validateExpressionInput } from '@/lib/constants'

type Currency = 'EUR' | 'BGN'

interface EditExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  monthRow: MonthRow | null
  onSave: (entries: { categoryId: string; amount: number; notes: string | null }[]) => Promise<void>
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
  const [shakingFields, setShakingFields] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (monthRow) {
      const initialAmounts: Record<string, string> = {}
      const initialCurrencies: Record<string, Currency> = {}
      const initialNotes: Record<string, string> = {}
      const initialExpanded: Record<string, boolean> = {}
      for (const cat of categories) {
        initialAmounts[cat.id] = monthRow.expenses[cat.id] != null
          ? String(monthRow.expenses[cat.id])
          : ''
        initialCurrencies[cat.id] = 'EUR'
        const note = monthRow.expenseNotes?.[cat.id] ?? ''
        initialNotes[cat.id] = note
        initialExpanded[cat.id] = note.length > 0
      }
      setAmounts(initialAmounts)
      setCurrencies(initialCurrencies)
      setNotes(initialNotes)
      setExpandedNotes(initialExpanded)
    }
  }, [monthRow, categories])

  const commitExpression = (catId: string, val: string) => {
    if (!val || ![...val].some(c => '+-*/()'.includes(c))) return
    const result = evaluateExpression(val)
    if (result === false) {
      setShakingFields(prev => ({ ...prev, [catId]: true }))
      setTimeout(() => setShakingFields(prev => ({ ...prev, [catId]: false })), 400)
    } else {
      setAmounts(prev => ({ ...prev, [catId]: String(result) }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const entries = categories
      .filter(cat => {
        const v = amounts[cat.id]
        if (!v) return false
        if ([...v].some(c => '+-*/()'.includes(c))) return evaluateExpression(v) !== false
        return Number(v) > 0
      })
      .map(cat => {
        let v = amounts[cat.id]
        if ([...v].some(c => '+-*/()'.includes(c))) v = String(evaluateExpression(v) || 0)
        const raw = Number(v)
        const cur = currencies[cat.id] ?? 'EUR'
        return {
          categoryId: cat.id,
          amount: cur === 'BGN' ? convertBgnToEur(raw) : raw,
          notes: notes[cat.id]?.trim() || null,
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
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{monthRow.monthName}</DialogTitle>
        </DialogHeader>

        {/* Content */}
        <DialogBody className="flex-1 min-h-0 max-h-none sm:max-h-[60vh]">
          <MathOperatorButtons />
          {categories.map(cat => {
            const val = amounts[cat.id] ?? ''
            const cur = currencies[cat.id] ?? 'EUR'
            const hasExpense = monthRow.expenseIds[cat.id] != null
            return (
              <div key={cat.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    data-math-input=""
                    value={val}
                    onChange={e => {
                      const result = validateExpressionInput(e.target.value)
                      if (result === false) {
                        setShakingFields(prev => ({ ...prev, [cat.id]: true }))
                        setTimeout(() => setShakingFields(prev => ({ ...prev, [cat.id]: false })), 400)
                        return
                      }
                      setAmounts(prev => ({ ...prev, [cat.id]: result }))
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') commitExpression(cat.id, val) }}
                    onBlur={() => commitExpression(cat.id, val)}
                    placeholder="0.00"
                    className={`max-w-[200px] ${shakingFields[cat.id] ? 'animate-shake' : ''}`}
                  />
                  {cur === 'BGN' && val && Number(val) > 0 && ![...val].some(c => '+-*/()'.includes(c)) && (
                    <p className="text-xs text-muted-foreground text-right">
                      ≈ {convertBgnToEur(Number(val)).toFixed(2)} €
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                      <CurrencyToggle
                        value={cur}
                        onChange={c => {
                          setCurrencies(prev => ({ ...prev, [cat.id]: c as Currency }))
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
                {(Number(val) > 0 && ![...val].some(c => '+-*/()'.includes(c))) && (
                  expandedNotes[cat.id] ? (
                    <textarea
                      className="w-full text-sm resize-none rounded-md border border-input bg-transparent px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      rows={2}
                      placeholder="Бележка..."
                      value={notes[cat.id] ?? ''}
                      onChange={e => setNotes(prev => ({ ...prev, [cat.id]: e.target.value }))}
                    />
                  ) : (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground text-left"
                      onClick={() => setExpandedNotes(prev => ({ ...prev, [cat.id]: true }))}
                    >
                      + Добави бележка
                    </button>
                  )
                )}
              </div>
            )
          })}
        </DialogBody>

        {/* Footer */}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отказ
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? 'Запазване...' : 'Запази'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
