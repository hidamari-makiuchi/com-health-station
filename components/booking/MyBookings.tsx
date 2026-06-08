import { getMyBookings } from '@/lib/actions/my-bookings'
import { BOOKING_STATUS_CONFIG } from '@/lib/types'
import { formatJP } from '@/lib/date-utils'
import CancelBookingButton from './CancelBookingButton'

export default async function MyBookings() {
  const bookings = await getMyBookings()
  if (bookings.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-foreground mb-3">あなたの予約</h2>
      <div className="space-y-3">
        {bookings.map((booking) => {
          const config = BOOKING_STATUS_CONFIG[booking.status]
          const isPending = booking.status === 'pending'
          return (
            <div key={booking.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatJP(booking.slot_date)}{' '}
                    {booking.slot_time.substring(0, 5)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{booking.user_name}</p>
                </div>
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full bg-secondary ${config.color}`}
                >
                  {config.label}
                </span>
              </div>
              {isPending && (
                <div className="mt-3 pt-3 border-t border-border">
                  <CancelBookingButton bookingId={booking.id} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
