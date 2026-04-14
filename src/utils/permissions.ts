import type { Permission, Role } from '@/types/user.types'

// ---------------------------------------------------------------------------
// Role → Permission map
//
// Business rules enforced here (NOT scattered in components):
//   • Billing (view_billing, manage_billing) → admin, receptionist
//   • void_invoice                           → admin only
//   • Create patients (write_patient)        → admin, receptionist
//   • Create lab orders (order_lab_test)     → doctor only
//   • super_admin has every permission
// ---------------------------------------------------------------------------

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    'manage_users',
    'manage_lab_catalogue',
    'view_audit_log',
    'write_patient',
    'write_visit',
    'update_visit',
    'write_consultation',
    'write_prescription',
    'order_lab_test',
    'process_lab_order',
    'write_lab_result',
    'view_billing',
    'manage_billing',
    'void_invoice',
    'manage_appointments',
    'reassign_appointment',
    'manage_queue',
    'start_visit_from_queue',
    'reorder_queue',
  ],

  admin: [
    // System
    'manage_users',
    'manage_lab_catalogue',   // can manage test catalogue, NOT process orders
    'view_audit_log',
    // Patients — admin and receptionist can register/edit patients (workflow §1.1)
    'write_patient',
    // Visits
    'write_visit',
    'update_visit',
    // Billing — admin has full billing access
    'view_billing',
    'manage_billing',
    'void_invoice',
    // Queue & appointments
    'manage_appointments',
    'reassign_appointment',
    'manage_queue',
    'start_visit_from_queue',
    'reorder_queue',
  ],

  doctor: [
    'update_visit',
    'write_consultation',
    'write_prescription',
    'order_lab_test',
    'start_visit_from_queue',
  ],

  lab_tech: [
    'process_lab_order',
    'write_lab_result',
  ],

  receptionist: [
    // Patients & visits — front-desk registration
    'write_patient',
    'write_visit',
    'update_visit',
    // Billing — receptionists collect payments
    'view_billing',
    'manage_billing',
    // Queue & appointments — front-desk workflow
    'manage_appointments',
    'manage_queue',
  ],
}

// ---------------------------------------------------------------------------
// Utilities — all permission logic lives here, never in components
// ---------------------------------------------------------------------------

/** True if the role has the given permission. */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/** True if the role has ALL of the given permissions. */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p))
}

/** True if the role has ANY of the given permissions. */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.length === 0 || permissions.some((p) => hasPermission(role, p))
}
