import type { PaginatedResponse } from '@/types/api.types'
import type { LabTest, TestOrder, TestResult } from '@/types/lab.types'

import client from './client'

export type CreateLabTestPayload = Pick<
  LabTest,
  'name' | 'description' | 'price' | 'is_active'
>

export type UpdateLabTestPayload = Partial<CreateLabTestPayload>

export type CreateLabOrderPayload = {
  visit_id: string
  consultation_id?: string | null
  test_id: string
}

export type UpdateLabOrderPayload = Partial<
  Pick<TestOrder, 'status' | 'assigned_to' | 'is_billable'>
>

export type CreateLabResultPayload = {
  test_order_id: string
  result_data: Record<string, unknown>
  remarks?: string
}

export const listTests = (params?: {
  page?: number
  page_size?: number
  search?: string
}) =>
  client
    .get<PaginatedResponse<LabTest>>('/api/lab/tests/', { params })
    .then((r) => r.data)

export const getTest = (id: string) =>
  client.get<LabTest>(`/api/lab/tests/${id}/`).then((r) => r.data)

export const createTest = (data: CreateLabTestPayload) =>
  client.post<LabTest>('/api/lab/tests/', data).then((r) => r.data)

export const updateTest = (id: string, data: UpdateLabTestPayload) =>
  client.patch<LabTest>(`/api/lab/tests/${id}/`, data).then((r) => r.data)

export const listOrders = (params?: {
  page?: number
  page_size?: number
  visit_id?: string
  patient_id?: string
  status?: string
  unbilled?: string | boolean
  pending_payment?: string | boolean
}) =>
  client
    .get<PaginatedResponse<TestOrder>>('/api/lab/orders/', { params })
    .then((r) => r.data)

export const getOrder = (id: string) =>
  client.get<TestOrder>(`/api/lab/orders/${id}/`).then((r) => r.data)

export const createOrder = (data: CreateLabOrderPayload) =>
  client.post<TestOrder>('/api/lab/orders/', data).then((r) => r.data)

export const updateOrder = (id: string, data: UpdateLabOrderPayload) =>
  client.patch<TestOrder>(`/api/lab/orders/${id}/`, data).then((r) => r.data)

export const listResults = (params?: {
  page?: number
  page_size?: number
  order_id?: string
}) =>
  client
    .get<PaginatedResponse<TestResult>>('/api/lab/results/', { params })
    .then((r) => r.data)

export const getResult = (id: string) =>
  client.get<TestResult>(`/api/lab/results/${id}/`).then((r) => r.data)

export const createResult = (data: CreateLabResultPayload) =>
  client.post<TestResult>('/api/lab/results/', data).then((r) => r.data)
