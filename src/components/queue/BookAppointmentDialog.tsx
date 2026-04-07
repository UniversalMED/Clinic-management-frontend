import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { CalendarPlus, Search, X } from 'lucide-react'
import { toast } from 'sonner'

import type { Patient } from '@/types/patient.types'
import { useCreateAppointment } from '@/hooks/useQueue'
import { usePatients } from '@/hooks/usePatients'
import { useUsers } from '@/hooks/useUsers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

// ---------------------------------------------------------------------------
// Patient search combobox
// ---------------------------------------------------------------------------

interface PatientComboboxProps {
  value: Patient | null
  onChange: (p: Patient | null) => void
}

function PatientCombobox({ value, onChange }: PatientComboboxProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data: patientsData } = usePatients({
    search: debouncedQuery || undefined,
    page_size: 8,
  })

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/40 px-2.5 py-1.5 text-sm">
        <span className="flex-1 truncate">{value.full_name}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Remove patient"
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
          placeholder="Search patients…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          className="pl-8"
        />
      </div>
      {showResults && patientsData && patientsData.results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
          {patientsData.results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(p)
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
  )
}

// ---------------------------------------------------------------------------
// BookAppointmentDialog
// ---------------------------------------------------------------------------

// Default datetime: today + 1 hour, rounded to nearest 30 min
function defaultDatetime(): string {
  const d = new Date()
  d.setHours(d.getHours() + 1, d.getMinutes() < 30 ? 0 : 30, 0, 0)
  // datetime-local format: YYYY-MM-DDTHH:mm
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

export function BookAppointmentDialog() {
  const [open, setOpen] = useState(false)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [doctorId, setDoctorId] = useState<string>('')
  const [scheduledAt, setScheduledAt] = useState(defaultDatetime())
  const [type, setType] = useState<'specialist' | 'general'>('general')
  const [notes, setNotes] = useState('')

  const createAppointment = useCreateAppointment()

  const { data: usersData } = useUsers({ page_size: 100 })
  const doctors = usersData?.results.filter(
    (u) => u.role === 'doctor',
  ) ?? []

  function resetForm() {
    setPatient(null)
    setDoctorId('')
    setScheduledAt(defaultDatetime())
    setType('general')
    setNotes('')
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) resetForm()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patient) return

    createAppointment.mutate(
      {
        patient_id: patient.id,
        doctor_id: doctorId || null,
        scheduled_at: new Date(scheduledAt).toISOString(),
        type,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Appointment booked')
          handleOpenChange(false)
        },
        onError: () => toast.error('Failed to book appointment'),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="w-full">
            <CalendarPlus className="h-3.5 w-3.5" />
            Book appointment
          </Button>
        }
      />

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Book appointment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Patient */}
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <PatientCombobox value={patient} onChange={setPatient} />
          </div>

          {/* Doctor */}
          <div className="space-y-1.5">
            <Label>Doctor (optional)</Label>
            <Select
              value={doctorId}
              onValueChange={setDoctorId}
            >
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

          {/* Date & time */}
          <div className="space-y-1.5">
            <Label htmlFor="scheduled-at">Date & time</Label>
            <input
              id="scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as 'specialist' | 'general')}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="specialist">Specialist</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="appt-notes">Notes (optional)</Label>
            <Textarea
              id="appt-notes"
              placeholder="Additional notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-16"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button
              type="submit"
              disabled={!patient || !scheduledAt || createAppointment.isPending}
            >
              {createAppointment.isPending ? 'Booking…' : 'Book'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
