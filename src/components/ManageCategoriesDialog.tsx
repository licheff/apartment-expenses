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
}

export function ManageCategoriesDialog({
  open,
  onOpenChange,
  apartments,
  categories,
  onAdd,
  onDelete,
}: ManageCategoriesDialogProps) {
  const [newName, setNewName] = useState('')
  const [activeTab, setActiveTab] = useState(apartments[0]?.id ?? '')
  const [deleting, setDeleting] = useState<string | null>(null)

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Управление на категории</DialogTitle>
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
              </TabsContent>
            )
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
