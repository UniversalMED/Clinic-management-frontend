import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { PaginatedResponse } from '@/types/api.types'

export type DataTableProps<T> = {
  data: PaginatedResponse<T>
  columns: ColumnDef<T>[]
  isLoading: boolean
  page: number
  onPageChange: (p: number) => void
  pageSize?: number
  emptyMessage?: string
  className?: string
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  page,
  onPageChange,
  pageSize = 25,
  emptyMessage = 'No results.',
  className,
}: DataTableProps<T>): ReactElement {
  const table = useReactTable({
    data: data.results,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(data.count / pageSize)),
  })

  const totalPages = Math.max(1, Math.ceil(data.count / pageSize))
  const showSkeleton = isLoading && data.results.length === 0
  const showEmpty = !isLoading && data.results.length === 0

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {showSkeleton ? (
              Array.from({ length: 5 }).map((_, rowIdx) => (
                <TableRow key={`sk-${rowIdx}`}>
                  {columns.map((_, colIdx) => (
                    <TableCell key={colIdx}>
                      <Skeleton className="h-4 w-full max-w-[12rem]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : showEmpty ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {data.count === 0 ? (
            '0 rows'
          ) : (
            <>
              Page <span className="font-medium text-foreground">{page}</span> of{' '}
              <span className="font-medium text-foreground">{totalPages}</span>
              <span className="mx-1">·</span>
              <span className="font-medium text-foreground">{data.count}</span> total
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
