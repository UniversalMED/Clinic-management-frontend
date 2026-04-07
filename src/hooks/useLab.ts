import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createOrder,
  createResult,
  getOrder,
  getResult,
  listOrders,
  listTests,
  updateOrder,
  type CreateLabOrderPayload,
  type CreateLabResultPayload,
  type UpdateLabOrderPayload,
} from '@/api/lab'
import { queryKeys } from '@/utils/queryKeys'

export function useLabTests(params?: {
  page?: number
  page_size?: number
  search?: string
}) {
  return useQuery({
    queryKey: queryKeys.labTests.list(params ?? {}),
    queryFn: () => listTests(params),
  })
}

export function useLabOrders(params?: {
  page?: number
  page_size?: number
  visit_id?: string
  patient_id?: string
  status?: string
  unbilled?: string | boolean
  billable?: string | boolean
}) {
  return useQuery({
    queryKey: queryKeys.labOrders.list(params ?? {}),
    queryFn: () => listOrders(params),
  })
}

export function useLabOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.labOrders.detail(id ?? ''),
    queryFn: () => getOrder(id!),
    enabled: Boolean(id),
  })
}

export function useCreateLabOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateLabOrderPayload) => createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labOrders.all })
    },
  })
}

export function useUpdateLabOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateLabOrderPayload
    }) => updateOrder(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labOrders.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.labOrders.detail(id),
      })
    },
  })
}

export function useCreateLabResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateLabResultPayload) => createResult(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labResults.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.labOrders.all })
    },
  })
}

export function useLabResult(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.labResults.detail(id ?? ''),
    queryFn: () => getResult(id!),
    enabled: Boolean(id),
  })
}
