'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getAvailableTimesForDate, createBooking } from '@/lib/actions/booking'
import type { SystemSettings, ContactType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { addDays, format, parseISO } from '@/lib/date-utils'

interface Props {
  settings: SystemSettings
}

function generateSelectableDates(
  advanceDays: number,
  slotMode: string,
  fixedDays: number[],
  weeklyTimes: Record<string, string[]>,
  maxDates = 30
): string[] {
  const dates: string[] = []
  let offset = 0
  while (dates.length < maxDates && offset < 180) {
    const d = addDays(new Date(), advanceDays + offset)
    const dow = d.getDay()
    let include: boolean
    if (slotMode === 'fixed') {
      include = fixedDays.length === 0 || fixedDays.includes(dow)
    } else if (slotMode === 'weekly') {
      include = (weeklyTimes[String(dow)]?.length ?? 0) > 0
    } else {
      include = true
    }
    if (include) dates.push(format(d))
    offset++
  }
  return dates
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

export default function BookingFlow({ settings }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const selectableDates = generateSelectableDates(
    settings.advance_days,
    settings.slot_mode,
    settings.fixed_days ?? [0, 1, 2, 3, 4, 5, 6],
    settings.weekly_times ?? {}
  )

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loadingTimes, setLoadingTimes] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [contactType, setContactType] = useState<ContactType>('phone')
  const [contact, setContact] = useState('')

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date)
    setSelectedTime(null)
    setAvailableTimes([])
    setLoadingTimes(true)
    try {
      const times = await getAvailableTimesForDate(date)
      setAvailableTimes(times)
    } finally {
      setLoadingTimes(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedTime || !userName || !contact) return

    startTransition(async () => {
      const result = await createBooking({
        slot_date: selectedDate,
        slot_time: selectedTime,
        user_name: userName,
        contact,
        contact_type: contactType,
      })

      if ('error' in result) {
        toast.error(result.error)
        return
      }

      router.push(
        `/booking/complete?name=${encodeURIComponent(userName)}&date=${selectedDate}&time=${selectedTime}`
      )
    })
  }

  const step = !selectedDate ? 1 : !selectedTime ? 2 : 3

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Step 1: 日付選択 */}
      <section>
        <StepHeader step={1} label="日程を選ぶ" active={true} />
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div className="flex gap-2 w-max">
            {selectableDates.map((date) => {
              const d = parseISO(date)
              const dow = d.getDay()
              const isSelected = selectedDate === date
              const isSat = dow === 6
              const isSun = dow === 0
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl min-w-[56px] h-[72px] text-sm font-medium transition-all border',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-card border-border hover:border-primary/60 hover:bg-accent',
                    isSat && !isSelected && 'text-blue-600',
                    isSun && !isSelected && 'text-red-500'
                  )}
                >
                  <span className="text-xs opacity-70">{DAY_LABELS[dow]}</span>
                  <span className="text-base leading-tight">
                    {d.getMonth() + 1}/{d.getDate()}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Step 2: 時間選択 */}
      {selectedDate && (
        <section>
          <StepHeader step={2} label="時間を選ぶ" active={step >= 2} />
          {loadingTimes ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              読み込み中...
            </div>
          ) : availableTimes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              この日は予約可能な時間帯がありません
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  className={cn(
                    'h-12 rounded-xl text-sm font-medium border transition-all',
                    selectedTime === time
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-card border-border hover:border-primary/60 hover:bg-accent'
                  )}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Step 3: 名前・連絡先 */}
      {selectedDate && selectedTime && (
        <section>
          <StepHeader step={3} label="お名前と連絡先" active={step >= 3} />
          <div className="space-y-4">
            <div>
              <Label htmlFor="userName" className="text-sm font-medium mb-1.5 block">
                お名前（仮名でも可）
              </Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="山田 太郎"
                required
                className="text-base h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">連絡先の種類</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['phone', 'email'] as ContactType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => { setContactType(type); setContact('') }}
                    className={cn(
                      'h-11 rounded-xl text-sm font-medium border transition-all',
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

            <div>
              <Label htmlFor="contact" className="text-sm font-medium mb-1.5 block">
                {contactType === 'phone' ? '電話番号' : 'メールアドレス'}
              </Label>
              <Input
                id="contact"
                type={contactType === 'email' ? 'email' : 'tel'}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={contactType === 'phone' ? '090-1234-5678' : 'example@email.com'}
                required
                className="text-base h-12"
              />
            </div>
          </div>
        </section>
      )}

      {/* 送信ボタン */}
      {selectedDate && selectedTime && (
        <div className="pt-2">
          <div className="bg-secondary rounded-xl p-4 mb-4 text-sm">
            <p className="font-medium text-secondary-foreground mb-1">予約内容の確認</p>
            <p className="text-muted-foreground">
              {(() => {
                const d = parseISO(selectedDate)
                return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DAY_LABELS[d.getDay()]}） ${selectedTime}`
              })()}
            </p>
          </div>
          <Button
            type="submit"
            className="w-full h-14 text-base font-bold rounded-2xl"
            disabled={!userName || !contact || isPending}
          >
            {isPending ? '送信中...' : '予約を申し込む'}
          </Button>
        </div>
      )}
    </form>
  )
}

function StepHeader({ step, label, active }: { step: number; label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
          active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {step}
      </div>
      <h2 className={cn('font-semibold', active ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </h2>
    </div>
  )
}
