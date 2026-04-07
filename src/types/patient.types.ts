export interface Patient {
  id: string
  clinic_id: string
  full_name: string
  gender: 'M' | 'F' | 'other'
  date_of_birth: string
  phone: string
  created_at: string
}

export interface Visit {
  id: string
  clinic_id: string
  patient_id: string
  created_by: string
  assigned_doctor_id: string | null
  status: 'open' | 'closed'
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
