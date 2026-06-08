import { createClient } from '@/lib/supabase/server'
import BookingTable from '@/components/admin/BookingTable'

export const revalidate = 0

export default async function AdminBookingsPage() {
  const supabase = await createClient()
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .order('slot_date', { ascending: false })
    .order('slot_time', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">予約一覧</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          申し込まれた相談予約の一覧です
        </p>
      </div>
      <BookingTable bookings={bookings || []} />
    </div>
  )
}
