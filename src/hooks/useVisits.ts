import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createConsultation,
  createPrescription,
  createVisit,
  getVisit,
  listConsultations,
  listPrescriptions,
  listVisits,
  updateVisit,
  type CreateConsultationPayload,
  type CreatePrescriptionPayload,
  type CreateVisitPayload,
  type UpdateVisitPayload,
} from '@/api/visits'
import { queryKeys } from '@/utils/queryKeys'

export function useVisits(params?: {
  page?: number
  page_size?: number
  status?: string
  patient_id?: string
  date?: string
}) {
  return useQuery({
    queryKey: queryKeys.visits.list(params ?? {}),
    queryFn: () => listVisits(params),
  })
}

export function useVisit(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.visits.detail(id ?? ''),
    queryFn: () => getVisit(id!),
    enabled: Boolean(id),
  })
}

export function useCreateVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateVisitPayload) => createVisit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all })
    },
  })
}

export function useUpdateVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateVisitPayload
    }) => updateVisit(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.detail(id) })
    },
  })
}

export function useConsultations(visitId: string | undefined) {
  const listKey = { visit_id: visitId ?? '' }
  return useQuery({
    queryKey: queryKeys.consultations.list(listKey),
    queryFn: () => listConsultations({ visit_id: visitId }),
    enabled: Boolean(visitId),
  })
}

export function useCreateConsultation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateConsultationPayload) =>
      createConsultation(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.consultations.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.consultations.list({
          visit_id: variables.visit_id,
        }),
      })
    },
  })
}

export function usePrescriptions(consultationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.prescriptions.list({ consultation_id: consultationId ?? '' }),
    queryFn: () => listPrescriptions({ consultation_id: consultationId }),
    enabled: Boolean(consultationId),
  })
}

export function useCreatePrescription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePrescriptionPayload) => createPrescription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.all })
    },
  })
}
