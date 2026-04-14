import type { PaginatedResponse } from '@/types/api.types'
import type { Invoice, InvoiceLineItem, Payment } from '@/types/billing.types'

import client from './client'

export type CreateInvoicePayload = {
  visit_id: string
  notes?: string
}

export type AddLineItemPayload = {
  test_order_id?: string
  test_name?: string
  unit_price?: string
  quantity?: number
  notes?: string
}

export type FinalizeInvoicePayload = {
  discount_amount?: string
  notes?: string
}

export type VoidInvoicePayload = {
  void_reason: string
}

export type PayPayload = {
  callback_url?: string
  return_url?: string
}

export type PayInvoiceResponse = {
  payment: Payment
  checkout_url: string
  qr_code: string
}

export const listInvoices = (params?: {
  page?: number
  page_size?: number
  visit_id?: string
  patient_id?: string
  status?: string
  finalized_at_date?: string
}) =>
  client
    .get<PaginatedResponse<Invoice>>('/api/billing/invoices/', { params })
    .then((r) => r.data)

export const getInvoice = (id: string) =>
  client.get<Invoice>(`/api/billing/invoices/${id}/`).then((r) => r.data)

export const createInvoice = (data: CreateInvoicePayload) =>
  client.post<Invoice>('/api/billing/invoices/', data).then((r) => r.data)

export const addLineItem = (invoiceId: string, data: AddLineItemPayload) =>
  client
    .post<InvoiceLineItem>(`/api/billing/invoices/${invoiceId}/items/`, data)
    .then((r) => r.data)

export const removeLineItem = (invoiceId: string, itemId: string) =>
  client
    .delete(`/api/billing/invoices/${invoiceId}/items/${itemId}/`)
    .then((r) => r.data)

export const finalizeInvoice = (
  invoiceId: string,
  data: FinalizeInvoicePayload,
) =>
  client
    .post<Invoice>(`/api/billing/invoices/${invoiceId}/finalize/`, data)
    .then((r) => r.data)

export const voidInvoice = (invoiceId: string, data: VoidInvoicePayload) =>
  client
    .post<Invoice>(`/api/billing/invoices/${invoiceId}/void/`, data)
    .then((r) => r.data)

export const pay = (invoiceId: string, data: PayPayload) =>
  client
    .post<PayInvoiceResponse>(`/api/billing/invoices/${invoiceId}/pay/`, data)
    .then((r) => r.data)

export const payCash = (invoiceId: string) =>
  client
    .post<Payment>(`/api/billing/invoices/${invoiceId}/pay-cash/`, {})
    .then((r) => r.data)

export type QuickPayCashResponse = {
  invoice: Invoice
  payment: Payment
}

export const quickPayCash = (visitId: string) =>
  client
    .post<QuickPayCashResponse>('/api/billing/invoices/quick-pay-cash/', { visit_id: visitId })
    .then((r) => r.data)

export const listPayments = (
  invoiceId: string,
  params?: { page?: number; page_size?: number },
) =>
  client
    .get<PaginatedResponse<Payment>>(
      `/api/billing/invoices/${invoiceId}/payments/`,
      { params },
    )
    .then((r) => r.data)
