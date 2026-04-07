import type { ReactElement } from 'react'
import { Outlet } from 'react-router-dom'

import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export function AppShell(): ReactElement {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-border bg-card">
        <Sidebar />
      </aside>
      <div className="flex min-h-screen flex-1 flex-col pl-[240px]">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
