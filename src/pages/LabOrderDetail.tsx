import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FlaskConical, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/useAuth'
import { useLabOrder, useLabResults, useUpdateLabOrder } from '@/hooks/useLab'
import { useVisit } from '@/hooks/useVisits'
import { useUsers } from '@/hooks/useUsers'
import { ResultEntryForm } from '@/components/lab/ResultEntryForm'
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
import { formatDate, formatCurrency, formatRelative } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Result display
// ---------------------------------------------------------------------------

function ResultCard({
  resultData,
  remarks,
  createdAt,
  technicianName,
}: {
  resultData: Record<string, unknown>
  remarks: string
  createdAt: string
  technicianName: string
}) {
  const entries = Object.entries(resultData)

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">Result</CardTitle>
        <CardDescription>
          Recorded {formatRelative(createdAt)}
          {technicianName && ` · by ${technicianName}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {entries.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Parameter</th>
                <th className="pb-2 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([k, v]) => (
                <tr key={k} className="border-b last:border-0">
                  <td className="py-2 font-medium pr-4">{k}</td>
                  <td className="py-2 tabular-nums">{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground">No result fields recorded.</p>
        )}

        {remarks && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Remarks</p>
            <p className="text-sm">{remarks}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// LabOrderDetail
// ---------------------------------------------------------------------------

export default function LabOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { hasPermission, user } = useAuth()

  const [resultFormKey, setResultFormKey] = useState(0)

  const { data: order, isLoading } = useLabOrder(orderId)
  const { data: visit } = useVisit(order?.visit_id)
  const { data: resultsData, isLoading: resultsLoading } = useLabResults({
    order_id: orderId,
    page_size: 1,
  })
  const { data: usersData } = useUsers({ page_size: 100 })
  const updateOrder = useUpdateLabOrder()

  const userMap = new Map(
    usersData?.results.map((u) => [u.id, u.full_name]) ?? [],
  )

  const result = resultsData?.results[0] ?? null
  const canProcess = hasPermission('process_lab_order')
  const canWriteResult = hasPermission('write_lab_result')

  function updateStatus(status: 'pending' | 'in_progress' | 'completed' | 'cancelled') {
    if (!orderId) return
    updateOrder.mutate(
      { id: orderId, data: { status } },
      {
        onSuccess: () => toast.success(`Order marked as ${status.replace('_', ' ')}`),
        onError: () => toast.error('Failed to update order'),
      },
    )
  }

  function assignToMe() {
    if (!orderId || !user?.id) return
    updateOrder.mutate(
      { id: orderId, data: { assigned_to: user.id } },
      {
        onSuccess: () => toast.success('Assigned to you'),
        onError: () => toast.error('Failed to assign order'),
      },
    )
  }

  // ---------------------------------------------------------------------------
  // Loading / not found
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <FlaskConical className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Order not found.</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('/lab')}>
          Back to Lab
        </Button>
      </div>
    )
  }

  const testLabel = order.test_name ?? `Test …${order.test_id.slice(-6)}`
  const orderedByName = userMap.get(order.ordered_by) ?? `…${order.ordered_by.slice(-6)}`
  const assignedName = order.assigned_to
    ? (userMap.get(order.assigned_to) ?? `…${order.assigned_to.slice(-6)}`)
    : null
  const techName = result ? (userMap.get(result.technician_id) ?? '') : ''

  const isAlreadyAssignedToMe = order.assigned_to === user?.id
  const isPending = order.status === 'pending'
  const isInProgress = order.status === 'in_progress'
  const isCompleted = order.status === 'completed'
  const isCancelled = order.status === 'cancelled'
  const isTerminal = isCompleted || isCancelled

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/lab')}
            aria-label="Back to lab"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-semibold">{testLabel}</h1>
              <StatusBadge domain="lab_order" status={order.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ordered {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {!isTerminal && canProcess && (
          <div className="flex items-center gap-2">
            {isPending && (
              <>
                {!isAlreadyAssignedToMe && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={assignToMe}
                    disabled={updateOrder.isPending}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Assign to me
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => updateStatus('in_progress')}
                  disabled={updateOrder.isPending}
                >
                  Start
                </Button>
              </>
            )}
            {isInProgress && (
              <Button
                size="sm"
                onClick={() => updateStatus('completed')}
                disabled={updateOrder.isPending}
              >
                Mark complete
              </Button>
            )}
            {!isCompleted && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus('cancelled')}
                disabled={updateOrder.isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Order info */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Order details</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <dl className="grid gap-y-3 gap-x-6 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Test</dt>
              <dd className="font-medium mt-0.5">{testLabel}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Price</dt>
              <dd className="tabular-nums mt-0.5">
                {formatCurrency(order.price_at_order_time)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Visit</dt>
              <dd className="mt-0.5">
                <Link
                  to={`/visits/${order.visit_id}`}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  …{order.visit_id.slice(-8)}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Patient</dt>
              <dd className="mt-0.5">
                {visit?.patient_id ? (
                  <Link
                    to={`/patients/${visit.patient_id}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    …{visit.patient_id.slice(-8)}
                  </Link>
                ) : (
                  <span className="text-muted-foreground/60">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Ordered by</dt>
              <dd className="mt-0.5">{orderedByName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Assigned to</dt>
              <dd className="mt-0.5">
                {assignedName ?? (
                  <span className="text-muted-foreground/60">Unassigned</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Billable</dt>
              <dd className="mt-0.5">{order.is_billable ? 'Yes' : 'No'}</dd>
            </div>
            {order.billed_invoice_id && (
              <div>
                <dt className="text-xs text-muted-foreground">Invoice</dt>
                <dd className="mt-0.5">
                  <Link
                    to={`/billing/invoices/${order.billed_invoice_id}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    …{order.billed_invoice_id.slice(-8)}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Result section */}
      {resultsLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : result ? (
        <ResultCard
          resultData={result.result_data}
          remarks={result.remarks}
          createdAt={result.created_at}
          technicianName={techName}
        />
      ) : isInProgress && canWriteResult ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Enter result</CardTitle>
            <CardDescription>
              Record the test findings for this order.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ResultEntryForm
              key={resultFormKey}
              orderId={order.id}
              onSuccess={() => setResultFormKey((k) => k + 1)}
            />
          </CardContent>
        </Card>
      ) : isCompleted && !result ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No result recorded for this order.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
