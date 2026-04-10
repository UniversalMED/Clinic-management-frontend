import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

import { usePatients } from '@/hooks/usePatients'
import { Input } from '@/components/ui/input'

interface PatientPickerProps {
  /** Called when the patient selection changes. `null` = cleared. */
  onChange: (patientId: string | null, patientName: string | null) => void
  placeholder?: string
  className?: string
}

/**
 * Inline patient search. Type to search by name or phone, click to select.
 * Shows the selected patient's name with a clear button.
 */
export function PatientPicker({
  onChange,
  placeholder = 'Filter by patient…',
  className,
}: PatientPickerProps) {
  const [input, setInput] = useState('')
  const [debounced, setDebounced] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebounced(input), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [input])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const { data: patients, isLoading } = usePatients({
    search: !selectedId && debounced ? debounced : undefined,
    page_size: 8,
  })

  function select(id: string, name: string) {
    setSelectedId(id)
    setSelectedName(name)
    setInput(name)
    setOpen(false)
    onChange(id, name)
  }

  function clear() {
    setSelectedId(null)
    setSelectedName(null)
    setInput('')
    setDebounced('')
    setOpen(false)
    onChange(null, null)
  }

  const showDropdown = open && !selectedId && debounced.length > 0

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            if (selectedId) {
              // Typing again after selection → clear selection
              setSelectedId(null)
              setSelectedName(null)
              onChange(null, null)
            }
            setOpen(true)
          }}
          onFocus={() => { if (!selectedId) setOpen(true) }}
          placeholder={placeholder}
          className="h-8 pl-8 pr-7 text-sm"
          aria-label="Search patients"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />
        {(input || selectedId) && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear patient filter"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-md"
          role="listbox"
        >
          {isLoading ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Searching…</p>
          ) : !patients?.results.length ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No patients found.</p>
          ) : (
            patients.results.map((p) => (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={p.id === selectedId}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => select(p.id, p.full_name)}
              >
                <span className="font-medium">{p.full_name}</span>
                <span className="ml-3 shrink-0 font-mono text-xs text-muted-foreground">
                  {p.phone}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {selectedName && (
        <p className="mt-1 text-xs text-muted-foreground">
          Showing results for <span className="font-medium text-foreground">{selectedName}</span>
        </p>
      )}
    </div>
  )
}
