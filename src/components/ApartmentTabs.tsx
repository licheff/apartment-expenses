import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Apartment } from '@/types'

interface ApartmentTabsProps {
  apartments: Apartment[]
  selected: string
  onSelect: (id: string) => void
}

export function ApartmentTabs({ apartments, selected, onSelect }: ApartmentTabsProps) {
  return (
    <Tabs value={selected} onValueChange={onSelect}>
      <TabsList>
        {apartments.map(apt => (
          <TabsTrigger key={apt.id} value={apt.id}>
            {apt.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
