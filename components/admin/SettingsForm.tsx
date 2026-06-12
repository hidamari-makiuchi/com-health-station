'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { updateSettings } from '@/lib/actions/settings'
import type { SystemSettings, SlotMode } from '@/lib/types'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  settings: SystemSettings
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

export default function SettingsForm({ settings }: Props) {
  const [isPending, startTransition] = useTransition()
  const [advanceDays, setAdvanceDays] = useState(settings.advance_days)
  const [slotMode, setSlotMode] = useState<SlotMode>(settings.slot_mode)
  const [fixedTimes, setFixedTimes] = useState<string[]>(settings.fixed_times)
  const [fixedDays, setFixedDays] = useState<number[]>(settings.fixed_days ?? [1, 2, 3, 4, 5])
  const [weeklyTimes, setWeeklyTimes] = useState<Record<string, string[]>>(
    settings.weekly_times ?? {}
  )
  const [newWeeklyTime, setNewWeeklyTime] = useState<string[]>(['', '', '', '', '', '', ''])
  const [newTime, setNewTime] = useState('')

  const toggleDay = (day: number) => {
    setFixedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const addTime = () => {
    if (!newTime || fixedTimes.includes(newTime)) return
    setFixedTimes((prev) => [...prev, newTime].sort())
    setNewTime('')
  }

  const removeTime = (t: string) => {
    setFixedTimes((prev) => prev.filter((x) => x !== t))
  }

  const addWeeklyTime = (dow: number) => {
    const t = newWeeklyTime[dow]
    if (!t) return
    const key = String(dow)
    const existing = weeklyTimes[key] ?? []
    if (existing.includes(t)) return
    setWeeklyTimes((prev) => ({ ...prev, [key]: [...existing, t].sort() }))
    setNewWeeklyTime((prev) => prev.map((v, i) => (i === dow ? '' : v)))
  }

  const removeWeeklyTime = (dow: number, t: string) => {
    const key = String(dow)
    setWeeklyTimes((prev) => ({ ...prev, [key]: (prev[key] ?? []).filter((x) => x !== t) }))
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateSettings({
        advance_days: advanceDays,
        slot_mode: slotMode,
        fixed_times: fixedTimes,
        fixed_days: fixedDays,
        weekly_times: weeklyTimes,
      })
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('設定を保存しました')
    })
  }

  return (
    <div className="max-w-md space-y-6">
      {/* Advance days */}
      <div className="bg-card border border-border rounded-xl p-4">
        <Label htmlFor="advance-days" className="font-semibold text-sm block mb-1">
          予約受付の最短日数
        </Label>
        <p className="text-xs text-muted-foreground mb-3">
          今日から何日後以降の日程を選択可能にするか（デフォルト: 5日）
        </p>
        <div className="flex items-center gap-2">
          <Input
            id="advance-days"
            type="number"
            min={1}
            max={30}
            value={advanceDays}
            onChange={(e) => setAdvanceDays(Number(e.target.value))}
            className="w-24 h-11 text-base text-center"
          />
          <span className="text-sm text-muted-foreground">日後から予約可</span>
        </div>
      </div>

      <Separator />

      {/* Slot mode */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="font-semibold text-sm mb-1">スロット管理モード</p>
        <p className="text-xs text-muted-foreground mb-3">
          予約可能な時間帯の管理方法を選択します
        </p>
        <div className="grid grid-cols-1 gap-2">
          {([
            {
              mode: 'fixed' as SlotMode,
              title: '固定時間帯モード',
              desc: '選択した曜日すべてに共通の時間帯を設定します',
            },
            {
              mode: 'weekly' as SlotMode,
              title: '週次テンプレートモード',
              desc: '曜日ごとに異なる時間帯を設定します（例: 月曜は10:00/14:00、水曜は09:00）',
            },
            {
              mode: 'custom' as SlotMode,
              title: 'カスタムモード',
              desc: '日付ごとに個別の時間帯を設定します（「スロット管理」メニューで追加）',
            },
          ] as const).map(({ mode, title, desc }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSlotMode(mode)}
              className={cn(
                'text-left rounded-xl border p-3 transition-all',
                slotMode === mode
                  ? 'border-primary bg-accent'
                  : 'border-border hover:border-primary/40'
              )}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center',
                    slotMode === mode ? 'border-primary' : 'border-muted-foreground'
                  )}
                >
                  {slotMode === mode && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-sm font-medium">{title}</span>
              </div>
              <p className="text-xs text-muted-foreground ml-5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Weekly template (only when weekly mode) */}
      {slotMode === 'weekly' && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div>
            <p className="font-semibold text-sm mb-1">曜日ごとの時間帯</p>
            <p className="text-xs text-muted-foreground mb-3">
              時間帯が設定されていない曜日は予約フォームに表示されません
            </p>
          </div>
          {DAY_LABELS.map((label, dow) => {
            const times = weeklyTimes[String(dow)] ?? []
            return (
              <div key={dow} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-sm font-semibold w-6',
                      dow === 0 && 'text-red-500',
                      dow === 6 && 'text-blue-600'
                    )}
                  >
                    {label}
                  </span>
                  <div className="flex gap-1.5 flex-wrap flex-1 mx-3 min-h-[28px]">
                    {times.length === 0 ? (
                      <span className="text-xs text-muted-foreground self-center">（なし）</span>
                    ) : (
                      times.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 bg-secondary rounded-md px-2 py-0.5 text-xs font-medium"
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() => removeWeeklyTime(dow, t)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            aria-label="削除"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Input
                      type="time"
                      value={newWeeklyTime[dow]}
                      onChange={(e) =>
                        setNewWeeklyTime((prev) => prev.map((v, i) => (i === dow ? e.target.value : v)))
                      }
                      className="h-8 w-28 text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addWeeklyTime(dow)}
                      disabled={!newWeeklyTime[dow]}
                      className="h-8 px-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Fixed days + times (only when fixed mode) */}
      {slotMode === 'fixed' && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-5">
          {/* 曜日選択 */}
          <div>
            <p className="font-semibold text-sm mb-1">予約可能な曜日</p>
            <p className="text-xs text-muted-foreground mb-3">
              予約フォームに表示する曜日を選択します
            </p>
            <div className="flex gap-1.5">
              {['日', '月', '火', '水', '木', '金', '土'].map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={cn(
                    'w-10 h-10 rounded-lg text-sm font-semibold border transition-all',
                    fixedDays.includes(i)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:border-primary/40',
                    i === 0 && !fixedDays.includes(i) && 'text-red-500',
                    i === 6 && !fixedDays.includes(i) && 'text-blue-600'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {fixedDays.length === 0 && (
              <p className="text-xs text-destructive mt-1.5">曜日が選択されていません</p>
            )}
          </div>

          {/* 時間帯 */}
          <div>
          <p className="font-semibold text-sm mb-1">時間帯</p>
          <p className="text-xs text-muted-foreground mb-3">
            予約可能な時刻を設定します
          </p>

          <div className="flex gap-2 mb-3">
            <Input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="flex-1 h-10 text-base"
            />
            <Button
              type="button"
              size="sm"
              onClick={addTime}
              disabled={!newTime}
              className="gap-1 h-10"
            >
              <Plus className="w-3.5 h-3.5" />
              追加
            </Button>
          </div>

          {fixedTimes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              時間帯が設定されていません
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {fixedTimes.map((t) => (
                <div
                  key={t}
                  className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2"
                >
                  <span className="text-sm font-medium">{t}</span>
                  <button
                    type="button"
                    onClick={() => removeTime(t)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={isPending}
        className="w-full h-12 font-bold"
      >
        {isPending ? '保存中...' : '設定を保存する'}
      </Button>
    </div>
  )
}
