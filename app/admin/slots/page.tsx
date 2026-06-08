import { createClient } from '@/lib/supabase/server'
import SlotManager from '@/components/admin/SlotManager'
import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function AdminSlotsPage() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('system_settings')
    .select('slot_mode')
    .single()

  if (settings?.slot_mode !== 'custom') {
    redirect('/admin/settings')
  }

  const { data: slots } = await supabase
    .from('available_slots')
    .select('*')
    .eq('is_active', true)
    .order('slot_date')
    .order('slot_time')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">スロット管理</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          予約可能な日時スロットを追加・削除します
        </p>
      </div>
      <SlotManager initialSlots={slots || []} />
    </div>
  )
}
