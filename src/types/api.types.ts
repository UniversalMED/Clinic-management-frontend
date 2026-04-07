export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiError {
  detail?: string
  [key: string]: unknown
}

export interface AuditLog {
  id: string
  clinic_id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  timestamp: string
}

export interface Notification {
  id: string
  event_type: string
  entity_type: string
  entity_id: string
  payload: Record<string, unknown>
  status: string
  retry_count: number
  created_at: string
  delivered_at: string | null
}
