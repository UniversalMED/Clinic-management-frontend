import type { PaginatedResponse } from '@/types/api.types'
import type { Appointment, QueueEntry, QueueStateAudit } from '@/types/queue.types'

import client from './client'

export type CreateAppointmentPayload = {
  patient_id: string
  doctor_id?: string | null
  scheduled_at: string
  duration_minutes?: number
  type: 'specialist' | 'general'
  notes?: string
}

export type UpdateAppointmentPayload = Partial<
  Pick<
    Appointment,
    'doctor_id' | 'scheduled_at' | 'duration_minutes' | 'notes'
  >
>

export type CancelAppointmentPayload = {
  cancel_reason: string
}

export type MarkAffectedPayload = {
  doctor_id: string
  date: string
  reason: string
}

export type MarkAffectedResponse = {
  affected_count: number
  reason: string
}

export type ReassignAppointmentPayload = {
  new_doctor_id: string
}

export type CheckInPayload = {
  appointment_id?: string
  patient_id?: string
}

export type MarkNoShowPayload = {
  reason?: string
}

export type ReinsertPayload = {
  reason: string
}

export type ReorderQueuePayload = {
  positions: { id: string; queue_position: number }[]
}

export type StartVisitResponse = {
  queue_entry: QueueEntry
  visit_id: string
}

export const listAppointments = (params?: {
  page?: number
  page_size?: number
  status?: string
  date?: string
  doctor_id?: string
}) =>
  client
    .get<PaginatedResponse<Appointment>>('/api/queue/appointments/', { params })
    .then((r) => r.data)

export const createAppointment = (data: CreateAppointmentPayload) =>
  client
    .post<Appointment>('/api/queue/appointments/', data)
    .then((r) => r.data)

export const updateAppointment = (id: string, data: UpdateAppointmentPayload) =>
  client
    .patch<Appointment>(`/api/queue/appointments/${id}/`, data)
    .then((r) => r.data)

export const cancelAppointment = (id: string, data: CancelAppointmentPayload) =>
  client
    .post<Appointment>(`/api/queue/appointments/${id}/cancel/`, data)
    .then((r) => r.data)

/** Backend: POST `/api/queue/appointments/affected/` (bulk mark by doctor + date). */
export const markAffected = (data: MarkAffectedPayload) =>
  client
    .post<MarkAffectedResponse>('/api/queue/appointments/affected/', data)
    .then((r) => r.data)

export const reassignAppointment = (
  id: string,
  data: ReassignAppointmentPayload,
) =>
  client
    .post<Appointment>(`/api/queue/appointments/${id}/reassign/`, data)
    .then((r) => r.data)

export const checkIn = (data: CheckInPayload) =>
  client.post<QueueEntry>('/api/queue/checkin/', data).then((r) => r.data)

export const listQueue = (params?: {
  page?: number
  page_size?: number
  status?: string
  doctor_id?: string
}) =>
  client
    .get<PaginatedResponse<QueueEntry>>('/api/queue/', { params })
    .then((r) => r.data)

export const callPatient = (id: string) =>
  client.post<QueueEntry>(`/api/queue/${id}/call/`).then((r) => r.data)

export const markNoShow = (id: string, data: MarkNoShowPayload) =>
  client
    .post<QueueEntry>(`/api/queue/${id}/no-show/`, data)
    .then((r) => r.data)

export const reinsert = (id: string, data: ReinsertPayload) =>
  client
    .post<QueueEntry>(`/api/queue/${id}/reinsert/`, data)
    .then((r) => r.data)

export const startVisit = (id: string) =>
  client
    .post<StartVisitResponse>(`/api/queue/${id}/start-visit/`)
    .then((r) => r.data)

export const completeVisit = (id: string) =>
  client
    .post<QueueEntry>(`/api/queue/${id}/complete/`)
    .then((r) => r.data)

export const reorderQueue = (data: ReorderQueuePayload) =>
  client.post<QueueEntry[]>('/api/queue/reorder/', data).then((r) => r.data)

export const getHistory = (id: string) =>
  client
    .get<QueueStateAudit[]>(`/api/queue/${id}/history/`)
    .then((r) => r.data)
