import { useEffect, useRef, useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

import type { LabTest, TestOrder, TestOrderStatus } from '@/types/lab.types'
import { useAuth } from '@/hooks/useAuth'
import {
  useLabOrders,
  useUpdateLabOrder,
  useLabTests,
  useCreateLabTest,
  useUpdateLabTest,
} from '@/hooks/useLab'
import { useUsers } from '@/hooks/useUsers'
import { PatientPicker } from '@/components/patients/PatientPicker'
import { ResultEntryForm } from '@/components/lab/ResultEntryForm'
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency, formatRelative } from '@/utils/formatters'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

type TabId = 'orders' | 'catalog'

const PAGE_TABS: { id: TabId; label: string }[] = [
  { id: 'orders', label: 'Orders' },
  { id: 'catalog', label: 'Test Catalog' },
]

const PAGE_SIZE = 25

// ---------------------------------------------------------------------------
// Orders tab — status filter
// ---------------------------------------------------------------------------

type OrderStatus = '' | TestOrderStatus

const ORDER_STATUS_FILTERS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: '', label: 'All' },
  { value: 'awaiting_payment', label: 'Awaiting payment' },
  { value: 'completed', label: 'Completed' },
  { value: 'canceled', label: 'Cancelled' },
]

// ---------------------------------------------------------------------------
// Orders tab — columns
// ---------------------------------------------------------------------------

function buildOrderColumns(
  userMap: Map<string, string>,
  currentUserId: string,
  canProcess: boolean,
  canWriteResult: boolean,
  onUpdateStatus: (id: string, status: TestOrderStatus) => void,
  onAssignToSelf: (id: string) => void,
  onEnterResult: (orderId: string) => void,
): ColumnDef<TestOrder>[] {
  return [
    {
      id: 'patient',
      header: 'Visit',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          …{row.original.visit_id.slice(-6)}
        </span>
      ),
    },
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
      id: 'ordered_by',
      header: 'Ordered by',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {userMap.get(row.original.ordered_by) ??
            `…${row.original.ordered_by.slice(-6)}`}
        </span>
      ),
    },
    {
      id: 'assigned_to',
      header: 'Assigned to',
      cell: ({ row }) => {
        const id = row.original.assigned_to
        if (!id) return <span className="text-muted-foreground/60">—</span>
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
        <StatusBadge domain="lab_order" status={row.original.status} />
      ),
    },
    {
      id: 'created_at',
      header: 'Ordered',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatRelative(row.original.created_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const order = row.original
        const isAssignedToSelf = order.assigned_to === currentUserId

        return (
          <div className="flex items-center gap-1">
            {canProcess && order.status === 'pending' && (
              <>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => onUpdateStatus(order.id, 'in_progress')}
                >
                  Start
                </Button>
                {!isAssignedToSelf && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => onAssignToSelf(order.id)}
                  >
                    Assign me
                  </Button>
                )}
              </>
            )}
            {canProcess && order.status === 'in_progress' && (
              <>
                {!isAssignedToSelf && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => onAssignToSelf(order.id)}
                  >
                    Assign me
                  </Button>
                )}
              </>
            )}
            {/* Allow result entry for in_progress AND completed orders */}
            {canWriteResult && (order.status === 'in_progress' || order.status === 'completed') && (
              <Button
                size="xs"
                onClick={() => onEnterResult(order.id)}
              >
                {order.status === 'in_progress' ? 'Enter result & complete' : 'Enter result'}
              </Button>
            )}
          </div>
        )
      },
    },
  ]
}

// ---------------------------------------------------------------------------
// Orders tab
// ---------------------------------------------------------------------------

