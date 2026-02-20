import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | null>(null)
  const [selectedExp, setSelectedExp] = useState<YearlyExpense | null>(null)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('EUR')

  const openAdd = () => {
    setName('')
    setAmount('')
    setCurrency('EUR')
    setDialogMode('add')
  }

  const openEdit = (exp: YearlyExpense) => {
    setSelectedExp(exp)
    setAmount(String(exp.amount))
    setCurrency('EUR')
    setDialogMode('edit')
  }

  const closeDialog = () => {
    setDialogMode(null)
    setSelectedExp(null)
    setName('')
    setAmount('')
    setCurrency('EUR')
  }

  const handleAdd = async () => {
    if (!name.trim() || !amount) return
    const eur = currency === 'BGN' ? convertBgnToEur(Number(amount)) : Number(amount)
    await onCreate(name.trim(), eur)
    closeDialog()
  }

  const handleEdit = async () => {
    if (!selectedExp || !amount) return
    const eur = currency === 'BGN' ? convertBgnToEur(Number(amount)) : Number(amount)
    await onUpdate(selectedExp.id, eur)
    closeDialog()
  }

  const handleDelete = async () => {
    if (!selectedExp) return
    await onDelete(selectedExp.id)
    closeDialog()
  }

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
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add'
                ? `Годишен разход (${year})`
                : selectedExp?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {dialogMode === 'add' && (
              <div className="grid gap-2">
                <Label>Наименование</Label>
                <Input
                  placeholder="напр. Данък"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  autoFocus
                />
              </div>
            )}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Сума</Label>
                <CurrencyToggle value={currency} onChange={setCurrency} />
              </div>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') dialogMode === 'add' ? handleAdd() : handleEdit()
                }}
                autoFocus={dialogMode === 'edit'}
              />
              {currency === 'BGN' && amount && (
                <p className="text-xs text-muted-foreground">
                  ≈ {convertBgnToEur(Number(amount)).toFixed(2)} €
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            {dialogMode === 'edit' && (
              <Button variant="destructive" onClick={handleDelete} className="mr-auto">
                Изтрий
              </Button>
            )}
            <Button variant="outline" onClick={closeDialog}>Отказ</Button>
            <Button
              onClick={dialogMode === 'add' ? handleAdd : handleEdit}
              disabled={dialogMode === 'add' ? !name.trim() || !amount : !amount}
            >
              Запази
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
