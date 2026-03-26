import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, CreditCard, Sun, Moon, Monitor, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Theme } from '@/hooks/useTheme'

const navItems = [
  { to: '/', label: 'Преглед', icon: LayoutDashboard, end: true },
  { to: '/expenses', label: 'Разходи', icon: Receipt, end: false },
  { to: '/subscriptions', label: 'Абонаменти', icon: CreditCard, end: false },
]

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Светла', icon: Sun },
  { value: 'dark', label: 'Тъмна', icon: Moon },
  { value: 'system', label: 'Системна', icon: Monitor },
]

interface SidebarProps {
  signOut: () => Promise<void>
  theme: Theme
  onThemeChange: (t: Theme) => void
}

export function Sidebar({ signOut, theme, onThemeChange }: SidebarProps) {
  const ThemeIcon = themeOptions.find(t => t.value === theme)?.icon ?? Monitor

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

        {/* Bottom: theme toggle + logout */}
        <div className="px-3 py-4 border-t border-sidebar-border flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Тема"
                className="text-sidebar-foreground hover:bg-primary/4 hover:text-sidebar-accent-foreground"
              >
                <ThemeIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start">
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

          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            title="Изход"
            className="ml-auto text-sidebar-foreground hover:bg-primary/4 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-background border-t flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {navItems.map(item => (
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
