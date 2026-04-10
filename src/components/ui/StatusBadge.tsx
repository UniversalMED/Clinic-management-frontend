import type { ReactElement } from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type StatusDomain = 'queue' | 'invoice' | 'payment' | 'lab_order' | 'visit' | 'appointment'

const queueStyles: Record<string, string> = {
  scheduled:
    'border-purple-300 bg-purple-100 text-purple-950 dark:border-purple-700 dark:bg-purple-950/50 dark:text-purple-100',
  checked_in:
    'border-sky-300 bg-sky-100 text-sky-950 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-100',
  waiting: 'border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100',
  called: 'border-teal-300 bg-teal-100 text-teal-950 dark:border-teal-700 dark:bg-teal-950/50 dark:text-teal-100',
  in_progress:
    'border-blue-300 bg-blue-100 text-blue-950 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-100',
  completed: 'border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100',
  no_show:
    'border-red-300 bg-red-100 text-red-950 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100',
}

const invoiceStyles: Record<string, string> = {
  draft: 'border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100',
  finalized:
    'border-blue-300 bg-blue-100 text-blue-950 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-100',
  void: 'border-red-300 bg-red-100 text-red-950 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100',
}

const paymentStyles: Record<string, string> = {
  pending:
    'border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100',
  success:
    'border-emerald-300 bg-emerald-100 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-100',
  failed: 'border-red-300 bg-red-100 text-red-950 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100',
}

const labOrderStyles: Record<string, string> = {
  pending:
    'border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100',
  in_progress:
    'border-blue-300 bg-blue-100 text-blue-950 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-100',
  completed:
    'border-emerald-300 bg-emerald-100 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-100',
  cancelled:
    'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
}

const appointmentStyles: Record<string, string> = {
  active:
    'border-emerald-300 bg-emerald-100 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-100',
  cancelled:
    'border-red-300 bg-red-100 text-red-950 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100',
  rescheduled:
    'border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100',
  affected:
    'border-orange-300 bg-orange-100 text-orange-950 dark:border-orange-700 dark:bg-orange-950/50 dark:text-orange-100',
}

const visitStyles: Record<string, string> = {
  open: 'border-emerald-300 bg-emerald-100 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-100',
  in_progress: 'border-blue-300 bg-blue-100 text-blue-950 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-100',
  completed: 'border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100',
}

const fallbackStyle =
  'border-border bg-muted text-muted-foreground'

function styleFor(domain: StatusDomain, status: string): string {
  const key = status.toLowerCase().replace(/-/g, '_')
  const labKey = key === 'canceled' ? 'cancelled' : key

  switch (domain) {
    case 'queue':
      return queueStyles[key] ?? fallbackStyle
    case 'invoice':
      return invoiceStyles[key] ?? fallbackStyle
    case 'payment':
      return paymentStyles[key] ?? fallbackStyle
    case 'lab_order':
      return labOrderStyles[labKey] ?? fallbackStyle
    case 'visit':
      return visitStyles[key] ?? fallbackStyle
    case 'appointment':
      return appointmentStyles[key] ?? fallbackStyle
    default:
      return fallbackStyle
  }
}

function formatLabel(status: string): string {
  return status.replace(/_/g, ' ')
}

type StatusBadgeProps = {
  domain: StatusDomain
  status: string
  className?: string
}

export function StatusBadge({
  domain,
  status,
  className,
}: StatusBadgeProps): ReactElement {
  return (
    <Badge
      variant="outline"
      className={cn('font-normal capitalize', styleFor(domain, status), className)}
    >
      {formatLabel(status)}
    </Badge>
  )
}
