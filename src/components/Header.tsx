import type { ReactNode } from 'react'

interface HeaderProps {
  title?: string
  actions?: ReactNode
  children?: ReactNode
}

export function Header({ title, actions, children }: HeaderProps) {
  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="mx-auto max-w-[1000px] p-4">
        {title ? (
          <div className="flex items-center justify-between min-h-9">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        ) : (
          children
        )}
      </div>
    </header>
  )
}
