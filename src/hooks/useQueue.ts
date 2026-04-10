import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  callPatient,
  cancelAppointment,
  checkIn,
  completeVisit,
  createAppointment,
  listAppointments,
  listQueue,
  markNoShow,
  reorderQueue,
  reinsert,
  startVisit,
  updateAppointment,
  type CancelAppointmentPayload,
  type CheckInPayload,
  type CreateAppointmentPayload,
  type MarkNoShowPayload,
  type ReinsertPayload,
  type ReorderQueuePayload,
  type UpdateAppointmentPayload,
} from '@/api/queue'
import { queryKeys } from '@/utils/queryKeys'

const QUEUE_POLL_MS = 30_000

export function useQueue(params?: {
  page?: number
  page_size?: number
  status?: string
  doctor_id?: string
}) {
  return useQuery({
    queryKey: queryKeys.queue.list(params ?? {}),
    queryFn: () => listQueue(params),
    refetchInterval: QUEUE_POLL_MS,
  })
}

export function useAppointments(params?: {
  page?: number
  page_size?: number
  status?: string
  date?: string
  doctor_id?: string
}) {
  return useQuery({
    queryKey: queryKeys.appointments.list(params ?? {}),
    queryFn: () => listAppointments(params),
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAppointmentPayload) =>
      createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
    },
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CheckInPayload) => checkIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
    },
  })
}

export function useCallPatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entryId: string) => callPatient(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue.all })
    },
  })
}

export function useMarkNoShow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      entryId,
      data,
    }: {
      entryId: string
      data?: MarkNoShowPayload
    }) => markNoShow(entryId, data ?? {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue.all })
    },
  })
}

export function useReinsert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      entryId,
      data,
    }: {
      entryId: string
      data: ReinsertPayload
    }) => reinsert(entryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue.all })
    },
  })
}

export function useStartVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entryId: string) => startVisit(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all })
    },
  })
}

export function useCompleteVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entryId: string) => completeVisit(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all })
    },
  })
}

export function useReorderQueue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ReorderQueuePayload) => reorderQueue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue.all })
    },
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentPayload }) =>
      updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
    },
  })
}

export function useCancelAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CancelAppointmentPayload }) =>
      cancelAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
    },
  })
}
