import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useCreateLabResult, useUpdateLabOrder } from '@/hooks/useLab'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KVPair {
  uid: string
  key: string
  value: string
}

function uid(): string {
  return Math.random().toString(36).slice(2)
}

// ---------------------------------------------------------------------------
// ResultEntryForm
// ---------------------------------------------------------------------------

export interface ResultEntryFormProps {
  orderId: string
  onSuccess?: () => void
}

export function ResultEntryForm({ orderId, onSuccess }: ResultEntryFormProps) {
  const createResult = useCreateLabResult()
  const updateOrder = useUpdateLabOrder()

  const [pairs, setPairs] = useState<KVPair[]>([
    { uid: uid(), key: '', value: '' },
  ])
  const [remarks, setRemarks] = useState('')

  function addPair() {
    setPairs((prev) => [...prev, { uid: uid(), key: '', value: '' }])
  }

  function removePair(id: string) {
    setPairs((prev) => {
      if (prev.length === 1) return prev // keep at least one row
      return prev.filter((p) => p.uid !== id)
    })
  }

  function updatePair(id: string, field: 'key' | 'value', val: string) {
    setPairs((prev) =>
      prev.map((p) => (p.uid === id ? { ...p, [field]: val } : p)),
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Build result_data — skip rows with empty keys
    const result_data: Record<string, string> = {}
    for (const p of pairs) {
      const k = p.key.trim()
      if (k) result_data[k] = p.value.trim()
    }

    if (Object.keys(result_data).length === 0) {
      toast.error('Add at least one result field.')
      return
    }

    createResult.mutate(
      {
        test_order_id: orderId,
        result_data,
        remarks: remarks.trim() || undefined,
      },
      {
        onSuccess: () => {
          // Auto-complete the order when result is submitted
          updateOrder.mutate(
            { id: orderId, data: { status: 'completed' } },
            {
              onSuccess: () => {
                toast.success('Result recorded and order completed')
                onSuccess?.()
              },
              onError: () => {
                // Result was saved even if status update failed
                toast.success('Result recorded')
                onSuccess?.()
              },
            },
          )
        },
        onError: () => toast.error('Failed to record result'),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Key-value builder */}
      <div className="space-y-2">
        <Label>Result fields *</Label>
        <div className="space-y-2">
          {pairs.map((pair) => (
            <div key={pair.uid} className="flex items-center gap-2">
              <Input
                placeholder="Parameter (e.g. Hemoglobin)"
                value={pair.key}
                onChange={(e) => updatePair(pair.uid, 'key', e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Value (e.g. 14.2 g/dL)"
                value={pair.value}
                onChange={(e) => updatePair(pair.uid, 'value', e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removePair(pair.uid)}
                aria-label="Remove field"
                disabled={pairs.length === 1}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPair}
          className="mt-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Add field
        </Button>
      </div>

      {/* Remarks */}
      <div className="space-y-1.5">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea
          id="remarks"
          placeholder="Optional clinical notes…"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={createResult.isPending || updateOrder.isPending}
      >
        {(createResult.isPending || updateOrder.isPending) ? 'Submitting…' : 'Submit result & complete'}
      </Button>
    </form>
  )
}
