import { useState, useEffect } from 'react'
import { Plus, Trash2, CalendarClock, LogOut } from 'lucide-react'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useApartments } from '@/hooks/useApartments'
import { usePaymentSources } from '@/hooks/usePaymentSources'

interface SettingsPageProps {
  signOut: () => Promise<void>
}

function getEndDateStatus(endDate: string | null): 'none' | 'ok' | 'soon' | 'expired' {
  if (!endDate) return 'none'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(endDate)
  const diffDays = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= 30) return 'soon'
  return 'ok'
}

const endDateIconClass: Record<ReturnType<typeof getEndDateStatus>, string> = {
  none: 'text-muted-foreground/40 hover:text-muted-foreground',
  ok: 'text-muted-foreground hover:text-foreground',
  soon: 'text-amber-500 hover:text-amber-600',
  expired: 'text-destructive hover:text-destructive/80',
}

export function SettingsPage({ signOut }: SettingsPageProps) {
  const {
    apartments,
    categories,
    addCategory,
    deleteCategory,
    toggleCategoryPaidByMe,
    updateCategoryEndDate,
    updateRentAmount,
  } = useApartments()

  const { paymentSources, create: createSource, remove: removeSource } = usePaymentSources()

  const [activeTab, setActiveTab] = useState(apartments[0]?.id ?? '')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null)
  const [rentInputs, setRentInputs] = useState<Record<string, string>>({})
  const [newSourceName, setNewSourceName] = useState('')
  const [deletingSource, setDeletingSource] = useState<string | null>(null)

  useEffect(() => {
    if (!activeTab && apartments.length > 0) {
      setActiveTab(apartments[0].id)
    }
  }, [apartments, activeTab])

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !activeTab) return
    await addCategory(activeTab, newCategoryName.trim())
    setNewCategoryName('')
  }

  const handleDeleteCategory = async (id: string) => {
    setDeletingCategory(id)
    await deleteCategory(id)
    setDeletingCategory(null)
  }

  const getRentInput = (apt: { id: string; rent_amount: number | null }) => {
    if (rentInputs[apt.id] !== undefined) return rentInputs[apt.id]
    return apt.rent_amount != null ? String(apt.rent_amount) : ''
  }

  const handleSaveRent = async (aptId: string) => {
    const val = rentInputs[aptId]
    const num = val ? Number(val) : null
    await updateRentAmount(aptId, num && num > 0 ? num : null)
    setRentInputs(prev => {
      const next = { ...prev }
      delete next[aptId]
      return next
    })
  }

  const handleAddSource = async () => {
    if (!newSourceName.trim()) return
    await createSource(newSourceName.trim())
    setNewSourceName('')
  }

  const handleDeleteSource = async (id: string) => {
    setDeletingSource(id)
    await removeSource(id)
    setDeletingSource(null)
  }

  return (
    <div>
      <Header title="Настройки" />

      <main className="mx-auto px-4 py-6 space-y-8 max-w-[600px]">
        {/* Section 1: Expenses by location */}
        <section className="space-y-4">
          <h1 className="text-base font-semibold">Разходи по локация</h1>

          <Tabs value={activeTab} onValueChange={tab => { setActiveTab(tab); setNewCategoryName('') }}>
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
                  {/* Category list */}
                  <div className="space-y-2">
                    {aptCategories.map(cat => {
                      const status = getEndDateStatus(cat.end_date)
                      return (
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
                                onCheckedChange={v => toggleCategoryPaidByMe(cat.id, v === true)}
                              />
                              <Label
                                htmlFor={`paid-${cat.id}`}
                                className="text-xs text-muted-foreground cursor-pointer"
                              >
                                Плащам аз
                              </Label>
                            </div>

                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-7 w-7 ${endDateIconClass[status]}`}
                                  title={cat.end_date ? `Изтича: ${cat.end_date}` : 'Задай дата на изтичане'}
                                >
                                  <CalendarClock className="h-3.5 w-3.5" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={cat.end_date ? new Date(cat.end_date + 'T00:00:00') : undefined}
                                  onSelect={date => {
                                    if (!date) return
                                    const y = date.getFullYear()
                                    const m = String(date.getMonth() + 1).padStart(2, '0')
                                    const d = String(date.getDate()).padStart(2, '0')
                                    updateCategoryEndDate(cat.id, `${y}-${m}-${d}`)
                                  }}
                                  defaultMonth={cat.end_date ? new Date(cat.end_date + 'T00:00:00') : undefined}
                                  initialFocus
                                />
                                {cat.end_date && (
                                  <div className="border-t p-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full text-xs text-muted-foreground"
                                      onClick={() => updateCategoryEndDate(cat.id, null)}
                                    >
                                      Премахни датата
                                    </Button>
                                  </div>
                                )}
                              </PopoverContent>
                            </Popover>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteCategory(cat.id)}
                              disabled={deletingCategory === cat.id}
                              title="Изтрий категорията"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    {aptCategories.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Няма категории</p>
                    )}
                  </div>

                  {/* Add category */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Нова категория..."
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                    />
                    <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()} size="sm">
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
                        type="text"
                        inputMode="decimal"
                        placeholder="Няма наем"
                        value={getRentInput(apt)}
                        onChange={e => setRentInputs(prev => ({ ...prev, [apt.id]: e.target.value }))}
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
                          updateRentAmount(apt.id, null)
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
        </section>

        <Separator />

        {/* Section 2: Payment methods */}
        <section className="space-y-4">
          <h1 className="text-base font-semibold">Начини на плащане</h1>

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
                  onClick={() => handleDeleteSource(source.id)}
                  disabled={deletingSource === source.id}
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

          <div className="flex gap-2">
            <Input
              placeholder="Нов начин на плащане..."
              value={newSourceName}
              onChange={e => setNewSourceName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSource()}
            />
            <Button onClick={handleAddSource} disabled={!newSourceName.trim()} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Добави
            </Button>
          </div>
        </section>

        <Separator />

        {/* Section 3: Account */}
        <section className="space-y-4">
          <h1 className="text-base font-semibold">Акаунт</h1>
          <Button variant="destructive" onClick={signOut} className="gap-2 w-full justify-center">
            <LogOut className="h-4 w-4" />
            Изход
          </Button>
        </section>
      </main>
    </div>
  )
}
