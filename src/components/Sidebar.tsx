import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, CreditCard, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggleBulb } from '@licheff/dark-mode-switch'

const navItems = [
  { to: '/', label: 'Преглед', icon: LayoutDashboard, end: true },
  { to: '/expenses', label: 'Разходи', icon: Receipt, end: false },
  { to: '/subscriptions', label: 'Абонаменти', icon: CreditCard, end: false },
]

const mobileNavItems = [
  ...navItems,
  { to: '/settings', label: 'Настройки', icon: Settings, end: false },
]

export function Sidebar() {
  return (
    <>
      {/* Desktop sidebar — fixed, full height */}
      <aside className="hidden sm:fixed sm:inset-y-0 sm:left-0 sm:z-30 sm:flex sm:w-[220px] sm:flex-col bg-sidebar border-r border-sidebar-border">
        {/* App name */}
        <div className="px-4 py-5 border-b border-sidebar-border">
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">💸 Бюджетник</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/8 text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-primary/4',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom utility bar: theme toggle + settings icon */}
        <div className="px-3 py-4 border-t border-sidebar-border flex items-center gap-1">
          <ThemeToggleBulb className="text-sidebar-foreground hover:bg-primary/4 hover:text-sidebar-accent-foreground" />
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                isActive
                  ? 'bg-primary/8 text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-primary/4 hover:text-sidebar-accent-foreground',
              )
            }
            title="Настройки"
          >
            <Settings className="h-4 w-4" />
          </NavLink>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-background border-t flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {mobileNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-1 pt-2.5 pb-4 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
