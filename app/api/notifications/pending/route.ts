import { NextRequest, NextResponse } from 'next/server'

async function getAccessToken(): Promise<string> {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!
  const privateKey   = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n')
  const projectId    = process.env.FIREBASE_PROJECT_ID!

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  }

  // JWT oluştur
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const body   = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signingInput = `${header}.${body}`

  const { createSign } = await import('crypto')
  const sign = createSign('RSA-SHA256')
  sign.update(signingInput)
  const signature = sign.sign(privateKey, 'base64url')
  const jwt = `${signingInput}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const data = await res.json()
  return data.access_token
}

export async function POST(req: NextRequest) {
  try {
    const { token, title, body, data } = await req.json()
    if (!token) return NextResponse.json({ error: 'Token gerekli.' }, { status: 400 })

    const projectId   = process.env.FIREBASE_PROJECT_ID!
    const accessToken = await getAccessToken()

    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: data ?? {},
          webpush: {
            notification: { icon: '/icons/icon-192.png', badge: '/icons/icon-72.png' },
          },
        },
      }),
    })

    const result = await res.json()
    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    console.error('[notifications]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}