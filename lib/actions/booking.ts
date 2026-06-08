'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { BookingFormData, BookingStatus } from '@/lib/types'
import { appendBookingIdToCookie } from '@/lib/actions/my-bookings'

export async function getSettings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('system_settings')
    .select('*')
    .single()
  return data
}

export async function getAvailableTimesForDate(
  date: string,
  excludeBookingId?: string
): Promise<string[]> {
  const supabase = await createClient()

  const [settingsResult, bookedResult] = await Promise.all([
    supabase.from('system_settings').select('slot_mode, fixed_times').single(),
    supabase
      .from('bookings')
      .select('slot_time, id')
      .eq('slot_date', date)
      .neq('status', 'cancelled'),
  ])

  const bookedTimes = new Set(
    (bookedResult.data || [])
      .filter((b) => b.id !== excludeBookingId)
      .map((b) => b.slot_time.substring(0, 5))
  )

  if (settingsResult.data?.slot_mode === 'fixed') {
    return (settingsResult.data.fixed_times || [])
      .filter((t: string) => !bookedTimes.has(t))
      .sort()
  }

  const { data: slots } = await supabase
    .from('available_slots')
    .select('slot_time')
    .eq('slot_date', date)
    .eq('is_active', true)

  return (slots || [])
    .map((s) => s.slot_time.substring(0, 5))
    .filter((t) => !bookedTimes.has(t))
    .sort()
}

export async function createBooking(
  data: BookingFormData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('slot_date', data.slot_date)
    .eq('slot_time', data.slot_time)
    .neq('status', 'cancelled')
    .maybeSingle()

  if (existing) {
    return { error: 'この時間帯はすでに予約済みです。別の時間をお選びください。' }
  }

  const { data: inserted, error } = await supabase
    .from('bookings')
    .insert(data)
    .select('id')
    .single()

  if (error || !inserted) {
    return { error: '予約の送信に失敗しました。時間をおいて再度お試しください。' }
  }

  await appendBookingIdToCookie(inserted.id)
  return { success: true }
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)

  if (error) return { error: 'ステータスの更新に失敗しました' }

  revalidatePath('/admin/bookings')
  return { success: true }
}

export async function updateBookingDateTime(
  id: string,
  slot_date: string,
  slot_time: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  // 仮予約のみ変更可
  const { data: booking } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', id)
    .single()

  if (!booking || booking.status !== 'pending') {
    return { error: '仮予約のみ日時を変更できます' }
  }

  // 重複チェック（自分自身を除く）
  const { data: conflict } = await supabase
    .from('bookings')
    .select('id')
    .eq('slot_date', slot_date)
    .eq('slot_time', slot_time)
    .neq('status', 'cancelled')
    .neq('id', id)
    .maybeSingle()

  if (conflict) {
    return { error: 'その日時はすでに予約が入っています' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ slot_date, slot_time })
    .eq('id', id)

  if (error) return { error: '日時の更新に失敗しました' }

  revalidatePath('/admin/bookings')
  return { success: true }
}

export async function updateBookingNotes(
  id: string,
  notes: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('bookings')
    .update({ notes })
    .eq('id', id)

  if (error) return { error: 'メモの更新に失敗しました' }

  revalidatePath('/admin/bookings')
  return { success: true }
}
