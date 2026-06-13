'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import type { Company } from '@/lib/types'

export async function getCompanyByToken(token: string): Promise<Company | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('companies')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .maybeSingle()
  return data
}

export async function listCompanies(): Promise<Company[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('companies')
    .select('*')
    .order('created_at')
  return data || []
}

export async function createCompany(
  name: string
): Promise<{ success: true; company: Company } | { error: string }> {
  const supabase = await createClient()
  const token = randomBytes(16).toString('hex')

  const { data, error } = await supabase
    .from('companies')
    .insert({ name, token })
    .select()
    .single()

  if (error) return { error: '会社の作成に失敗しました' }

  // デフォルト設定を作成
  await supabase.from('system_settings').insert({
    company_id: data.id,
    advance_days: 5,
    slot_mode: 'fixed',
    fixed_times: ['10:00', '11:00', '14:00', '15:00'],
    fixed_days: [1, 2, 3, 4, 5],
    weekly_times: {},
  })

  revalidatePath('/admin/companies')
  return { success: true, company: data }
}

export async function regenerateToken(
  companyId: string
): Promise<{ success: true; token: string } | { error: string }> {
  const supabase = await createClient()
  const token = randomBytes(16).toString('hex')

  const { error } = await supabase
    .from('companies')
    .update({ token })
    .eq('id', companyId)

  if (error) return { error: 'トークンの再発行に失敗しました' }

  revalidatePath('/admin/companies')
  return { success: true, token }
}

export async function updateCompanyActive(
  companyId: string,
  is_active: boolean
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('companies')
    .update({ is_active })
    .eq('id', companyId)

  if (error) return { error: '更新に失敗しました' }

  revalidatePath('/admin/companies')
  return { success: true }
}
