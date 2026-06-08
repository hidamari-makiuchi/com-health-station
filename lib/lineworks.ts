import { formatJP } from '@/lib/date-utils'
import { BOOKING_STATUS_CONFIG } from '@/lib/types'
import type { BookingStatus } from '@/lib/types'

// Base64url encode
function b64url(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

async function createJwt(clientId: string, serviceAccount: string, privateKeyPem: string): Promise<string> {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload = b64url(JSON.stringify({ iss: clientId, sub: serviceAccount, iat: now, exp: now + 3600 }))
  const signingInput = `${header}.${payload}`

  const pemBody = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')
  const keyBuffer = Buffer.from(pemBody, 'base64')

  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  )
  return `${signingInput}.${b64url(new Uint8Array(sig))}`
}

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.LINEWORKS_CLIENT_ID
  const clientSecret = process.env.LINEWORKS_CLIENT_SECRET
  const serviceAccount = process.env.LINEWORKS_SERVICE_ACCOUNT
  const privateKey = process.env.LINEWORKS_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientId || !clientSecret || !serviceAccount || !privateKey) return null

  const jwt = await createJwt(clientId, serviceAccount, privateKey)

  const body = new URLSearchParams({
    assertion: jwt,
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'bot',
  })

  const res = await fetch('https://auth.worksmobile.com/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.access_token ?? null
}

const ADMIN_BOOKINGS_URL = 'https://com-health-station.vercel.app/admin/bookings'

async function sendMessage(text: string): Promise<void> {
  const botId = process.env.LINEWORKS_BOT_ID
  const userId = process.env.LINEWORKS_USER_ID
  const channelId = process.env.LINEWORKS_CHANNEL_ID
  if (!botId || (!userId && !channelId)) return

  const token = await getAccessToken()
  if (!token) return

  // ユーザーDM優先、未設定ならチャンネルへ
  const endpoint = userId
    ? `https://www.worksapis.com/v1.0/bots/${botId}/users/${userId}/messages`
    : `https://www.worksapis.com/v1.0/bots/${botId}/channels/${channelId}/messages`

  const content = {
    type: 'button_template',
    contentText: text,
    actions: [
      {
        type: 'uri',
        label: '予約一覧を開く',
        uri: ADMIN_BOOKINGS_URL,
      },
    ],
  }

  await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  })
}

export async function notifyBookingCreated(booking: {
  slot_date: string
  slot_time: string
  user_name: string
}): Promise<void> {
  try {
    const text = `📅 新規予約が入りました\n\n👤 ${booking.user_name} 様\n🗓 ${formatJP(booking.slot_date)} ${booking.slot_time.substring(0, 5)}`
    await sendMessage(text)
  } catch {
    // 通知失敗は予約処理に影響させない
  }
}

export async function notifyBookingCancelledByUser(booking: {
  slot_date: string
  slot_time: string
  user_name: string
}): Promise<void> {
  try {
    const text = `❌ 予約がキャンセルされました（予約者より）\n\n👤 ${booking.user_name} 様\n🗓 ${formatJP(booking.slot_date)} ${booking.slot_time.substring(0, 5)}`
    await sendMessage(text)
  } catch {
    // 通知失敗は予約処理に影響させない
  }
}

export async function notifyStatusChanged(booking: {
  slot_date: string
  slot_time: string
  user_name: string
  status: BookingStatus
}): Promise<void> {
  try {
    const label = BOOKING_STATUS_CONFIG[booking.status].label
    const text = `🔄 ステータスが変更されました\n\n👤 ${booking.user_name} 様\n🗓 ${formatJP(booking.slot_date)} ${booking.slot_time.substring(0, 5)}\n📊 → ${label}`
    await sendMessage(text)
  } catch {
    // 通知失敗は予約処理に影響させない
  }
}
