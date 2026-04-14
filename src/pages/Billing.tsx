import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { Receipt } from 'lucide-react'
import { toast } from 'sonner'

import type { Invoice } from '@/types/billing.types'
import type { TestOrder } from '@/types/lab.types'
import { useAuth } from '@/hooks/useAuth'
import { useInvoices, useCreateInvoice, useQuickPayCash } from '@/hooks/useBilling'
import { useLabOrders } from '@/hooks/useLab'
import { usePatients } from '@/hooks/usePatients'
import { useVisits } from '@/hooks/useVisits'
import { formatDate, formatCurrency } from '@/utils/formatters'
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
// Filter tabs
// ---------------------------------------------------------------------------

type StatusFilter = 'pending_billing' | 'all' | 'draft' | 'finalized' | 'void'

const FILTER_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'pending_billing', label: 'Pending Billing' },
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'finalized', label: 'Finalized' },
  { id: 'void', label: 'Void' },
]

const PAGE_SIZE = 25

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

function buildColumns(onRowClick: (id: string) => void): ColumnDef<Invoice>[] {
  return [
    {
      id: 'patient',
      header: 'Patient',
      cell: ({ row }) => (
        <Link
          to={`/patients/${row.original.patient_id}`}
          className="font-medium text-foreground hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Patient …{row.original.patient_id.slice(-6)}
        </Link>
      ),
    },
    {
      id: 'visit',
      header: 'Visit',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          …{row.original.visit_id.slice(-6)}
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
          onClick={() => onRowClick(row.original.id)}
        >
          View
        </Button>
      ),
    },
  ]
}

// ---------------------------------------------------------------------------
// Pending Billing Section
// ---------------------------------------------------------------------------

