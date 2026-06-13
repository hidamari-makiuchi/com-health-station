import { createClient } from '@/lib/supabase/server'
import { listCompanies } from '@/lib/actions/companies'
import SettingsForm from '@/components/admin/SettingsForm'
import CompanySelector from '@/components/admin/CompanySelector'

export const revalidate = 0

interface Props {
  searchParams: Promise<{ company?: string }>
}

export default async function AdminSettingsPage({ searchParams }: Props) {
  const { company: companyId } = await searchParams
  const supabase = await createClient()

  const companies = await listCompanies()
  const selectedId = companyId ?? companies[0]?.id

  let settings = null
  if (selectedId) {
    const { data } = await supabase
      .from('system_settings')
      .select('*')
      .eq('company_id', selectedId)
      .maybeSingle()
    settings = data
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">設定</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          予約受付の設定を変更します
        </p>
      </div>

      <CompanySelector
        companies={companies}
        selectedId={selectedId}
        basePath="/admin/settings"
      />

      {selectedId && settings ? (
        <SettingsForm settings={settings} />
      ) : selectedId ? (
        <p className="text-sm text-muted-foreground">この会社の設定が見つかりません。</p>
      ) : null}
    </div>
  )
}
