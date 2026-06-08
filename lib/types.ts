export type SlotMode = 'fixed' | 'custom'
export type ContactType = 'phone' | 'email'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending:   { label: '仮予約',   color: 'text-amber-600',  badgeVariant: 'outline' },
  confirmed: { label: '確定',     color: 'text-blue-600',   badgeVariant: 'default' },
  cancelled: { label: 'キャンセル', color: 'text-red-500',    badgeVariant: 'destructive' },
  completed: { label: '相談済',   color: 'text-green-600',  badgeVariant: 'secondary' },
  no_show:   { label: '無断欠席', color: 'text-gray-400',   badgeVariant: 'outline' },
}

export interface SystemSettings {
  id: string
  advance_days: number
  slot_mode: SlotMode
  fixed_times: string[]
  fixed_days: number[]   // 0=日, 1=月, ..., 6=土
  updated_at: string
}

export interface AvailableSlot {
  id: string
  slot_date: string
  slot_time: string
  is_active: boolean
  created_at: string
}

export interface Booking {
  id: string
  slot_date: string
  slot_time: string
  user_name: string
  contact: string
  contact_type: ContactType
  status: BookingStatus
  notes: string | null
  created_at: string
}

export interface BookingFormData {
  slot_date: string
  slot_time: string
  user_name: string
  contact: string
  contact_type: ContactType
}
