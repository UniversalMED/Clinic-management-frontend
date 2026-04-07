import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { GripVertical, Clock } from 'lucide-react'
import { toast } from 'sonner'

import type { QueueEntry } from '@/types/queue.types'
import { useAuth } from '@/hooks/useAuth'
import {
  useCallPatient,
  useMarkNoShow,
  useReinsert,
  useStartVisit,
  useCompleteVisit,
} from '@/hooks/useQueue'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function checkedInAgo(iso: string | null): string {
  if (!iso) return '—'
  return formatDistanceToNow(parseISO(iso), { addSuffix: true })
}

// ---------------------------------------------------------------------------
// Inline re-insert dialog
// ---------------------------------------------------------------------------

interface ReinsertDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: (reason: string) => void
  isPending: boolean
}

function ReinsertDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: ReinsertDialogProps) {
  const [reason, setReason] = useState('')

  function handleSubmit() {
    if (!reason.trim()) return
    onConfirm(reason.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Re-insert patient</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="reinsert-reason">Reason</Label>
          <Textarea
            id="reinsert-reason"
            placeholder="e.g. Patient returned after no-show"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-20"
          />
        </div>
        <DialogFooter showCloseButton>
          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || isPending}
          >
            {isPending ? 'Reinserting…' : 'Re-insert'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// QueueCard
// ---------------------------------------------------------------------------

export interface QueueCardProps {
  entry: QueueEntry
  doctorName?: string
  dragHandleProps?: React.HTMLAttributes<HTMLElement>
  isDragging?: boolean
}

export function QueueCard({
  entry,
  doctorName,
  dragHandleProps,
  isDragging,
}: QueueCardProps) {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()

  const [reinsertOpen, setReinsertOpen] = useState(false)

  const callPatient = useCallPatient()
  const markNoShow = useMarkNoShow()
  const reinsert = useReinsert()
  const startVisit = useStartVisit()
  const completeVisit = useCompleteVisit()

  const canManageQueue = hasPermission('manage_queue')
  const canStartVisit = hasPermission('start_visit_from_queue')

  // ---- action handlers ---------------------------------------------------

  function handleCall() {
    callPatient.mutate(entry.id, {
      onSuccess: () => toast.success('Patient called'),
      onError: () => toast.error('Failed to call patient'),
    })
  }

  function handleNoShow() {
    markNoShow.mutate(
      { entryId: entry.id, data: { reason: 'staff_marked_no_show' } },
      {
        onSuccess: () => toast.success('Marked as no-show'),
        onError: () => toast.error('Failed to mark no-show'),
      },
    )
  }

  function handleReinsert(reason: string) {
    reinsert.mutate(
      { entryId: entry.id, data: { reason } },
      {
        onSuccess: () => {
          setReinsertOpen(false)
          toast.success('Patient re-inserted into queue')
        },
        onError: () => toast.error('Failed to re-insert patient'),
      },
    )
  }

  function handleStartVisit() {
    startVisit.mutate(entry.id, {
      onSuccess: (data) => {
        toast.success('Visit started')
        navigate(`/visits/${data.visit_id}`)
      },
      onError: () => toast.error('Failed to start visit'),
    })
  }

  function handleComplete() {
    completeVisit.mutate(entry.id, {
      onSuccess: () => toast.success('Visit completed'),
      onError: () => toast.error('Failed to complete visit'),
    })
  }

  // ---- render ------------------------------------------------------------

  return (
    <>
      <div
        className={`group relative rounded-lg border bg-card p-3 text-sm ring-1 ring-foreground/10 transition-shadow ${
          isDragging ? 'shadow-lg opacity-60' : 'hover:shadow-sm'
        }`}
      >
        <div className="flex items-start gap-2">
          {/* Drag handle (only rendered when dragHandleProps provided) */}
          {dragHandleProps && (
            <button
              type="button"
              className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
              {...dragHandleProps}
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}

          {/* Position badge */}
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
            {entry.queue_position ?? '—'}
          </span>

          {/* Main info */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-medium leading-snug">
                {entry.patient_name ?? 'Unknown patient'}
              </span>
              <Badge variant="outline" className="text-xs font-normal">
                {entry.entry_type === 'walk_in' ? 'Walk-in' : 'Appt.'}
              </Badge>
              <StatusBadge domain="queue" status={entry.status} />
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span>{doctorName ?? 'Unassigned'}</span>
              {entry.checked_in_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {checkedInAgo(entry.checked_in_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.status === 'waiting' && canManageQueue && (
            <Button
              size="xs"
              onClick={handleCall}
              disabled={callPatient.isPending}
            >
              Call
            </Button>
          )}

          {entry.status === 'called' && (
            <>
              {canStartVisit && (
                <Button
                  size="xs"
                  onClick={handleStartVisit}
                  disabled={startVisit.isPending}
                >
                  Start Visit
                </Button>
              )}
              {canManageQueue && (
                <Button
                  size="xs"
                  variant="destructive"
                  onClick={handleNoShow}
                  disabled={markNoShow.isPending}
                >
                  No Show
                </Button>
              )}
            </>
          )}

          {entry.status === 'no_show' && canManageQueue && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => setReinsertOpen(true)}
            >
              Re-insert
            </Button>
          )}

          {entry.status === 'in_progress' && canStartVisit && (
            <Button
              size="xs"
              variant="secondary"
              onClick={handleComplete}
              disabled={completeVisit.isPending}
            >
              Complete
            </Button>
          )}
        </div>
      </div>

      <ReinsertDialog
        open={reinsertOpen}
        onOpenChange={setReinsertOpen}
        onConfirm={handleReinsert}
        isPending={reinsert.isPending}
      />
    </>
  )
}
