import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { toast } from 'sonner'

import type { Patient } from '@/types/patient.types'
import { useCreatePatient, useUpdatePatient } from '@/hooks/usePatients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const PHONE_RE = /^(09\d{8}|\+251\d{9})$/

const schema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  gender: z.enum(['male', 'female']),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .regex(PHONE_RE, 'Phone must start with 09 (e.g. 0912345678) or +251 (e.g. +251912345678)'),
})

type FormValues = z.infer<typeof schema>

// ---------------------------------------------------------------------------
// Field error helper
// ---------------------------------------------------------------------------

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

// ---------------------------------------------------------------------------
// PatientForm
// ---------------------------------------------------------------------------

export interface PatientFormProps {
  patient?: Patient
  onSuccess?: (saved: Patient) => void
}

export function PatientForm({ patient, onSuccess }: PatientFormProps) {
  const isEdit = Boolean(patient)
  const createPatient = useCreatePatient()
  const updatePatient = useUpdatePatient()
  const isPending = createPatient.isPending || updatePatient.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: {
      full_name: patient?.full_name ?? '',
      gender: patient?.gender ?? 'male',
      date_of_birth: patient?.date_of_birth ?? '',
      phone: patient?.phone ?? '',
    },
  })

  function onSubmit(data: FormValues) {
    if (isEdit && patient) {
      updatePatient.mutate(
        { id: patient.id, data },
        {
          onSuccess: (saved) => {
            toast.success('Patient updated')
            onSuccess?.(saved)
          },
          onError: () => toast.error('Failed to update patient'),
        },
      )
    } else {
      createPatient.mutate(data, {
        onSuccess: (saved) => {
          toast.success('Patient created')
          onSuccess?.(saved)
        },
        onError: () => toast.error('Failed to create patient'),
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Full name */}
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name *</Label>
        <Input
          id="full_name"
          placeholder="Abebe Girma"
          {...register('full_name')}
        />
        <FieldError message={errors.full_name?.message} />
      </div>

      {/* Gender */}
      <div className="space-y-1.5">
        <Label htmlFor="gender">Gender</Label>
        <select
          id="gender"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          {...register('gender')}
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <FieldError message={errors.gender?.message} />
      </div>

      {/* Date of birth */}
      <div className="space-y-1.5">
        <Label htmlFor="date_of_birth">Date of birth</Label>
        <input
          id="date_of_birth"
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          className="h-9 w-full cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          {...register('date_of_birth')}
        />
        <FieldError message={errors.date_of_birth?.message} />
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone *</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+251 9XX XXX XXX"
          {...register('phone')}
        />
        <FieldError message={errors.phone?.message} />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending
          ? isEdit
            ? 'Updating…'
            : 'Creating…'
          : isEdit
            ? 'Update patient'
            : 'Create patient'}
      </Button>
    </form>
  )
}
