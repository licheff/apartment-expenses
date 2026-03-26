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
      {/* sm:pl-[220px] offsets the fixed sidebar on desktop; padding-bottom clears the mobile tab bar + safe area */}
      <div className="sm:pl-[220px] sm:pb-0" style={{ paddingBottom: 'calc(70px + env(safe-area-inset-bottom))' }}>
        <Outlet />
      </div>
    </div>
  )
}
