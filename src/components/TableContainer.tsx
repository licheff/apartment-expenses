import { cn } from '@/lib/utils'

interface TableContainerProps {
  /** Use scrollable when the table has many columns and needs horizontal scroll (e.g. ExpenseTable) */
  scrollable?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Standard wrapper for all tables. Enforces rounded-lg border bg-card.
 * Pass scrollable for wide tables that need horizontal scroll.
 */
export function TableContainer({ scrollable = false, className, children }: TableContainerProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card',
        scrollable ? 'overflow-x-auto' : 'overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  )
}
