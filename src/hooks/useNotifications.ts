import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { acknowledge, list as listNotifications } from '@/api/notifications'
import { queryKeys } from '@/utils/queryKeys'

const NOTIFICATION_POLL_MS = 5_000

export function useNotifications(params?: {
  page?: number
  page_size?: number
  status?: string
}) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params ?? {}),
    queryFn: () => listNotifications(params),
    refetchInterval: NOTIFICATION_POLL_MS,
  })
}

export function useAcknowledgeNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => acknowledge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}
