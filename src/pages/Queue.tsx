import { QueueBoard } from '@/components/queue/QueueBoard'
import { CheckInForm } from '@/components/queue/CheckInForm'

export default function Queue() {
  return (
    <div className="flex h-full gap-6">
      {/* Left — live queue board */}
      <div className="min-w-0 flex-1">
        <QueueBoard />
      </div>

      {/* Right — check-in panel */}
      <aside className="w-80 shrink-0 space-y-4">
        <CheckInForm />
      </aside>
    </div>
  )
}
