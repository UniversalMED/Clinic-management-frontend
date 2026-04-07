import type { AuditLog, PaginatedResponse } from '@/types/api.types'

import client from './client'

export const list = (params?: {
  page?: number
  page_size?: number
  entity_type?: string
  action?: string
  entity_id?: string
}) =>
  client
    .get<PaginatedResponse<AuditLog>>('/api/audit/logs/', { params })
    .then((r) => r.data)
