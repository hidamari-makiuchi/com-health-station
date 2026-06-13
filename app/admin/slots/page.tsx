import { createClient } from '@/lib/supabase/server'
import { listCompanies } from '@/lib/actions/companies'
import SlotManager from '@/components/admin/SlotManager'
import CompanySelector from '@/components/admin/CompanySelector'

export const revalidate = 0

interface Props {
  searchParams: Promise<{ company?: string }>
}

export default async function AdminSlotsPage({ searchParams }: Props) {
  const { company: companyId } = await searchParams
  const supabase = await createClient()

  const companies = await listCompanies()
  const selectedId = companyId ?? companies[0]?.id

  let slots = null
  let isCustomMode = false

  if (selectedId) {
    const [slotsResult, settingsResult] = await Promise.all([
      supabase
        .from('available_slots')
        .select('*')
        .eq('company_id', selectedId)
        .eq('is_active', true)
        .order('slot_date')
        .order('slot_time'),
      supabase
        .from('system_settings')
        .select('slot_mode')
        .eq('company_id', selectedId)
        .maybeSingle(),
    ])
    slots = slotsResult.data || []
    isCustomMode = settingsResult.data?.slot_mode === 'custom'
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">スロット管理</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          予約可能な日時スロットを追加・削除します
        </p>
      </div>

      <CompanySelector
        companies={companies}
        selectedId={selectedId}
        basePath="/admin/slots"
      />

      {selectedId && !isCustomMode && (
        <div className="bg-muted/40 rounded-xl px-4 py-3 text-sm text-muted-foreground">
          この会社はカスタムモードではありません。
          <a href={`/admin/settings?company=${selectedId}`} className="underline ml-1">
            設定
          </a>
          でスロット管理モードを「カスタムモード」に変更してください。
        </div>
      )}

      {selectedId && isCustomMode && slots !== null && (
        <SlotManager initialSlots={slots} companyId={selectedId} />
      )}
    </div>
  )
}
