'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

import { DashboardSidebar } from '@/components/dashboard-sidebar'

const IsoLevelWarp = dynamic(() => import('@/components/ui/isometric-wave-grid-background'), {
  ssr: false,
})

const WORKSPACE_ROUTE_REGEX =
  /^\/(?:$|dashboard(?:\/|$)|projects(?:\/|$)|assets(?:\/|$)|editor(?:\/|$)|settings(?:\/|$)|exports(?:\/|$)|templates(?:\/|$)|team(?:\/|$)|highlights(?:\/|$)|captions(?:\/|$)|broll(?:\/|$)|brand-kit(?:\/|$)|billing(?:\/|$))/
const EDITOR_DETAIL_ROUTE_REGEX = /^\/editor\/[^/]+(?:\/|$)/

const AUTH_ROUTE_REGEX = /^\/(?:login|signup|verify|forgot-password|reset-password|terms|privacy)(?:\/|$)/

function isWorkspaceRoute(pathname: string) {
  if (!pathname || pathname.startsWith('/api')) return false
  if (AUTH_ROUTE_REGEX.test(pathname)) return false
  return WORKSPACE_ROUTE_REGEX.test(pathname)
}

export function WorkspaceFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const shouldRenderWorkspaceShell = isWorkspaceRoute(pathname)
  const shouldRenderSidebar = shouldRenderWorkspaceShell && !EDITOR_DETAIL_ROUTE_REGEX.test(pathname)

  if (!shouldRenderWorkspaceShell) {
    return <>{children}</>
  }

  return (
    <div className="relative h-screen w-full overflow-hidden font-sans selection:bg-white/10 selection:text-white">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_12%_4%,rgba(168,124,255,0.08)_0%,rgba(34,14,58,0.04)_42%,transparent_72%),linear-gradient(180deg,rgba(10,10,14,0.98)_0%,rgba(6,6,8,1)_100%)]" />
      <IsoLevelWarp color="148, 100, 255" density={36} speed={0.9} />

      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_12%_4%,rgba(168,124,255,0.14)_0%,rgba(34,14,58,0.06)_42%,transparent_72%),linear-gradient(180deg,rgba(8,8,12,0.6)_0%,rgba(4,4,6,0.85)_100%)]" />

      <div className="relative z-10 flex h-screen w-full">
        {shouldRenderSidebar ? <DashboardSidebar /> : null}

        <div className="relative z-10 flex h-screen flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