function PendingBillingSection() {
  const navigate = useNavigate()
  const createInvoice = useCreateInvoice()
  const quickPayCash = useQuickPayCash()

  const { data, isLoading } = useLabOrders({
    status: 'awaiting_payment',
    page_size: 100,
  })

  const orders = data?.results ?? []

  // Group orders by visit_id
  const byVisit = orders.reduce<Record<string, TestOrder[]>>((acc, order) => {
    if (!acc[order.visit_id]) acc[order.visit_id] = []
    acc[order.visit_id].push(order)
    return acc
  }, {})

  function handleCreateInvoice(visitId: string) {
    createInvoice.mutate(
      { visit_id: visitId },
      {
        onSuccess: (invoice) => {
          toast.success('Invoice created')
          navigate(`/billing/invoices/${invoice.id}`)
        },
        onError: () => toast.error('Failed to create invoice'),
      },
    )
  }

  function handleQuickPayCash(visitId: string) {
    quickPayCash.mutate(visitId, {
      onSuccess: (res) => {
        toast.success(`Cash payment collected — ETB ${parseFloat(res.invoice.total_amount).toFixed(2)}`)
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        toast.error(msg ?? 'Failed to collect payment')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg border border-border animate-pulse bg-muted/30" />
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No lab orders awaiting payment.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        <strong>Quick Pay Cash</strong> collects payment instantly. Use <strong>Create Invoice</strong> for itemized billing or future reference.
      </div>
      {Object.entries(byVisit).map(([visitId, visitOrders]) => {
        const total = visitOrders.reduce(
          (sum, o) => sum + parseFloat(o.price_at_order_time || '0'),
          0,
        )
        return (
          <div
            key={visitId}
            className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">
                  Visit …{visitId.slice(-6)}
                </span>
                <Link
                  to={`/visits/${visitId}`}
                  className="text-xs text-primary hover:underline"
                >
                  View visit ↗
                </Link>
              </div>
              <div className="space-y-0.5">
                {visitOrders.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 text-sm">
                    <span className="font-medium">
                      {o.test_name ?? `Test …${o.test_id.slice(-6)}`}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(o.price_at_order_time)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sm font-semibold">
                Total: {formatCurrency(String(total.toFixed(2)))}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => handleQuickPayCash(visitId)}
                disabled={quickPayCash.isPending}
              >
                {quickPayCash.isPending ? 'Processing…' : 'Quick Pay Cash'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCreateInvoice(visitId)}
                disabled={createInvoice.isPending}
              >
                Create Invoice
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// New Invoice Dialog
// ---------------------------------------------------------------------------

function NewInvoiceDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const createInvoice = useCreateInvoice()

  const [patientSearch, setPatientSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null)

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

  const { data: visits, isLoading: visitsLoading } = useVisits({
    patient_id: selectedPatientId ?? undefined,
    page_size: 50,
  })

  function reset() {
    setPatientSearch('')
    setDebouncedSearch('')
    setSelectedPatientId(null)
    setSelectedVisitId(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  function handleSubmit() {
    if (!selectedVisitId) return
    createInvoice.mutate(
      { visit_id: selectedVisitId },
      {
        onSuccess: (invoice) => {
          toast.success('Invoice created')
          handleOpenChange(false)
          navigate(`/billing/invoices/${invoice.id}`)
        },
        onError: () => toast.error('Failed to create invoice'),
      },
    )
  }

  const showPatientList = debouncedSearch.length > 0 && !selectedPatientId

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New invoice</DialogTitle>
          <DialogDescription>
            Search for a patient, then pick a visit to bill.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Patient search */}
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <Input
              placeholder="Search by name or phone…"
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value)
                if (selectedPatientId) {
                  setSelectedPatientId(null)
                  setSelectedVisitId(null)
                }
              }}
            />
            {showPatientList && (
              <div className="rounded-lg border border-border bg-popover shadow-sm max-h-40 overflow-y-auto">
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
                        setSelectedVisitId(null)
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

          {/* Visit list (appears after patient is chosen) */}
          {selectedPatientId && (
            <div className="space-y-1.5">
              <Label>Visit</Label>
              {visitsLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading visits…
                </p>
              ) : visits?.results.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No visits found for this patient.
                </p>
              ) : (
                <div className="rounded-lg border border-border divide-y divide-border max-h-44 overflow-y-auto">
                  {visits?.results.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors',
                        selectedVisitId === v.id && 'bg-muted',
                      )}
                      onClick={() => setSelectedVisitId(v.id)}
                    >
                      <span className="text-muted-foreground">
                        {formatDate(v.created_at)}
                      </span>
                      <span className="ml-2 text-xs capitalize">{v.status}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter showCloseButton>
          <Button
            onClick={handleSubmit}
            disabled={!selectedVisitId || createInvoice.isPending}
          >
            {createInvoice.isPending ? 'Creating…' : 'Create invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Billing page
// ---------------------------------------------------------------------------

export default function Billing() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending_billing')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)

  const isPendingTab = statusFilter === 'pending_billing'

  const { data, isLoading } = useInvoices(
    !isPendingTab
      ? {
          status: statusFilter === 'all' ? undefined : statusFilter,
          page,
          page_size: PAGE_SIZE,
        }
      : undefined,
  )

  const columns = buildColumns((id) => navigate(`/billing/invoices/${id}`))
  const tableData = data ?? { count: 0, next: null, previous: null, results: [] }

  return (
    <div className="space-y-4">
      {/* Header row: filter tabs + New Invoice button */}
      <div className="flex items-end justify-between gap-4 border-b">
        <div
          className="flex"
          role="tablist"
          aria-label="Invoice status filter"
        >
          {FILTER_TABS.map((tab) => (
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

        {hasPermission('manage_billing') && (
          <div className="pb-2">
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Receipt className="h-3.5 w-3.5" />
              New invoice
            </Button>
          </div>
        )}
      </div>

      {isPendingTab ? (
        <PendingBillingSection />
      ) : (
        <DataTable
          data={tableData}
          columns={columns}
          isLoading={isLoading}
          page={page}
          onPageChange={setPage}
          pageSize={PAGE_SIZE}
          emptyMessage={
            statusFilter === 'all'
              ? 'No invoices yet.'
              : `No ${statusFilter} invoices.`
          }
        />
      )}

      <NewInvoiceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
