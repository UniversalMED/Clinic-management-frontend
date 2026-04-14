import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import type { Notification } from '@/types/api.types'
import { useNotifications } from './useNotifications'

// ---------------------------------------------------------------------------
// Event type → human label + navigation target
// ---------------------------------------------------------------------------

function eventLabel(eventType: string): string {
  switch (eventType) {
    case 'lab_test_requested':  return 'New Lab Order'
    case 'lab_test_started':    return 'Lab Test Started'
    case 'lab_test_completed':  return 'Lab Result Ready'
    default: return eventType.replace(/_/g, ' ')
  }
}

function eventDescription(n: Notification): string {
  const name = n.payload?.test_name as string | undefined
  switch (n.event_type) {
    case 'lab_test_requested':
      return name ? `${name} — waiting to be processed` : 'A new lab order is waiting'
    case 'lab_test_started':
      return name ? `${name} is now in progress` : 'A lab test has started'
    case 'lab_test_completed':
      return name ? `${name} result is available` : 'A lab result is ready'
    default:
      return name ?? ''
  }
}

function navigateTo(n: Notification): string {
  if (n.event_type === 'lab_test_requested') return '/lab'
  return `/lab/orders/${n.entity_id}`
}

// ---------------------------------------------------------------------------
// Hook — detects new notifications and fires popup toasts
// ---------------------------------------------------------------------------

/**
 * Call once at the app shell level.
 * On first data load it seeds the "already seen" set so existing notifications
 * don't flood the screen. Every subsequent poll that finds new IDs fires a
 * Sonner toast styled like a push notification.
 */
export function useNotificationPopups() {
  const navigate = useNavigate()
  const seenIds = useRef<Set<string> | null>(null)

  const { data } = useNotifications({ status: 'pending', page_size: 20 })

  useEffect(() => {
    if (!data) return

    const incoming = data.results

    // First load — seed the baseline, show nothing
    if (seenIds.current === null) {
      seenIds.current = new Set(incoming.map((n) => n.id))
      return
    }

    // Subsequent polls — find IDs we haven't seen before
    const fresh = incoming.filter((n) => !seenIds.current!.has(n.id))

    for (const notif of fresh) {
      seenIds.current.add(notif.id)
      const href = navigateTo(notif)

      toast(eventLabel(notif.event_type), {
        description: eventDescription(notif),
        duration: 8_000,
        action: {
          label: 'View',
          onClick: () => navigate(href),
        },
      })
    }
  }, [data, navigate])
}
