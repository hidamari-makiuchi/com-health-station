'use client'

import { useRouter } from 'next/navigation'
import type { Company } from '@/lib/types'

interface Props {
  companies: Company[]
  selectedId: string | undefined
  basePath: string
}

export default function CompanySelector({ companies, selectedId, basePath }: Props) {
  const router = useRouter()

  if (companies.length === 0) {
    return (
      <p className="text-sm text-muted-foreground mb-6">
        会社が登録されていません。先に
        <a href="/admin/companies" className="underline ml-1">会社管理</a>
        から追加してください。
      </p>
    )
  }

  return (
    <div className="mb-6">
      <label className="text-sm font-medium block mb-1.5">会社を選択</label>
      <select
        value={selectedId ?? ''}
        onChange={(e) => router.push(`${basePath}?company=${e.target.value}`)}
        className="h-10 rounded-lg border border-input bg-background px-3 text-sm w-full max-w-xs"
      >
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}{!c.is_active ? '（無効）' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
