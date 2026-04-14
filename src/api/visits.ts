import type { PaginatedResponse } from '@/types/api.types'
import type { Consultation, Prescription, Visit } from '@/types/patient.types'

import client from './client'

export type CreateVisitPayload = {
  patient_id: string
  assigned_doctor_id?: string | null
}

export type UpdateVisitPayload = Partial<
  Pick<Visit, 'patient_id' | 'assigned_doctor_id' | 'status'>
>

export type CreateConsultationPayload = {
  visit_id: string
  symptoms?: string
  diagnosis?: string
  notes?: string
}

export const listVisits = (params?: {
  page?: number
  page_size?: number
  status?: string
  patient_id?: string
  date?: string
}) =>
  client
    .get<PaginatedResponse<Visit>>('/api/clinic/visits/', { params })
    .then((r) => r.data)

export const getVisit = (id: string) =>
  client.get<Visit>(`/api/clinic/visits/${id}/`).then((r) => r.data)

export const createVisit = (data: CreateVisitPayload) =>
  client.post<Visit>('/api/clinic/visits/', data).then((r) => r.data)

export const updateVisit = (id: string, data: UpdateVisitPayload) =>
  client.patch<Visit>(`/api/clinic/visits/${id}/`, data).then((r) => r.data)

export const listConsultations = (params?: {
  page?: number
  page_size?: number
  visit_id?: string
}) =>
  client
    .get<PaginatedResponse<Consultation>>('/api/clinic/consultations/', { params })
    .then((r) => r.data)

export const createConsultation = (data: CreateConsultationPayload) =>
  client
    .post<Consultation>('/api/clinic/consultations/', data)
    .then((r) => r.data)

export type CreatePrescriptionPayload = {
  consultation_id: string
  notes?: string
  items: {
    medication: string
    dosage: string
    frequency: string
    duration?: string
    instructions?: string
  }[]
}

export const listPrescriptions = (params?: {
  consultation_id?: string
  page?: number
  page_size?: number
}) =>
  client
    .get<PaginatedResponse<Prescription>>('/api/clinic/prescriptions/', { params })
    .then((r) => r.data)

export const createPrescription = (data: CreatePrescriptionPayload) =>
  client.post<Prescription>('/api/clinic/prescriptions/', data).then((r) => r.data)
