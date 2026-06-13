'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { revalidatePath } from 'next/cache'
import type { BookingFormData, BookingStatus } from '@/lib/types'
import { appendBookingIdToCookie } from '@/lib/actions/my-bookings'
import { notifyBookingCreated, notifyStatusChanged } from '@/lib/lineworks'

export async function getSettings(companyId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('system_settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle()
  return data
}

export async function getAvailableTimesForDate(
  date: string,
  companyId?: string,
  excludeBookingId?: string
): Promise<string[]> {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const settingsQuery = supabase
    .from('system_settings')
    .select('slot_mode, fixed_times, weekly_times')

  const [settingsResult, bookedResult] = await Promise.all([
    companyId
      ? settingsQuery.eq('company_id', companyId).maybeSingle()
      : settingsQuery.is('company_id', null).maybeSingle(),
    adminSupabase
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

  const mode = settingsResult.data?.slot_mode

  if (mode === 'fixed') {
    return (settingsResult.data?.fixed_times || [])
      .filter((t: string) => !bookedTimes.has(t))
      .sort()
  }

  if (mode === 'weekly') {
    const [y, m, d] = date.split('-').map(Number)
    const dow = new Date(y, m - 1, d).getDay()
    const times: string[] = (settingsResult.data?.weekly_times ?? {})[String(dow)] ?? []
    return times.filter((t) => !bookedTimes.has(t)).sort()
  }

  const slotsQuery = supabase
    .from('available_slots')
    .select('slot_time')
    .eq('slot_date', date)
    .eq('is_active', true)

  const { data: slots } = companyId
    ? await slotsQuery.eq('company_id', companyId)
    : await slotsQuery.is('company_id', null)

  return (slots || [])
    .map((s) => s.slot_time.substring(0, 5))
    .filter((t) => !bookedTimes.has(t))
    .sort()
}

export async function createBooking(
  data: BookingFormData,
  companyId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const { data: existing } = await adminSupabase
    .from('bookings')
    .select('id')
    .eq('slot_date', data.slot_date)
    .eq('slot_time', data.slot_time)
    .neq('status', 'cancelled')
    .maybeSingle()

  if (existing) {
    return { error: 'この時間帯はすでに予約済みです。別の時間をお選びください。' }
  }

  const id = crypto.randomUUID()
  const { error } = await supabase.from('bookings').insert({ ...data, id, company_id: companyId })
  if (error) {
    return { error: '予約の送信に失敗しました。時間をおいて再度お試しください。' }
  }

  await appendBookingIdToCookie(id)
  await notifyBookingCreated({ slot_date: data.slot_date, slot_time: data.slot_time, user_name: data.user_name })
  return { success: true }
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select('slot_date, slot_time, user_name')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)

  if (error) return { error: 'ステータスの更新に失敗しました' }

  revalidatePath('/admin/bookings')
  if (booking) {
    await notifyStatusChanged({ ...booking, status })
  }
  return { success: true }
}

export async function updateBookingDateTime(
  id: string,
  slot_date: string,
  slot_time: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', id)
    .single()

  if (!booking || booking.status !== 'pending') {
    return { error: '仮予約のみ日時を変更できます' }
  }

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

export async function createAdminBooking(
  data: BookingFormData & { notes?: string; company_id?: string | null }
): Promise<{ success: true } | { error: string }> {
  const adminSupabase = createAdminClient()

  const { data: existing } = await adminSupabase
    .from('bookings')
    .select('id')
    .eq('slot_date', data.slot_date)
    .eq('slot_time', data.slot_time)
    .neq('status', 'cancelled')
    .maybeSingle()

  if (existing) {
    return { error: 'この時間帯はすでに予約済みです。別の時間をお選びください。' }
  }

  const id = crypto.randomUUID()
  const { error } = await adminSupabase.from('bookings').insert({
    id,
    ...data,
    status: 'confirmed',
    notes: data.notes || null,
  })

  if (error) return { error: '予約の登録に失敗しました。' }

  revalidatePath('/admin/bookings')
  await notifyBookingCreated({ slot_date: data.slot_date, slot_time: data.slot_time, user_name: data.user_name })
  return { success: true }
}
