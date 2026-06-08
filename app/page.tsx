import { getSettings } from '@/lib/actions/booking'
import BookingFlow from '@/components/booking/BookingFlow'
import { Sun } from 'lucide-react'

export const revalidate = 60

export default async function HomePage() {
  const settings = await getSettings()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-5">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <Sun className="w-6 h-6" />
          <div>
            <p className="text-xs opacity-80 leading-none">みんなの保健室</p>
            <h1 className="text-lg font-bold leading-tight">ひだまり</h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">相談予約</h2>
            <p className="text-sm text-muted-foreground mt-1">
              ご希望の日時をお選びのうえ、お名前と連絡先をご入力ください。
              担当者よりご連絡いたします。
            </p>
          </div>

          {settings ? (
            <BookingFlow settings={settings} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>現在予約を受け付けていません。</p>
              <p className="text-sm mt-1">しばらくしてから再度アクセスしてください。</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-4 text-center text-xs text-muted-foreground border-t border-border">
        © みんなの保健室ひだまり
      </footer>
    </div>
  )
}
