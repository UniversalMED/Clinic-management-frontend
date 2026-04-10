import { useQuery } from '@tanstack/react-query'

import { list } from '@/api/audit'
import { queryKeys } from '@/utils/queryKeys'

export function useAuditLogs(params?: {
  page?: number
  page_size?: number
  entity_type?: string
  action?: string
  entity_id?: string
}) {
  return useQuery({
    queryKey: queryKeys.audit.logs(params ?? {}),
    queryFn: () => list(params),
  })
}
