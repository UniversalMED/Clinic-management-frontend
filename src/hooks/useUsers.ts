import { useQuery } from '@tanstack/react-query'

import { listUsers } from '@/api/users'
import { queryKeys } from '@/utils/queryKeys'

export function useUsers(params?: {
  page?: number
  page_size?: number
  role?: string
  search?: string
}) {
  return useQuery({
    queryKey: queryKeys.users.list(params ?? {}),
    queryFn: () => listUsers(params),
  })
}
