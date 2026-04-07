import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, differenceInYears, parseISO } from 'date-fns'
import {
  Users,
  Clock,
  FlaskConical,
  Banknote,
  ChevronRight,
  Inbox,
} from 'lucide-react'

import { useVisits } from '@/hooks/useVisits'
import { useQueue } from '@/hooks/useQueue'
import { useLabOrders } from '@/hooks/useLab'
import { useInvoices } from '@/hooks/useBilling'
import { usePatients } from '@/hooks/usePatients'
import { useUsers } from '@/hooks/useUsers'
import { formatCurrency, formatRelative } from '@/utils/formatters'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardAction,
  CardDescription,
} from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const today = format(new Date(), 'yyyy-MM-dd')

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAge(dob: string): number {
  return differenceInYears(new Date(), parseISO(dob))
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  iconBg: string
  loading: boolean
}

function StatCard({ title, value, icon, iconBg, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="text-xs font-medium uppercase tracking-wide">
          {title}
        </CardDescription>
        <CardAction>
          <div className={cn('rounded-lg p-2', iconBg)}>{icon}</div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <p className="text-3xl font-bold tabular-nums tracking-tight">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Shared list-state helpers
// ---------------------------------------------------------------------------

function SkeletonRows({ count }: { count: number }) {
  return (
    <ul>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 border-b px-4 py-3 last:border-0">
          <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </li>
      ))}
    </ul>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="rounded-full bg-muted p-4">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export default function Dashboard() {
  // --- Stat card queries (page_size=1 → only need count) ---
  const { data: visitsData, isLoading: visitsLoading } = useVisits({
    date: today,
    page_size: 1,
  })

  const { data: queueWaitingData, isLoading: queueWaitingLoading } = useQueue({
    status: 'waiting',
    page_size: 1,
  })

  const { data: labData, isLoading: labLoading } = useLabOrders({
    status: 'pending',
    page_size: 1,
  })

  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({
    status: 'finalized',
    finalized_at_date: today,
    page_size: 100,
  })

  const revenueToday = useMemo(
    () =>
      invoicesData?.results.reduce(
        (sum, inv) => sum + Number(inv.total_amount),
        0,
      ) ?? 0,
    [invoicesData],
  )

  // --- Queue snapshot (top 8 active entries) ---
  const { data: queueSnapshot, isLoading: queueSnapshotLoading } = useQueue({
    status: 'waiting,called,in_progress',
    page_size: 8,
  })

  // Doctor name lookup from all users
  const { data: usersData } = useUsers({ page_size: 100 })
  const doctorMap = useMemo(() => {
    const map = new Map<string, string>()
    usersData?.results.forEach((u) => map.set(u.id, u.full_name))
    return map
  }, [usersData])

  // --- Recent patients (last 8) ---
  const { data: patientsData, isLoading: patientsLoading } = usePatients({
    page_size: 8,
  })

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Stat cards                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Patients today"
          value={visitsData?.count ?? 0}
          icon={
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          }
          iconBg="bg-blue-100 dark:bg-blue-950/50"
          loading={visitsLoading}
        />
        <StatCard
          title="Queue waiting"
          value={queueWaitingData?.count ?? 0}
          icon={
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          }
          iconBg="bg-amber-100 dark:bg-amber-950/50"
          loading={queueWaitingLoading}
        />
        <StatCard
          title="Lab pending"
          value={labData?.count ?? 0}
          icon={
            <FlaskConical className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          }
          iconBg="bg-purple-100 dark:bg-purple-950/50"
          loading={labLoading}
        />
        <StatCard
          title="Revenue today"
          value={formatCurrency(revenueToday)}
          icon={
            <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          }
          iconBg="bg-emerald-100 dark:bg-emerald-950/50"
          loading={invoicesLoading}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Two-column panels                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Queue snapshot -------------------------------------------------- */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle>Queue snapshot</CardTitle>
            <CardAction>
              <Link
                to="/queue"
                className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Manage all
                <ChevronRight className="h-3 w-3" />
              </Link>
            </CardAction>
          </CardHeader>

          <CardContent className="flex-1 p-0">
            {queueSnapshotLoading ? (
              <SkeletonRows count={5} />
            ) : !queueSnapshot?.results.length ? (
              <EmptyState message="No active queue entries right now" />
            ) : (
              <ul className="divide-y">
                {queueSnapshot.results.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {/* Position */}
                    <span className="w-5 shrink-0 text-center text-sm tabular-nums text-muted-foreground">
                      {entry.queue_position ?? '—'}
                    </span>

                    {/* Patient + doctor */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-snug">
                        {entry.patient_name ?? 'Unknown patient'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {entry.assigned_doctor_id
                          ? (doctorMap.get(entry.assigned_doctor_id) ??
                            'Unknown doctor')
                          : 'Unassigned'}
                      </p>
                    </div>

                    {/* Entry type badge */}
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs font-normal"
                    >
                      {entry.entry_type === 'walk_in' ? 'Walk-in' : 'Appt.'}
                    </Badge>

                    {/* Status badge */}
                    <StatusBadge
                      domain="queue"
                      status={entry.status}
                      className="shrink-0"
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>

          {!!queueSnapshot?.count && queueSnapshot.count > 8 && (
            <CardFooter className="justify-center">
              <Link
                to="/queue"
                className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {queueSnapshot.count - 8} more{' '}
                {queueSnapshot.count - 8 === 1 ? 'entry' : 'entries'}
                <ChevronRight className="h-3 w-3" />
              </Link>
            </CardFooter>
          )}
        </Card>

        {/* Recent patients ------------------------------------------------- */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle>Recent patients</CardTitle>
            <CardAction>
              <Link
                to="/patients"
                className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                View all
                <ChevronRight className="h-3 w-3" />
              </Link>
            </CardAction>
          </CardHeader>

          <CardContent className="flex-1 p-0">
            {patientsLoading ? (
              <SkeletonRows count={5} />
            ) : !patientsData?.results.length ? (
              <EmptyState message="No patients registered yet" />
            ) : (
              <ul className="divide-y">
                {patientsData.results.map((patient) => {
                  const isNew = patient.created_at.startsWith(today)
                  return (
                    <li
                      key={patient.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      {/* Avatar */}
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(patient.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Name + demographics */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium leading-snug">
                          {patient.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {patient.gender === 'M'
                            ? 'Male'
                            : patient.gender === 'F'
                              ? 'Female'
                              : 'Other'}
                          {' · '}
                          {getAge(patient.date_of_birth)} yrs
                        </p>
                      </div>

                      {/* New badge or time ago */}
                      {isNew ? (
                        <Badge className="shrink-0 text-xs">New</Badge>
                      ) : (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatRelative(patient.created_at)}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
