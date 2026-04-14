import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { Search, X, UserCheck, CalendarCheck } from 'lucide-react'
import { toast } from 'sonner'

import type { Patient } from '@/types/patient.types'
import type { Appointment } from '@/types/queue.types'
import { useCheckIn, useAppointments, useUpdateAppointment, useCancelAppointment } from '@/hooks/useQueue'
import { usePatients } from '@/hooks/usePatients'
import { useUsers } from '@/hooks/useUsers'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { BookAppointmentDialog } from '@/components/queue/BookAppointmentDialog'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Patient search combobox (walk-in)
// ---------------------------------------------------------------------------

interface PatientSearchProps {
  selected: Patient | null
  onSelect: (p: Patient | null) => void
}

function PatientSearch({ selected, onSelect }: PatientSearchProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data: patientsData, isFetching } = usePatients({
    search: debouncedQuery || undefined,
    page_size: 8,
  })

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/40 px-2.5 py-2 text-sm">
        <UserCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{selected.full_name}</p>
          <p className="text-xs text-muted-foreground">{selected.phone}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Clear selection"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          className="pl-8"
        />
      </div>

      {showResults && query.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
          {isFetching ? (
            <div className="space-y-1.5 p-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : patientsData?.results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No patients found
            </p>
          ) : (
            <ul>
              {patientsData?.results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      onSelect(p)
                      setQuery('')
                      setShowResults(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="font-medium">{p.full_name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {p.phone}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Walk-in tab
// ---------------------------------------------------------------------------

interface WalkInTabProps {
  onSuccess: () => void
}

function WalkInTab({ onSuccess }: WalkInTabProps) {
  const [selected, setSelected] = useState<Patient | null>(null)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const checkIn = useCheckIn()
  const { data: usersData } = useUsers({ role: 'doctor', page_size: 100 })
  const doctors = usersData?.results.filter((u) => u.role === 'doctor') ?? []
  const [selectedDoctorId, setSelectedDoctorId] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    checkIn.mutate(
      { patient_id: selected.id },
      {
        onSuccess: (entry) => {
          setQueuePosition(entry.queue_position)
          toast.success(
            entry.queue_position
              ? `Patient checked in — Queue position #${entry.queue_position}`
              : 'Patient checked in',
          )
          setSelected(null)
          setSelectedDoctorId('')
          onSuccess()
        },
        onError: () => toast.error('Check-in failed'),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <PatientSearch selected={selected} onSelect={(p) => { setSelected(p); setQueuePosition(null) }} />

      {selected && doctors.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Preferred doctor (optional)</label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring dark:bg-input/30"
          >
            <option value="">Any available doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.full_name}</option>
            ))}
          </select>
        </div>
      )}

      {queuePosition && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200">
          Queue position: <strong>#{queuePosition}</strong> — first-come, first-served
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!selected || checkIn.isPending}
      >
        {checkIn.isPending ? 'Checking in…' : 'Check in to queue'}
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Edit appointment dialog
// ---------------------------------------------------------------------------

interface EditAppointmentDialogProps {
  appointment: Appointment
  doctors: { id: string; full_name: string }[]
}

function EditAppointmentDialog({ appointment, doctors }: EditAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [doctorId, setDoctorId] = useState(appointment.doctor_id ?? '')
  const [scheduledAt, setScheduledAt] = useState(
    format(new Date(appointment.scheduled_at), "yyyy-MM-dd'T'HH:mm"),
  )
  const [durationMinutes, setDurationMinutes] = useState(
    appointment.duration_minutes ?? 30,
  )
  const [notes, setNotes] = useState(appointment.notes ?? '')

  const updateAppointment = useUpdateAppointment()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateAppointment.mutate(
      {
        id: appointment.id,
        data: {
          doctor_id: doctorId || null,
          scheduled_at: new Date(scheduledAt).toISOString(),
          duration_minutes: durationMinutes,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Appointment updated')
          setOpen(false)
        },
        onError: () => toast.error('Failed to update appointment'),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        Edit
      </button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Doctor (optional)</Label>
            <Select value={doctorId} onValueChange={(v) => setDoctorId(v ?? '')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any available doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-scheduled-at">Date & time</Label>
            <input
              id="edit-scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-duration">Duration (minutes)</Label>
            <input
              id="edit-duration"
              type="number"
              min={5}
              max={480}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              required
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">Notes (optional)</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-16"
            />
          </div>
          <DialogFooter showCloseButton>
            <Button
              type="submit"
              disabled={!scheduledAt || updateAppointment.isPending}
            >
              {updateAppointment.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Cancel appointment dialog
// ---------------------------------------------------------------------------

interface CancelAppointmentDialogProps {
  appointment: Appointment
}

function CancelAppointmentDialog({ appointment }: CancelAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')

  const cancelAppointment = useCancelAppointment()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) return
    cancelAppointment.mutate(
      { id: appointment.id, data: { cancel_reason: reason.trim() } },
      {
        onSuccess: () => {
          toast.success('Appointment cancelled')
          setOpen(false)
          setReason('')
        },
        onError: () => toast.error('Failed to cancel appointment'),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded px-1.5 py-0.5 text-xs font-medium text-destructive hover:bg-destructive/10"
      >
        Cancel
      </button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cancel appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This cannot be undone. The patient will need a new appointment.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cancel-reason"
              placeholder="Enter cancellation reason…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="min-h-16"
            />
          </div>
          <DialogFooter showCloseButton>
            <Button
              type="submit"
              variant="destructive"
              disabled={!reason.trim() || cancelAppointment.isPending}
            >
              {cancelAppointment.isPending ? 'Cancelling…' : 'Cancel appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Appointment tab
// ---------------------------------------------------------------------------

interface AppointmentTabProps {
  onSuccess: () => void
}

function AppointmentTab({ onSuccess }: AppointmentTabProps) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const checkIn = useCheckIn()

  const { data: appointmentsData, isLoading } = useAppointments({
    date: today,
    status: 'active',
    page_size: 50,
  })

  const { data: patientsData } = usePatients({ page_size: 100 })
  const { data: usersData } = useUsers({ page_size: 100 })

  const patientMap = new Map(
    patientsData?.results.map((p) => [p.id, p.full_name]) ?? [],
  )
  const doctorMap = new Map(
    usersData?.results.map((u) => [u.id, u.full_name]) ?? [],
  )
  const doctors = usersData?.results.filter((u) => u.role === 'doctor') ?? []

  function handleCheckIn(appt: Appointment) {
    checkIn.mutate(
      { appointment_id: appt.id },
      {
        onSuccess: () => {
          toast.success('Patient checked in')
          onSuccess()
        },
        onError: () => toast.error('Check-in failed'),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const appointments = appointmentsData?.results ?? []

  if (appointments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <CalendarCheck className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No active appointments for today
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {appointments.map((appt) => (
        <li
          key={appt.id}
          className="rounded-lg border bg-card p-3"
        >
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 text-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate font-medium">
                  {patientMap.get(appt.patient_id) ?? `…${appt.patient_id.slice(-6)}`}
                </p>
                <StatusBadge domain="appointment" status={appt.status} />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(appt.scheduled_at)}
                {appt.doctor_id && (
                  <>
                    {' · '}
                    {doctorMap.get(appt.doctor_id) ?? 'Dr.'}
                  </>
                )}
                {' · '}
                <span className="capitalize">{appt.type}</span>
                {' · '}
                {appt.duration_minutes} min
              </p>
            </div>
            {appt.status === 'active' && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => handleCheckIn(appt)}
                disabled={checkIn.isPending}
              >
                Check in
              </Button>
            )}
          </div>
          {appt.status === 'active' && (
            <div className="mt-2 flex gap-1 border-t pt-2">
              <EditAppointmentDialog appointment={appt} doctors={doctors} />
              <CancelAppointmentDialog appointment={appt} />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// CheckInForm
// ---------------------------------------------------------------------------

type TabId = 'walk_in' | 'appointment'

const TABS: { id: TabId; label: string }[] = [
  { id: 'walk_in', label: 'Walk-in' },
  { id: 'appointment', label: 'Appointment' },
]

export function CheckInForm() {
  const [activeTab, setActiveTab] = useState<TabId>('walk_in')

  return (
    <PermissionGate
      permission="manage_queue"
      fallback={
        <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
          You don't have permission to check in patients.
        </div>
      }
    >
      <div className="rounded-xl border bg-card ring-1 ring-foreground/10">
        {/* Title */}
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Check-in</h2>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 border-b px-4 pt-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                '-mb-px border-b-2 px-3 pb-2.5 text-xs font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4">
          {activeTab === 'walk_in' ? (
            <WalkInTab onSuccess={() => {}} />
          ) : (
            <AppointmentTab onSuccess={() => {}} />
          )}
        </div>

        {/* Book appointment */}
        <div className="border-t px-4 pb-4">
          <BookAppointmentDialog />
        </div>
      </div>
    </PermissionGate>
  )
}
