import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addLineItem,
  createInvoice,
  finalizeInvoice,
  getInvoice,
  listInvoices,
  listPayments,
  pay,
  payCash,
  removeLineItem,
  voidInvoice,
  type AddLineItemPayload,
  type CreateInvoicePayload,
  type FinalizeInvoicePayload,
  type PayPayload,
  type VoidInvoicePayload,
} from '@/api/billing'
import { queryKeys } from '@/utils/queryKeys'

export function useInvoices(params?: {
  page?: number
  page_size?: number
  visit_id?: string
  patient_id?: string
  status?: string
  finalized_at_date?: string
}) {
  return useQuery({
    queryKey: queryKeys.invoices.list(params ?? {}),
    queryFn: () => listInvoices(params),
  })
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id ?? ''),
    queryFn: () => getInvoice(id!),
    enabled: Boolean(id),
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateInvoicePayload) => createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all })
    },
  })
}

export function useAddLineItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: string
      data: AddLineItemPayload
    }) => addLineItem(invoiceId, data),
    onSuccess: (_data, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.detail(invoiceId),
      })
    },
  })
}

export function useRemoveLineItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      invoiceId,
      itemId,
    }: {
      invoiceId: string
      itemId: string
    }) => removeLineItem(invoiceId, itemId),
    onSuccess: (_data, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.detail(invoiceId),
      })
    },
  })
}

export function useFinalizeInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: string
      data: FinalizeInvoicePayload
    }) => finalizeInvoice(invoiceId, data),
    onSuccess: (_data, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.detail(invoiceId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.labOrders.all })
    },
  })
}

export function useVoidInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: string
      data: VoidInvoicePayload
    }) => voidInvoice(invoiceId, data),
    onSuccess: (_data, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.detail(invoiceId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.labOrders.all })
    },
  })
}

export function useInitiatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: string
      data: PayPayload
    }) => pay(invoiceId, data),
    onSuccess: (_data, { invoiceId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.all,
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.detail(invoiceId),
      })
    },
  })
}

export function useCashPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invoiceId: string) => payCash(invoiceId),
    onSuccess: (_data, invoiceId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.list(invoiceId, {}),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.detail(invoiceId),
      })
    },
  })
}

export function usePayments(
  invoiceId: string | undefined,
  params?: { page?: number; page_size?: number },
) {
  return useQuery({
    queryKey: queryKeys.payments.list(invoiceId ?? '', params ?? {}),
    queryFn: () => listPayments(invoiceId!, params),
    enabled: Boolean(invoiceId),
  })
}
