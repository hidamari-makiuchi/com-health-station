import { Sun } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground px-4 py-5">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <Sun className="w-6 h-6" />
          <div>
            <p className="text-xs opacity-80 leading-none">みんなの保健室</p>
            <h1 className="text-lg font-bold leading-tight">ひだまり</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-muted-foreground text-sm">
            ご利用の会社からご案内されたURLからアクセスしてください。
          </p>
        </div>
      </main>

      <footer className="px-4 py-4 text-center text-xs text-muted-foreground border-t border-border">
        © みんなの保健室ひだまり
      </footer>
    </div>
  )
}
