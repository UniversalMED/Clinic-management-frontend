import { useEffect, useRef } from 'react'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import { Toaster } from '@/components/ui/sonner'
import { initAuth } from '@/lib/initAuth'

import { router } from './router'

const queryClient = new QueryClient()

/** Runs the one-time session check before any protected route can render. */
function AuthInitializer() {
  const qc = useQueryClient()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    initAuth(qc)
  }, [qc])

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  )
}
