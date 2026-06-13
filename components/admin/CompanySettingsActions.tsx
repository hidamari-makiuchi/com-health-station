'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createCompanySettings, deleteCompanySettings } from '@/lib/actions/settings'

interface CreateProps {
  companyId: string
}

export function CreateCompanySettingsButton({ companyId }: CreateProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handle = () => {
    startTransition(async () => {
      const result = await createCompanySettings(companyId)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('会社別設定を作成しました')
      router.push(`/admin/settings?company=${companyId}`)
    })
  }

  return (
    <Button onClick={handle} disabled={isPending} size="sm">
      {isPending ? '作成中...' : 'カスタマイズする'}
    </Button>
  )
}

interface DeleteProps {
  settingsId: string
}

export function DeleteCompanySettingsButton({ settingsId }: DeleteProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handle = () => {
    if (!confirm('会社別設定を削除してグローバル設定に戻しますか？')) return
    startTransition(async () => {
      const result = await deleteCompanySettings(settingsId)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('グローバル設定に戻しました')
      router.push('/admin/settings')
    })
  }

  return (
    <Button onClick={handle} disabled={isPending} size="sm" variant="outline">
      {isPending ? '削除中...' : 'グローバル設定に戻す'}
    </Button>
  )
}
