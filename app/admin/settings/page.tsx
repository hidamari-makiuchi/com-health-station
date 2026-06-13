import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { listCompanies } from '@/lib/actions/companies'
import SettingsForm from '@/components/admin/SettingsForm'
import {
  CreateCompanySettingsButton,
  DeleteCompanySettingsButton,
} from '@/components/admin/CompanySettingsActions'
import { ChevronLeft } from 'lucide-react'

export const revalidate = 0

interface Props {
  searchParams: Promise<{ company?: string }>
}

export default async function AdminSettingsPage({ searchParams }: Props) {
  const { company: companyId } = await searchParams
  const supabase = await createClient()

  if (companyId) {
    // 会社別設定の表示・編集
    const [companiesResult, settingsResult] = await Promise.all([
      listCompanies(),
      supabase
        .from('system_settings')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle(),
    ])

    const company = companiesResult.find((c) => c.id === companyId)
    const settings = settingsResult.data

    return (
      <div>
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          グローバル設定に戻る
        </Link>

        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{company?.name ?? '会社'} の設定</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {settings ? 'この会社専用の設定を使用しています' : 'グローバル設定を使用中'}
            </p>
          </div>
          {settings ? (
            <DeleteCompanySettingsButton settingsId={settings.id} />
          ) : (
            <CreateCompanySettingsButton companyId={companyId} />
          )}
        </div>

        {settings ? (
          <SettingsForm settings={settings} />
        ) : (
          <div className="bg-muted/40 rounded-xl px-4 py-6 text-center text-sm text-muted-foreground">
            現在グローバル設定を適用しています。「カスタマイズする」を押すと、この会社専用の設定を作成できます。
          </div>
        )}
      </div>
    )
  }

  // グローバル設定の表示・編集
  const [globalResult, companies, overridesResult] = await Promise.all([
    supabase.from('system_settings').select('*').is('company_id', null).maybeSingle(),
    listCompanies(),
    supabase.from('system_settings').select('company_id').not('company_id', 'is', null),
  ])

  const globalSettings = globalResult.data
  const overrideCompanyIds = new Set((overridesResult.data ?? []).map((r) => r.company_id))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">設定</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          全会社に適用されるデフォルト設定です
        </p>
      </div>

      {globalSettings ? (
        <SettingsForm settings={globalSettings} />
      ) : (
        <p className="text-sm text-muted-foreground">グローバル設定が見つかりません。</p>
      )}

      {companies.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border">
          <h2 className="font-semibold text-sm mb-1">会社別カスタマイズ</h2>
          <p className="text-xs text-muted-foreground mb-4">
            会社ごとにグローバル設定を上書きできます
          </p>
          <div className="space-y-2">
            {companies.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {overrideCompanyIds.has(c.id) ? '会社別設定あり' : 'グローバル設定を使用'}
                  </p>
                </div>
                <Link
                  href={`/admin/settings?company=${c.id}`}
                  className="text-xs text-primary hover:underline"
                >
                  {overrideCompanyIds.has(c.id) ? '編集' : '設定する'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
