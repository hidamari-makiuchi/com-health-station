'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100 transition-opacity"
      aria-label="ログアウト"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:block">ログアウト</span>
    </button>
  )
}
