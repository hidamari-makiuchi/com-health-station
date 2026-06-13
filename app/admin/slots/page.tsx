import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { listCompanies } from '@/lib/actions/companies'
import SlotManager from '@/components/admin/SlotManager'
import { ChevronLeft } from 'lucide-react'

export const revalidate = 0

interface Props {
  searchParams: Promise<{ company?: string }>
}

export default async function AdminSlotsPage({ searchParams }: Props) {
  const { company: companyId } = await searchParams
  const supabase = await createClient()

  if (companyId) {
    // 会社別スロット
    const [companiesResult, slotsResult, settingsResult] = await Promise.all([
      listCompanies(),
      supabase
        .from('available_slots')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('slot_date')
        .order('slot_time'),
      supabase
        .from('system_settings')
        .select('slot_mode')
        .eq('company_id', companyId)
        .maybeSingle(),
    ])

    const company = companiesResult.find((c) => c.id === companyId)
    const isCustomMode = settingsResult.data?.slot_mode === 'custom'

    return (
      <div>
        <Link
          href="/admin/slots"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          グローバルスロットに戻る
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold">{company?.name ?? '会社'} のスロット</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            この会社専用の予約スロットを管理します
          </p>
        </div>

        {!isCustomMode ? (
          <div className="bg-muted/40 rounded-xl px-4 py-3 text-sm text-muted-foreground">
            この会社の設定はカスタムモードではありません。
            <Link href={`/admin/settings?company=${companyId}`} className="underline ml-1">
              会社別設定
            </Link>
            でスロット管理モードを「カスタムモード」に変更してください。
          </div>
        ) : (
          <SlotManager initialSlots={slotsResult.data || []} companyId={companyId} />
        )}
      </div>
    )
  }

  // グローバルスロット
  const [globalSettingsResult, slotsResult, companies] = await Promise.all([
    supabase.from('system_settings').select('slot_mode').is('company_id', null).maybeSingle(),
    supabase
      .from('available_slots')
      .select('*')
      .is('company_id', null)
      .eq('is_active', true)
      .order('slot_date')
      .order('slot_time'),
    listCompanies(),
  ])

  const isCustomMode = globalSettingsResult.data?.slot_mode === 'custom'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">スロット管理</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          全会社に適用されるデフォルトのスロットです
        </p>
      </div>

      {!isCustomMode ? (
        <div className="bg-muted/40 rounded-xl px-4 py-3 text-sm text-muted-foreground">
          グローバル設定がカスタムモードではありません。
          <Link href="/admin/settings" className="underline ml-1">
            設定
          </Link>
          でスロット管理モードを「カスタムモード」に変更してください。
        </div>
      ) : (
        <SlotManager initialSlots={slotsResult.data || []} />
      )}

      {companies.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border">
          <h2 className="font-semibold text-sm mb-1">会社別スロット</h2>
          <p className="text-xs text-muted-foreground mb-4">
            会社ごとに独立したスロットを管理できます
          </p>
          <div className="space-y-2">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`/admin/slots?company=${c.id}`}
                className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/40 transition-colors"
              >
                <p className="text-sm font-medium">{c.name}</p>
                <span className="text-xs text-primary">管理する →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
