import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/admin/SettingsForm'

export const revalidate = 0

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('system_settings')
    .select('*')
    .single()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">設定</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          予約受付の設定を変更します
        </p>
      </div>
      {settings && <SettingsForm settings={settings} />}
    </div>
  )
}
