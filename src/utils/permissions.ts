import type { Permission, Role } from '@/types/user.types'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'manage_users',
    'manage_lab_catalogue',
    'write_patient',
    'write_visit',
    'update_visit',
    'process_lab_order',
    'view_audit_log',
    'manage_billing',
    'void_invoice',
    'manage_appointments',
    'reassign_appointment',
    'manage_queue',
    'start_visit_from_queue',
    'reorder_queue',
  ],
  doctor: [
    'update_visit',
    'write_consultation',
    'order_lab_test',
    'write_prescription',
    'start_visit_from_queue',
  ],
  lab_tech: ['process_lab_order', 'write_lab_result'],
  receptionist: [
    'write_patient',
    'write_visit',
    'update_visit',
    'manage_billing',
    'manage_appointments',
    'manage_queue',
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
