import {
  LayoutGrid,
  Users,
  ClipboardList,
  UsersRound,
  Microscope,
  CreditCard,
  UserCog,
  ScrollText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { Permission } from '@/types/user.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NavSection = 'clinic' | 'operations' | 'admin'

/**
 * A single navigation entry.
 *
 * `requiredPermissions` — the nav item is visible if the user holds ANY of
 * these permissions. An empty array means the item is visible to every
 * authenticated user.
 *
 * `countKey` — optional identifier that Sidebar uses to look up a live badge
 * count from a pre-fetched query result.
 */
export type NavItem = {
  id: string
  label: string
  path: string
  icon: LucideIcon
  section: NavSection
  requiredPermissions: Permission[]
  countKey?: 'queue_waiting' | 'lab_pending'
}

// ---------------------------------------------------------------------------
// Config
//
// ⚠️  All visibility rules live here — NEVER in Sidebar or page components.
// ---------------------------------------------------------------------------

export const NAV_ITEMS: NavItem[] = [
  // ── Clinic ──────────────────────────────────────────────────────────────
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutGrid,
    section: 'clinic',
    requiredPermissions: [], // every authenticated user
  },
  {
    id: 'patients',
    label: 'Patients',
    path: '/patients',
    icon: Users,
    section: 'clinic',
    requiredPermissions: [], // every authenticated user
  },
  {
    id: 'visits',
    label: 'Visits',
    path: '/visits',
    icon: ClipboardList,
    section: 'clinic',
    requiredPermissions: [], // every authenticated user
  },
  {
    id: 'queue',
    label: 'Queue',
    path: '/queue',
    icon: UsersRound,
    section: 'clinic',
    requiredPermissions: ['manage_queue', 'start_visit_from_queue'],
    countKey: 'queue_waiting',
  },

  // ── Operations ──────────────────────────────────────────────────────────
  {
    id: 'lab',
    label: 'Lab',
    path: '/lab',
    icon: Microscope,
    section: 'operations',
    requiredPermissions: ['order_lab_test', 'process_lab_order', 'write_lab_result', 'manage_lab_catalogue'],
    countKey: 'lab_pending',
  },
  {
    id: 'billing',
    label: 'Billing',
    path: '/billing',
    icon: CreditCard,
    section: 'operations',
    // Business rule: billing visible to super_admin and admin only
    requiredPermissions: ['view_billing'],
  },

  // ── Admin ────────────────────────────────────────────────────────────────
  {
    id: 'users',
    label: 'Users',
    path: '/users',
    icon: UserCog,
    section: 'admin',
    requiredPermissions: ['manage_users'],
  },
  {
    id: 'audit',
    label: 'Audit',
    path: '/audit',
    icon: ScrollText,
    section: 'admin',
    requiredPermissions: ['view_audit_log'],
  },
]

// Convenience: items grouped by section, in declaration order
export const NAV_SECTIONS: NavSection[] = ['clinic', 'operations', 'admin']

export const SECTION_LABELS: Record<NavSection, string> = {
  clinic: 'Clinic',
  operations: 'Lab & billing',
  admin: 'Admin',
}
