import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value: string          // "YYYY-MM-DD" or ""
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

// Parse "YYYY-MM-DD" as local date to avoid UTC offset shifting the displayed day
function parseLocalDate(str: string): Date | undefined {
  if (!str) return undefined
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function DatePickerInput({ value, onChange, placeholder = 'Избери дата', className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = parseLocalDate(value)

  const label = selected
    ? selected.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' })
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={date => {
            if (date) {
              onChange(toDateString(date))
              setOpen(false)
            }
          }}
          defaultMonth={selected}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