function OrdersTab() {
  const { user, hasPermission } = useAuth()
  const canProcess = hasPermission('process_lab_order')
  const canWriteResult = hasPermission('write_lab_result')

  const [statusFilter, setStatusFilter] = useState<OrderStatus>('pending')
  const [patientId, setPatientId] = useState<string | null>(null)
  const [testSearch, setTestSearch] = useState('')
  const [debouncedTestSearch, setDebouncedTestSearch] = useState('')
  const [page, setPage] = useState(1)
  const [resultDrawerOpen, setResultDrawerOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedTestSearch(testSearch), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [testSearch])

  const { data, isLoading } = useLabOrders({
    status: statusFilter || undefined,
    patient_id: patientId ?? undefined,
    page,
    page_size: PAGE_SIZE,
  })

  const { data: usersData } = useUsers({ page_size: 100 })
  const userMap = new Map(
    usersData?.results.map((u) => [u.id, u.full_name]) ?? [],
  )

  const updateOrder = useUpdateLabOrder()

  function handleUpdateStatus(id: string, status: TestOrderStatus) {
    updateOrder.mutate(
      { id, data: { status } },
      {
        onSuccess: () => toast.success(`Order marked ${status.replace('_', ' ')}`),
        onError: () => toast.error('Failed to update order'),
      },
    )
  }

  function handleAssignToSelf(id: string) {
    if (!user) return
    updateOrder.mutate(
      { id, data: { assigned_to: user.id } },
      {
        onSuccess: () => toast.success('Assigned to you'),
        onError: () => toast.error('Failed to assign order'),
      },
    )
  }

  function openResultDrawer(orderId: string) {
    setSelectedOrderId(orderId)
    setResultDrawerOpen(true)
  }

  const columns = buildOrderColumns(
    userMap,
    user?.id ?? '',
    canProcess,
    canWriteResult,
    handleUpdateStatus,
    handleAssignToSelf,
    openResultDrawer,
  )

  // Client-side filter by test name search
  const rawResults = data?.results ?? []
  const filteredResults = debouncedTestSearch
    ? rawResults.filter((o) =>
        (o.test_name ?? '').toLowerCase().includes(debouncedTestSearch.toLowerCase())
      )
    : rawResults

  const tableData = {
    count: debouncedTestSearch ? filteredResults.length : (data?.count ?? 0),
    next: data?.next ?? null,
    previous: data?.previous ?? null,
    results: filteredResults,
  }

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-3">
        <PatientPicker
          onChange={(id) => { setPatientId(id); setPage(1) }}
          className="w-56"
        />
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by test name…"
            value={testSearch}
            onChange={(e) => setTestSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {ORDER_STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => {
              setStatusFilter(f.value)
              setPage(1)
            }}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === f.value
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
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
            ? `No ${statusFilter.replace('_', ' ')} orders.`
            : 'No lab orders yet.'
        }
      />

      {/* Enter Result drawer */}
      <Drawer
        direction="right"
        open={resultDrawerOpen}
        onOpenChange={(open) => {
          setResultDrawerOpen(open)
          if (!open) setSelectedOrderId(null)
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Enter result</DrawerTitle>
            <DrawerDescription>
              Record the test findings. The order will be marked complete on submit.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {selectedOrderId && (
              <ResultEntryForm
                orderId={selectedOrderId}
                onSuccess={() => {
                  setResultDrawerOpen(false)
                  setSelectedOrderId(null)
                }}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add Test Dialog
// ---------------------------------------------------------------------------

function AddTestDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createTest = useCreateLabTest()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [isActive, setIsActive] = useState(true)

  function reset() {
    setName('')
    setDescription('')
    setPrice('')
    setIsActive(true)
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  function handleSubmit() {
    if (!name.trim() || !price) return
    createTest.mutate(
      {
        name: name.trim(),
        description: description.trim(),
        price,
        is_active: isActive,
      },
      {
        onSuccess: () => {
          toast.success('Test added')
          handleOpenChange(false)
        },
        onError: () => toast.error('Failed to add test'),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add test</DialogTitle>
          <DialogDescription>
            Add a new test to the lab catalogue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="test-name">Name *</Label>
            <Input
              id="test-name"
              placeholder="e.g. Complete Blood Count"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="test-desc">Description</Label>
            <Textarea
              id="test-desc"
              placeholder="Optional description…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="test-price">Price (ETB) *</Label>
            <Input
              id="test-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-foreground"
            />
            Active (visible to staff)
          </label>
        </div>

        <DialogFooter showCloseButton>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !price || createTest.isPending}
          >
            {createTest.isPending ? 'Adding…' : 'Add test'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Catalog tab — columns
// ---------------------------------------------------------------------------

function buildCatalogColumns(
  canManage: boolean,
  canSeePrices: boolean,
  onToggleActive: (id: string, isActive: boolean) => void,
): ColumnDef<LabTest>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.description || '—'}
        </span>
      ),
    },
    ...(canSeePrices ? [{
      id: 'price',
      header: 'Price',
      cell: ({ row }: { row: { original: LabTest } }) => (
        <span className="tabular-nums">
          {formatCurrency(row.original.price)}
        </span>
      ),
    } as ColumnDef<LabTest>] : []),
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const active = row.original.is_active
        return (
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
              active
                ? 'border-emerald-300 bg-emerald-100 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-100'
                : 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
            )}
          >
            {active ? 'Active' : 'Inactive'}
          </span>
        )
      },
    },
    ...(canManage
      ? [
          {
            id: 'toggle',
            header: '',
            cell: ({ row }: { row: { original: LabTest } }) => (
              <Button
                size="xs"
                variant="ghost"
                onClick={() =>
                  onToggleActive(row.original.id, !row.original.is_active)
                }
              >
                {row.original.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            ),
          } as ColumnDef<LabTest>,
        ]
      : []),
  ]
}

// ---------------------------------------------------------------------------
// Catalog tab
// ---------------------------------------------------------------------------

function CatalogTab() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('manage_lab_catalogue')
  const canSeePrices = hasPermission('manage_billing')

  const [page, setPage] = useState(1)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const { data, isLoading } = useLabTests({ page, page_size: PAGE_SIZE })
  const updateTest = useUpdateLabTest()

  function handleToggleActive(id: string, isActive: boolean) {
    updateTest.mutate(
      { id, data: { is_active: isActive } },
      {
        onSuccess: () =>
          toast.success(isActive ? 'Test activated' : 'Test deactivated'),
        onError: () => toast.error('Failed to update test'),
      },
    )
  }

  const columns = buildCatalogColumns(canManage, canSeePrices, handleToggleActive)
  const tableData = data ?? { count: 0, next: null, previous: null, results: [] }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add test
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
        emptyMessage="No tests in the catalogue yet."
      />

      <AddTestDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Lab page
// ---------------------------------------------------------------------------

export default function Lab() {
  const [activeTab, setActiveTab] = useState<TabId>('orders')

  return (
    <div className="space-y-5">
      {/* Tab nav */}
      <div
        className="flex border-b"
        role="tablist"
        aria-label="Lab sections"
      >
        {PAGE_TABS.map((tab) => (
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

      {activeTab === 'orders' && <OrdersTab />}
      {activeTab === 'catalog' && <CatalogTab />}
    </div>
  )
}
