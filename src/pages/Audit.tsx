import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'

import type { AuditLog } from '@/types/api.types'
import { useAuth } from '@/hooks/useAuth'
import { useAuditLogs } from '@/hooks/useAudit'
import { useUsers } from '@/hooks/useUsers'
import { formatDate } from '@/utils/formatters'
import { DataTable } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 25

const ENTITY_TYPES = [
  'patient',
  'visit',
  'consultation',
  'prescription',
  'invoice',
  'payment',
  'lab_test',
  'test_order',
  'test_result',
  'queue_entry',
  'appointment',
  'user',
] as const

const ACTIONS = ['create', 'update'] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function humanize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

function buildColumns(userMap: Map<string, string>): ColumnDef<AuditLog>[] {
  return [
    {
      id: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {formatDate(row.original.timestamp)}
        </span>
      ),
    },
    {
      id: 'user',
      header: 'User',
      cell: ({ row }) => {
        const id = row.original.user_id
        return (
          <span className="font-medium">
            {userMap.get(id) ?? `…${id.slice(-6)}`}
          </span>
        )
      },
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <span className="capitalize">{row.original.action}</span>
      ),
    },
    {
      id: 'entity_type',
      header: 'Entity type',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {humanize(row.original.entity_type)}
        </span>
      ),
    },
    {
      id: 'entity_id',
      header: 'Entity ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          …{row.original.entity_id.slice(-8)}
        </span>
      ),
    },
  ]
}

// ---------------------------------------------------------------------------
// Audit page
// ---------------------------------------------------------------------------

export default function Audit() {
  const { hasPermission, isLoading } = useAuth()

  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [entityIdInput, setEntityIdInput] = useState('')
  const [debouncedEntityId, setDebouncedEntityId] = useState('')
  const [page, setPage] = useState(1)

  // Debounce entity_id text input
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedEntityId(entityIdInput)
      setPage(1)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [entityIdInput])

  const { data, isLoading: logsLoading } = useAuditLogs({
    entity_type: entityType || undefined,
    action: action || undefined,
    entity_id: debouncedEntityId || undefined,
    page,
    page_size: PAGE_SIZE,
  })

  const { data: usersData } = useUsers({ page_size: 200 })
  const userMap = new Map(
    usersData?.results.map((u) => [u.id, u.full_name]) ?? [],
  )

  // Guard: redirect if not admin
  if (!isLoading && !hasPermission('manage_users')) {
    return <Navigate to="/dashboard" replace />
  }

  const columns = buildColumns(userMap)
  const tableData = data ?? { count: 0, next: null, previous: null, results: [] }

  const selectCls =
    'h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>Entity type</Label>
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value)
              setPage(1)
            }}
            className={selectCls}
          >
            <option value="">All types</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {humanize(t)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Action</Label>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value)
              setPage(1)
            }}
            className={selectCls}
          >
            <option value="">All actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {humanize(a)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="entity-id">Entity ID</Label>
          <Input
            id="entity-id"
            placeholder="Paste a UUID…"
            value={entityIdInput}
            onChange={(e) => setEntityIdInput(e.target.value)}
            className="w-64 font-mono text-xs"
          />
        </div>
      </div>

      <DataTable
        data={tableData}
        columns={columns}
        isLoading={logsLoading}
        page={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        emptyMessage="No audit logs match the current filters."
      />
    </div>
  )
}
