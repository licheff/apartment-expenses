import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Apartment, Category } from '@/types'

interface ManageCategoriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apartments: Apartment[]
  categories: Record<string, Category[]>
  onAdd: (apartmentId: string, name: string) => Promise<{ error: unknown }>
  onDelete: (categoryId: string) => Promise<{ error: unknown }>
  onTogglePaidByMe: (categoryId: string, paidByMe: boolean) => Promise<{ error: unknown }>
  onUpdateRentAmount: (apartmentId: string, rentAmount: number | null) => Promise<{ error: unknown }>
}

export function ManageCategoriesDialog({
  open,
  onOpenChange,
  apartments,
  categories,
  onAdd,
  onDelete,
  onTogglePaidByMe,
  onUpdateRentAmount,
}: ManageCategoriesDialogProps) {
  const [newName, setNewName] = useState('')
  const [activeTab, setActiveTab] = useState(apartments[0]?.id ?? '')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [rentInputs, setRentInputs] = useState<Record<string, string>>({})

  const handleAdd = async () => {
    if (!newName.trim() || !activeTab) return
    await onAdd(activeTab, newName.trim())
    setNewName('')
  }

  const handleDelete = async (categoryId: string) => {
    setDeleting(categoryId)
    await onDelete(categoryId)
    setDeleting(null)
  }

  const getRentInput = (apt: Apartment) => {
    if (rentInputs[apt.id] !== undefined) return rentInputs[apt.id]
    return apt.rent_amount != null ? String(apt.rent_amount) : ''
  }

  const handleSaveRent = async (aptId: string) => {
    const val = rentInputs[aptId]
    const num = val ? Number(val) : null
    await onUpdateRentAmount(aptId, num && num > 0 ? num : null)
    setRentInputs(prev => {
      const next = { ...prev }
      delete next[aptId]
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Настройки</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            {apartments.map(apt => (
              <TabsTrigger key={apt.id} value={apt.id} className="flex-1">
                {apt.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {apartments.map(apt => {
            const aptCategories = categories[apt.id] ?? []
            return (
              <TabsContent key={apt.id} value={apt.id} className="space-y-4">
                {/* Existing categories */}
                <div className="space-y-2">
                  {aptCategories.map(cat => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <span className="text-sm">{cat.name}</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Checkbox
                            id={`paid-${cat.id}`}
                            checked={cat.paid_by_me}
                            onCheckedChange={v => onTogglePaidByMe(cat.id, v === true)}
                          />
                          <Label
                            htmlFor={`paid-${cat.id}`}
                            className="text-xs text-muted-foreground cursor-pointer"
                          >
                            Плащам аз
                          </Label>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(cat.id)}
                          disabled={deleting === cat.id}
                          title="Изтрий категорията"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {aptCategories.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Няма категории
                    </p>
                  )}
                </div>

                <Separator />

                {/* Add new category */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Нова категория..."
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                  <Button onClick={handleAdd} disabled={!newName.trim()} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Добави
                  </Button>
                </div>

                <Separator />

                {/* Rent amount */}
                <div className="grid gap-2">
                  <Label className="text-sm">Месечен наем (EUR)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Няма наем"
                      value={getRentInput(apt)}
                      onChange={e =>
                        setRentInputs(prev => ({ ...prev, [apt.id]: e.target.value }))
                      }
                    />
                    <Button size="sm" onClick={() => handleSaveRent(apt.id)}>
                      Запази
                    </Button>
                  </div>
                  {apt.rent_amount != null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground w-fit"
                      onClick={() => {
                        setRentInputs(prev => ({ ...prev, [apt.id]: '' }))
                        onUpdateRentAmount(apt.id, null)
                      }}
                    >
                      Премахни наема
                    </Button>
                  )}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
