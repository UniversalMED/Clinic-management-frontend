import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createUser,
  listUsers,
  updateRole,
  type CreateUserPayload,
  type UpdateRolePayload,
} from '@/api/users'
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

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserPayload) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateRolePayload
    }) => updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}
