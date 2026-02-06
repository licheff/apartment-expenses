import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface YearSelectorProps {
  years: number[]
  selected: number
  onSelect: (year: number) => void
}

export function YearSelector({ years, selected, onSelect }: YearSelectorProps) {
  return (
    <Select value={String(selected)} onValueChange={v => onSelect(Number(v))}>
      <SelectTrigger className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {years.map(year => (
          <SelectItem key={year} value={String(year)}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
