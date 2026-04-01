// @ts-nocheck
/**
 * Sunucu tarafı push bildirimi gönderici
 */

import { createClient } from '@supabase/supabase-js'

export interface PushPayload {
  userId:  string
  title:   string
  body:    string
  type:    string
  data?:   Record<string, string>
  image?:  string
  tag?:    string
}

async function getSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function sendFCM(token: string, payload: Omit<PushPayload, 'userId'>): Promise<boolean> {
  const projectId = process.env.FIREBASE_PROJECT_ID
  if (!projectId) return false

  try {
    const accessToken = await getFirebaseAccessToken()
    if (!accessToken) return false

    const message = {
      token,
      notification: { title: payload.title, body: payload.body },
      data: {
        type:  payload.type,
        title: payload.title,
        body:  payload.body,
        ...(payload.data ?? {}),
      },
      android: {
        notification: {
          channel_id: getChannelId(payload.type),
          sound: 'default',
          priority: payload.type === 'order_pending' ? 'HIGH' : 'DEFAULT',
          tag: payload.tag ?? payload.type,
        },
      },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1, 'content-available': 1 },
        },
      },
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: '/icons/icon-192.png',
          badge: '/icons/badge-72.png',
          tag: payload.tag ?? payload.type,
          data: payload.data,
          actions: getActions(payload.type, payload.data),
        },
      },
    }

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('[FCM] gönderim hatası:', err)
    }

    return res.ok
  } catch (err) {
    console.error('[FCM] gönderim hatası:', err)
    return false
  }
}

export async function sendPushNotification(payload: PushPayload): Promise<boolean> {
  const supabase = await getSupabaseAdminClient()

  const { data: user } = await supabase
    .from('users')
    .select('fcm_token')
    .eq('id', payload.userId)
    .single()

  // Her durumda in-app bildirim kaydet
  await saveInAppNotification(supabase, payload)

  if (!user?.fcm_token) return false

  let tokenData: any
  try {
    tokenData = JSON.parse(user.fcm_token)
  } catch {
    tokenData = user.fcm_token
  }

  if (typeof tokenData === 'string') {
    return await sendFCM(tokenData, payload)
  } else if (tokenData?.token) {
    return await sendFCM(tokenData.token, payload)
  }

  return false
}

export async function sendBulkPush(userIds: string[], payload: Omit<PushPayload, 'userId'>): Promise<void> {
  await Promise.allSettled(
    userIds.map(userId => sendPushNotification({ ...payload, userId }))
  )
}

async function saveInAppNotification(supabase: any, payload: PushPayload) {
  try {
    await supabase.from('notifications').insert({
      user_id: payload.userId,
      type:    payload.type,
      title:   payload.title,
      body:    payload.body,
      data:    payload.data ?? {},
    })
  } catch {}
}

function getChannelId(type: string): string {
  if (type.startsWith('order'))  return 'orders'
  if (type === 'new_message')    return 'messages'
  if (type.startsWith('chef'))   return 'chef'
  if (type.startsWith('payout')) return 'payments'
  return 'general'
}

function getActions(type: string, data?: Record<string, string>) {
  switch (type) {
    case 'order_pending':
      return [
        { action: 'approve', title: '✅ Onayla' },
        { action: 'reject',  title: '❌ Reddet' },
      ]
    case 'new_message':
      return [{ action: 'reply', title: '💬 Yanıtla' }]
    default:
      return []
  }
}

async function getFirebaseAccessToken(): Promise<string | null> {
  try {
    const { GoogleAuth } = await import('google-auth-library')

    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL

    if (!privateKey || !clientEmail) return null

    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: 'https://www.googleapis.com/auth/firebase.messaging',
    })

    const token = await auth.getAccessToken()
    return token
  } catch (err) {
    console.error('[FCM] access token hatası:', err)
    return null
  }
}