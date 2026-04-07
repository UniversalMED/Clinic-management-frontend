import { useMemo, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { Inbox, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import type { QueueEntry } from '@/types/queue.types'
import { useAuth } from '@/hooks/useAuth'
import { useQueue, useReorderQueue } from '@/hooks/useQueue'
import { useUsers } from '@/hooks/useUsers'
import { Skeleton } from '@/components/ui/skeleton'
import { QueueCard } from '@/components/queue/QueueCard'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------

type FilterValue = 'all' | 'waiting' | 'called' | 'in_progress' | 'completed'

const FILTER_TABS: { label: string; value: FilterValue }[] = [
  { label: 'All', value: 'all' },
  { label: 'Waiting', value: 'waiting' },
  { label: 'Called', value: 'called' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
]

const ALL_STATUSES =
  'checked_in,waiting,called,in_progress,completed,no_show'

function statusParam(filter: FilterValue): string {
  return filter === 'all' ? ALL_STATUSES : filter
}

// ---------------------------------------------------------------------------
// Sortable card wrapper
// ---------------------------------------------------------------------------

interface SortableCardProps {
  entry: QueueEntry
  doctorName?: string
}

function SortableCard({ entry, doctorName }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id })

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <QueueCard
        entry={entry}
        doctorName={doctorName}
        dragHandleProps={listeners}
        isDragging={isDragging}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function BoardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-3">
          <div className="flex items-start gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// QueueBoard
// ---------------------------------------------------------------------------

export function QueueBoard() {
  const { hasPermission } = useAuth()
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')

  const { data, isLoading, isFetching } = useQueue({
    status: statusParam(activeFilter),
    page_size: 100,
  })

  const { data: usersData } = useUsers({ page_size: 100 })
  const doctorMap = useMemo(() => {
    const map = new Map<string, string>()
    usersData?.results.forEach((u) => map.set(u.id, u.full_name))
    return map
  }, [usersData])

  const reorderQueue = useReorderQueue()

  const entries = data?.results ?? []

  // Waiting entries eligible for drag-to-reorder
  const canReorder =
    hasPermission('reorder_queue') && activeFilter === 'waiting'
  const waitingEntries = entries.filter((e) => e.status === 'waiting')

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = waitingEntries.findIndex((e) => e.id === active.id)
    const newIndex = waitingEntries.findIndex((e) => e.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(waitingEntries, oldIndex, newIndex)

    reorderQueue.mutate(
      {
        positions: reordered.map((entry, idx) => ({
          id: entry.id,
          queue_position: idx + 1,
        })),
      },
      {
        onError: () => toast.error('Failed to reorder queue'),
      },
    )
  }

  // -------------------------------------------------------------------------

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Live queue</h2>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {isFetching && !isLoading && (
            <RefreshCw className="h-3 w-3 animate-spin" />
          )}
          {data && (
            <span>
              {data.count} {data.count === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1 rounded-lg bg-muted p-1"
        role="tablist"
        aria-label="Queue filter"
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeFilter === tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={cn(
              'flex-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
              activeFilter === tab.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <BoardSkeleton />
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No entries
              {activeFilter !== 'all' ? ` with status "${activeFilter.replace('_', ' ')}"` : ''}
            </p>
          </div>
        ) : canReorder ? (
          // Drag-to-reorder (waiting entries only, admin)
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={waitingEntries.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {waitingEntries.map((entry) => (
                  <SortableCard
                    key={entry.id}
                    entry={entry}
                    doctorName={
                      entry.assigned_doctor_id
                        ? doctorMap.get(entry.assigned_doctor_id)
                        : undefined
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          // Regular list
          <div className="space-y-2">
            {entries.map((entry) => (
              <QueueCard
                key={entry.id}
                entry={entry}
                doctorName={
                  entry.assigned_doctor_id
                    ? doctorMap.get(entry.assigned_doctor_id)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
