'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// companyId 省略またはnullでグローバルスロットを操作
export async function getSlots(companyId?: string) {
  const supabase = await createClient()
  const query = supabase
    .from('available_slots')
    .select('*')
    .eq('is_active', true)
    .order('slot_date')
    .order('slot_time')

  const { data } = companyId
    ? await query.eq('company_id', companyId)
    : await query.is('company_id', null)

  return data || []
}

export async function addSlot(
  slot_date: string,
  slot_time: string,
  companyId?: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('available_slots')
    .insert({ slot_date, slot_time, company_id: companyId || null })

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
