/**
 * Sunucu tarafı push bildirimi gönderici
 *
 * Kullanım:
 *   sendPushNotification({
 *     userId:  'uuid',
 *     title:   'Siparişin Onaylandı!',
 *     body:    'Fatma Hanım siparişini hazırlamaya başladı.',
 *     type:    'order_confirmed',
 *     data:    { order_id: 'xxx' },
 *   })
 */

import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server'

// ─── Tipler ───────────────────────────────────────────────────────────────────

export interface PushPayload {
  userId:  string
  title:   string
  body:    string
  type:    string
  data?:   Record<string, string>
  image?:  string
  tag?:    string
}

// ─── FCM gönderici ────────────────────────────────────────────────────────────

async function sendFCM(token: string, payload: Omit<PushPayload, 'userId'>): Promise<boolean> {
  const projectId = process.env.FIREBASE_PROJECT_ID
  if (!projectId) return false

  // Firebase Admin SDK yerine REST API — bağımlılık minimize
  try {
    // Access token al (service account ile)
    const accessToken = await getFirebaseAccessToken()
    if (!accessToken) return false

    const message = {
      token,
      notification: { title: payload.title, body: payload.body, image: payload.image },
      data: {
        type:  payload.type,
        title: payload.title,
        body:  payload.body,
        ...(payload.data ?? {}),
      },
      android: {
        notification: {
          channel_id: getChannelId(payload.type),
          sound:       'default',
          priority:    payload.type === 'order_pending' ? 'HIGH' : 'DEFAULT',
          tag:         payload.tag ?? payload.type,
        },
      },
      apns: {
        payload: {
          aps: {
            sound:            'default',
            badge:            1,
            'content-available': 1,
          },
        },
      },
      webpush: {
        notification: {
          title:    payload.title,
          body:     payload.body,
          icon:     '/icons/icon-192.png',
          badge:    '/icons/badge-72.png',
          tag:      payload.tag ?? payload.type,
          data:     payload.data,
          actions:  getActions(payload.type, payload.data),
        },
      },
    }

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ message }),
      }
    )

    return res.ok
  } catch (err) {
    console.error('[FCM] gönderim hatası:', err)
    return false
  }
}

// ─── Ana gönderim fonksiyonu ──────────────────────────────────────────────────

export async function sendPushNotification(payload: PushPayload): Promise<boolean> {
  // Admin client kullan — notifications tablosu service_role gerektirir
  const supabase = await getSupabaseAdminClient()

  // FCM token'ı al
  const { data: user } = await supabase
    .from('users')
    .select('fcm_token')
    .eq('id', payload.userId)
    .single()

  if (!user?.fcm_token) {
    // Token yok — veritabanına bildirim kaydet (uygulama açıldığında göster)
    await saveInAppNotification(supabase, payload)
    return false
  }

  let tokenData: any
  try {
    tokenData = JSON.parse(user.fcm_token)
  } catch {
    tokenData = user.fcm_token  // String ise doğrudan FCM token
  }

  let pushSent = false

  if (typeof tokenData === 'string') {
    // Doğrudan FCM token
    pushSent = await sendFCM(tokenData, payload)
  } else if (tokenData?.type === 'web-push') {
    // Web Push aboneliği — şimdilik FCM yoksa in-app bildirimi kaydet
    // Gerçek implementasyon: web-push npm paketi kullanılır
    console.log('[Push] Web push aboneliği bulundu — web-push kütüphanesiyle gönder')
    pushSent = false
  } else if (tokenData?.token) {
    pushSent = await sendFCM(tokenData.token, payload)
  }

  // Her durumda in-app bildirim kaydet
  await saveInAppNotification(supabase, payload)

  return pushSent
}

// ─── Toplu gönderim (örn: favori aşçı yeni menü ekledi) ──────────────────────

export async function sendBulkPush(userIds: string[], payload: Omit<PushPayload, 'userId'>): Promise<void> {
  await Promise.allSettled(
    userIds.map(userId => sendPushNotification({ ...payload, userId }))
  )
}

// ─── In-app bildirim kaydet ───────────────────────────────────────────────────
// notifications INSERT için service_role gerekiyor (RLS politikası)
async function saveInAppNotification(supabase: any, payload: PushPayload) {
  try {
    // getSupabaseAdminClient cookie bağlamı olmadan çalışmaz (Next.js server context dışında)
    // Bu yüzden geçilen supabase client (adminClient) kullanılıyor
    await supabase.from('notifications').insert({
      user_id: payload.userId,
      type:    payload.type,
      title:   payload.title,
      body:    payload.body,
      data:    payload.data ?? {},
    })
  } catch {
    // Bildirim kayıt hatası sessizce geç
  }
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function getChannelId(type: string): string {
  if (type.startsWith('order'))   return 'orders'
  if (type === 'new_message')     return 'messages'
  if (type.startsWith('chef'))    return 'chef'
  if (type.startsWith('payout'))  return 'payments'
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

// Firebase service account ile access token al
async function getFirebaseAccessToken(): Promise<string | null> {
  // Production'da google-auth-library kullanılır
  // Şimdilik null döner, FCM token varsa çalışmaz
  // npm install google-auth-library
  // const { GoogleAuth } = await import('google-auth-library')
  // const auth  = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/firebase.messaging' })
  // const token = await auth.getAccessToken()
  // return token
  return null
}
