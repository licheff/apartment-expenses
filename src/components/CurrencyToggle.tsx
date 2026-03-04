interface CurrencyToggleProps {
  value: string
  onChange: (currency: string) => void
  /** Which currencies to show — defaults to ['EUR', 'BGN'] */
  currencies?: string[]
}

export function CurrencyToggle({ value, onChange, currencies = ['EUR', 'BGN'] }: CurrencyToggleProps) {
  return (
    <div className="inline-flex items-center rounded-md border bg-muted p-0.5 text-sm">
      {currencies.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`rounded-sm px-2.5 py-1 font-medium transition-colors ${
            value === c
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  )
}
