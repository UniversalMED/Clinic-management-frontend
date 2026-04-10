import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { CalendarDays, Search } from 'lucide-react'
import { toast } from 'sonner'

import type { Visit } from '@/types/patient.types'
import { useAuth } from '@/hooks/useAuth'
import { useVisits, useCreateVisit } from '@/hooks/useVisits'
import { usePatients } from '@/hooks/usePatients'
import { useUsers } from '@/hooks/useUsers'
import { formatDate } from '@/utils/formatters'
import { PatientPicker } from '@/components/patients/PatientPicker'
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type StatusFilter = '' | 'open' | 'in_progress' | 'completed'

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: '', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
]

const PAGE_SIZE = 25

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

function buildColumns(
  userMap: Map<string, string>,
  onView: (id: string) => void,
): ColumnDef<Visit>[] {
  return [
    {
      id: 'patient',
      header: 'Patient',
      cell: ({ row }) => (
        <Link
          to={`/patients/${row.original.patient_id}`}
          className="font-mono text-xs font-medium text-foreground hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          …{row.original.patient_id.slice(-8)}
        </Link>
      ),
    },
    {
      id: 'doctor',
      header: 'Doctor',
      cell: ({ row }) => {
        const id = row.original.assigned_doctor_id
        if (!id) return <span className="text-muted-foreground/60">Unassigned</span>
        return (
          <span className="text-muted-foreground">
            {userMap.get(id) ?? `…${id.slice(-6)}`}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge domain="visit" status={row.original.status} />
      ),
    },
    {
      id: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          size="xs"
          variant="ghost"
          onClick={() => onView(row.original.id)}
        >
          View
        </Button>
      ),
    },
  ]
}

// ---------------------------------------------------------------------------
// New Visit Dialog
// ---------------------------------------------------------------------------

function NewVisitDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const createVisit = useCreateVisit()

  const [patientSearch, setPatientSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(patientSearch), 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [patientSearch])

  const { data: patients, isLoading: patientsLoading } = usePatients({
    search: !selectedPatientId && debouncedSearch ? debouncedSearch : undefined,
    page_size: 10,
  })

  function reset() {
    setPatientSearch('')
    setDebouncedSearch('')
    setSelectedPatientId(null)
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  function handleSubmit() {
    if (!selectedPatientId) return
    createVisit.mutate(
      { patient_id: selectedPatientId },
      {
        onSuccess: (visit) => {
          toast.success('Visit created')
          handleOpenChange(false)
          navigate(`/visits/${visit.id}`)
        },
        onError: () => toast.error('Failed to create visit'),
      },
    )
  }

  const showResults = debouncedSearch.length > 0 && !selectedPatientId

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New visit</DialogTitle>
          <DialogDescription>
            Search for a patient to start a new visit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label>Patient</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone…"
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value)
                if (selectedPatientId) {
                  setSelectedPatientId(null)
                }
              }}
              className="pl-8"
            />
          </div>

          {showResults && (
            <div className="rounded-lg border border-border bg-popover shadow-sm max-h-48 overflow-y-auto">
              {patientsLoading ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  Searching…
                </p>
              ) : patients?.results.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  No patients found.
                </p>
              ) : (
                patients?.results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => {
                      setSelectedPatientId(p.id)
                      setPatientSearch(p.full_name)
                    }}
                  >
                    <span className="font-medium">{p.full_name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {p.phone}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <DialogFooter showCloseButton>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPatientId || createVisit.isPending}
          >
            {createVisit.isPending ? 'Creating…' : 'Create visit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Visits page
// ---------------------------------------------------------------------------

export default function Visits() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [dateFilter, setDateFilter] = useState('')
  const [patientId, setPatientId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading } = useVisits({
    status: statusFilter || undefined,
    date: dateFilter || undefined,
    patient_id: patientId ?? undefined,
    page,
    page_size: PAGE_SIZE,
  })

  const { data: usersData } = useUsers({ page_size: 100 })
  const userMap = new Map(
    usersData?.results.map((u) => [u.id, u.full_name]) ?? [],
  )

  const columns = buildColumns(userMap, (id) => navigate(`/visits/${id}`))
  const tableData = data ?? { count: 0, next: null, previous: null, results: [] }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b">
        {/* Status tabs */}
        <div className="flex" role="tablist" aria-label="Visit status filter">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={statusFilter === tab.id}
              onClick={() => {
                setStatusFilter(tab.id)
                setPage(1)
              }}
              className={cn(
                '-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition-colors',
                statusFilter === tab.id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right-side controls */}
        <div className="flex flex-wrap items-end gap-2 pb-2">
          {/* Patient filter */}
          <PatientPicker
            onChange={(id) => { setPatientId(id); setPage(1) }}
            className="w-56"
          />

          {/* Date filter */}
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value)
                setPage(1)
              }}
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              aria-label="Filter by date"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => { setDateFilter(''); setPage(1) }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {hasPermission('write_visit') && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              New visit
            </Button>
          )}
        </div>
      </div>

      <DataTable
        data={tableData}
        columns={columns}
        isLoading={isLoading}
        page={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        emptyMessage={
          statusFilter
            ? `No ${statusFilter.replace('_', ' ')} visits${dateFilter ? ' on this date' : ''}.`
            : dateFilter
              ? 'No visits on this date.'
              : 'No visits recorded yet.'
        }
      />

      <NewVisitDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
