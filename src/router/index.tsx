import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import Audit from '@/pages/Audit'
import Billing from '@/pages/Billing'
import Dashboard from '@/pages/Dashboard'
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

import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'patients', element: <Patients /> },
          { path: 'patients/:patientId', element: <PatientDetail /> },
          { path: 'visits', element: <Visits /> },
          { path: 'visits/:visitId', element: <VisitDetail /> },
          { path: 'queue', element: <Queue /> },
          { path: 'lab', element: <Lab /> },
          { path: 'lab/orders/:orderId', element: <LabOrderDetail /> },
          { path: 'billing', element: <Billing /> },
          { path: 'billing/invoices/:invoiceId', element: <InvoiceDetail /> },
          { path: 'users', element: <Users /> },
          { path: 'audit', element: <Audit /> },
        ],
      },
    ],
  },
])
