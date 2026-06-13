import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { CheckCircle, Sun } from 'lucide-react'
import { formatJP } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { getCompanyByToken } from '@/lib/actions/companies'

interface Props {
  params: Promise<{ token: string }>
  searchParams: Promise<{ name?: string; date?: string; time?: string }>
}

export default async function CompletePage({ params, searchParams }: Props) {
  const { token } = await params
  const company = await getCompanyByToken(token)
  if (!company) notFound()

  const { name, date, time } = await searchParams

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground px-4 py-5">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <Sun className="w-6 h-6" />
          <div>
            <p className="text-xs opacity-80 leading-none">みんなの保健室陽だまり</p>
            <h1 className="text-lg font-bold leading-tight">{company.name}の保健室</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-10">
        <div className="max-w-md mx-auto text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">お申し込みありがとうございます</h2>
          <p className="text-muted-foreground text-sm mb-8">
            ご入力いただいた連絡先に担当者よりご連絡いたします。
          </p>

          {name && date && time && (
            <div className="bg-card border border-border rounded-2xl p-5 text-left mb-8">
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">予約内容</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">お名前</span>
                  <span className="font-medium">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">日時</span>
                  <span className="font-medium">
                    {formatJP(date)} {time}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Link
            href={`/${token}`}
            className={cn(buttonVariants(), 'w-full h-12 rounded-2xl justify-center')}
          >
            トップページに戻る
          </Link>
        </div>
      </main>

      <footer className="px-4 py-4 text-center text-xs text-muted-foreground border-t border-border">
        © みんなの保健室ひだまり
      </footer>
    </div>
  )
}
