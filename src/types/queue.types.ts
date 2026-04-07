export type QueueStatus =
  | 'checked_in'
  | 'waiting'
  | 'called'
  | 'in_progress'
  | 'completed'
  | 'no_show'

export interface QueueEntry {
  id: string
  clinic_id: string
  patient_id: string
  patient_name: string | null
  appointment_id: string | null
  visit_id: string | null
  status: QueueStatus
  queue_position: number | null
  entry_type: 'appointment' | 'walk_in'
  priority_override: number
  scheduled_at: string | null
  checked_in_at: string | null
  called_at: string | null
  in_progress_at: string | null
  completed_at: string | null
  no_show_at: string | null
  assigned_doctor_id: string | null
  created_at: string
}

export type AppointmentStatus = 'active' | 'cancelled' | 'completed' | 'affected'

export interface Appointment {
  id: string
  clinic_id: string
  patient_id: string
  doctor_id: string | null
  scheduled_at: string
  duration_minutes: number
  type: 'specialist' | 'general'
  notes: string
  status: AppointmentStatus
  created_at: string
}

export interface QueueStateAudit {
  id: string
  queue_entry_id: string
  previous_status: string | null
  new_status: string
  changed_by: string | null
  change_reason: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}
