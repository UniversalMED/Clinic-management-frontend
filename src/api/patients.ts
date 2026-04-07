import type { PaginatedResponse } from '@/types/api.types'
import type { Patient } from '@/types/patient.types'

import client from './client'

export type CreatePatientPayload = Pick<
  Patient,
  'full_name' | 'gender' | 'date_of_birth' | 'phone'
>

export type UpdatePatientPayload = Partial<CreatePatientPayload>

export const listPatients = (params?: {
  page?: number
  page_size?: number
  search?: string
}) =>
  client
    .get<PaginatedResponse<Patient>>('/api/clinic/patients/', { params })
    .then((r) => r.data)

export const getPatient = (id: string) =>
  client.get<Patient>(`/api/clinic/patients/${id}/`).then((r) => r.data)

export const createPatient = (data: CreatePatientPayload) =>
  client.post<Patient>('/api/clinic/patients/', data).then((r) => r.data)

export const updatePatient = (id: string, data: UpdatePatientPayload) =>
  client.patch<Patient>(`/api/clinic/patients/${id}/`, data).then((r) => r.data)
