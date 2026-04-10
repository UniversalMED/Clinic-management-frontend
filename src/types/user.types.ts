export type Role =
  | 'super_admin'
  | 'admin'
  | 'doctor'
  | 'lab_tech'
  | 'receptionist'

export type Permission =
  // User & system management
  | 'manage_users'
  | 'manage_lab_catalogue'
  | 'view_audit_log'
  // Patients & clinical
  | 'write_patient'
  | 'write_visit'
  | 'update_visit'
  | 'write_consultation'
  | 'write_prescription'
  // Lab
  | 'order_lab_test'
  | 'process_lab_order'
  | 'write_lab_result'
  // Billing
  | 'view_billing'
  | 'manage_billing'
  | 'void_invoice'
  // Queue & appointments
  | 'manage_appointments'
  | 'reassign_appointment'
  | 'manage_queue'
  | 'start_visit_from_queue'
  | 'reorder_queue'

export interface Profile {
  id: string
  clinic_id: string
  full_name: string
  role: Role
  created_at: string
}
