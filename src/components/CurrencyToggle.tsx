type Currency = 'EUR' | 'BGN'

interface CurrencyToggleProps {
  value: Currency
  onChange: (currency: Currency) => void
}

export function CurrencyToggle({ value, onChange }: CurrencyToggleProps) {
  return (
    <div className="inline-flex items-center rounded-md border bg-muted p-0.5 text-sm">
      <button
        type="button"
        onClick={() => onChange('EUR')}
        className={`rounded-sm px-2.5 py-1 font-medium transition-colors ${
          value === 'EUR'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        EUR
      </button>
      <button
        type="button"
        onClick={() => onChange('BGN')}
        className={`rounded-sm px-2.5 py-1 font-medium transition-colors ${
          value === 'BGN'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        BGN
      </button>
    </div>
  )
}
