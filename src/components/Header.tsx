import { Upload, Download, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApartmentTabs } from '@/components/ApartmentTabs'
import type { Apartment } from '@/types'

interface HeaderProps {
  apartments: Apartment[]
  selectedApartmentId: string
  onSelectApartment: (id: string) => void
  onImport: () => void
  onExport: () => void
  onSettings: () => void
}

export function Header({
  apartments,
  selectedApartmentId,
  onSelectApartment,
  onImport,
  onExport,
  onSettings,
}: HeaderProps) {
  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold tracking-tight">Месечни разходи</h1>
          {apartments.length > 0 && (
            <ApartmentTabs
              apartments={apartments}
              selected={selectedApartmentId}
              onSelect={onSelectApartment}
            />
          )}
        </div>
        <div className="flex items-center gap-1">
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
