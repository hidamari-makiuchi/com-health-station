'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, HelpCircle } from 'lucide-react'

const COOKIE_NAME = 'flow_seen'
const COOKIE_DAYS = 365

function setSeenCookie() {
  const expires = new Date(Date.now() + COOKIE_DAYS * 864e5).toUTCString()
  document.cookie = `${COOKIE_NAME}=1; expires=${expires}; path=/; SameSite=Lax`
}

function hasSeenCookie() {
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${COOKIE_NAME}=`))
}

export default function FlowModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [seen, setSeen] = useState(true) // 初期は true にして SSR ハイドレーションを安定させる

  useEffect(() => {
    const alreadySeen = hasSeenCookie()
    setSeen(alreadySeen)
    if (!alreadySeen) setIsOpen(true)
  }, [])

  const close = () => {
    setIsOpen(false)
    setSeenCookie()
    setSeen(true)
  }

  return (
    <>
      {/* 2回目以降: 「予約の流れ」ボタン */}
      {seen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline mb-4"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          予約から相談までの流れ
        </button>
      )}

      {/* モーダル */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={close}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute top-3 right-3 z-10 bg-white/80 rounded-full p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="閉じる"
            >
              <X className="w-4 h-4" />
            </button>

            <Image
              src="/booking-flow.png"
              alt="予約から相談を受けるまでの流れ"
              width={400}
              height={560}
              className="w-full rounded-2xl"
              priority
            />

            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={close}
                className="w-full mt-3 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
