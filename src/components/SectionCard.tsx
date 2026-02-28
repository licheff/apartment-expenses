import { cn } from '@/lib/utils'

interface SectionCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

/**
 * Reusable panel with a labeled header border and card background.
 * Use className for grid positioning (e.g. "sm:col-span-2").
 */
export function SectionCard({ title, children, className }: SectionCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card overflow-hidden', className)}>
      <div className="px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  )
}
