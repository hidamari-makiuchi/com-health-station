import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sun, CalendarDays, Clock, Settings } from 'lucide-react'
import LogoutButton from '@/components/admin/LogoutButton'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 未ログイン（= ログインページ）はナビなしでそのまま返す
  // リダイレクトは proxy.ts が担う
  if (!user) {
    return <>{children}</>
  }

  const { data: settings } = await supabase
    .from('system_settings')
    .select('slot_mode')
    .single()

  const navItems = [
    { href: '/admin/bookings', label: '予約一覧', icon: CalendarDays },
    ...(settings?.slot_mode === 'custom'
      ? [{ href: '/admin/slots', label: 'スロット管理', icon: Clock }]
      : []),
    { href: '/admin/settings', label: '設定', icon: Settings },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top header */}
      <header className="bg-primary text-primary-foreground px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5" />
          <span className="font-bold text-sm">ひだまり 管理画面</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-70 hidden sm:block">{user.email}</span>
          <LogoutButton />
        </div>
      </header>

      {/* Bottom nav (mobile) / Sidebar (desktop) */}
      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        <nav className="hidden md:flex flex-col w-48 border-r border-border bg-card py-4 gap-1 shrink-0">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg mx-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom nav for mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-muted-foreground hover:text-primary transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px]">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
