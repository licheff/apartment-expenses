import { ArrowDownUp, Upload, Download, Settings, Sun, Moon, Monitor, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ApartmentTabs } from '@/components/ApartmentTabs'
import { YearSelector } from '@/components/YearSelector'
import type { Apartment } from '@/types'
import type { Theme } from '@/hooks/useTheme'

interface HeaderProps {
  apartments: Apartment[]
  selectedApartmentId: string
  onSelectApartment: (id: string) => void
  years: number[]
  selectedYear: number
  onSelectYear: (year: number) => void
  onImport: () => void
  onExport: () => void
  onSettings: () => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
  onSignOut: () => void
}

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Светла', icon: Sun },
  { value: 'dark', label: 'Тъмна', icon: Moon },
  { value: 'system', label: 'Системна', icon: Monitor },
]

export function Header({
  apartments,
  selectedApartmentId,
  onSelectApartment,
  years,
  selectedYear,
  onSelectYear,
  onImport,
  onExport,
  onSettings,
  theme,
  onThemeChange,
  onSignOut,
}: HeaderProps) {
  const currentThemeOption = themeOptions.find(t => t.value === theme) ?? themeOptions[2]
  const ThemeIcon = currentThemeOption.icon

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="mx-auto max-w-[1000px] px-4">
        {/* Top row: title + actions */}
        <div className="flex items-center justify-between py-3">
          <h1 className="text-xl font-bold tracking-tight">Сметки</h1>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Импорт / Експорт">
                  <ArrowDownUp className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Импорт CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Експорт CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Тема">
                  <ThemeIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {themeOptions.map(opt => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => onThemeChange(opt.value)}
                    className={theme === opt.value ? 'bg-accent' : ''}
                  >
                    <opt.icon className="h-4 w-4 mr-2" />
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={onSettings} title="Категории">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onSignOut} title="Изход">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bottom row: apartment tabs + year selector */}
        {(apartments.length > 0 || years.length > 0) && (
          <div className="flex items-center gap-3 pb-3">
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
        )}
      </div>
    </header>
  )
}
