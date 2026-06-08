'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server-admin'
import type { MyBooking } from '@/lib/types'

const BOOKING_IDS_COOKIE = 'booking_ids'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90 // 90日

export async function readBookingIds(): Promise<string[]> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(BOOKING_IDS_COOKIE)
  if (!cookie) return []
  try {
    const ids = JSON.parse(cookie.value)
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export async function appendBookingIdToCookie(id: string): Promise<void> {
  const cookieStore = await cookies()
  const ids = await readBookingIds()
  if (!ids.includes(id)) ids.push(id)
  cookieStore.set(BOOKING_IDS_COOKIE, JSON.stringify(ids), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function getMyBookings(): Promise<MyBooking[]> {
  const ids = await readBookingIds()
  if (ids.length === 0) return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('bookings')
    .select('id, slot_date, slot_time, user_name, status')
    .in('id', ids)
    .order('slot_date', { ascending: false })
    .order('slot_time', { ascending: false })

  return (data as MyBooking[]) || []
}

export async function cancelMyBooking(
  id: string
): Promise<{ success: true } | { error: string }> {
  const ids = await readBookingIds()
  if (!ids.includes(id)) {
    return { error: '予約情報が見つかりません' }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (error) return { error: 'キャンセルに失敗しました' }
  if (!data) return { error: 'キャンセルできません（すでに確定済みまたはキャンセル済みです）' }

  revalidatePath('/')
  revalidatePath('/admin/bookings')
  return { success: true }
}
