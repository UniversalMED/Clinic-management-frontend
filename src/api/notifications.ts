import type { Notification, PaginatedResponse } from '@/types/api.types'

import client from './client'

export const list = (params?: {
  page?: number
  page_size?: number
  status?: string
}) =>
  client
    .get<PaginatedResponse<Notification>>('/api/notifications/', { params })
    .then((r) => r.data)

export const acknowledge = (id: string) =>
  client
    .post<Notification>(`/api/notifications/${id}/acknowledge/`)
    .then((r) => r.data)
