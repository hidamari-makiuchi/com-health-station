'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SlotMode } from '@/lib/types'

export async function updateSettings(settings: {
  advance_days: number
  slot_mode: SlotMode
  fixed_times: string[]
  fixed_days: number[]
  weekly_times: Record<string, string[]>
}): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  const { data: row } = await supabase
    .from('system_settings')
    .select('id')
    .single()

  if (!row) return { error: '設定が見つかりません' }

  const { error } = await supabase
    .from('system_settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('id', row.id)

  if (error) return { error: '設定の更新に失敗しました' }

  revalidatePath('/', 'layout')
  return { success: true }
}
