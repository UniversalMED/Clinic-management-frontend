export type TestOrderStatus =
  | 'awaiting_payment'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface LabTest {
  id: string
  clinic_id: string
  name: string
  description: string
  price: string
  is_active: boolean
  created_by: string
  created_at: string
}

export interface TestOrder {
  id: string
  visit_id: string
  consultation_id: string | null
  test_id: string
  test_name: string | null
  ordered_by: string
  assigned_to: string | null
  status: TestOrderStatus
  is_billable: boolean
  price_at_order_time: string
  billed_invoice_id: string | null
  created_at: string
}

export interface TestResult {
  id: string
  test_order_id: string
  technician_id: string
  result_data: Record<string, unknown>
  remarks: string
  created_at: string
}
