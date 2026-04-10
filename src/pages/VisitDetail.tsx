import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import {
  ArrowLeft,
  Stethoscope,
  UserCog,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Consultation, Prescription, Visit } from '@/types/patient.types'
import type { TestOrder } from '@/types/lab.types'
import type { Invoice } from '@/types/billing.types'
import { useAuth } from '@/hooks/useAuth'
import {
  useVisit,
  useUpdateVisit,
  useConsultations,
  useCreateConsultation,
  usePrescriptions,
  useCreatePrescription,
} from '@/hooks/useVisits'
import { usePatient } from '@/hooks/usePatients'
import { useLabOrders, useCreateLabOrder, useLabTests } from '@/hooks/useLab'
import { useInvoices } from '@/hooks/useBilling'
import { useUsers } from '@/hooks/useUsers'
import { formatDate, formatCurrency, formatRelative } from '@/utils/formatters'
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TabId = 'overview' | 'consultation' | 'lab' | 'billing'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'consultation', label: 'Consultation' },
  { id: 'lab', label: 'Lab Orders' },
  { id: 'billing', label: 'Billing' },
]

const PAGE_SIZE = 25

// ---------------------------------------------------------------------------
// Assign Doctor Dialog
// ---------------------------------------------------------------------------

function AssignDoctorDialog({
  visit,
  open,
  onOpenChange,
}: {
  visit: Visit
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateVisit = useUpdateVisit()
  const { data: usersData } = useUsers({ role: 'doctor', page_size: 100 })
  const doctors = usersData?.results ?? []

  const [doctorId, setDoctorId] = useState(visit.assigned_doctor_id ?? '')

  function handleSave() {
    updateVisit.mutate(
      { id: visit.id, data: { assigned_doctor_id: doctorId || null } },
      {
        onSuccess: () => {
          toast.success('Doctor assigned')
          onOpenChange(false)
        },
        onError: () => toast.error('Failed to assign doctor'),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Assign doctor</DialogTitle>
          <DialogDescription>
            Choose which doctor handles this visit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Doctor</Label>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">Unassigned</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
              </option>
            ))}
          </select>
        </div>
        <DialogFooter showCloseButton>
          <Button
            onClick={handleSave}
            disabled={updateVisit.isPending}
          >
            {updateVisit.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

function OverviewTab({ visit }: { visit: Visit }) {
  const { hasPermission } = useAuth()
  const { data: patient } = usePatient(visit.patient_id)
  const { data: usersData } = useUsers({ page_size: 100 })
  const userMap = new Map(
    usersData?.results.map((u) => [u.id, u.full_name]) ?? [],
  )

  const updateVisit = useUpdateVisit()
  const [assignOpen, setAssignOpen] = useState(false)

  // Doctors can advance status; only receptionist/admin can reassign doctor
  const canAdvanceStatus = hasPermission('update_visit')
  const canAssignDoctor = hasPermission('write_visit')

  function handleAdvanceStatus() {
    const next =
      visit.status === 'open'
        ? 'in_progress'
        : visit.status === 'in_progress'
          ? 'completed'
          : 'open'
    const label =
      next === 'in_progress' ? 'Visit started' : next === 'completed' ? 'Visit completed' : 'Visit reopened'
    updateVisit.mutate(
      { id: visit.id, data: { status: next } },
      {
        onSuccess: () => toast.success(label),
        onError: () => toast.error('Failed to update visit'),
      },
    )
  }

  const assignedDoctor = visit.assigned_doctor_id
    ? userMap.get(visit.assigned_doctor_id) ??
      `…${visit.assigned_doctor_id.slice(-6)}`
    : null

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Visit details</CardTitle>
            <div className="flex gap-2">
              {canAssignDoctor && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAssignOpen(true)}
                >
                  <UserCog className="h-3.5 w-3.5" />
                  {visit.assigned_doctor_id ? 'Change doctor' : 'Assign doctor'}
                </Button>
              )}
              {canAdvanceStatus && (
                <Button
                  size="sm"
                  variant={visit.status === 'completed' ? 'outline' : 'default'}
                  onClick={handleAdvanceStatus}
                  disabled={updateVisit.isPending}
                >
                  {updateVisit.isPending
                    ? '…'
                    : visit.status === 'open'
                      ? 'Start visit'
                      : visit.status === 'in_progress'
                        ? 'Complete visit'
                        : 'Reopen visit'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Patient</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {patient ? (
                  <Link
                    to={`/patients/${visit.patient_id}`}
                    className="hover:underline"
                  >
                    {patient.full_name}
                  </Link>
                ) : (
                  <span className="font-mono">…{visit.patient_id.slice(-6)}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="mt-0.5">
                <StatusBadge domain="visit" status={visit.status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Assigned doctor</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {assignedDoctor ?? (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Created</dt>
              <dd className="mt-0.5 text-sm text-muted-foreground">
                {formatDate(visit.created_at)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <AssignDoctorDialog
        visit={visit}
        open={assignOpen}
        onOpenChange={setAssignOpen}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Consultation card
// ---------------------------------------------------------------------------

function ConsultationCard({
  consultation,
  doctorName,
}: {
  consultation: Consultation
  doctorName: string
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{doctorName}</span>
          <span className="text-xs text-muted-foreground">
            {formatRelative(consultation.created_at)}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-3 border-t px-4 py-3">
          {consultation.symptoms && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Symptoms
              </p>
              <p className="mt-1 text-sm whitespace-pre-wrap">
                {consultation.symptoms}
              </p>
            </div>
          )}
          {consultation.diagnosis && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Diagnosis
              </p>
              <p className="mt-1 text-sm whitespace-pre-wrap">
                {consultation.diagnosis}
              </p>
            </div>
          )}
          {consultation.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notes
              </p>
              <p className="mt-1 text-sm whitespace-pre-wrap">
                {consultation.notes}
              </p>
            </div>
          )}
          {!consultation.symptoms &&
            !consultation.diagnosis &&
            !consultation.notes && (
              <p className="text-sm text-muted-foreground">
                No details recorded.
              </p>
            )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add Consultation Form (inline, collapsible)
// ---------------------------------------------------------------------------

function AddConsultationForm({
  visitId,
  onSuccess,
}: {
  visitId: string
  onSuccess: () => void
}) {
  const createConsultation = useCreateConsultation()
  const [symptoms, setSymptoms] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')

  const hasContent =
    symptoms.trim() || diagnosis.trim() || notes.trim()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasContent) return
    createConsultation.mutate(
      {
        visit_id: visitId,
        symptoms: symptoms.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Consultation note added')
          setSymptoms('')
          setDiagnosis('')
          setNotes('')
          onSuccess()
        },
        onError: () => toast.error('Failed to save consultation'),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-dashed border-border p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        New consultation note
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="symptoms">Symptoms</Label>
        <Textarea
          id="symptoms"
          placeholder="Patient-reported symptoms…"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="diagnosis">Diagnosis</Label>
        <Textarea
          id="diagnosis"
          placeholder="Clinical diagnosis…"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cons-notes">Notes</Label>
        <Textarea
          id="cons-notes"
          placeholder="Additional clinical notes, plan, follow-up…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={!hasContent || createConsultation.isPending}
      >
        {createConsultation.isPending ? 'Saving…' : 'Save note'}
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Prescription display
// ---------------------------------------------------------------------------

function PrescriptionCard({ prescription }: { prescription: Prescription }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Prescription
      </p>
      {prescription.notes && (
        <p className="text-sm text-muted-foreground">{prescription.notes}</p>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-1 font-medium">Medication</th>
            <th className="pb-1 font-medium">Dosage</th>
            <th className="pb-1 font-medium">Frequency</th>
            <th className="pb-1 font-medium">Duration</th>
          </tr>
        </thead>
        <tbody>
          {prescription.items.map((item) => (
            <tr key={item.id} className="border-b last:border-0">
              <td className="py-1.5 font-medium pr-3">{item.medication}</td>
              <td className="py-1.5 text-muted-foreground pr-3">{item.dosage}</td>
              <td className="py-1.5 text-muted-foreground pr-3">{item.frequency}</td>
              <td className="py-1.5 text-muted-foreground">{item.duration ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Write prescription form
// ---------------------------------------------------------------------------

function WritePrescriptionForm({
  consultationId,
  onSuccess,
}: {
  consultationId: string
  onSuccess: () => void
}) {
  const createPrescription = useCreatePrescription()
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([
    { uid: crypto.randomUUID(), medication: '', dosage: '', frequency: '', duration: '', instructions: '' },
  ])

  function addItem() {
    setItems((prev) => [
      ...prev,
      { uid: crypto.randomUUID(), medication: '', dosage: '', frequency: '', duration: '', instructions: '' },
    ])
  }

  function removeItem(uid: string) {
    setItems((prev) => prev.length === 1 ? prev : prev.filter((i) => i.uid !== uid))
  }

  function updateItem(uid: string, field: string, value: string) {
    setItems((prev) => prev.map((i) => i.uid === uid ? { ...i, [field]: value } : i))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validItems = items.filter((i) => i.medication.trim() && i.dosage.trim() && i.frequency.trim())
    if (validItems.length === 0) {
      toast.error('Add at least one medication with dosage and frequency.')
      return
    }
    createPrescription.mutate(
      {
        consultation_id: consultationId,
        notes: notes.trim() || undefined,
        items: validItems.map(({ medication, dosage, frequency, duration, instructions }) => ({
          medication: medication.trim(),
          dosage: dosage.trim(),
          frequency: frequency.trim(),
          duration: duration.trim() || undefined,
          instructions: instructions.trim() || undefined,
        })),
      },
      {
        onSuccess: () => {
          toast.success('Prescription saved')
          setNotes('')
          setItems([{ uid: crypto.randomUUID(), medication: '', dosage: '', frequency: '', duration: '', instructions: '' }])
          onSuccess()
        },
        onError: () => toast.error('Failed to save prescription'),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-dashed border-border p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        New prescription
      </p>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.uid} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-start">
            <div>
              {idx === 0 && <p className="text-xs text-muted-foreground mb-1">Medication *</p>}
              <Input
                placeholder="e.g. Amoxicillin"
                value={item.medication}
                onChange={(e) => updateItem(item.uid, 'medication', e.target.value)}
              />
            </div>
            <div>
              {idx === 0 && <p className="text-xs text-muted-foreground mb-1">Dosage *</p>}
              <Input
                placeholder="e.g. 500mg"
                value={item.dosage}
                onChange={(e) => updateItem(item.uid, 'dosage', e.target.value)}
              />
            </div>
            <div>
              {idx === 0 && <p className="text-xs text-muted-foreground mb-1">Frequency *</p>}
              <Input
                placeholder="e.g. 3×/day"
                value={item.frequency}
                onChange={(e) => updateItem(item.uid, 'frequency', e.target.value)}
              />
            </div>
            <div>
              {idx === 0 && <p className="text-xs text-muted-foreground mb-1">Duration</p>}
              <Input
                placeholder="e.g. 7 days"
                value={item.duration}
                onChange={(e) => updateItem(item.uid, 'duration', e.target.value)}
              />
            </div>
            <div>
              {idx === 0 && <p className="text-xs text-muted-foreground mb-1 invisible">X</p>}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeItem(item.uid)}
                disabled={items.length === 1}
              >
                ×
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        + Add medication
      </Button>
      <div className="space-y-1.5">
        <Label htmlFor="rx-notes">Notes</Label>
        <Textarea
          id="rx-notes"
          placeholder="Prescriber notes…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button type="submit" size="sm" disabled={createPrescription.isPending}>
        {createPrescription.isPending ? 'Saving…' : 'Save prescription'}
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Per-consultation prescription section
// ---------------------------------------------------------------------------

function ConsultationPrescriptions({
  consultationId,
  canWrite,
}: {
  consultationId: string
  canWrite: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading } = usePrescriptions(consultationId)
  const prescriptions = data?.results ?? []

  return (
    <div className="space-y-2 border-t pt-3 mt-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Prescriptions ({prescriptions.length})
        </p>
        {canWrite && !showForm && (
          <Button type="button" size="xs" variant="outline" onClick={() => setShowForm(true)}>
            + Write prescription
          </Button>
        )}
      </div>
      {isLoading && <Skeleton className="h-8 w-full" />}
      {prescriptions.map((rx) => (
        <PrescriptionCard key={rx.id} prescription={rx} />
      ))}
      {showForm && (
        <WritePrescriptionForm
          consultationId={consultationId}
          onSuccess={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Consultation tab
// ---------------------------------------------------------------------------

function ConsultationTab({ visit }: { visit: Visit }) {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission('write_consultation')

  const { data, isLoading } = useConsultations(visit.id)
  const { data: usersData } = useUsers({ page_size: 100 })
  const userMap = new Map(
    usersData?.results.map((u) => [u.id, u.full_name]) ?? [],
  )

  const consultations = data?.results ?? []

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {consultations.length === 0 && !canWrite && (
        <p className="text-sm text-muted-foreground">
          No consultation notes recorded for this visit.
        </p>
      )}

      {consultations.map((c) => (
        <div key={c.id} className="space-y-0">
          <ConsultationCard
            consultation={c}
            doctorName={
              userMap.get(c.doctor_id) ?? `…${c.doctor_id.slice(-6)}`
            }
          />
          <ConsultationPrescriptions consultationId={c.id} canWrite={canWrite} />
        </div>
      ))}

      {canWrite && (
        <AddConsultationForm
          visitId={visit.id}
          onSuccess={() => {}}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Order test form
// ---------------------------------------------------------------------------

function OrderTestForm({
  visitId,
  onSuccess,
}: {
  visitId: string
  onSuccess: () => void
}) {
  const createOrder = useCreateLabOrder()
  const { data: testsData } = useLabTests({ page_size: 100 })
  const tests = testsData?.results.filter((t) => t.is_active) ?? []

  const [testId, setTestId] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!testId) return
    createOrder.mutate(
      { visit_id: visitId, test_id: testId },
      {
        onSuccess: () => {
          toast.success('Lab order placed')
          setTestId('')
          onSuccess()
        },
        onError: () => toast.error('Failed to place lab order'),
      },
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 rounded-lg border border-dashed border-border p-3"
    >
      <div className="flex-1 space-y-1">
        <Label htmlFor="test-select">Order a lab test</Label>
        <select
          id="test-select"
          value={testId}
          onChange={(e) => setTestId(e.target.value)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">Select test…</option>
          {tests.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — {formatCurrency(t.price)}
            </option>
          ))}
        </select>
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={!testId || createOrder.isPending}
      >
        {createOrder.isPending ? 'Ordering…' : 'Order'}
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Lab tab
// ---------------------------------------------------------------------------

function LabTab({ visit }: { visit: Visit }) {
  const { hasPermission } = useAuth()
  const canOrder = hasPermission('order_lab_test')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useLabOrders({
    visit_id: visit.id,
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
          {row.original.test_name ?? `Test …${row.original.test_id.slice(-6)}`}
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
        <span className="tabular-nums text-muted-foreground">
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
    <div className="space-y-4">
      {canOrder && (
        <OrderTestForm visitId={visit.id} onSuccess={() => {}} />
      )}
      <DataTable
        data={tableData}
        columns={columns}
        isLoading={isLoading}
        page={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        emptyMessage="No lab orders for this visit."
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Billing tab
// ---------------------------------------------------------------------------

function BillingTab({ visitId }: { visitId: string }) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useInvoices({
    visit_id: visitId,
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
      emptyMessage="No invoices for this visit."
    />
  )
}

// ---------------------------------------------------------------------------
// VisitDetail page
// ---------------------------------------------------------------------------

export default function VisitDetail() {
  const { visitId } = useParams<{ visitId: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<TabId>('overview')

  const { data: visit, isLoading } = useVisit(visitId)
  const { data: patient } = usePatient(visit?.patient_id)

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (!visit) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>
        <p className="text-sm text-muted-foreground">Visit not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() =>
            visit.patient_id
              ? navigate(`/patients/${visit.patient_id}`)
              : navigate(-1)
          }
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold">
              {patient?.full_name ?? `Visit …${visit.id.slice(-6)}`}
            </h1>
            <StatusBadge domain="visit" status={visit.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDate(visit.created_at)}
          </p>
        </div>
      </div>

      {/* Tab nav */}
      <div
        className="flex border-b"
        role="tablist"
        aria-label="Visit sections"
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
      {activeTab === 'overview' && <OverviewTab visit={visit} />}
      {activeTab === 'consultation' && <ConsultationTab visit={visit} />}
      {activeTab === 'lab' && <LabTab visit={visit} />}
      {activeTab === 'billing' && <BillingTab visitId={visit.id} />}
    </div>
  )
}
