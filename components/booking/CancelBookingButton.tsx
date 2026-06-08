'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cancelMyBooking } from '@/lib/actions/my-bookings'
import { cn } from '@/lib/utils'

export default function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmed, setConfirmed] = useState(false)

  const handleClick = () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    startTransition(async () => {
      const result = await cancelMyBooking(bookingId)
      if ('error' in result) {
        toast.error(result.error)
        setConfirmed(false)
      } else {
        toast.success('予約をキャンセルしました')
        router.refresh()
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'w-full h-10 text-sm font-medium rounded-lg border transition-all',
        confirmed
          ? 'border-destructive text-destructive hover:bg-destructive/10'
          : 'border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive'
      )}
    >
      {isPending
        ? 'キャンセル中...'
        : confirmed
          ? 'もう一度タップで確定'
          : '予約をキャンセルする'}
    </button>
  )
}
