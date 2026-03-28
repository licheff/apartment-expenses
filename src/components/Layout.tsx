import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'

interface LayoutProps {
  signOut: () => Promise<void>
}

export function Layout({ signOut }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar signOut={signOut} />
      {/* sm:pl-[220px] offsets the fixed sidebar on desktop; padding-bottom clears the mobile tab bar + safe area */}
      <div className="sm:pl-[220px] sm:pb-0" style={{ paddingBottom: 'calc(70px + env(safe-area-inset-bottom))' }}>
        <Outlet />
      </div>
    </div>
  )
}
