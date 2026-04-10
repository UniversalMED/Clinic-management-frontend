import { useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function Forbidden() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="rounded-full bg-destructive/10 p-5">
        <ShieldOff className="h-10 w-10 text-destructive" />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Access denied</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          You don't have permission to view this page. Contact your administrator
          if you believe this is a mistake.
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button onClick={() => navigate('/dashboard')}>
          Dashboard
        </Button>
      </div>
    </div>
  )
}
