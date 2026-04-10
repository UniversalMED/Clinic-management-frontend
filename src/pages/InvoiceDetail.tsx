import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { ArrowLeft, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

import type { InvoiceLineItem, Payment } from '@/types/billing.types'
import { useAuth } from '@/hooks/useAuth'
import {
  useInvoice,
  useAddLineItem,
  useRemoveLineItem,
  useFinalizeInvoice,
  useVoidInvoice,
  useInitiatePayment,
  useCashPayment,
  usePayments,
} from '@/hooks/useBilling'
import { usePatient } from '@/hooks/usePatients'
import { useVisit } from '@/hooks/useVisits'
import { useLabOrders } from '@/hooks/useLab'
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
// Finalize Dialog
// ---------------------------------------------------------------------------

function FinalizeDialog({
  open,
  onOpenChange,
  invoiceId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string
}) {
  const finalize = useFinalizeInvoice()
  const [discount, setDiscount] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit() {
    finalize.mutate(
      {
        invoiceId,
        data: {
          discount_amount: discount ? discount : undefined,
          notes: notes || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Invoice finalized')
          onOpenChange(false)
          setDiscount('')
          setNotes('')
        },
        onError: () => toast.error('Failed to finalize invoice'),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Finalize invoice</DialogTitle>
          <DialogDescription>
            Optionally apply a discount before locking the invoice.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="discount">Discount amount (ETB)</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fin-notes">Notes</Label>
            <Textarea
              id="fin-notes"
              placeholder="Optional notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button onClick={handleSubmit} disabled={finalize.isPending}>
            {finalize.isPending ? 'Finalizing…' : 'Finalize'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Void Dialog
// ---------------------------------------------------------------------------

function VoidDialog({
  open,
  onOpenChange,
  invoiceId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string
}) {
  const voidInvoice = useVoidInvoice()
  const [reason, setReason] = useState('')

  function handleSubmit() {
    if (!reason.trim()) return
    voidInvoice.mutate(
      { invoiceId, data: { void_reason: reason.trim() } },
      {
        onSuccess: () => {
          toast.success('Invoice voided')
          onOpenChange(false)
          setReason('')
        },
        onError: () => toast.error('Failed to void invoice'),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Void invoice</DialogTitle>
          <DialogDescription>
            This cannot be undone. All stamped lab orders will be released.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="void-reason">Reason *</Label>
          <Textarea
            id="void-reason"
            placeholder="Describe why this invoice is being voided…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter showCloseButton>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason.trim() || voidInvoice.isPending}
          >
            {voidInvoice.isPending ? 'Voiding…' : 'Void invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// QR Code Dialog
// ---------------------------------------------------------------------------

function QRCodeDialog({
  open,
  onOpenChange,
  qrCode,
  checkoutUrl,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  qrCode: string
  checkoutUrl: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Scan to pay</DialogTitle>
          <DialogDescription>
            Have the patient scan this QR code to complete payment via Chapa.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <img
            src={qrCode}
            alt="Chapa payment QR code"
            className="h-48 w-48 rounded-lg border border-border object-contain"
          />
          {checkoutUrl && (
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Open checkout link
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Add Line Item Form
// ---------------------------------------------------------------------------

type AddMode = 'order' | 'adhoc'

function AddLineItemForm({
  invoiceId,
  visitId,
  existingOrderIds,
}: {
  invoiceId: string
  visitId: string
  existingOrderIds: Set<string>
}) {
  const addLineItem = useAddLineItem()
  const [mode, setMode] = useState<AddMode>('order')
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [adhocName, setAdhocName] = useState('')
  const [adhocPrice, setAdhocPrice] = useState('')

  const { data: labOrdersData, isLoading: ordersLoading } = useLabOrders({
    visit_id: visitId,
    pending_payment: 'true',
    page_size: 100,
  })

  const availableOrders = (labOrdersData?.results ?? []).filter(
    (o) => !existingOrderIds.has(o.id),
  )

  function handleAdd() {
    if (mode === 'order') {
      if (!selectedOrderId) return
      addLineItem.mutate(
        { invoiceId, data: { test_order_id: selectedOrderId } },
        {
          onSuccess: () => {
            toast.success('Line item added')
            setSelectedOrderId('')
          },
          onError: () => toast.error('Failed to add line item'),
        },
      )
    } else {
      if (!adhocName.trim() || !adhocPrice) return
      addLineItem.mutate(
        {
          invoiceId,
          data: {
            test_name: adhocName.trim(),
            unit_price: adhocPrice,
          },
        },
        {
          onSuccess: () => {
            toast.success('Line item added')
            setAdhocName('')
            setAdhocPrice('')
          },
          onError: () => toast.error('Failed to add line item'),
        },
      )
    }
  }

  const canAdd =
    mode === 'order'
      ? Boolean(selectedOrderId)
      : Boolean(adhocName.trim()) && Boolean(adhocPrice)

  return (
    <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1">
        {(['order', 'adhoc'] as AddMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              mode === m
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {m === 'order' ? 'From lab order' : 'Ad-hoc charge'}
          </button>
        ))}
      </div>

      {mode === 'order' ? (
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label>Lab order</Label>
            {ordersLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : availableOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No billable lab orders available for this visit.
              </p>
            ) : (
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring dark:bg-input/30"
              >
                <option value="">Select a lab order…</option>
                {availableOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.test_name ?? `Order …${o.id.slice(-6)}`} —{' '}
                    {formatCurrency(o.price_at_order_time)}
                  </option>
                ))}
              </select>
            )}
          </div>
          {availableOrders.length > 0 && (
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!canAdd || addLineItem.isPending}
            >
              {addLineItem.isPending ? 'Adding…' : 'Add'}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="adhoc-name">Name</Label>
            <Input
              id="adhoc-name"
              placeholder="e.g. Consultation fee"
              value={adhocName}
              onChange={(e) => setAdhocName(e.target.value)}
            />
          </div>
          <div className="w-28 space-y-1.5">
            <Label htmlFor="adhoc-price">Price (ETB)</Label>
            <Input
              id="adhoc-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={adhocPrice}
              onChange={(e) => setAdhocPrice(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!canAdd || addLineItem.isPending}
          >
            {addLineItem.isPending ? 'Adding…' : 'Add'}
          </Button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Line Items Section
// ---------------------------------------------------------------------------

function LineItemsSection({
  invoiceId,
  visitId,
  lineItems,
  isDraft,
  canManage,
}: {
  invoiceId: string
  visitId: string
  lineItems: InvoiceLineItem[]
  isDraft: boolean
  canManage: boolean
}) {
  const removeLineItem = useRemoveLineItem()

  const existingOrderIds = new Set(
    lineItems.map((li) => li.test_order_id).filter(Boolean) as string[],
  )

  function handleDelete(itemId: string) {
    removeLineItem.mutate(
      { invoiceId, itemId },
      {
        onSuccess: () => toast.success('Line item removed'),
        onError: () => toast.error('Failed to remove line item'),
      },
    )
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Line items</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {lineItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No line items yet.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Item
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    Unit price
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    Qty
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    Subtotal
                  </th>
                  {isDraft && canManage && <th className="w-10" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2.5 font-medium">{item.test_name}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                      {formatCurrency(item.subtotal)}
                    </td>
                    {isDraft && canManage && (
                      <td className="px-2 py-2.5">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDelete(item.id)}
                          disabled={removeLineItem.isPending}
                          aria-label="Remove line item"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isDraft && canManage && (
          <AddLineItemForm
            invoiceId={invoiceId}
            visitId={visitId}
            existingOrderIds={existingOrderIds}
          />
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Totals Section
// ---------------------------------------------------------------------------

function TotalsSection({
  subtotal,
  discount,
  total,
}: {
  subtotal: string
  discount: string
  total: string
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Discount</dt>
            <dd className="tabular-nums text-emerald-600 dark:text-emerald-400">
              − {formatCurrency(discount)}
            </dd>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCurrency(total)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Payment History
// ---------------------------------------------------------------------------

const PAY_PAGE_SIZE = 10

function PaymentHistory({ invoiceId }: { invoiceId: string }) {
  const [page, setPage] = useState(1)

  const { data, isLoading } = usePayments(invoiceId, {
    page,
    page_size: PAY_PAGE_SIZE,
  })

  const tableData = data ?? { count: 0, next: null, previous: null, results: [] }

  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: 'method',
      header: 'Method',
      cell: ({ row }) => (
        <span className="capitalize">{row.original.method}</span>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge domain="payment" status={row.original.status} />
      ),
    },
    {
      id: 'tx_ref',
      header: 'Ref',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.tx_ref}
        </span>
      ),
    },
    {
      id: 'paid_at',
      header: 'Paid at',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.paid_at
            ? formatRelative(row.original.paid_at)
            : '—'}
        </span>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Payment history</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <DataTable
          data={tableData}
          columns={columns}
          isLoading={isLoading}
          page={page}
          onPageChange={setPage}
          pageSize={PAY_PAGE_SIZE}
          emptyMessage="No payments recorded."
        />
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// InvoiceDetail page
// ---------------------------------------------------------------------------

export default function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()

  const [finalizeOpen, setFinalizeOpen] = useState(false)
  const [voidOpen, setVoidOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [checkoutUrl, setCheckoutUrl] = useState('')

  const { data: invoice, isLoading: invoiceLoading } = useInvoice(invoiceId)
  const { data: patient } = usePatient(invoice?.patient_id)
  const { data: visit } = useVisit(invoice?.visit_id)

  const initiatePayment = useInitiatePayment()
  const cashPayment = useCashPayment()

  const canManage = hasPermission('manage_billing')
  const canVoid = hasPermission('void_invoice')

  const isDraft = invoice?.status === 'draft'
  const isFinalized = invoice?.status === 'finalized'

  function handleChapaPayment() {
    if (!invoiceId) return
    initiatePayment.mutate(
      { invoiceId, data: {} },
      {
        onSuccess: (res) => {
          setQrCode(res.qr_code)
          setCheckoutUrl(res.checkout_url)
          setQrOpen(true)
        },
        onError: () => toast.error('Failed to initiate payment'),
      },
    )
  }

  function handleCashPayment() {
    if (!invoiceId) return
    cashPayment.mutate(invoiceId, {
      onSuccess: () => toast.success('Cash payment recorded'),
      onError: () => toast.error('Failed to record cash payment'),
    })
  }

  if (invoiceLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/billing')}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to billing
        </Button>
        <p className="text-sm text-muted-foreground">Invoice not found.</p>
      </div>
    )
  }

  const patientName =
    patient?.full_name ?? `Patient …${invoice.patient_id.slice(-6)}`
  const visitDate = visit
    ? formatDate(visit.created_at)
    : `Visit …${invoice.visit_id.slice(-6)}`
  const lineItems = invoice.line_items ?? []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/billing')}
            aria-label="Back to billing"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">{patientName}</h1>
          <StatusBadge domain="invoice" status={invoice.status} />
        </div>
        <div className="ml-9 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>
            Visit:{' '}
            <Link
              to={`/patients/${invoice.patient_id}`}
              className="hover:underline"
            >
              {visitDate}
            </Link>
          </span>
          <span>·</span>
          <span>Created {formatDate(invoice.created_at)}</span>
          <span>·</span>
          <span>
            Issued by{' '}
            <span className="font-mono">…{invoice.issued_by.slice(-6)}</span>
          </span>
        </div>
      </div>

      {/* Action buttons */}
      {(isDraft || isFinalized) && (
        <div className="flex flex-wrap gap-2">
          {isDraft && canManage && (
            <Button size="sm" onClick={() => setFinalizeOpen(true)}>
              Finalize invoice
            </Button>
          )}
          {isFinalized && canManage && (
            <>
              <Button
                size="sm"
                onClick={handleChapaPayment}
                disabled={initiatePayment.isPending}
              >
                {initiatePayment.isPending ? 'Initiating…' : 'Pay with Chapa'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCashPayment}
                disabled={cashPayment.isPending}
              >
                {cashPayment.isPending ? 'Recording…' : 'Cash payment'}
              </Button>
            </>
          )}
          {isFinalized && canVoid && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setVoidOpen(true)}
            >
              Void invoice
            </Button>
          )}
        </div>
      )}

      {/* Line items */}
      <LineItemsSection
        invoiceId={invoice.id}
        visitId={invoice.visit_id}
        lineItems={lineItems}
        isDraft={isDraft}
        canManage={canManage}
      />

      {/* Totals */}
      <TotalsSection
        subtotal={invoice.subtotal}
        discount={invoice.discount_amount}
        total={invoice.total_amount}
      />

      {/* Payment history */}
      <PaymentHistory invoiceId={invoice.id} />

      {/* Dialogs */}
      <FinalizeDialog
        open={finalizeOpen}
        onOpenChange={setFinalizeOpen}
        invoiceId={invoice.id}
      />
      <VoidDialog
        open={voidOpen}
        onOpenChange={setVoidOpen}
        invoiceId={invoice.id}
      />
      {qrCode && (
        <QRCodeDialog
          open={qrOpen}
          onOpenChange={setQrOpen}
          qrCode={qrCode}
          checkoutUrl={checkoutUrl}
        />
      )}
    </div>
  )
}
