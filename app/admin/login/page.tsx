import LoginForm from '@/components/admin/LoginForm'
import { Sun } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-3">
            <Sun className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">ひだまり 管理画面</h1>
          <p className="text-sm text-muted-foreground mt-1">管理者アカウントでログインしてください</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
