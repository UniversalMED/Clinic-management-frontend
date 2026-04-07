import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createPatient,
  getPatient,
  listPatients,
  updatePatient,
  type CreatePatientPayload,
  type UpdatePatientPayload,
} from '@/api/patients'
import { queryKeys } from '@/utils/queryKeys'

export function usePatients(params?: {
  page?: number
  page_size?: number
  search?: string
}) {
  const key = queryKeys.patients.list(params ?? {})
  return useQuery({
    queryKey: key,
    queryFn: () => listPatients(params),
  })
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.patients.detail(id ?? ''),
    queryFn: () => getPatient(id!),
    enabled: Boolean(id),
  })
}

export function useCreatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePatientPayload) => createPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
    },
  })
}

export function useUpdatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdatePatientPayload
    }) => updatePatient(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.detail(id),
      })
    },
  })
}
