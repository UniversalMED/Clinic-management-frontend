import type { FormEvent, ReactElement } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Bell, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useAcknowledgeNotification, useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types/api.types'

function routeTitle(pathname: string): string {
  if (pathname === '/' || pathname === '/dashboard') return 'Dashboard'
  if (pathname === '/patients') return 'Patients'
  if (pathname.startsWith('/patients/')) return 'Patient detail'
  if (pathname === '/visits') return 'Visits'
  if (pathname.startsWith('/visits/')) return 'Visit detail'
  if (pathname === '/queue') return 'Queue'
  if (pathname === '/lab') return 'Lab'
  if (pathname.startsWith('/lab/orders/')) return 'Lab order'
  if (pathname === '/billing') return 'Billing'
  if (pathname.startsWith('/billing/invoices/')) return 'Invoice'
  if (pathname === '/users') return 'Users'
  if (pathname === '/audit') return 'Audit'
  return 'Clinic'
}

function formatEventLabel(eventType: string): string {
  return eventType.replace(/_/g, ' ')
}

export function Topbar(): ReactElement {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [patientQuery, setPatientQuery] = useState('')

  const title = routeTitle(location.pathname)

  useEffect(() => {
    if (location.pathname === '/patients' || location.pathname.startsWith('/patients')) {
      setPatientQuery(searchParams.get('q') ?? '')
    }
  }, [location.pathname, searchParams])

  const { data: notificationsData } = useNotifications({
    status: 'pending',
    page_size: 8,
  })
  const pendingCount = notificationsData?.count ?? 0
  const recent = notificationsData?.results ?? []

  const { mutate: ack } = useAcknowledgeNotification()

  function onPatientSearch(e: FormEvent) {
    e.preventDefault()
    const q = patientQuery.trim()
    navigate(q ? `/patients?q=${encodeURIComponent(q)}` : '/patients')
  }

  function onAcknowledge(n: Notification) {
    ack(n.id)
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <h1 className="min-w-0 shrink-0 text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h1>

      <form
        onSubmit={onPatientSearch}
        className="mx-auto flex max-w-md flex-1 items-center gap-2"
      >
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="patient-search"
            value={patientQuery}
            onChange={(e) => setPatientQuery(e.target.value)}
            placeholder="Search patients…"
            className="h-9 pl-9"
            aria-label="Search patients"
          />
        </div>
        <Button type="submit" size="sm" variant="secondary" className="shrink-0">
          Search
        </Button>
      </form>

      <div className="ml-auto flex shrink-0 items-center">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="relative"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                <span
                  className={cn(
                    'absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background',
                    pendingCount === 0 && 'hidden',
                  )}
                />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="font-semibold">
              Notifications
              {pendingCount > 0 ? (
                <span className="ml-1 font-normal text-muted-foreground">
                  ({pendingCount} pending)
                </span>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {recent.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                No pending notifications
              </div>
            ) : (
              recent.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex cursor-pointer flex-col items-start gap-0.5 py-2"
                  onClick={() => onAcknowledge(n)}
                >
                  <span className="font-medium capitalize">
                    {formatEventLabel(n.event_type)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(() => {
                      try {
                        return formatDistanceToNow(parseISO(n.created_at), {
                          addSuffix: true,
                        })
                      } catch {
                        return n.created_at
                      }
                    })()}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
