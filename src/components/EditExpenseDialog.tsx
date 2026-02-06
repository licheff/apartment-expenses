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
import type { Category, MonthRow } from '@/types'

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
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (monthRow) {
      const initial: Record<string, string> = {}
      for (const cat of categories) {
        initial[cat.id] = monthRow.expenses[cat.id] != null
          ? String(monthRow.expenses[cat.id])
          : ''
      }
      setAmounts(initial)
    }
  }, [monthRow, categories])

  const handleSave = async () => {
    setSaving(true)
    const entries = categories
      .filter(cat => amounts[cat.id] && Number(amounts[cat.id]) > 0)
      .map(cat => ({
        categoryId: cat.id,
        amount: Number(amounts[cat.id]),
      }))
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
          {categories.map(cat => (
            <div key={cat.id} className="grid grid-cols-[1fr_120px] items-center gap-4">
              <Label>{cat.name}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amounts[cat.id] ?? ''}
                onChange={e =>
                  setAmounts(prev => ({ ...prev, [cat.id]: e.target.value }))
                }
                placeholder="0.00"
              />
            </div>
          ))}
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
