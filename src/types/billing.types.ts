export type InvoiceStatus = 'draft' | 'finalized' | 'void'

export interface InvoiceLineItem {
  id: string
  invoice_id: string
  test_order_id: string | null
  test_name: string
  unit_price: string
  quantity: number
  subtotal: string
  notes: string
  created_at: string
}

export interface Invoice {
  id: string
  clinic_id: string
  visit_id: string
  patient_id: string
  issued_by: string
  finalized_by: string | null
  voided_by: string | null
  status: InvoiceStatus
  subtotal: string
  discount_amount: string
  total_amount: string
  notes: string
  finalized_at: string | null
  voided_at: string | null
  void_reason: string | null
  created_at: string
  line_items?: InvoiceLineItem[]
}

export type PaymentStatus = 'pending' | 'success' | 'failed'

export interface Payment {
  id: string
  clinic_id: string
  invoice_id: string
  tx_ref: string
  amount: string
  currency: string
  status: PaymentStatus
  method: 'chapa' | 'cash'
  chapa_ref: string
  mode: string
  paid_at: string | null
  created_at: string
}
