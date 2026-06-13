'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { revalidatePath } from 'next/cache'
import type { SlotMode } from '@/lib/types'

export async function updateSettings(
  settingsId: string,
  settings: {
    advance_days: number
    slot_mode: SlotMode
    fixed_times: string[]
    fixed_days: number[]
    weekly_times: Record<string, string[]>
  }
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('system_settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('id', settingsId)

  if (error) return { error: '設定の更新に失敗しました' }

  revalidatePath('/', 'layout')
  return { success: true }
}

// グローバル設定を複製して会社固有の設定を作成
export async function createCompanySettings(
  companyId: string
): Promise<{ success: true } | { error: string }> {
  const adminSupabase = createAdminClient()

  const { data: global } = await adminSupabase
    .from('system_settings')
    .select('*')
    .is('company_id', null)
    .maybeSingle()

  const { error } = await adminSupabase.from('system_settings').insert({
    company_id: companyId,
    advance_days:  global?.advance_days  ?? 5,
    slot_mode:     global?.slot_mode     ?? 'fixed',
    fixed_times:   global?.fixed_times   ?? ['10:00', '11:00', '14:00', '15:00'],
    fixed_days:    global?.fixed_days    ?? [1, 2, 3, 4, 5],
    weekly_times:  global?.weekly_times  ?? {},
  })

  if (error) return { error: '会社別設定の作成に失敗しました' }

  revalidatePath('/admin/settings')
  return { success: true }
}

// 会社固有の設定を削除（グローバルに戻す）
export async function deleteCompanySettings(
  settingsId: string
): Promise<{ success: true } | { error: string }> {
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('system_settings')
    .delete()
    .eq('id', settingsId)

  if (error) return { error: '会社別設定の削除に失敗しました' }

  revalidatePath('/admin/settings')
  return { success: true }
}
