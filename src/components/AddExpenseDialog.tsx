import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Category } from '@/types'
import { MONTH_NAMES } from '@/lib/constants'

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  onSave: (categoryId: string, month: number, amount: number, year: number) => Promise<void>
  defaultMonth?: number
  defaultYear: number
}

export function AddExpenseDialog({
  open,
  onOpenChange,
  categories,
  onSave,
  defaultMonth,
  defaultYear,
}: AddExpenseDialogProps) {
  const [categoryId, setCategoryId] = useState('')
  const [month, setMonth] = useState(defaultMonth ?? 1)
  const [year, setYear] = useState(defaultYear)
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  // Generate a range of years from 2020 to current year + 1
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from(
    { length: currentYear - 2019 + 1 },
    (_, i) => currentYear + 1 - i,
  )

  const handleSave = async () => {
    if (!categoryId || !amount) return
    setSaving(true)
    await onSave(categoryId, month, Number(amount), year)
    setSaving(false)
    setCategoryId('')
    setAmount('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Добави разход</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div className="grid gap-2">
            <Label>Категория</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Избери категория" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Сума (€)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отказ
          </Button>
          <Button onClick={handleSave} disabled={!categoryId || !amount || saving}>
            {saving ? 'Запазване...' : 'Запази'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
