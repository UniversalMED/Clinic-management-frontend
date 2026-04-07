import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { differenceInYears, parseISO } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'
import { UserPlus, Search } from 'lucide-react'

import type { Patient } from '@/types/patient.types'
import { useAuth } from '@/hooks/useAuth'
import { usePatients } from '@/hooks/usePatients'
import { formatDate } from '@/utils/formatters'
import { PatientForm } from '@/components/patients/PatientForm'
import { DataTable } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAge(dob: string): number {
  return differenceInYears(new Date(), parseISO(dob))
}

function genderLabel(g: 'M' | 'F' | 'other'): string {
  return g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

function buildColumns(
  onRowClick: (id: string) => void,
): ColumnDef<Patient>[] {
  return [
    {
      accessorKey: 'full_name',
      header: 'Name',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onRowClick(row.original.id)}
          className="font-medium text-foreground hover:underline"
        >
          {row.original.full_name}
        </button>
      ),
    },
    {
      accessorKey: 'gender',
      header: 'Gender',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {genderLabel(row.original.gender)}
        </span>
      ),
    },
    {
      id: 'age',
      header: 'Age',
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {getAge(row.original.date_of_birth)} yrs
        </span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.phone}</span>
      ),
    },
    {
      id: 'created_at',
      header: 'Registered',
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
// Patients page
// ---------------------------------------------------------------------------

const PAGE_SIZE = 25

export default function Patients() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()

  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(1)
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput])

  const { data, isLoading } = usePatients({
    page,
    page_size: PAGE_SIZE,
    search: debouncedSearch || undefined,
  })

  const columns = buildColumns((id) => navigate(`/patients/${id}`))

  // Provide empty paginated shape while loading initial fetch
  const tableData = data ?? { count: 0, next: null, previous: null, results: [] }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>

        {hasPermission('write_patient') && (
          <Button size="sm" onClick={() => setDrawerOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" />
            New patient
          </Button>
        )}
      </div>

      {/* Table */}
      <DataTable
        data={tableData}
        columns={columns}
        isLoading={isLoading}
        page={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        emptyMessage={
          debouncedSearch
            ? `No patients matching "${debouncedSearch}"`
            : 'No patients registered yet.'
        }
      />

      {/* New patient drawer */}
      <Drawer
        direction="right"
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>New patient</DrawerTitle>
            <DrawerDescription>
              Fill in the patient's details to register them.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <PatientForm
              onSuccess={() => setDrawerOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
