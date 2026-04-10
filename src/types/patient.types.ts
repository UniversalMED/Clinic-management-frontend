export interface Patient {
  id: string
  clinic_id: string
  full_name: string
  gender: 'male' | 'female' | null
  date_of_birth: string
  phone: string
  created_at: string
}

export type VisitStatus = 'open' | 'in_progress' | 'completed'

export interface Visit {
  id: string
  clinic_id: string
  patient_id: string
  created_by: string
  assigned_doctor_id: string | null
  status: VisitStatus
  created_at: string
}

export interface Prescription {
  id: string
  consultation_id: string
  prescribed_by: string
  notes: string
  items: PrescriptionItem[]
  created_at: string
}

export interface PrescriptionItem {
  id: string
  medication: string
  dosage: string
  frequency: string
  duration: string | null
  instructions: string | null
  created_at: string
}

export interface Consultation {
  id: string
  visit_id: string
  doctor_id: string
  symptoms: string
  diagnosis: string
  notes: string
  created_at: string
}
