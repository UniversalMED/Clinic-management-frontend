import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { differenceInYears, parseISO } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'
import {
  ArrowLeft,
  Pencil,
  UserRound,
  CalendarDays,
  Phone,
  Activity,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Visit } from '@/types/patient.types'
import type { TestOrder } from '@/types/lab.types'
import type { Invoice } from '@/types/billing.types'
import { useAuth } from '@/hooks/useAuth'
import { usePatient } from '@/hooks/usePatients'
import { useVisits, useCreateVisit } from '@/hooks/useVisits'
import { useLabOrders } from '@/hooks/useLab'
import { useInvoices } from '@/hooks/useBilling'
import { formatDate, formatCurrency, formatRelative } from '@/utils/formatters'
import { PatientForm } from '@/components/patients/PatientForm'
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAge(dob: string): string {
  return `${differenceInYears(new Date(), parseISO(dob))} yrs`
}

function genderLabel(g: 'M' | 'F' | 'other'): string {
  return g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabId = 'overview' | 'visits' | 'lab' | 'billing'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'visits', label: 'Visits' },
  { id: 'lab', label: 'Lab Orders' },
  { id: 'billing', label: 'Billing' },
]

// ---------------------------------------------------------------------------
// Shared page size
// ---------------------------------------------------------------------------

const PAGE_SIZE = 25

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function OverviewTab({
  patientId,
  onEditClick,
}: {
  patientId: string
  onEditClick: () => void
}) {
  const { hasPermission } = useAuth()
  const { data: patient, isLoading } = usePatient(patientId)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-48" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!patient) return null

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{patient.full_name}</CardTitle>
            <CardDescription>Patient information</CardDescription>
          </div>
          {hasPermission('write_patient') && (
            <Button size="sm" variant="outline" onClick={onEditClick}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <dl className="grid gap-4 sm:grid-cols-2">
          <InfoRow
            icon={<UserRound className="h-4 w-4" />}
            label="Gender"
            value={genderLabel(patient.gender)}
          />
          <InfoRow
            icon={<CalendarDays className="h-4 w-4" />}
            label="Date of birth"
            value={`${patient.date_of_birth} · ${getAge(patient.date_of_birth)}`}
          />
          <InfoRow
            icon={<Phone className="h-4 w-4" />}
            label="Phone"
            value={patient.phone}
          />
          <InfoRow
            icon={<Activity className="h-4 w-4" />}
            label="Registered"
            value={formatDate(patient.created_at)}
          />
        </dl>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Visits tab
// ---------------------------------------------------------------------------

function VisitsTab({ patientId }: { patientId: string }) {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [page, setPage] = useState(1)
  const createVisit = useCreateVisit()

  const { data, isLoading } = useVisits({
    patient_id: patientId,
    page,
    page_size: PAGE_SIZE,
  })

  const tableData = data ?? { count: 0, next: null, previous: null, results: [] }

  const columns: ColumnDef<Visit>[] = [
    {
      id: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        // Map visit status to invoice domain for visual consistency
        const domain = 'invoice' as const
        const status = row.original.status === 'open' ? 'finalized' : 'draft'
        return <StatusBadge domain={domain} status={status} />
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Link
          to={`/visits/${row.original.id}`}
          className="text-xs text-primary hover:underline"
        >
          View →
        </Link>
      ),
    },
  ]

  function handleNewVisit() {
    createVisit.mutate(
      { patient_id: patientId },
      {
        onSuccess: (visit) => {
          toast.success('Visit created')
          navigate(`/visits/${visit.id}`)
        },
        onError: () => toast.error('Failed to create visit'),
      },
    )
  }

  return (
    <div className="space-y-3">
      {hasPermission('write_visit') && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleNewVisit}
            disabled={createVisit.isPending}
          >
            {createVisit.isPending ? 'Creating…' : 'New visit'}
          </Button>
        </div>
      )}
      <DataTable
        data={tableData}
        columns={columns}
        isLoading={isLoading}
        page={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        emptyMessage="No visits recorded for this patient."
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Lab Orders tab
// ---------------------------------------------------------------------------

function LabTab({ patientId }: { patientId: string }) {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useLabOrders({
    patient_id: patientId,
    page,
    page_size: PAGE_SIZE,
  })

  const tableData = data ?? { count: 0, next: null, previous: null, results: [] }

  const columns: ColumnDef<TestOrder>[] = [
    {
      id: 'test_name',
      header: 'Test',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.test_name ??
            `Test …${row.original.test_id.slice(-6)}`}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge domain="lab_order" status={row.original.status} />
      ),
    },
    {
      id: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatCurrency(row.original.price_at_order_time)}
        </span>
      ),
    },
    {
      id: 'ordered',
      header: 'Ordered',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatRelative(row.original.created_at)}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      data={tableData}
      columns={columns}
      isLoading={isLoading}
      page={page}
      onPageChange={setPage}
      pageSize={PAGE_SIZE}
      emptyMessage="No lab orders for this patient."
    />
  )
}

// ---------------------------------------------------------------------------
// Billing tab
// ---------------------------------------------------------------------------

function BillingTab({ patientId }: { patientId: string }) {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useInvoices({
    patient_id: patientId,
    page,
    page_size: PAGE_SIZE,
  })

  const tableData = data ?? { count: 0, next: null, previous: null, results: [] }

  const columns: ColumnDef<Invoice>[] = [
    {
      id: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge domain="invoice" status={row.original.status} />
      ),
    },
    {
      id: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <span className="tabular-nums font-medium">
          {formatCurrency(row.original.total_amount)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Link
          to={`/billing/invoices/${row.original.id}`}
          className="text-xs text-primary hover:underline"
        >
          View →
        </Link>
      ),
    },
  ]

  return (
    <DataTable
      data={tableData}
      columns={columns}
      isLoading={isLoading}
      page={page}
      onPageChange={setPage}
      pageSize={PAGE_SIZE}
      emptyMessage="No invoices for this patient."
    />
  )
}

// ---------------------------------------------------------------------------
// PatientDetail page
// ---------------------------------------------------------------------------

export default function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)

  const { data: patient, isLoading: patientLoading } = usePatient(patientId)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate('/patients')}
          aria-label="Back to patients"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          {patientLoading ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <h1 className="truncate text-lg font-semibold">
              {patient?.full_name ?? 'Patient'}
            </h1>
          )}
        </div>
      </div>

      {/* Tab nav */}
      <div
        className="flex border-b"
        role="tablist"
        aria-label="Patient sections"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              '-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition-colors',
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
      {patientId && (
        <>
          {activeTab === 'overview' && (
            <OverviewTab
              patientId={patientId}
              onEditClick={() => setEditDrawerOpen(true)}
            />
          )}
          {activeTab === 'visits' && <VisitsTab patientId={patientId} />}
          {activeTab === 'lab' && <LabTab patientId={patientId} />}
          {activeTab === 'billing' && <BillingTab patientId={patientId} />}
        </>
      )}

      {/* Edit drawer */}
      <Drawer
        direction="right"
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit patient</DrawerTitle>
            <DrawerDescription>
              Update {patient?.full_name ?? 'patient'}'s details.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {patient && (
              <PatientForm
                patient={patient}
                onSuccess={() => setEditDrawerOpen(false)}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
