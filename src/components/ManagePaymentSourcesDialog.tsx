import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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
import type { PaymentSource } from '@/types'

interface ManagePaymentSourcesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentSources: PaymentSource[]
  onCreate: (name: string) => Promise<{ error: unknown }>
  onDelete: (id: string) => Promise<{ error: unknown }>
}

export function ManagePaymentSourcesDialog({
  open,
  onOpenChange,
  paymentSources,
  onCreate,
  onDelete,
}: ManagePaymentSourcesDialogProps) {
  const [newName, setNewName] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!newName.trim()) return
    await onCreate(newName.trim())
    setNewName('')
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await onDelete(id)
    setDeleting(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Начини на плащане</DialogTitle>
        </DialogHeader>

        <DialogBody>
          {/* Existing sources */}
          <div className="space-y-2">
            {paymentSources.map(source => (
              <div
                key={source.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span className="text-sm">{source.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(source.id)}
                  disabled={deleting === source.id}
                  title="Изтрий"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {paymentSources.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Няма добавени начини на плащане
              </p>
            )}
          </div>

          {/* Add new source */}
          <div className="flex gap-2">
            <Input
              placeholder="Нов начин на плащане..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={!newName.trim()} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Добави
            </Button>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            Готово
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
