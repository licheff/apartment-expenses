import { Upload, Download, Settings, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApartmentTabs } from '@/components/ApartmentTabs'
import { YearSelector } from '@/components/YearSelector'
import type { Apartment } from '@/types'

interface HeaderProps {
  apartments: Apartment[]
  selectedApartmentId: string
  onSelectApartment: (id: string) => void
  years: number[]
  selectedYear: number
  onSelectYear: (year: number) => void
  onAdd: () => void
  onImport: () => void
  onExport: () => void
  onSettings: () => void
}

export function Header({
  apartments,
  selectedApartmentId,
  onSelectApartment,
  years,
  selectedYear,
  onSelectYear,
  onAdd,
  onImport,
  onExport,
  onSettings,
}: HeaderProps) {
  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="mx-auto flex items-center justify-between px-4 py-3 max-w-[1000px]">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">Сметки</h1>
          {apartments.length > 0 && (
            <ApartmentTabs
              apartments={apartments}
              selected={selectedApartmentId}
              onSelect={onSelectApartment}
            />
          )}
          {years.length > 0 && (
            <YearSelector
              years={years}
              selected={selectedYear}
              onSelect={onSelectYear}
            />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="default" size="sm" onClick={onAdd} title="Добави разход">
            <Plus className="h-4 w-4 mr-1" />
            Добави
          </Button>
          <Button variant="ghost" size="icon" onClick={onImport} title="Импорт CSV">
            <Upload className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onExport} title="Експорт CSV">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onSettings} title="Категории">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
