export type Role =
  | 'admin'
  | 'doctor'
  | 'lab_tech'
  | 'receptionist'

export type Permission =
  | 'manage_users'
  | 'manage_lab_catalogue'
  | 'write_patient'
  | 'write_visit'
  | 'update_visit'
  | 'process_lab_order'
  | 'view_audit_log'
  | 'manage_billing'
  | 'void_invoice'
  | 'manage_appointments'
  | 'reassign_appointment'
  | 'manage_queue'
  | 'start_visit_from_queue'
  | 'reorder_queue'
  | 'write_consultation'
  | 'order_lab_test'
  | 'write_prescription'
  | 'write_lab_result'

export interface Profile {
  id: string
  clinic_id: string
  full_name: string
  role: Role
  created_at: string
}
