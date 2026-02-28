import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import type { Theme } from '@/hooks/useTheme'

interface LayoutProps {
  signOut: () => Promise<void>
  theme: Theme
  onThemeChange: (t: Theme) => void
}

export function Layout({ signOut, theme, onThemeChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar signOut={signOut} theme={theme} onThemeChange={onThemeChange} />
      {/* sm:pl-[220px] offsets the fixed sidebar on desktop; pb-16 clears the mobile tab bar */}
      <div className="sm:pl-[220px] pb-16 sm:pb-0">
        <Outlet />
      </div>
    </div>
  )
}
