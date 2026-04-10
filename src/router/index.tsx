import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import Audit from '@/pages/Audit'
import Billing from '@/pages/Billing'
import Dashboard from '@/pages/Dashboard'
import Forbidden from '@/pages/Forbidden'
import InvoiceDetail from '@/pages/InvoiceDetail'
import Lab from '@/pages/Lab'
import LabOrderDetail from '@/pages/LabOrderDetail'
import Login from '@/pages/Login'
import PatientDetail from '@/pages/PatientDetail'
import Patients from '@/pages/Patients'
import Queue from '@/pages/Queue'
import Users from '@/pages/Users'
import VisitDetail from '@/pages/VisitDetail'
import Visits from '@/pages/Visits'

import { PageGuard } from './PageGuard'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/403', element: <Forbidden /> },

  {
    path: '/',
    // Layer 1 — authentication only
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },

          // ── Open to all authenticated users ──────────────────────────────
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'patients', element: <Patients /> },
          { path: 'patients/:patientId', element: <PatientDetail /> },
          { path: 'visits', element: <Visits /> },
          { path: 'visits/:visitId', element: <VisitDetail /> },

          // ── Queue — manage_queue OR start_visit_from_queue ────────────────
          {
            path: 'queue',
            element: (
              <PageGuard permissions={['manage_queue', 'start_visit_from_queue']}>
                <Queue />
              </PageGuard>
            ),
          },

          // ── Lab — any lab permission ──────────────────────────────────────
          {
            path: 'lab',
            element: (
              <PageGuard permissions={['order_lab_test', 'process_lab_order', 'write_lab_result', 'manage_lab_catalogue']}>
                <Lab />
              </PageGuard>
            ),
          },
          {
            path: 'lab/orders/:orderId',
            element: (
              <PageGuard permissions={['order_lab_test', 'process_lab_order', 'write_lab_result', 'manage_lab_catalogue']}>
                <LabOrderDetail />
              </PageGuard>
            ),
          },

          // ── Billing — super_admin and admin only ──────────────────────────
          {
            path: 'billing',
            element: (
              <PageGuard permissions={['view_billing']}>
                <Billing />
              </PageGuard>
            ),
          },
          {
            path: 'billing/invoices/:invoiceId',
            element: (
              <PageGuard permissions={['view_billing']}>
                <InvoiceDetail />
              </PageGuard>
            ),
          },

          // ── Admin — manage_users ──────────────────────────────────────────
          {
            path: 'users',
            element: (
              <PageGuard permissions={['manage_users']}>
                <Users />
              </PageGuard>
            ),
          },

          // ── Admin — view_audit_log ────────────────────────────────────────
          {
            path: 'audit',
            element: (
              <PageGuard permissions={['view_audit_log']}>
                <Audit />
              </PageGuard>
            ),
          },
        ],
      },
    ],
  },
])
