'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getAvailableTimesForDate, createAdminBooking } from '@/lib/actions/booking'
import type { Company, ContactType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
  companies: Company[]
}

export default function AdminBookingModal({ open, onClose, onCreated, companies }: Props) {
  const [isPending, startTransition] = useTransition()

  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [slotDate, setSlotDate] = useState('')
  const [slotTime, setSlotTime] = useState('')
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loadingTimes, setLoadingTimes] = useState(false)
  const [userName, setUserName] = useState('')
  const [contactType, setContactType] = useState<ContactType>('phone')
  const [contact, setContact] = useState('')
  const [notes, setNotes] = useState('')

  const handleDateChange = async (date: string) => {
    setSlotDate(date)
    setSlotTime('')
    setAvailableTimes([])
    if (!date) return
    setLoadingTimes(true)
    try {
      const times = await getAvailableTimesForDate(date, companyId || undefined)
      setAvailableTimes(times)
    } finally {
      setLoadingTimes(false)
    }
  }

  const handleCompanyChange = (id: string) => {
    setCompanyId(id)
    setSlotDate('')
    setSlotTime('')
    setAvailableTimes([])
  }

  const handleClose = () => {
    setCompanyId(companies[0]?.id ?? '')
    setSlotDate('')
    setSlotTime('')
    setAvailableTimes([])
    setUserName('')
    setContactType('phone')
    setContact('')
    setNotes('')
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!slotDate || !slotTime || !userName || !contact) return

    startTransition(async () => {
      const result = await createAdminBooking({
        slot_date: slotDate,
        slot_time: slotTime,
        user_name: userName,
        contact,
        contact_type: contactType,
        notes,
        company_id: companyId || null,
      })

      if ('error' in result) {
        toast.error(result.error)
        return
      }

      toast.success('予約を登録しました')
      handleClose()
      onCreated()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">電話受付予約の登録</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 会社選択 */}
          {companies.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-1.5 block">会社</Label>
              <select
                value={companyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">（会社なし）</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* 日時 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">日付</Label>
              <input
                type="date"
                value={slotDate}
                onChange={(e) => handleDateChange(e.target.value)}
                required
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">時刻</Label>
              {availableTimes.length > 0 ? (
                <select
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  required
                  className="w-full h-10 rounded-lg border border-input bg-background px-2 text-sm"
                >
                  <option value="">選択</option>
                  {availableTimes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="time"
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  required
                  disabled={!slotDate}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
              )}
              {loadingTimes && (
                <p className="text-xs text-muted-foreground mt-0.5">読込中...</p>
              )}
              {slotDate && !loadingTimes && availableTimes.length === 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">空き枠なし（時刻を直接入力）</p>
              )}
            </div>
          </div>

          {/* お名前 */}
          <div>
            <Label htmlFor="admin-user-name" className="text-sm font-medium mb-1.5 block">
              お名前
            </Label>
            <Input
              id="admin-user-name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="山田 太郎"
              required
              className="h-10"
            />
          </div>

          {/* 連絡先種別 */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">連絡先の種類</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['phone', 'email'] as ContactType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setContactType(type); setContact('') }}
                  className={cn(
                    'h-10 rounded-lg text-sm font-medium border transition-all',
                    contactType === type
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:border-primary/60 hover:bg-accent'
                  )}
                >
                  {type === 'phone' ? '📞 電話番号' : '📧 メールアドレス'}
                </button>
              ))}
            </div>
          </div>

          {/* 連絡先 */}
          <div>
            <Label htmlFor="admin-contact" className="text-sm font-medium mb-1.5 block">
              {contactType === 'phone' ? '電話番号' : 'メールアドレス'}
            </Label>
            <Input
              id="admin-contact"
              type={contactType === 'email' ? 'email' : 'tel'}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={contactType === 'phone' ? '090-1234-5678' : 'example@email.com'}
              required
              className="h-10"
            />
          </div>

          {/* メモ */}
          <div>
            <Label htmlFor="admin-notes" className="text-sm font-medium mb-1.5 block">
              メモ（任意）
            </Label>
            <Textarea
              id="admin-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="相談内容・受付時の備考など..."
              className="min-h-[80px] text-sm resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              キャンセル
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending || !slotDate || !slotTime || !userName || !contact}
            >
              {isPending ? '登録中...' : '予約を登録'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
