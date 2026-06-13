'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCompany, regenerateToken, updateCompanyActive } from '@/lib/actions/companies'
import type { Company } from '@/lib/types'
import { Plus, RefreshCw, Copy, Check, Settings } from 'lucide-react'

interface Props {
  initialCompanies: Company[]
}

export default function CompanyManager({ initialCompanies }: Props) {
  const [companies, setCompanies] = useState(initialCompanies)
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const handleCreate = () => {
    if (!name.trim()) return
    startTransition(async () => {
      const result = await createCompany(name.trim())
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      setCompanies((prev) => [...prev, result.company])
      setName('')
      toast.success('会社を追加しました')
    })
  }

  const handleRegenerate = (companyId: string) => {
    startTransition(async () => {
      const result = await regenerateToken(companyId)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, token: result.token } : c))
      )
      toast.success('URLトークンを再発行しました')
    })
  }

  const handleToggleActive = (companyId: string, current: boolean) => {
    startTransition(async () => {
      const result = await updateCompanyActive(companyId, !current)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, is_active: !current } : c))
      )
      toast.success(!current ? '有効にしました' : '無効にしました')
    })
  }

  const copyUrl = (token: string, companyId: string) => {
    const url = `${baseUrl}/${token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(companyId)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  return (
    <div className="space-y-6">
      {/* 追加フォーム */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold text-sm mb-3">会社を追加</h2>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="company-name" className="text-xs mb-1 block">会社名</Label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onCompositionEnd={(e) => setName((e.target as HTMLInputElement).value)}
              placeholder="株式会社サンプル"
              className="h-11"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleCreate()
              }}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || isPending}
              className="h-11 gap-1"
            >
              <Plus className="w-4 h-4" />
              追加
            </Button>
          </div>
        </div>
      </div>

      {/* 一覧 */}
      <div>
        <h2 className="font-semibold text-sm mb-3">会社一覧（{companies.length}件）</h2>
        {companies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            会社が登録されていません
          </div>
        ) : (
          <div className="space-y-3">
            {companies.map((company) => (
              <div
                key={company.id}
                className={`bg-card border rounded-xl p-4 ${company.is_active ? 'border-border' : 'border-border opacity-60'}`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="font-medium text-sm">{company.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {company.is_active ? '有効' : '無効'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/settings?company=${company.id}`}>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" aria-label="設定">
                        <Settings className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleActive(company.id, company.is_active)}
                      disabled={isPending}
                      className="text-xs h-7 px-2"
                    >
                      {company.is_active ? '無効化' : '有効化'}
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/40 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <code className="text-xs text-muted-foreground truncate flex-1">
                    {baseUrl}/{company.token}
                  </code>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => copyUrl(company.token, company.id)}
                      aria-label="URLをコピー"
                    >
                      {copiedId === company.id ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleRegenerate(company.id)}
                      disabled={isPending}
                      aria-label="トークンを再発行"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
