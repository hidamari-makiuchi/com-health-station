'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSlots() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('available_slots')
    .select('*')
    .eq('is_active', true)
    .order('slot_date')
    .order('slot_time')
  return data || []
}

export async function addSlot(
  slot_date: string,
  slot_time: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('available_slots')
    .insert({ slot_date, slot_time })

  if (error) {
    if (error.code === '23505') return { error: 'そのスロットはすでに登録されています' }
    return { error: 'スロットの追加に失敗しました' }
  }

  revalidatePath('/admin/slots')
  return { success: true }
}

export async function deleteSlot(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('available_slots')
    .delete()
    .eq('id', id)

  if (error) return { error: 'スロットの削除に失敗しました' }

  revalidatePath('/admin/slots')
  return { success: true }
}
