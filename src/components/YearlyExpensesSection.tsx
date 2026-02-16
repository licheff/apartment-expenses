import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('EUR')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editCurrency, setEditCurrency] = useState<Currency>('EUR')

  const handleAdd = async () => {
    if (!newName.trim() || !newAmount) return
    const raw = Number(newAmount)
    const eur = currency === 'BGN' ? convertBgnToEur(raw) : raw
    await onCreate(newName.trim(), eur)
    setNewName('')
    setNewAmount('')
    setCurrency('EUR')
    setAdding(false)
  }

  const startEdit = (exp: YearlyExpense) => {
    setEditingId(exp.id)
    setEditAmount(String(exp.amount))
    setEditCurrency('EUR')
  }

  const handleEditSave = async () => {
    if (!editingId || !editAmount) return
    const raw = Number(editAmount)
    const eur = editCurrency === 'BGN' ? convertBgnToEur(raw) : raw
    await onUpdate(editingId, eur)
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditAmount('')
    setEditCurrency('EUR')
  }

  const cancelAdd = () => {
    setAdding(false)
    setNewName('')
    setNewAmount('')
    setCurrency('EUR')
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Годишни разходи ({year})
          </CardTitle>
          {!adding && (
            <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Добави
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {yearlyExpenses.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Няма годишни разходи
          </p>
        )}

        <div className="space-y-2">
          {yearlyExpenses.map(exp => (
            <div
              key={exp.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="text-sm">{exp.name}</span>
              {editingId === exp.id ? (
                <div className="flex items-center gap-2">
                  <CurrencyToggle value={editCurrency} onChange={setEditCurrency} />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-24 h-8 text-sm"
                    value={editAmount}
                    onChange={e => setEditAmount(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleEditSave()
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleEditSave}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={cancelEdit}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(Number(exp.amount))}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => startEdit(exp)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete(exp.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {adding && (
            <div className="rounded-md border px-3 py-2 space-y-2">
              <Input
                placeholder="Име (напр. Данък)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <CurrencyToggle value={currency} onChange={setCurrency} />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-24 h-8 text-sm"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAdd()
                    if (e.key === 'Escape') cancelAdd()
                  }}
                />
                <Button size="sm" className="h-8" onClick={handleAdd} disabled={!newName.trim() || !newAmount}>
                  Запази
                </Button>
                <Button variant="ghost" size="sm" className="h-8" onClick={cancelAdd}>
                  Отказ
                </Button>
              </div>
            </div>
          )}
        </div>

        {yearlyExpenses.length > 0 && (
          <div className="flex justify-between pt-3 mt-3 border-t">
            <span className="text-sm font-bold">Общо годишни</span>
            <span className="text-sm font-bold tabular-nums">
              {formatCurrency(yearlyTotal)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
